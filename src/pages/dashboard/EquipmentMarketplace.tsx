/**
 * EquipmentMarketplace — Buy/sell used recycling & transport equipment
 * Platform earns 3-5% commission on each transaction
 */
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Eye, MessageSquare, Package, Search, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES: Record<string, string> = {
  compactor: 'ضاغط / كبّاسة',
  shredder: 'فرّامة / تقطيع',
  baler: 'مكبس بالات',
  truck: 'شاحنة / مركبة نقل',
  container: 'حاويات',
  scale: 'ميزان / بسكولة',
  conveyor: 'سير ناقل',
  other: 'أخرى',
};

const CONDITIONS: Record<string, string> = {
  new: 'جديد',
  like_new: 'كالجديد',
  used: 'مستعمل',
  needs_repair: 'يحتاج صيانة',
};

const EquipmentMarketplace = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [inquiryListing, setInquiryListing] = useState<any>(null);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [inquiryOffer, setInquiryOffer] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newItem, setNewItem] = useState({
    title: '', description: '', category: '', condition: 'used',
    brand: '', model: '', year_manufactured: '',
    price: '', location_text: '',
  });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['equipment-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_listings')
        .select('*, organization:organizations(name, logo_url)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: myInquiries = [] } = useQuery({
    queryKey: ['my-equipment-inquiries', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data } = await supabase
        .from('equipment_inquiries')
        .select('*, listing:equipment_listings(title, price, status)')
        .eq('inquirer_organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id || !user) throw new Error('Not auth');
      const { error } = await supabase.from('equipment_listings').insert({
        organization_id: profile.organization_id,
        seller_user_id: user.id,
        title: newItem.title,
        description: newItem.description,
        category: newItem.category,
        condition: newItem.condition,
        brand: newItem.brand || null,
        model: newItem.model || null,
        year_manufactured: newItem.year_manufactured ? Number(newItem.year_manufactured) : null,
        price: Number(newItem.price),
        location_text: newItem.location_text || null,
        status: 'pending_review',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إضافة المعدة — بانتظار مراجعة الإدارة');
      setCreateOpen(false);
      setNewItem({ title: '', description: '', category: '', condition: 'used', brand: '', model: '', year_manufactured: '', price: '', location_text: '' });
      queryClient.invalidateQueries({ queryKey: ['equipment-listings'] });
    },
    onError: () => toast.error('فشل في إضافة المعدة'),
  });

  const inquiryMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id || !user || !inquiryListing) throw new Error('Missing');
      const { error } = await supabase.from('equipment_inquiries').insert({
        listing_id: inquiryListing.id,
        inquirer_organization_id: profile.organization_id,
        inquirer_user_id: user.id,
        message: inquiryMsg,
        offer_amount: inquiryOffer ? Number(inquiryOffer) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إرسال الاستفسار');
      setInquiryListing(null);
      setInquiryMsg('');
      setInquiryOffer('');
      queryClient.invalidateQueries({ queryKey: ['my-equipment-inquiries'] });
    },
    onError: () => toast.error('فشل الإرسال'),
  });

  const activeListings = listings.filter((l: any) => l.status === 'active');
  const filtered = activeListings.filter((l: any) => {
    if (filterCategory !== 'all' && l.category !== filterCategory) return false;
    if (searchTerm && !l.title.includes(searchTerm) && !(l.brand || '').includes(searchTerm)) return false;
    return true;
  });
  const myListings = listings.filter((l: any) => l.organization_id === profile?.organization_id);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4" dir="rtl">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-primary" />
            سوق المعدات المستعملة
          </h1>
          <p className="text-sm text-muted-foreground mt-1">بع واشترِ معدات التدوير والنقل بعمولة 4%</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />أضف معدة للبيع</Button></DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader><DialogTitle>إضافة معدة للبيع</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>عنوان الإعلان</Label><Input value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))} placeholder="مثال: مكبس بالات هيدروليكي 2022" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>التصنيف</Label>
                  <Select value={newItem.category} onValueChange={v => setNewItem(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>{Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>الحالة</Label>
                  <Select value={newItem.condition} onValueChange={v => setNewItem(p => ({ ...p, condition: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(CONDITIONS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>الماركة</Label><Input value={newItem.brand} onChange={e => setNewItem(p => ({ ...p, brand: e.target.value }))} /></div>
                <div><Label>الموديل</Label><Input value={newItem.model} onChange={e => setNewItem(p => ({ ...p, model: e.target.value }))} /></div>
                <div><Label>سنة الصنع</Label><Input type="number" value={newItem.year_manufactured} onChange={e => setNewItem(p => ({ ...p, year_manufactured: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>السعر (ج.م)</Label><Input type="number" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} /></div>
                <div><Label>الموقع</Label><Input value={newItem.location_text} onChange={e => setNewItem(p => ({ ...p, location_text: e.target.value }))} /></div>
              </div>
              <div><Label>وصف تفصيلي</Label><Textarea value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
              <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!newItem.title || !newItem.category || !newItem.price || createMutation.isPending}>
                {createMutation.isPending ? 'جارٍ الإضافة...' : 'نشر الإعلان'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث عن معدة..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48"><SelectValue placeholder="كل التصنيفات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل التصنيفات</SelectItem>
            {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="browse" dir="rtl">
        <TabsList><TabsTrigger value="browse">تصفح السوق ({filtered.length})</TabsTrigger><TabsTrigger value="my">إعلاناتي</TabsTrigger><TabsTrigger value="inquiries">استفساراتي</TabsTrigger></TabsList>

        <TabsContent value="browse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item: any) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-blue-500 to-purple-500" />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm">{item.title}</CardTitle>
                    <Badge variant="outline" className="text-[9px]">{CONDITIONS[item.condition] || item.condition}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{(item as any).organization?.name}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/50 rounded p-1.5"><Package className="w-3 h-3 inline ml-1" />{CATEGORIES[item.category]}</div>
                    {item.brand && <div className="bg-muted/50 rounded p-1.5">{item.brand} {item.model}</div>}
                    {item.year_manufactured && <div className="bg-muted/50 rounded p-1.5"><Calendar className="w-3 h-3 inline ml-1" />{item.year_manufactured}</div>}
                    {item.location_text && <div className="bg-muted/50 rounded p-1.5"><MapPin className="w-3 h-3 inline ml-1" />{item.location_text}</div>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">{Number(item.price).toLocaleString()} ج.م</span>
                    {item.is_negotiable && <Badge variant="secondary" className="text-[9px]">قابل للتفاوض</Badge>}
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                  {item.organization_id !== profile?.organization_id && (
                    <Button className="w-full" size="sm" onClick={() => { setInquiryListing(item); setInquiryMsg(''); }}>
                      <MessageSquare className="w-4 h-4 ml-1" />تواصل مع البائع
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && <p className="text-center text-muted-foreground col-span-full py-12">لا توجد معدات معروضة حالياً</p>}
          </div>
        </TabsContent>

        <TabsContent value="my">
          <div className="space-y-3">
            {myListings.map((l: any) => (
              <Card key={l.id}><CardContent className="p-4 flex items-center justify-between">
                <div><p className="font-medium text-sm">{l.title}</p><p className="text-xs text-muted-foreground">{CATEGORIES[l.category]} — {Number(l.price).toLocaleString()} ج.م</p></div>
                <div className="text-left">
                  <Badge variant={l.status === 'active' ? 'default' : l.status === 'sold' ? 'secondary' : 'outline'}>
                    {l.status === 'active' ? 'نشط' : l.status === 'sold' ? 'مباع' : l.status === 'pending_review' ? 'بانتظار الموافقة' : l.status}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">{l.views_count} مشاهدة • {l.inquiries_count} استفسار</p>
                </div>
              </CardContent></Card>
            ))}
            {myListings.length === 0 && <p className="text-center text-muted-foreground py-8">لم تعرض معدات بعد</p>}
          </div>
        </TabsContent>

        <TabsContent value="inquiries">
          <div className="space-y-3">
            {myInquiries.map((inq: any) => (
              <Card key={inq.id}><CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{(inq as any).listing?.title}</p>
                  <Badge variant={inq.status === 'replied' ? 'default' : inq.status === 'accepted' ? 'default' : 'secondary'}>
                    {inq.status === 'pending' ? 'بانتظار الرد' : inq.status === 'replied' ? 'تم الرد' : inq.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{inq.message}</p>
                {inq.seller_reply && <p className="text-xs text-primary mt-1 border-r-2 border-primary pr-2">{inq.seller_reply}</p>}
              </CardContent></Card>
            ))}
            {myInquiries.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد استفسارات</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Inquiry Dialog */}
      <Dialog open={!!inquiryListing} onOpenChange={o => !o && setInquiryListing(null)}>
        <DialogContent dir="rtl"><DialogHeader><DialogTitle>استفسار عن: {inquiryListing?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm bg-muted/30 rounded p-2">السعر المعروض: <strong>{inquiryListing?.price?.toLocaleString()} ج.م</strong></p>
            <div><Label>رسالتك</Label><Textarea value={inquiryMsg} onChange={e => setInquiryMsg(e.target.value)} rows={3} placeholder="أريد الاستفسار عن..." /></div>
            <div><Label>عرض سعر (اختياري)</Label><Input type="number" value={inquiryOffer} onChange={e => setInquiryOffer(e.target.value)} placeholder="اقترح سعراً" /></div>
            <Button className="w-full" onClick={() => inquiryMutation.mutate()} disabled={!inquiryMsg || inquiryMutation.isPending}>إرسال الاستفسار</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentMarketplace;
