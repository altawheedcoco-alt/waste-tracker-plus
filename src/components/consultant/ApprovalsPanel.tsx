import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ShieldCheck, FileText, CheckCircle2, XCircle, Loader2,
  Truck, AlertTriangle, Eye, Clock, CreditCard,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ApprovalsPanelProps {
  assignments: any[];
}

const ApprovalsPanel = memo(({ assignments }: ApprovalsPanelProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const orgIds = assignments.map((a: any) => a.organization_id);

  // Fetch pending shipments from all linked orgs
  const { data: pendingShipments = [], isLoading } = useQuery({
    queryKey: ['consultant-pending-shipments', orgIds],
    queryFn: async () => {
      if (!orgIds.length) return [];
      const results: any[] = [];
      for (const orgId of orgIds) {
        // @ts-ignore - deep type instantiation workaround
        const result = await supabase
          .from('shipments')
          .select('*, generator:organizations!shipments_generator_id_fkey(name), transporter:organizations!shipments_transporter_id_fkey(name)')
          .eq('organization_id', orgId)
          .in('status', ['pending', 'registered'] as any)
          .order('created_at', { ascending: false })
          .limit(20);
        const data = result.data;
        if (data) results.push(...data);
      }
      return results;
    },
    enabled: orgIds.length > 0,
  });

  // Fetch documents needing review from linked orgs
  const { data: pendingDocs = [] } = useQuery({
    queryKey: ['consultant-pending-docs', orgIds],
    queryFn: async () => {
      if (!orgIds.length) return [];
      const results: any[] = [];
      for (const orgId of orgIds) {
        const { data } = await supabase
          .from('organization_documents')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(20);
        if (data) results.push(...data);
      }
      return results;
    },
    enabled: orgIds.length > 0,
  });

  // Approve shipment mutation
  const approveShipment = useMutation({
    mutationFn: async ({ shipmentId, approved }: { shipmentId: string; approved: boolean }) => {
      const newStatus = approved ? 'approved' : 'rejected';
      const { error } = await supabase
        .from('shipments')
        .update({ status: newStatus } as any)
        .eq('id', shipmentId);
      if (error) throw error;

      // Log the review
      await supabase.from('shipment_logs').insert({
        shipment_id: shipmentId,
        status: newStatus as any,
        changed_by: profile?.id,
        notes: `مراجعة الاستشاري: ${approved ? 'اعتماد' : 'رفض'} - ${reviewNotes || 'بدون ملاحظات'}`,
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['consultant-pending-shipments'] });
      toast.success(vars.approved ? 'تم اعتماد الشحنة بنجاح' : 'تم رفض الشحنة');
      setSelectedShipment(null);
      setReviewNotes('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getOrgName = (orgId: string) => {
    const a = assignments.find((x: any) => x.organization_id === orgId);
    return a?.organization?.name || 'جهة غير معروفة';
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="shipments">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="shipments" className="gap-1.5">
            <ShieldCheck className="w-4 h-4" />اعتماد الشحنات
            {pendingShipments.length > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5">{pendingShipments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="w-4 h-4" />مراجعة المستندات
            {pendingDocs.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5">{pendingDocs.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                اعتماد الشحنات
              </CardTitle>
              <CardDescription>
                مراجعة واعتماد الشحنات للتأكد من مطابقة نوع النفايات للتصريح القانوني
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : pendingShipments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">لا توجد شحنات بانتظار الاعتماد</p>
                  <p className="text-sm mt-1">كل الشحنات تمت مراجعتها</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingShipments.map((s: any) => (
                    <div key={s.id} className="border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-mono text-xs">{s.shipment_number}</Badge>
                            <Badge variant={s.status === 'pending' ? 'secondary' : 'default'} className="text-[10px]">
                              {s.status === 'pending' ? 'بانتظار المراجعة' : s.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{s.waste_type || 'نوع غير محدد'}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{s.quantity} {s.unit}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(s.created_at).toLocaleDateString('ar-EG')}</span>
                            <span>من: {getOrgName(s.organization_id)}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelectedShipment(s)}>
                            <Eye className="w-3.5 h-3.5" />مراجعة
                          </Button>
                        </div>
                      </div>

                      {selectedShipment?.id === s.id && (
                        <div className="mt-4 pt-4 border-t border-border space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-muted-foreground">المولد:</span> {s.generator?.name || '-'}</div>
                            <div><span className="text-muted-foreground">الناقل:</span> {s.transporter?.name || '-'}</div>
                            <div><span className="text-muted-foreground">موقع التحميل:</span> {s.pickup_location || '-'}</div>
                            <div><span className="text-muted-foreground">موقع التسليم:</span> {s.delivery_location || '-'}</div>
                          </div>
                          <Textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="ملاحظات المراجعة (اختياري)..."
                            className="text-sm"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="destructive" className="gap-1.5"
                              disabled={approveShipment.isPending}
                              onClick={() => approveShipment.mutate({ shipmentId: s.id, approved: false })}>
                              <XCircle className="w-4 h-4" />رفض
                            </Button>
                            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                              disabled={approveShipment.isPending}
                              onClick={() => approveShipment.mutate({ shipmentId: s.id, approved: true })}>
                              {approveShipment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              اعتماد الشحنة
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-blue-600" />
                مراجعة المستندات
              </CardTitle>
              <CardDescription>
                فحص رخص القيادة وتصاريح السيارات والمستندات القانونية للجهات المرتبطة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingDocs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">لا توجد مستندات للمراجعة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingDocs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.document_name || doc.document_type}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {getOrgName(doc.organization_id)} · {new Date(doc.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {doc.expiry_date && new Date(doc.expiry_date) < new Date() && (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertTriangle className="w-3 h-3 ml-1" />منتهي
                          </Badge>
                        )}
                        {doc.document_url && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

ApprovalsPanel.displayName = 'ApprovalsPanel';
export default ApprovalsPanel;
