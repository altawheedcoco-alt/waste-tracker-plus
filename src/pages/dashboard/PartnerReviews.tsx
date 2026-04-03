/**
 * PartnerReviews — Star ratings + written reviews between organizations
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MessageSquare, Plus, TrendingUp, Award, Shield, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import BackButton from '@/components/ui/back-button';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const StarRating = ({ value, onChange, readonly = false, size = 'md' }: { value: number; onChange?: (v: number) => void; readonly?: boolean; size?: string }) => {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  return (
          <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${sizeClass} ${i <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} ${!readonly ? 'cursor-pointer hover:text-amber-300' : ''}`}
          onClick={() => !readonly && onChange?.(i)}
        />
      ))}
    </div>
  );
};

const PartnerReviews = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [ratings, setRatings] = useState({ overall: 0, punctuality: 0, quality: 0, communication: 0, compliance: 0 });
  const [reviewText, setReviewText] = useState('');
  const [responseDialog, setResponseDialog] = useState<any>(null);
  const [responseText, setResponseText] = useState('');

  // Fetch reviews about my org
  const { data: receivedReviews = [] } = useQuery({
    queryKey: ['received-reviews', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data } = await supabase
        .from('partner_reviews')
        .select('*, reviewer_org:organizations!partner_reviews_reviewer_organization_id_fkey(name, logo_url)')
        .eq('reviewed_organization_id', profile.organization_id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch my reviews
  const { data: givenReviews = [] } = useQuery({
    queryKey: ['given-reviews', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data } = await supabase
        .from('partner_reviews')
        .select('*, reviewed_org:organizations!partner_reviews_reviewed_organization_id_fkey(name, logo_url)')
        .eq('reviewer_organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch partners for review dropdown
  const { data: partners = [] } = useQuery({
    queryKey: ['my-partners', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data } = await supabase
        .from('partner_links')
        .select('*, partner:organizations!partner_links_partner_organization_id_fkey(id, name)')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active');
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  const avgRating = receivedReviews.length > 0
    ? (receivedReviews.reduce((sum: number, r: any) => sum + (r.overall_rating || 0), 0) / receivedReviews.length).toFixed(1)
    : '0.0';

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id || !user || !selectedPartner) throw new Error('Missing');
      const { error } = await supabase.from('partner_reviews').insert({
        reviewer_organization_id: profile.organization_id,
        reviewed_organization_id: selectedPartner,
        reviewer_user_id: user.id,
        overall_rating: ratings.overall,
        punctuality_rating: ratings.punctuality || null,
        quality_rating: ratings.quality || null,
        communication_rating: ratings.communication || null,
        compliance_rating: ratings.compliance || null,
        review_text: reviewText || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم نشر التقييم بنجاح');
      setCreateOpen(false);
      setRatings({ overall: 0, punctuality: 0, quality: 0, communication: 0, compliance: 0 });
      setReviewText('');
      setSelectedPartner('');
      queryClient.invalidateQueries({ queryKey: ['given-reviews'] });
    },
    onError: () => toast.error('فشل في إرسال التقييم'),
  });

  const submitResponse = useMutation({
    mutationFn: async () => {
      if (!responseDialog) return;
      const { error } = await supabase.from('partner_reviews').update({
        response_text: responseText,
        response_at: new Date().toISOString(),
      }).eq('id', responseDialog.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إرسال الرد');
      setResponseDialog(null);
      setResponseText('');
      queryClient.invalidateQueries({ queryKey: ['received-reviews'] });
    },
  });

  return (
    <DashboardLayout>
    <div className="space-y-6 p-4" dir="rtl">
        <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="w-7 h-7 text-amber-500" />
            التقييمات والمراجعات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">قيّم جهاتك المرتبطة وابنِ سمعة رقمية موثوقة</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />تقييم شريك</Button></DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>تقييم شريك</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>اختر الشريك</Label>
                <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                  <SelectTrigger><SelectValue placeholder="اختر جهة" /></SelectTrigger>
                  <SelectContent>{partners.map((p: any) => <SelectItem key={p.partner?.id} value={p.partner?.id}>{p.partner?.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>التقييم العام *</Label><StarRating value={ratings.overall} onChange={v => setRatings(p => ({ ...p, overall: v }))} size="lg" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">الالتزام بالمواعيد</Label><StarRating value={ratings.punctuality} onChange={v => setRatings(p => ({ ...p, punctuality: v }))} size="sm" /></div>
                <div><Label className="text-xs">جودة الخدمة</Label><StarRating value={ratings.quality} onChange={v => setRatings(p => ({ ...p, quality: v }))} size="sm" /></div>
                <div><Label className="text-xs">التواصل</Label><StarRating value={ratings.communication} onChange={v => setRatings(p => ({ ...p, communication: v }))} size="sm" /></div>
                <div><Label className="text-xs">الامتثال البيئي</Label><StarRating value={ratings.compliance} onChange={v => setRatings(p => ({ ...p, compliance: v }))} size="sm" /></div>
              </div>
              <div><Label>مراجعة مكتوبة</Label><Textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3} placeholder="شاركنا تجربتك..." /></div>
              <Button className="w-full" onClick={() => submitReview.mutate()} disabled={!ratings.overall || !selectedPartner || submitReview.isPending}>
                نشر التقييم
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50"><CardContent className="p-4 text-center">
          <Star className="w-6 h-6 mx-auto text-amber-500 mb-1 fill-amber-500" />
          <p className="text-3xl font-bold">{avgRating}</p><p className="text-xs text-muted-foreground">التقييم العام</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center"><MessageSquare className="w-6 h-6 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{receivedReviews.length}</p><p className="text-xs text-muted-foreground">مراجعة مستلمة</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><ThumbsUp className="w-6 h-6 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{receivedReviews.filter((r: any) => r.overall_rating >= 4).length}</p><p className="text-xs text-muted-foreground">تقييم إيجابي</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Award className="w-6 h-6 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{givenReviews.length}</p><p className="text-xs text-muted-foreground">تقييم أرسلته</p></CardContent></Card>
      </div>

      <Tabs defaultValue="received" dir="rtl">
        <TabsList><TabsTrigger value="received">التقييمات المستلمة</TabsTrigger><TabsTrigger value="given">تقييماتي للآخرين</TabsTrigger></TabsList>

        <TabsContent value="received">
          <div className="space-y-3">
            {receivedReviews.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{r.is_anonymous ? 'مُقيّم مجهول' : (r as any).reviewer_org?.name}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'dd MMM yyyy', { locale: ar })}</p>
                    </div>
                    <StarRating value={r.overall_rating} readonly size="sm" />
                  </div>
                  {r.review_text && <p className="text-sm text-foreground bg-muted/30 rounded p-2 mb-2">{r.review_text}</p>}
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    {r.punctuality_rating && <Badge variant="outline">المواعيد: {'⭐'.repeat(r.punctuality_rating)}</Badge>}
                    {r.quality_rating && <Badge variant="outline">الجودة: {'⭐'.repeat(r.quality_rating)}</Badge>}
                    {r.communication_rating && <Badge variant="outline">التواصل: {'⭐'.repeat(r.communication_rating)}</Badge>}
                    {r.compliance_rating && <Badge variant="outline">الامتثال: {'⭐'.repeat(r.compliance_rating)}</Badge>}
                  </div>
                  {r.response_text ? (
                    <div className="mt-2 border-r-2 border-primary pr-3 text-xs text-muted-foreground"><p className="font-medium text-primary text-[10px]">ردكم:</p>{r.response_text}</div>
                  ) : (
                    <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => { setResponseDialog(r); setResponseText(''); }}>↩️ رد على التقييم</Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {receivedReviews.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد تقييمات مستلمة بعد</p>}
          </div>
        </TabsContent>

        <TabsContent value="given">
          <div className="space-y-3">
            {givenReviews.map((r: any) => (
              <Card key={r.id}><CardContent className="p-4 flex items-center justify-between">
                <div><p className="font-medium text-sm">{(r as any).reviewed_org?.name}</p><p className="text-xs text-muted-foreground">{r.review_text?.slice(0, 60)}...</p></div>
                <StarRating value={r.overall_rating} readonly size="sm" />
              </CardContent></Card>
            ))}
            {givenReviews.length === 0 && <p className="text-center text-muted-foreground py-8">لم تقيّم أحداً بعد</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={!!responseDialog} onOpenChange={o => !o && setResponseDialog(null)}>
        <DialogContent dir="rtl"><DialogHeader><DialogTitle>الرد على التقييم</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm bg-muted/30 rounded p-2">"{responseDialog?.review_text}"</p>
            <Textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={3} placeholder="اكتب ردك..." />
            <Button className="w-full" onClick={() => submitResponse.mutate()} disabled={!responseText || submitResponse.isPending}>إرسال الرد</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
        );
};

export default PartnerReviews;
