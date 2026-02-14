import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Store, Search, ShoppingCart, Tag, BarChart3, Heart, 
  Loader2, ShieldCheck, Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import BackButton from '@/components/ui/back-button';
import { ExchangeListingCard } from '@/components/waste-exchange/ExchangeListingCard';
import { CreateListingDialog } from '@/components/waste-exchange/CreateListingDialog';
import { PlaceBidDialog } from '@/components/waste-exchange/PlaceBidDialog';
import { ExchangePriceIndex } from '@/components/waste-exchange/ExchangePriceIndex';
import { MyListingsTab } from '@/components/waste-exchange/MyListingsTab';
import { MyBidsTab } from '@/components/waste-exchange/MyBidsTab';
import { AdminExchangePanel } from '@/components/waste-exchange/AdminExchangePanel';

const WasteExchange = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { profile, organization, roles } = useAuth();
  const isAdmin = roles?.includes('admin');
  const orgType = organization?.organization_type;

  // Access control: only transporter, recycler, admin
  const hasAccess = isAdmin || orgType === 'transporter' || orgType === 'recycler';

  const [activeTab, setActiveTab] = useState('marketplace');
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [priceIndex, setPriceIndex] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterWaste, setFilterWaste] = useState('all');
  const [filterGov, setFilterGov] = useState('all');

  // Bid dialog
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [selectedListingPrice, setSelectedListingPrice] = useState<number | undefined>();

  // Stats for admin
  const [adminStats, setAdminStats] = useState({
    totalListings: 0, activeListings: 0, totalBids: 0,
    completedTransactions: 0, totalVolumeTons: 0, totalValueEGP: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch active listings
      const { data: listingsData } = await supabase
        .from('waste_exchange_listings')
        .select('*, organizations!waste_exchange_listings_organization_id_fkey(name, organization_type)')
        .eq('status', 'active')
        .order('created_at', { ascending: false }) as any;

      const mapped = (listingsData || []).map((l: any) => ({
        ...l,
        organization_name: l.organizations?.name,
        organization_type: l.organizations?.organization_type,
      }));
      setListings(mapped);

      // Fetch my listings
      if (organization?.id) {
        const { data: myData } = await supabase
          .from('waste_exchange_listings')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false }) as any;
        setMyListings(myData || []);
      }

      // Fetch my bids
      if (organization?.id) {
        const { data: bidsData } = await supabase
          .from('waste_exchange_bids')
          .select('*')
          .eq('bidder_organization_id', organization.id)
          .order('created_at', { ascending: false }) as any;
        setMyBids(bidsData || []);
      }

      // Fetch price index
      const { data: priceData } = await supabase
        .from('waste_exchange_price_index')
        .select('*')
        .order('price_date', { ascending: false })
        .limit(20) as any;
      setPriceIndex(priceData || []);

      // Fetch watchlist
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: wData } = await supabase
          .from('waste_exchange_watchlist')
          .select('listing_id')
          .eq('user_id', user.id) as any;
        setWatchlist((wData || []).map((w: any) => w.listing_id));
      }

      // Admin stats
      if (isAdmin) {
        const { count: totalL } = await supabase.from('waste_exchange_listings').select('*', { count: 'exact', head: true }) as any;
        const { count: activeL } = await supabase.from('waste_exchange_listings').select('*', { count: 'exact', head: true }).eq('status', 'active') as any;
        const { count: totalB } = await supabase.from('waste_exchange_bids').select('*', { count: 'exact', head: true }) as any;
        const { data: txns } = await supabase.from('waste_exchange_transactions').select('agreed_quantity_tons, total_value') as any;
        
        setAdminStats({
          totalListings: totalL || 0,
          activeListings: activeL || 0,
          totalBids: totalB || 0,
          completedTransactions: txns?.length || 0,
          totalVolumeTons: txns?.reduce((a: number, t: any) => a + (t.agreed_quantity_tons || 0), 0) || 0,
          totalValueEGP: txns?.reduce((a: number, t: any) => a + (t.total_value || 0), 0) || 0,
        });
      }
    } catch (err) {
      console.error('Waste exchange fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, isAdmin]);

  useEffect(() => {
    if (hasAccess) fetchData();
  }, [hasAccess, fetchData]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('waste-exchange-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waste_exchange_listings' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waste_exchange_bids' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const toggleWatchlist = async (listingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (watchlist.includes(listingId)) {
      await supabase.from('waste_exchange_watchlist').delete().eq('user_id', user.id).eq('listing_id', listingId);
      setWatchlist(prev => prev.filter(id => id !== listingId));
    } else {
      await supabase.from('waste_exchange_watchlist').insert({ user_id: user.id, listing_id: listingId } as any);
      setWatchlist(prev => [...prev, listingId]);
    }
  };

  const handleBid = (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    setSelectedListingId(listingId);
    setSelectedListingPrice(listing?.price_per_ton);
    setBidDialogOpen(true);
  };

  // Filter listings
  const filteredListings = listings.filter(l => {
    if (filterType !== 'all' && l.listing_type !== filterType) return false;
    if (filterWaste !== 'all' && l.waste_type !== filterWaste) return false;
    if (filterGov !== 'all' && l.location_governorate !== filterGov) return false;
    if (searchQuery && !l.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">{isRTL ? 'غير مصرح' : 'Access Restricted'}</h2>
            <p className="text-muted-foreground">
              {isRTL ? 'بورصة المخلفات متاحة فقط للجهات الناقلة والمدورة ومدير النظام' : 'Waste Exchange is only available for Transporters, Recyclers and System Admin'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-4 md:p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Store className="w-7 h-7 text-primary" />
              {isRTL ? 'بورصة المخلفات' : 'Waste Exchange'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL ? 'سوق إلكتروني لتداول المخلفات بين الجهات الناقلة والمدورة' : 'Digital marketplace for waste trading between transporters and recyclers'}
            </p>
          </div>
        </div>
        {organization?.id && (
          <CreateListingDialog isRTL={isRTL} organizationId={organization.id} onCreated={fetchData} />
        )}
      </div>

      {/* Admin Panel */}
      {isAdmin && <AdminExchangePanel isRTL={isRTL} stats={adminStats} />}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isRTL ? 'عروض نشطة' : 'Active Listings', value: listings.length, icon: Tag, color: 'text-green-500' },
          { label: isRTL ? 'عروضي' : 'My Listings', value: myListings.length, icon: Store, color: 'text-blue-500' },
          { label: isRTL ? 'عروض أسعاري' : 'My Bids', value: myBids.length, icon: ShoppingCart, color: 'text-amber-500' },
          { label: isRTL ? 'المتابعة' : 'Watchlist', value: watchlist.length, icon: Heart, color: 'text-red-500' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="cursor-pointer" onClick={() => {
              if (i === 1) setActiveTab('my-listings');
              if (i === 2) setActiveTab('my-bids');
            }}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="marketplace">{isRTL ? 'السوق' : 'Market'}</TabsTrigger>
          <TabsTrigger value="my-listings">{isRTL ? 'عروضي' : 'My Listings'}</TabsTrigger>
          <TabsTrigger value="my-bids">{isRTL ? 'عروض أسعاري' : 'My Bids'}</TabsTrigger>
          <TabsTrigger value="price-index">{isRTL ? 'مؤشر الأسعار' : 'Price Index'}</TabsTrigger>
        </TabsList>

        {/* Marketplace */}
        <TabsContent value="marketplace" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="ps-9" placeholder={isRTL ? 'بحث في العروض...' : 'Search listings...'}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                <SelectItem value="sell">{isRTL ? 'بيع' : 'Sell'}</SelectItem>
                <SelectItem value="buy">{isRTL ? 'شراء' : 'Buy'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterWaste} onValueChange={setFilterWaste}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'كل الأنواع' : 'All Types'}</SelectItem>
                <SelectItem value="metals">{isRTL ? 'معادن' : 'Metals'}</SelectItem>
                <SelectItem value="paper">{isRTL ? 'ورق' : 'Paper'}</SelectItem>
                <SelectItem value="plastics">{isRTL ? 'بلاستيك' : 'Plastics'}</SelectItem>
                <SelectItem value="wood">{isRTL ? 'خشب' : 'Wood'}</SelectItem>
                <SelectItem value="glass">{isRTL ? 'زجاج' : 'Glass'}</SelectItem>
                <SelectItem value="organic">{isRTL ? 'عضوي' : 'Organic'}</SelectItem>
                <SelectItem value="rdf">{isRTL ? 'RDF' : 'RDF'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredListings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">{isRTL ? 'لا توجد عروض حالياً' : 'No listings available'}</p>
                <p className="text-sm">{isRTL ? 'كن أول من ينشر عرضاً!' : 'Be the first to publish!'}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map(listing => (
                <ExchangeListingCard
                  key={listing.id}
                  listing={listing}
                  isRTL={isRTL}
                  onView={(id) => {/* future detail view */}}
                  onBid={handleBid}
                  onWatchlist={toggleWatchlist}
                  isWatched={watchlist.includes(listing.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Listings */}
        <TabsContent value="my-listings">
          <MyListingsTab isRTL={isRTL} listings={myListings} onRefresh={fetchData}
            onViewBids={(id) => {/* future bids view */}} />
        </TabsContent>

        {/* My Bids */}
        <TabsContent value="my-bids">
          <MyBidsTab isRTL={isRTL} bids={myBids} onRefresh={fetchData} />
        </TabsContent>

        {/* Price Index */}
        <TabsContent value="price-index">
          <ExchangePriceIndex isRTL={isRTL} priceData={priceIndex} />
        </TabsContent>
      </Tabs>

      {/* Bid Dialog */}
      {organization?.id && (
        <PlaceBidDialog
          isRTL={isRTL}
          open={bidDialogOpen}
          onOpenChange={setBidDialogOpen}
          listingId={selectedListingId}
          organizationId={organization.id}
          currentPrice={selectedListingPrice}
          onBidPlaced={fetchData}
        />
      )}
    </div>
  );
};

export default WasteExchange;
