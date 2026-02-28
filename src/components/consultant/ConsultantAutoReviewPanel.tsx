import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  FileText, Loader2, CheckCircle2, XCircle, Clock, Eye,
  ShieldCheck, AlertTriangle, Lock, Stamp, Send,
} from 'lucide-react';

interface ConsultantAutoReviewPanelProps {
  assignments: any[];
  consultantId: string;
  entityType: 'individual' | 'office';
}

/**
 * Auto-Review Panel: 
 * - Shows pending shipment drafts awaiting consultant review
 * - Implements Lock Rule (block invoice until approved)
 * - Implements Watermark Rule (individual docs = "under review" until office stamps)
 */
const ConsultantAutoReviewPanel = memo(({ assignments, consultantId, entityType }: ConsultantAutoReviewPanelProps) => {
  const queryClient = useQueryClient();
  const orgIds = assignments.map((a: any) => a.organization_id);
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Fetch pending drafts
  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['consultant-review-drafts', consultantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('consultant_review_drafts')
        .select('*')
        .eq('consultant_id', consultantId)
        .in('status', ['pending', 'reviewed'])
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!consultantId,
  });

  // Fetch completed shipments that need review (auto-draft creation)
  const { data: pendingShipments = [] } = useQuery({
    queryKey: ['shipments-needing-review', orgIds],
    queryFn: async () => {
      if (!orgIds.length) return [];
      const { data } = await (supabase
        .from('shipments')
        .select('id, shipment_code, waste_type, actual_weight, status, created_at, generator_id, recycler_id, transporter_id') as any)
        .in('organization_id', orgIds)
        .eq('consultant_technical_approval', 'not_required')
        .in('status', ['delivered', 'completed', 'recycler_received', 'disposal_received'])
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: orgIds.length > 0,
  });

  // Create draft from pending shipment
  const createDraft = useMutation({
    mutationFn: async (shipment: any) => {
      const { error } = await supabase.from('consultant_review_drafts').insert({
        consultant_id: consultantId,
        organization_id: shipment.organization_id || orgIds[0],
        shipment_id: shipment.id,
        shipment_data: shipment,
        waste_type: shipment.waste_type,
        weight_tons: shipment.actual_weight,
        generator_name: shipment.generator_id,
        recycler_name: shipment.recycler_id,
        status: 'pending',
        issued_by_type: entityType,
        office_approval_status: entityType === 'individual' ? 'pending' : 'not_required',
      } as any);
      if (error) throw error;

      // Update shipment to mark it as pending consultant approval
      await supabase.from('shipments').update({
        consultant_technical_approval: 'pending',
        consultant_approved_by: consultantId,
      } as any).eq('id', shipment.id);
    },
    onSuccess: () => {
      toast.success('تم إنشاء مسودة المراجعة');
      queryClient.invalidateQueries({ queryKey: ['consultant-review-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['shipments-needing-review'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Approve or reject draft (Lock Rule enforcement)
  const reviewDraft = useMutation({
    mutationFn: async ({ draftId, action }: { draftId: string; action: 'approved' | 'rejected' }) => {
      const draft = drafts.find((d: any) => d.id === draftId);
      if (!draft) throw new Error('المسودة غير موجودة');

      // Update draft status
      const updateData: any = {
        status: action,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString(),
      };

      // Watermark rule: if individual consultant, mark as needing office approval
      if (entityType === 'individual' && action === 'approved') {
        updateData.office_approval_status = 'pending';
      }

      const { error } = await supabase
        .from('consultant_review_drafts')
        .update(updateData as any)
        .eq('id', draftId);
      if (error) throw error;

      // Lock Rule: Update shipment consultant approval status
      if (draft.shipment_id) {
        await supabase.from('shipments').update({
          consultant_technical_approval: action,
          consultant_approved_at: new Date().toISOString(),
          consultant_approval_notes: reviewNotes,
        } as any).eq('id', draft.shipment_id);
      }

      // Notify the organization
      if (draft.organization_id) {
        const { data: orgProfiles } = await supabase
          .from('profiles').select('id')
          .eq('organization_id', draft.organization_id).limit(5);
        if (orgProfiles?.length) {
          await supabase.from('notifications').insert(
            orgProfiles.map(p => ({
              user_id: p.id,
              title: action === 'approved' ? '✅ اعتماد فني: تمت الموافقة' : '❌ اعتماد فني: مرفوض',
              message: action === 'approved'
                ? 'تم اعتماد المطابقة الفنية للشحنة — يمكنكم الآن إصدار الفاتورة'
                : `رُفض الاعتماد الفني: ${reviewNotes || 'يرجى مراجعة الشحنة'}`,
              type: 'consultant_action',
              action_url: '/dashboard/shipments',
            })) as any
          );
        }
      }
    },
    onSuccess: (_, { action }) => {
      toast.success(action === 'approved' ? 'تم الاعتماد الفني بنجاح' : 'تم رفض الشحنة');
      setSelectedDraft(null);
      setReviewNotes('');
      queryClient.invalidateQueries({ queryKey: ['consultant-review-drafts'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Office approval for individual consultant docs (Watermark Rule)
  const officeApproveDraft = useMutation({
    mutationFn: async ({ draftId, action }: { draftId: string; action: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('consultant_review_drafts')
        .update({
          office_approval_status: action,
          office_approved_by: consultantId,
          office_approved_at: new Date().toISOString(),
          status: action === 'approved' ? 'approved' : 'rejected',
        } as any)
        .eq('id', draftId);
      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      toast.success(action === 'approved' ? 'تم ختم المكتب الاستشاري' : 'تم رفض المستند');
      queryClient.invalidateQueries({ queryKey: ['consultant-review-drafts'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pendingCount = drafts.filter((d: any) => d.status === 'pending').length;
  const needsOfficeApproval = drafts.filter((d: any) => d.office_approval_status === 'pending' && d.status === 'reviewed');

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-[11px] text-muted-foreground">مسودات تنتظر المراجعة</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">{pendingShipments.length}</p>
          <p className="text-[11px] text-muted-foreground">شحنات بدون اعتماد فني</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{drafts.filter((d: any) => d.status === 'approved').length}</p>
          <p className="text-[11px] text-muted-foreground">معتمدة</p>
        </Card>
        {entityType === 'office' && (
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{needsOfficeApproval.length}</p>
            <p className="text-[11px] text-muted-foreground">تحتاج ختم المكتب</p>
          </Card>
        )}
      </div>

      {/* Pending Shipments (Auto-Draft) */}
      {pendingShipments.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              شحنات تحتاج مراجعة فنية ({pendingShipments.length})
            </CardTitle>
            <CardDescription>شحنات مكتملة لم تحصل على اعتماد الاستشاري بعد</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {pendingShipments.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium font-mono text-xs">{s.shipment_code || s.id.slice(0, 8)}</p>
                    <p className="text-[10px] text-muted-foreground">{s.waste_type} — {s.actual_weight || '?'} طن</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1 text-xs"
                    onClick={() => createDraft.mutate(s)} disabled={createDraft.isPending}>
                    <Send className="w-3 h-3" />إنشاء مسودة
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Office Approval Queue (Watermark Rule) */}
      {entityType === 'office' && needsOfficeApproval.length > 0 && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Stamp className="w-4 h-4 text-purple-500" />
              مستندات تحتاج ختم المكتب ({needsOfficeApproval.length})
            </CardTitle>
            <CardDescription>مستندات صادرة من استشاريين أفراد تحمل وسم "قيد المراجعة"</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsOfficeApproval.map((d: any) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{d.waste_type || 'شحنة'} — {d.weight_tons || '?'} طن</p>
                      <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300">⏳ قيد المراجعة</Badge>
                    </div>
                    {d.review_notes && <p className="text-[10px] text-muted-foreground">{d.review_notes}</p>}
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="gap-1 text-xs text-red-600"
                      onClick={() => officeApproveDraft.mutate({ draftId: d.id, action: 'rejected' })}>
                      <XCircle className="w-3 h-3" />رفض
                    </Button>
                    <Button size="sm" className="gap-1 text-xs bg-purple-600 hover:bg-purple-700"
                      onClick={() => officeApproveDraft.mutate({ draftId: d.id, action: 'approved' })}>
                      <Stamp className="w-3 h-3" />ختم المكتب
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Draft Review */}
      {drafts.filter((d: any) => d.status === 'pending').length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              مسودات تنتظر مراجعتك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {drafts.filter((d: any) => d.status === 'pending').map((draft: any) => (
                <motion.div key={draft.id} layout
                  className={`p-3 rounded-lg border transition-all ${selectedDraft?.id === draft.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedDraft(selectedDraft?.id === draft.id ? null : draft)}>
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{draft.waste_type || 'نفايات'} — {draft.weight_tons || '?'} طن</p>
                      <p className="text-[10px] text-muted-foreground">
                        {draft.transport_office || ''} | {new Date(draft.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                      <Lock className="w-3 h-3 ml-1" />الفاتورة مقفلة
                    </Badge>
                  </div>

                  {selectedDraft?.id === draft.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 space-y-3">
                      <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                        <p>النوع: <strong>{draft.waste_type || 'غير محدد'}</strong></p>
                        <p>الوزن: <strong>{draft.weight_tons || '?'} طن</strong></p>
                        <p>المسافة: <strong>{draft.distance_km || '?'} كم</strong></p>
                      </div>
                      <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="ملاحظات المراجعة الفنية..." className="min-h-[60px]" />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="gap-1 text-red-600"
                          onClick={() => reviewDraft.mutate({ draftId: draft.id, action: 'rejected' })} disabled={reviewDraft.isPending}>
                          <XCircle className="w-4 h-4" />رفض
                        </Button>
                        <Button size="sm" className="gap-1"
                          onClick={() => reviewDraft.mutate({ draftId: draft.id, action: 'approved' })} disabled={reviewDraft.isPending}>
                          {reviewDraft.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                          اعتماد المطابقة الفنية
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lock Rule Info */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold mb-1">قاعدة القفل (Lock Rule)</p>
              <p className="text-[11px] text-muted-foreground">
                لا يمكن لمكتب النقل إصدار فاتورة للجهة إلا بعد ضغط الاستشاري على زر [اعتماد المطابقة الفنية].
                الشحنات غير المعتمدة تظهر بوسم "🔒 الفاتورة مقفلة".
              </p>
            </div>
          </div>
          {entityType === 'individual' && (
            <div className="flex items-start gap-3 mt-3 pt-3 border-t">
              <Stamp className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold mb-1">قاعدة الختم (Watermark Rule)</p>
                <p className="text-[11px] text-muted-foreground">
                  المستندات الصادرة من الاستشاري الفرد تحمل وسم "قيد المراجعة" حتى يتم اعتمادها بختم المكتب الاستشاري الرئيسي.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

ConsultantAutoReviewPanel.displayName = 'ConsultantAutoReviewPanel';
export default ConsultantAutoReviewPanel;
