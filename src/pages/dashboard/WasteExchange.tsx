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
  Loader2, ShieldCheck, Filter, Briefcase
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
import { BrokerDashboard } from '@/components/waste-exchange/BrokerDashboard';

const WasteExchange = () => {
  const { t, language } = useLanguage();
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
            <h2 className="text-xl font-bold mb-2">{t('exchangePage.accessRestricted')}</h2>
            <p className="text-muted-foreground">
              {t('exchangePage.accessRestrictedDesc')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 p-3 md:p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BackButton />
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-2xl font-bold text-foreground flex items-center gap-2 truncate">
              <Store className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              {t('exchangePage.title')}
            </h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground truncate">
              {t('exchangePage.subtitle')}
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[
          { label: t('exchangePage.activeListings'), value: listings.length, icon: Tag, color: 'text-green-500' },
          { label: t('exchangePage.myListings'), value: myListings.length, icon: Store, color: 'text-blue-500' },
          { label: t('exchangePage.myBids'), value: myBids.length, icon: ShoppingCart, color: 'text-amber-500' },
          { label: t('exchangePage.watchlist'), value: watchlist.length, icon: Heart, color: 'text-red-500' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="cursor-pointer" onClick={() => {
              if (i === 1) setActiveTab('my-listings');
              if (i === 2) setActiveTab('my-bids');
            }}>
              <CardContent className="p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
                <s.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${s.color} shrink-0`} />
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold">{s.value}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
          <TabsList className="inline-flex w-max gap-0.5 h-auto p-1">
            <TabsTrigger value="marketplace" className="text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">{t('exchangePage.market')}</TabsTrigger>
            <TabsTrigger value="broker" className="gap-1 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
              <Briefcase className="w-3 h-3 shrink-0" />
              {t('exchangePage.broker')}
            </TabsTrigger>
            <TabsTrigger value="my-listings" className="text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">{t('exchangePage.myListings')}</TabsTrigger>
            <TabsTrigger value="my-bids" className="text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">{t('exchangePage.myBids')}</TabsTrigger>
            <TabsTrigger value="price-index" className="text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">{t('exchangePage.priceIndex')}</TabsTrigger>
          </TabsList>
        </div>

        {/* Marketplace */}
        <TabsContent value="marketplace" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="ps-9" placeholder={t('exchangePage.searchListings')}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('exchangePage.all')}</SelectItem>
                <SelectItem value="sell">{t('exchangePage.sell')}</SelectItem>
                <SelectItem value="buy">{t('exchangePage.buy')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterWaste} onValueChange={setFilterWaste}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('exchangePage.allTypes')}</SelectItem>
                <SelectItem value="metals">{t('exchange.metals')}</SelectItem>
                <SelectItem value="paper">{t('exchange.paperCardboard')}</SelectItem>
                <SelectItem value="plastics">{t('exchange.plastics')}</SelectItem>
                <SelectItem value="wood">{t('exchange.wood')}</SelectItem>
                <SelectItem value="glass">{t('exchange.glass')}</SelectItem>
                <SelectItem value="organic">{t('exchange.organic')}</SelectItem>
                <SelectItem value="rdf">{t('exchange.rdf')}</SelectItem>
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
                <p className="text-lg">{t('exchangePage.noListings')}</p>
                <p className="text-sm">{t('exchangePage.beFirst')}</p>
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

        {/* Broker Dashboard */}
        <TabsContent value="broker">
          <BrokerDashboard isRTL={isRTL} />
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
