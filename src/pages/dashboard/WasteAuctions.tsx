/**
 * WasteAuctions — Full auction system for waste materials
 * Generators list waste → Recyclers bid → Platform earns commission
 */
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gavel, Plus, Clock, TrendingUp, Eye, Award, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const WASTE_TYPES = [
  'ورق وكرتون', 'بلاستيك', 'معادن حديدية', 'معادن غير حديدية', 'ألمنيوم',
  'خشب', 'زجاج', 'مخلفات إلكترونية', 'إطارات', 'زيوت مستعملة', 'مخلفات عضوية', 'أخرى'
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-700' },
  pending_approval: { label: 'بانتظار الموافقة', color: 'bg-yellow-100 text-yellow-700' },
  active: { label: 'مزاد نشط', color: 'bg-green-100 text-green-700' },
  ended: { label: 'انتهى', color: 'bg-blue-100 text-blue-700' },
  awarded: { label: 'تم الترسية', color: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'ملغى', color: 'bg-red-100 text-red-700' },
};

const WasteAuctions = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [bidDialogAuction, setBidDialogAuction] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [newAuction, setNewAuction] = useState({
    title: '', description: '', waste_type: '', estimated_quantity: '',
    minimum_price: '', buy_now_price: '', ends_at: '', location_text: '', quality_grade: 'B',
  });

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['waste-auctions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waste_auctions')
        .select('*, organization:organizations(name, logo_url)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: myBids = [] } = useQuery({
    queryKey: ['my-auction-bids', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data } = await supabase
        .from('auction_bids')
        .select('*, auction:waste_auctions(title, status, ends_at)')
        .eq('bidder_organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id || !user) throw new Error('Not authenticated');
      const { error } = await supabase.from('waste_auctions').insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        title: newAuction.title,
        description: newAuction.description,
        waste_type: newAuction.waste_type,
        estimated_quantity: Number(newAuction.estimated_quantity),
        minimum_price: Number(newAuction.minimum_price) || 0,
        buy_now_price: newAuction.buy_now_price ? Number(newAuction.buy_now_price) : null,
        ends_at: new Date(newAuction.ends_at).toISOString(),
        location_text: newAuction.location_text,
        quality_grade: newAuction.quality_grade,
        status: 'pending_approval',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إنشاء المزاد — بانتظار موافقة الإدارة');
      setCreateOpen(false);
      setNewAuction({ title: '', description: '', waste_type: '', estimated_quantity: '', minimum_price: '', buy_now_price: '', ends_at: '', location_text: '', quality_grade: 'B' });
      queryClient.invalidateQueries({ queryKey: ['waste-auctions'] });
    },
    onError: () => toast.error('فشل في إنشاء المزاد'),
  });

  const bidMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id || !user || !bidDialogAuction) throw new Error('Missing data');
      const { error } = await supabase.from('auction_bids').insert({
        auction_id: bidDialogAuction.id,
        bidder_organization_id: profile.organization_id,
        bidder_user_id: user.id,
        amount: Number(bidAmount),
        notes: bidNotes || null,
      });
      if (error) throw error;
      // Update highest bid
      if (Number(bidAmount) > (bidDialogAuction.current_highest_bid || 0)) {
        await supabase.from('waste_auctions').update({ current_highest_bid: Number(bidAmount) }).eq('id', bidDialogAuction.id);
      }
    },
    onSuccess: () => {
      toast.success('تم تقديم العرض بنجاح!');
      setBidDialogAuction(null);
      setBidAmount('');
      setBidNotes('');
      queryClient.invalidateQueries({ queryKey: ['waste-auctions'] });
      queryClient.invalidateQueries({ queryKey: ['my-auction-bids'] });
    },
    onError: () => toast.error('فشل في تقديم العرض'),
  });

  const activeAuctions = auctions.filter((a: any) => a.status === 'active');
  const myAuctions = auctions.filter((a: any) => a.organization_id === profile?.organization_id);

  const getTimeLeft = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return 'انتهى';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} يوم ${hours % 24} ساعة`;
    return `${hours} ساعة`;
  };

  return (
    <div className="space-y-4 p-3 md:p-4" dir="rtl">
      <BackButton />
      <div className="space-y-2">
        <div className="min-w-0">
          <h1 className="text-base sm:text-2xl font-bold text-foreground flex items-center gap-2 truncate">
            <Gavel className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
            مزادات المخلفات
          </h1>
          <p className="text-[11px] sm:text-sm text-muted-foreground truncate">اعرض مخلفاتك في مزاد إلكتروني وتنافس على أفضل سعر</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 text-xs sm:text-sm" size="sm"><Plus className="w-3.5 h-3.5" />إنشاء مزاد جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg" dir="rtl">
            <DialogHeader><DialogTitle>إنشاء مزاد مخلفات جديد</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>عنوان المزاد</Label><Input value={newAuction.title} onChange={e => setNewAuction(p => ({ ...p, title: e.target.value }))} placeholder="مثال: 50 طن كرتون نظيف" /></div>
              <div><Label>نوع المخلفات</Label>
                <Select value={newAuction.waste_type} onValueChange={v => setNewAuction(p => ({ ...p, waste_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                  <SelectContent>{WASTE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">الكمية (طن)</Label><Input type="number" value={newAuction.estimated_quantity} onChange={e => setNewAuction(p => ({ ...p, estimated_quantity: e.target.value }))} /></div>
                <div><Label className="text-xs">درجة الجودة</Label>
                  <Select value={newAuction.quality_grade} onValueChange={v => setNewAuction(p => ({ ...p, quality_grade: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A — ممتاز</SelectItem>
                      <SelectItem value="B">B — جيد</SelectItem>
                      <SelectItem value="C">C — مقبول</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">السعر الافتتاحي (ج.م)</Label><Input type="number" value={newAuction.minimum_price} onChange={e => setNewAuction(p => ({ ...p, minimum_price: e.target.value }))} /></div>
                <div><Label className="text-xs">شراء فوري (اختياري)</Label><Input type="number" value={newAuction.buy_now_price} onChange={e => setNewAuction(p => ({ ...p, buy_now_price: e.target.value }))} /></div>
              </div>
              <div><Label>ينتهي في</Label><Input type="datetime-local" value={newAuction.ends_at} onChange={e => setNewAuction(p => ({ ...p, ends_at: e.target.value }))} /></div>
              <div><Label>الموقع</Label><Input value={newAuction.location_text} onChange={e => setNewAuction(p => ({ ...p, location_text: e.target.value }))} placeholder="المنطقة الصناعية، القاهرة" /></div>
              <div><Label>وصف تفصيلي</Label><Textarea value={newAuction.description} onChange={e => setNewAuction(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
              <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!newAuction.title || !newAuction.waste_type || !newAuction.ends_at || createMutation.isPending}>
                {createMutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء المزاد'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card><CardContent className="p-2.5 sm:p-4 text-center"><Gavel className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-primary mb-1" /><p className="text-lg sm:text-2xl font-bold">{activeAuctions.length}</p><p className="text-[10px] sm:text-xs text-muted-foreground">مزاد نشط</p></CardContent></Card>
        <Card><CardContent className="p-2.5 sm:p-4 text-center"><TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-green-500 mb-1" /><p className="text-lg sm:text-2xl font-bold">{myBids.length}</p><p className="text-[10px] sm:text-xs text-muted-foreground">عروضي</p></CardContent></Card>
        <Card><CardContent className="p-2.5 sm:p-4 text-center"><Award className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-amber-500 mb-1" /><p className="text-lg sm:text-2xl font-bold">{myBids.filter((b: any) => b.status === 'won').length}</p><p className="text-[10px] sm:text-xs text-muted-foreground">فائز</p></CardContent></Card>
        <Card><CardContent className="p-2.5 sm:p-4 text-center"><Users className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-blue-500 mb-1" /><p className="text-lg sm:text-2xl font-bold">{myAuctions.length}</p><p className="text-[10px] sm:text-xs text-muted-foreground">مزاداتي</p></CardContent></Card>
      </div>

      <Tabs defaultValue="active" dir="rtl">
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
          <TabsList className="inline-flex w-max gap-0.5 h-auto p-1">
            <TabsTrigger value="active" className="text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">المزادات النشطة</TabsTrigger>
            <TabsTrigger value="mine" className="text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">مزاداتي</TabsTrigger>
            <TabsTrigger value="bids" className="text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">عروضي</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active">
          {isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAuctions.map((auction: any) => (
                <Card key={auction.id} className="hover:shadow-lg transition-shadow">
                  <div className="h-1.5 bg-gradient-to-r from-primary to-green-400" />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm">{auction.title}</CardTitle>
                      <Badge variant="outline" className="text-[9px]">{auction.quality_grade}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{(auction as any).organization?.name}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/50 rounded p-2"><span className="text-muted-foreground">النوع:</span><br /><span className="font-medium">{auction.waste_type}</span></div>
                      <div className="bg-muted/50 rounded p-2"><span className="text-muted-foreground">الكمية:</span><br /><span className="font-medium">{auction.estimated_quantity} {auction.unit}</span></div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">أعلى عرض:</span>
                      <span className="text-lg font-bold text-primary">{auction.current_highest_bid || auction.minimum_price} ج.م</span>
                    </div>
                    {auction.buy_now_price && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">شراء فوري:</span>
                        <span className="font-bold text-amber-600">{auction.buy_now_price} ج.م</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <Clock className="w-3 h-3" />
                      <span>متبقي: {getTimeLeft(auction.ends_at)}</span>
                    </div>
                    {auction.organization_id !== profile?.organization_id && (
                      <Button className="w-full" size="sm" onClick={() => { setBidDialogAuction(auction); setBidAmount(''); }}>
                        <Gavel className="w-4 h-4 ml-1" />قدّم عرضك
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {activeAuctions.length === 0 && <p className="text-center text-muted-foreground col-span-full py-12">لا توجد مزادات نشطة حالياً</p>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine">
          <div className="space-y-3">
            {myAuctions.map((a: any) => (
              <Card key={a.id}><CardContent className="p-4 flex items-center justify-between">
                <div><p className="font-medium text-sm">{a.title}</p><p className="text-xs text-muted-foreground">{a.waste_type} — {a.estimated_quantity} طن</p></div>
                <div className="text-left"><Badge className={STATUS_MAP[a.status]?.color || ''}>{STATUS_MAP[a.status]?.label}</Badge><p className="text-xs mt-1">أعلى عرض: {a.current_highest_bid || 0} ج.م</p></div>
              </CardContent></Card>
            ))}
            {myAuctions.length === 0 && <p className="text-center text-muted-foreground py-8">لم تنشئ مزادات بعد</p>}
          </div>
        </TabsContent>

        <TabsContent value="bids">
          <div className="space-y-3">
            {myBids.map((b: any) => (
              <Card key={b.id}><CardContent className="p-4 flex items-center justify-between">
                <div><p className="font-medium text-sm">{(b as any).auction?.title}</p><p className="text-xs text-muted-foreground">عرضي: {b.amount} ج.م</p></div>
                <Badge variant={b.status === 'won' ? 'default' : b.status === 'outbid' ? 'destructive' : 'secondary'}>
                  {b.status === 'won' ? '🏆 فائز' : b.status === 'outbid' ? 'تم تجاوزك' : 'نشط'}
                </Badge>
              </CardContent></Card>
            ))}
            {myBids.length === 0 && <p className="text-center text-muted-foreground py-8">لم تقدم عروض بعد</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Bid Dialog */}
      <Dialog open={!!bidDialogAuction} onOpenChange={o => !o && setBidDialogAuction(null)}>
        <DialogContent dir="rtl"><DialogHeader><DialogTitle>تقديم عرض — {bidDialogAuction?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p>السعر الافتتاحي: <strong>{bidDialogAuction?.minimum_price} ج.م</strong></p>
              <p>أعلى عرض حالي: <strong className="text-primary">{bidDialogAuction?.current_highest_bid || bidDialogAuction?.minimum_price} ج.م</strong></p>
            </div>
            <div><Label>قيمة عرضك (ج.م)</Label><Input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="أدخل قيمة عرضك" /></div>
            <div><Label>ملاحظات (اختياري)</Label><Textarea value={bidNotes} onChange={e => setBidNotes(e.target.value)} rows={2} /></div>
            <Button className="w-full" onClick={() => bidMutation.mutate()} disabled={!bidAmount || bidMutation.isPending}>
              {bidMutation.isPending ? 'جارٍ التقديم...' : `تقديم العرض — ${bidAmount || '0'} ج.م`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WasteAuctions;
