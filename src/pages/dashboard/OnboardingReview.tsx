import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Brain, CheckCircle, XCircle, AlertTriangle, Eye, FileText,
  Building2, User, CreditCard, Loader2, Shield, Clock,
  ThumbsUp, ThumbsDown, Search, Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Acceptance {
  id: string;
  full_name: string | null;
  organization_name: string | null;
  organization_type: string;
  signer_national_id: string | null;
  signer_phone: string | null;
  signer_position: string | null;
  signer_id_front_url: string | null;
  signer_id_back_url: string | null;
  signer_signature_url: string | null;
  selfie_url: string | null;
  business_doc_urls: string[] | null;
  business_doc_type: string | null;
  delegation_data: any;
  verified_match: boolean;
  ai_review_score: number | null;
  ai_review_status: string | null;
  ai_review_reasons: any[] | null;
  ai_review_summary: string | null;
  admin_reviewed_by: string | null;
  admin_reviewed_at: string | null;
  admin_review_notes: string | null;
  accepted_at: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="w-3 h-3" /> },
  auto_approved: { label: 'موافق تلقائياً', color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="w-3 h-3" /> },
  needs_review: { label: 'يحتاج مراجعة', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: <AlertTriangle className="w-3 h-3" /> },
  admin_approved: { label: 'موافق', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <ThumbsUp className="w-3 h-3" /> },
  admin_rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-800 border-red-200', icon: <ThumbsDown className="w-3 h-3" /> },
};

const docTypeLabels: Record<string, string> = {
  tax_card: 'بطاقة ضريبية',
  commercial_register: 'سجل تجاري',
  data_statement: 'وثيقة بيانات',
  other: 'مستند آخر',
};

