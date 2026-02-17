import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Eye, MousePointerClick, Clock, Trash2, Edit, Send, Image, Video, Link, BarChart3, Loader2 } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'مسودة', variant: 'secondary' },
  pending_review: { label: 'بانتظار الموافقة', variant: 'outline' },
  pending_payment: { label: 'بانتظار الدفع', variant: 'outline' },
  active: { label: 'نشط', variant: 'default' },
  paused: { label: 'متوقف', variant: 'secondary' },
  expired: { label: 'منتهي', variant: 'destructive' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
};

const CATEGORIES = [
  { value: 'waste_management', label: 'إدارة مخلفات' },
  { value: 'recycling', label: 'تدوير' },
  { value: 'transport', label: 'نقل' },
  { value: 'equipment', label: 'معدات' },
  { value: 'services', label: 'خدمات' },
  { value: 'general', label: 'عام' },
];

const AdvertiserDashboard = () => {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const [ads, setAds] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [form, setForm] = useState({
    title: '', subtitle: '', description: '', external_link: '', cta_text: 'تعرف أكثر', cta_link: '', category: 'general', video_url: '',
    media_urls: [] as string[], badge_text: '',
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [adsRes, plansRes] = await Promise.all([
      supabase.from('advertisements').select('*, ad_plans(*)').eq('advertiser_user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('ad_plans').select('*').eq('is_active', true).order('priority_order'),
    ]);
    setAds(adsRes.data || []);
    setPlans(plansRes.data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !selectedPlan) {
      toast({ title: 'خطأ', description: 'يرجى ملء العنوان واختيار الباقة', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('advertisements').insert({
      advertiser_user_id: user?.id,
      advertiser_organization_id: organization?.id || null,
      ad_plan_id: selectedPlan,
      title: form.title,
      subtitle: form.subtitle || null,
      description: form.description || null,
      external_link: form.external_link || null,
      cta_text: form.cta_text || 'تعرف أكثر',
      cta_link: form.cta_link || null,
      category: form.category,
      video_url: form.video_url || null,
      media_urls: form.media_urls,
      badge_text: form.badge_text || null,
      status: 'pending_review',
      target_audience: ['all'],
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'خطأ', description: 'فشل إنشاء الإعلان', variant: 'destructive' });
    } else {
      toast({ title: 'تم الإرسال', description: 'تم إرسال إعلانك للمراجعة من قبل الإدارة' });
      setShowCreate(false);
      setForm({ title: '', subtitle: '', description: '', external_link: '', cta_text: 'تعرف أكثر', cta_link: '', category: 'general', video_url: '', media_urls: [], badge_text: '' });
      setSelectedPlan('');
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('advertisements').delete().eq('id', id);
    toast({ title: 'تم الحذف' });
    fetchData();
  };

  const totalImpressions = ads.reduce((s, a) => s + (a.impressions_count || 0), 0);
  const totalClicks = ads.reduce((s, a) => s + (a.clicks_count || 0), 0);
  const activeAds = ads.filter(a => a.status === 'active').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold">إعلاناتي</h1>
              <p className="text-muted-foreground text-sm">أنشئ وأدر حملاتك الإعلانية</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> إنشاء إعلان جديد
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الإعلانات', value: ads.length, icon: BarChart3 },
            { label: 'إعلانات نشطة', value: activeAds, icon: Eye },
            { label: 'إجمالي المشاهدات', value: totalImpressions, icon: Eye },
            { label: 'إجمالي النقرات', value: totalClicks, icon: MousePointerClick },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ads List */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">الكل ({ads.length})</TabsTrigger>
            <TabsTrigger value="active">نشط ({ads.filter(a => a.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="pending">بانتظار ({ads.filter(a => a.status === 'pending_review').length})</TabsTrigger>
          </TabsList>
          {['all', 'active', 'pending'].map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {loading ? (
                <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
              ) : (
                (tab === 'all' ? ads : ads.filter(a => tab === 'active' ? a.status === 'active' : a.status === 'pending_review')).map(ad => (
                  <Card key={ad.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{ad.title}</h3>
                            <Badge variant={STATUS_MAP[ad.status]?.variant || 'secondary'}>{STATUS_MAP[ad.status]?.label || ad.status}</Badge>
                            {ad.is_featured && <Badge className="bg-amber-500">مميز</Badge>}
                          </div>
                          {ad.subtitle && <p className="text-sm text-muted-foreground">{ad.subtitle}</p>}
                          {ad.description && <p className="text-sm line-clamp-2">{ad.description}</p>}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{ad.impressions_count} مشاهدة</span>
                            <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{ad.clicks_count} نقرة</span>
                            {ad.ad_plans && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ad.ad_plans.name_ar}</span>}
                            {ad.media_urls?.length > 0 && <span className="flex items-center gap-1"><Image className="h-3 w-3" />{ad.media_urls.length} وسائط</span>}
                            {ad.video_url && <span className="flex items-center gap-1"><Video className="h-3 w-3" />فيديو</span>}
                          </div>
                          {ad.rejection_reason && <p className="text-sm text-destructive mt-1">سبب الرفض: {ad.rejection_reason}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(ad.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
              {!loading && ads.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد إعلانات بعد</p>
                  <Button variant="outline" className="mt-3" onClick={() => setShowCreate(true)}>أنشئ أول إعلان</Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء إعلان جديد</DialogTitle>
              <DialogDescription>صمم إعلانك بحرية كاملة واختر الباقة المناسبة</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Plan selection */}
              <div className="space-y-2">
                <Label className="font-bold">اختر الباقة *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plans.map(plan => (
                    <Card key={plan.id} className={`cursor-pointer transition-all ${selectedPlan === plan.id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`} onClick={() => setSelectedPlan(plan.id)}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-sm">{plan.name_ar}</h4>
                          <span className="text-primary font-bold">{plan.price_egp} ج.م</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{plan.duration_days} يوم</p>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {plan.allows_video && <Badge variant="outline" className="text-[10px]"><Video className="h-3 w-3 ml-1" />فيديو</Badge>}
                          {plan.homepage_placement && <Badge variant="outline" className="text-[10px]">الرئيسية</Badge>}
                          <Badge variant="outline" className="text-[10px]"><Image className="h-3 w-3 ml-1" />{plan.max_media_count} صور</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>عنوان الإعلان *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="عنوان جذاب لإعلانك" className="text-right" />
              </div>
              <div className="space-y-2">
                <Label>عنوان فرعي</Label>
                <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="وصف مختصر" className="text-right" />
              </div>
              <div className="space-y-2">
                <Label>تفاصيل الإعلان</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="اكتب تفاصيل إعلانك هنا..." rows={4} className="text-right" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>شارة مميزة</Label>
                  <Input value={form.badge_text} onChange={e => setForm(f => ({ ...f, badge_text: e.target.value }))} placeholder="مثال: عرض خاص" className="text-right" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Link className="h-4 w-4" /> رابط خارجي</Label>
                <Input value={form.external_link} onChange={e => setForm(f => ({ ...f, external_link: e.target.value }))} placeholder="https://..." dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>نص الزر (CTA)</Label>
                  <Input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label>رابط الزر</Label>
                  <Input value={form.cta_link} onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))} placeholder="https://..." dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Video className="h-4 w-4" /> رابط فيديو (YouTube / Vimeo)</Label>
                <Input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/..." dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Image className="h-4 w-4" /> روابط الصور (رابط لكل سطر)</Label>
                <Textarea
                  value={form.media_urls.join('\n')}
                  onChange={e => setForm(f => ({ ...f, media_urls: e.target.value.split('\n').filter(Boolean) }))}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  rows={3} dir="ltr"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
              <Button onClick={handleCreate} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                إرسال للمراجعة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdvertiserDashboard;
