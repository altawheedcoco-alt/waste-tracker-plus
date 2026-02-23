import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Store, Plus, Eye, Gavel, Clock, CheckCircle, 
  MapPin, Scale, RefreshCw, TrendingUp, Package 
} from 'lucide-react';

interface Listing {
  id: string;
  listing_number: string;
  title: string;
  waste_type: string;
  waste_description?: string;
  quantity: number;
  unit: string;
  pickup_city?: string;
  preferred_date?: string;
  deadline?: string;
  min_price?: number;
  max_price?: number;
  listing_type: string;
  status: string;
  special_requirements?: string;
  hazardous: boolean;
  views_count: number;
  bids_count: number;
  created_at: string;
  organization_id: string;
}

interface Bid {
  id: string;
  listing_id: string;
  bidder_organization_id: string;
  price: number;
  estimated_pickup_date?: string;
  notes?: string;
  vehicle_type?: string;
  status: string;
  created_at: string;
}

const WasteMarketplace = () => {
  const { organization } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidNotes, setBidNotes] = useState('');

  const [newListing, setNewListing] = useState({
    title: '',
    waste_type: 'general',
    waste_description: '',
    quantity: '',
    unit: 'طن',
    pickup_city: '',
    preferred_date: '',
    deadline: '',
    min_price: '',
    max_price: '',
    listing_type: 'transport_request',
    special_requirements: '',
    hazardous: false,
  });

  useEffect(() => {
    fetchData();
  }, [organization?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all open listings
      const { data: allListings } = await supabase
        .from('marketplace_listings')
        .select('*')
        .in('status', ['open', 'bidding'])
        .order('created_at', { ascending: false })
        .limit(50);

      setListings(allListings || []);

      if (organization?.id) {
        // My listings
        const { data: mine } = await supabase
          .from('marketplace_listings')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false });
        setMyListings(mine || []);

        // My bids
        const { data: bids } = await supabase
          .from('marketplace_bids')
          .select('*')
          .eq('bidder_organization_id', organization.id)
          .order('created_at', { ascending: false });
        setMyBids(bids || []);
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const createListing = async () => {
    if (!newListing.title || !newListing.quantity) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    try {
      const { error } = await supabase.from('marketplace_listings').insert({
        organization_id: organization!.id,
        title: newListing.title,
        waste_type: newListing.waste_type,
        waste_description: newListing.waste_description || null,
        quantity: parseFloat(newListing.quantity),
        unit: newListing.unit,
        pickup_city: newListing.pickup_city || null,
        preferred_date: newListing.preferred_date || null,
        deadline: newListing.deadline || null,
        min_price: newListing.min_price ? parseFloat(newListing.min_price) : null,
        max_price: newListing.max_price ? parseFloat(newListing.max_price) : null,
        listing_type: newListing.listing_type,
        special_requirements: newListing.special_requirements || null,
        hazardous: newListing.hazardous,
      });

      if (error) throw error;
      toast.success('تم نشر العرض بنجاح');
      setShowCreateDialog(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const submitBid = async (listingId: string) => {
    if (!bidAmount) {
      toast.error('يرجى إدخال المبلغ');
      return;
    }
    try {
      const { error } = await supabase.from('marketplace_bids').insert({
        listing_id: listingId,
        bidder_organization_id: organization!.id,
        price: parseFloat(bidAmount),
        notes: bidNotes || null,
      });

      if (error) throw error;
      toast.success('تم تقديم عرضك بنجاح');
      setBidAmount('');
      setBidNotes('');
      setSelectedListing(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      open: { label: 'مفتوح', variant: 'default' },
      bidding: { label: 'مزايدة', variant: 'outline' },
      awarded: { label: 'تم الترسية', variant: 'secondary' },
      completed: { label: 'مكتمل', variant: 'secondary' },
      cancelled: { label: 'ملغي', variant: 'destructive' },
    };
    const info = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transport_request': return '🚛 طلب نقل';
      case 'waste_sale': return '💰 بيع مخلفات';
      case 'waste_purchase': return '🛒 شراء مخلفات';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Store className="w-6 h-6 mx-auto text-primary mb-1" />
          <div className="text-2xl font-bold">{listings.length}</div>
          <div className="text-xs text-muted-foreground">عروض متاحة</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Package className="w-6 h-6 mx-auto text-blue-500 mb-1" />
          <div className="text-2xl font-bold">{myListings.length}</div>
          <div className="text-xs text-muted-foreground">عروضي</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Gavel className="w-6 h-6 mx-auto text-orange-500 mb-1" />
          <div className="text-2xl font-bold">{myBids.length}</div>
          <div className="text-xs text-muted-foreground">مزايداتي</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto text-green-500 mb-1" />
          <div className="text-2xl font-bold">{myBids.filter(b => b.status === 'accepted').length}</div>
          <div className="text-xs text-muted-foreground">تمت الترسية</div>
        </CardContent></Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="w-4 h-4 ml-1" />
          نشر عرض جديد
        </Button>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 ml-1" />
          تحديث
        </Button>
      </div>

      {/* Marketplace Tabs */}
      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">تصفح العروض</TabsTrigger>
          <TabsTrigger value="my_listings">عروضي</TabsTrigger>
          <TabsTrigger value="my_bids">مزايداتي</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.filter(l => l.organization_id !== organization?.id).map(listing => (
              <Card key={listing.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold">{listing.title}</h3>
                      <span className="text-xs text-muted-foreground font-mono">{listing.listing_number}</span>
                    </div>
                    <div className="flex gap-1">
                      {getStatusBadge(listing.status)}
                      {listing.hazardous && <Badge variant="destructive">خطرة</Badge>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="bg-muted px-2 py-0.5 rounded">{getTypeLabel(listing.listing_type)}</span>
                    <span className="bg-muted px-2 py-0.5 rounded"><Scale className="w-3 h-3 inline ml-1" />{listing.quantity} {listing.unit}</span>
                    {listing.pickup_city && <span className="bg-muted px-2 py-0.5 rounded"><MapPin className="w-3 h-3 inline ml-1" />{listing.pickup_city}</span>}
                  </div>

                  {(listing.min_price || listing.max_price) && (
                    <div className="text-sm font-medium text-primary">
                      💰 {listing.min_price && `${listing.min_price.toLocaleString()}`} {listing.min_price && listing.max_price && ' - '} {listing.max_price && `${listing.max_price.toLocaleString()}`} ج.م
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span><Eye className="w-3 h-3 inline ml-1" />{listing.views_count} مشاهدة</span>
                    <span><Gavel className="w-3 h-3 inline ml-1" />{listing.bids_count} عرض</span>
                    {listing.deadline && <span><Clock className="w-3 h-3 inline ml-1" />حتى {listing.deadline}</span>}
                  </div>

                  <Button 
                    variant="eco" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedListing(listing)}
                  >
                    <Gavel className="w-4 h-4 ml-1" />
                    تقديم عرض
                  </Button>
                </CardContent>
              </Card>
            ))}
            {listings.filter(l => l.organization_id !== organization?.id).length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد عروض متاحة حالياً</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my_listings">
          <div className="space-y-3">
            {myListings.map(listing => (
              <div key={listing.id} className="p-4 rounded-lg border flex items-center justify-between">
                <div>
                  <span className="font-bold">{listing.title}</span>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">{listing.listing_number}</span>
                  <div className="text-sm text-muted-foreground">{listing.quantity} {listing.unit} • {listing.bids_count} عرض</div>
                </div>
                {getStatusBadge(listing.status)}
              </div>
            ))}
            {myListings.length === 0 && <div className="text-center py-8 text-muted-foreground">لا توجد عروض منشورة</div>}
          </div>
        </TabsContent>

        <TabsContent value="my_bids">
          <div className="space-y-3">
            {myBids.map(bid => (
              <div key={bid.id} className="p-4 rounded-lg border flex items-center justify-between">
                <div>
                  <span className="font-bold">{bid.price.toLocaleString()} ج.م</span>
                  <div className="text-sm text-muted-foreground">{new Date(bid.created_at).toLocaleDateString('ar')}</div>
                </div>
                <Badge variant={bid.status === 'accepted' ? 'default' : bid.status === 'rejected' ? 'destructive' : 'outline'}>
                  {bid.status === 'pending' ? 'قيد المراجعة' : bid.status === 'accepted' ? 'مقبول' : bid.status === 'rejected' ? 'مرفوض' : bid.status}
                </Badge>
              </div>
            ))}
            {myBids.length === 0 && <div className="text-center py-8 text-muted-foreground">لم تقدم أي عروض بعد</div>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Bid Dialog */}
      <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تقديم عرض - {selectedListing?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p><strong>الكمية:</strong> {selectedListing?.quantity} {selectedListing?.unit}</p>
              {selectedListing?.pickup_city && <p><strong>المدينة:</strong> {selectedListing?.pickup_city}</p>}
              {selectedListing?.special_requirements && <p><strong>متطلبات:</strong> {selectedListing?.special_requirements}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">عرض السعر (ج.م) *</label>
              <Input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="أدخل عرض السعر" />
            </div>
            <div>
              <label className="text-sm font-medium">ملاحظات (اختياري)</label>
              <Textarea value={bidNotes} onChange={e => setBidNotes(e.target.value)} placeholder="أي تفاصيل إضافية..." rows={2} />
            </div>
            <Button onClick={() => selectedListing && submitBid(selectedListing.id)} className="w-full">
              <Gavel className="w-4 h-4 ml-1" />
              تقديم العرض
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Listing Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>نشر عرض جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <Input placeholder="عنوان العرض *" value={newListing.title} onChange={e => setNewListing(p => ({ ...p, title: e.target.value }))} />
            <Select value={newListing.listing_type} onValueChange={v => setNewListing(p => ({ ...p, listing_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="transport_request">🚛 طلب نقل</SelectItem>
                <SelectItem value="waste_sale">💰 بيع مخلفات</SelectItem>
                <SelectItem value="waste_purchase">🛒 شراء مخلفات</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="الكمية *" value={newListing.quantity} onChange={e => setNewListing(p => ({ ...p, quantity: e.target.value }))} />
              <Input placeholder="المدينة" value={newListing.pickup_city} onChange={e => setNewListing(p => ({ ...p, pickup_city: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="أقل سعر (ج.م)" value={newListing.min_price} onChange={e => setNewListing(p => ({ ...p, min_price: e.target.value }))} />
              <Input type="number" placeholder="أعلى سعر (ج.م)" value={newListing.max_price} onChange={e => setNewListing(p => ({ ...p, max_price: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" placeholder="التاريخ المفضل" value={newListing.preferred_date} onChange={e => setNewListing(p => ({ ...p, preferred_date: e.target.value }))} />
              <Input type="date" placeholder="آخر موعد" value={newListing.deadline} onChange={e => setNewListing(p => ({ ...p, deadline: e.target.value }))} />
            </div>
            <Textarea placeholder="متطلبات خاصة..." value={newListing.special_requirements} onChange={e => setNewListing(p => ({ ...p, special_requirements: e.target.value }))} rows={2} />
            <Button onClick={createListing} className="w-full">نشر العرض</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WasteMarketplace;