const OnboardingReview = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAcceptance, setSelectedAcceptance] = useState<Acceptance | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: acceptances = [], isLoading } = useQuery({
    queryKey: ['onboarding-reviews', filterStatus],
    queryFn: async () => {
      let query = supabase.from('terms_acceptances').select('*').order('created_at', { ascending: false });
      if (filterStatus !== 'all') {
        query = query.eq('ai_review_status', filterStatus);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Acceptance[];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase.from('terms_acceptances').update({
        ai_review_status: status,
        admin_reviewed_by: profile?.id,
        admin_reviewed_at: new Date().toISOString(),
        admin_review_notes: notes,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-reviews'] });
      toast.success('تم تحديث حالة المراجعة');
      setSelectedAcceptance(null);
      setReviewNotes('');
    },
    onError: () => toast.error('حدث خطأ أثناء التحديث'),
  });

  const filtered = acceptances.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.full_name?.toLowerCase().includes(q) ||
      a.organization_name?.toLowerCase().includes(q) ||
      a.signer_national_id?.includes(q)
    );
  });

  const stats = {
    total: acceptances.length,
    pending: acceptances.filter(a => a.ai_review_status === 'pending').length,
    needsReview: acceptances.filter(a => a.ai_review_status === 'needs_review').length,
    autoApproved: acceptances.filter(a => a.ai_review_status === 'auto_approved').length,
    adminApproved: acceptances.filter(a => a.ai_review_status === 'admin_approved').length,
    rejected: acceptances.filter(a => a.ai_review_status === 'admin_rejected').length,
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6" dir="rtl">
        <BackButton />
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">المساعد الذكي - مراجعة المستندات</h1>
              <p className="text-sm text-muted-foreground">مراجعة ذكية تلقائية لمستندات التسجيل مع إمكانية المراجعة اليدوية</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'الإجمالي', value: stats.total, icon: <FileText className="w-4 h-4" />, color: 'bg-muted' },
            { label: 'في الانتظار', value: stats.pending, icon: <Clock className="w-4 h-4" />, color: 'bg-yellow-50' },
            { label: 'يحتاج مراجعة', value: stats.needsReview, icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-orange-50' },
            { label: 'موافق تلقائياً', value: stats.autoApproved, icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-50' },
            { label: 'موافق يدوياً', value: stats.adminApproved, icon: <ThumbsUp className="w-4 h-4" />, color: 'bg-emerald-50' },
            { label: 'مرفوض', value: stats.rejected, icon: <XCircle className="w-4 h-4" />, color: 'bg-red-50' },
          ].map((stat, i) => (
            <Card key={i} className={`${stat.color}`}>
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">{stat.icon}<span className="text-xs text-muted-foreground">{stat.label}</span></div>
                <p className="text-xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو المنظمة أو الرقم القومي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-1.5">
            {['all', 'needs_review', 'pending', 'auto_approved', 'admin_approved', 'admin_rejected'].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? 'الكل' : statusConfig[status]?.label || status}
              </Button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">لا توجد طلبات</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((acc) => {
              const config = statusConfig[acc.ai_review_status || 'pending'];
              return (
                <Card key={acc.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedAcceptance(acc)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{acc.full_name || 'بدون اسم'}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            <span>{acc.organization_name}</span>
                            <span>•</span>
                            <span>{acc.signer_position}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {acc.ai_review_score !== null && (
                          <div className="text-center">
                            <p className={`text-lg font-bold ${getScoreColor(acc.ai_review_score)}`}>
                              {acc.ai_review_score}%
                            </p>
                            <p className="text-[9px] text-muted-foreground">تقييم AI</p>
                          </div>
                        )}
                        <Badge variant="outline" className={`text-[10px] gap-1 ${config?.color}`}>
                          {config?.icon}
                          {config?.label}
                        </Badge>
                        <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedAcceptance} onOpenChange={() => setSelectedAcceptance(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-5 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                مراجعة مستندات التسجيل
              </DialogTitle>
            </DialogHeader>
            {selectedAcceptance && (
              <ScrollArea className="max-h-[65vh] px-5">
                <div className="py-4 space-y-5" dir="rtl">
                  {/* Signer Info */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" /> بيانات الموقّع</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div><span className="text-muted-foreground text-xs">الاسم:</span><p className="font-medium">{selectedAcceptance.full_name}</p></div>
                        <div><span className="text-muted-foreground text-xs">المنظمة:</span><p className="font-medium">{selectedAcceptance.organization_name}</p></div>
                        <div><span className="text-muted-foreground text-xs">المنصب:</span><p className="font-medium">{selectedAcceptance.signer_position}</p></div>
                        <div><span className="text-muted-foreground text-xs">الرقم القومي:</span><p className="font-mono font-medium">{selectedAcceptance.signer_national_id}</p></div>
                        <div><span className="text-muted-foreground text-xs">الهاتف:</span><p className="font-medium">{selectedAcceptance.signer_phone}</p></div>
                        <div>
                          <span className="text-muted-foreground text-xs">تطابق الوجه:</span>
                          <p className="font-medium">{selectedAcceptance.verified_match ? '✓ مطابق' : '✗ غير مطابق'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Documents Preview */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="w-4 h-4" /> المستندات المرفقة</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        {selectedAcceptance.signer_id_front_url && (
                          <div className="text-center">
                            <img src={selectedAcceptance.signer_id_front_url} alt="وجه البطاقة" className="w-28 h-20 object-cover rounded-lg border" />
                            <p className="text-[10px] text-muted-foreground mt-1">وجه البطاقة</p>
                          </div>
                        )}
                        {selectedAcceptance.signer_id_back_url && (
                          <div className="text-center">
                            <img src={selectedAcceptance.signer_id_back_url} alt="ظهر البطاقة" className="w-28 h-20 object-cover rounded-lg border" />
                            <p className="text-[10px] text-muted-foreground mt-1">ظهر البطاقة</p>
                          </div>
                        )}
                        {selectedAcceptance.selfie_url && (
                          <div className="text-center">
                            <img src={selectedAcceptance.selfie_url} alt="صورة شخصية" className="w-20 h-20 object-cover rounded-full border" />
                            <p className="text-[10px] text-muted-foreground mt-1">صورة شخصية</p>
                          </div>
                        )}
                        {selectedAcceptance.signer_signature_url && (
                          <div className="text-center">
                            <img src={selectedAcceptance.signer_signature_url} alt="التوقيع" className="w-28 h-16 object-contain rounded-lg border bg-white" />
                            <p className="text-[10px] text-muted-foreground mt-1">التوقيع</p>
                          </div>
                        )}
                      </div>

                      {/* Business Documents */}
                      {selectedAcceptance.business_doc_urls && (selectedAcceptance.business_doc_urls as string[]).length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3" />
                            {docTypeLabels[selectedAcceptance.business_doc_type || ''] || 'مستند تجاري'}
                            <Badge variant="outline" className="text-[9px]">{(selectedAcceptance.business_doc_urls as string[]).length} صفحة</Badge>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(selectedAcceptance.business_doc_urls as string[]).map((url, i) => (
                              <img key={i} src={url} alt={`صفحة ${i + 1}`} className="w-20 h-28 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                                onClick={() => window.open(url, '_blank')} />
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* AI Review Results */}
                  {selectedAcceptance.ai_review_score !== null && (
                    <Card className="border-2 border-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Brain className="w-4 h-4 text-primary" />
                          نتائج المراجعة الذكية
                          <Badge className={`mr-auto text-xs ${selectedAcceptance.ai_review_score! >= 80 ? 'bg-green-500' : 'bg-orange-500'}`}>
                            {selectedAcceptance.ai_review_score}%
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedAcceptance.ai_review_summary && (
                          <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedAcceptance.ai_review_summary}</p>
                        )}
                        {selectedAcceptance.ai_review_reasons && (selectedAcceptance.ai_review_reasons as any[]).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium">الفحوصات:</p>
                            {(selectedAcceptance.ai_review_reasons as any[]).map((check: any, i: number) => (
                              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${check.passed ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                                {check.passed ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />}
                                <div>
                                  <p className="font-medium">{check.check_name}</p>
                                  <p className="text-muted-foreground">{check.details}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Admin existing notes */}
                  {selectedAcceptance.admin_review_notes && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium mb-1">ملاحظات المدير السابقة:</p>
                      <p className="text-sm">{selectedAcceptance.admin_review_notes}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}

            {selectedAcceptance && selectedAcceptance.ai_review_status !== 'admin_approved' && selectedAcceptance.ai_review_status !== 'admin_rejected' && (
              <DialogFooter className="p-5 border-t">
                <div className="w-full space-y-3">
                  <Textarea
                    placeholder="ملاحظات المدير (اختياري)..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      disabled={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ id: selectedAcceptance.id, status: 'admin_rejected', notes: reviewNotes })}
                    >
                      <XCircle className="w-4 h-4" /> رفض
                    </Button>
                    <Button
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                      disabled={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ id: selectedAcceptance.id, status: 'admin_approved', notes: reviewNotes })}
                    >
                      {reviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      قبول
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default OnboardingReview;
