import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Store, Search, Plus, Package, ShoppingBag, Filter,
  ArrowLeftRight, Info, AlertTriangle, Handshake, Megaphone, Heart,
} from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  useB2BListings, useMyB2BListings, useUpdateListingStatus,
  useB2BRequests, useMyB2BRequests,
} from '@/hooks/useB2BMarketplace';
import B2BStatsBar from '@/components/b2b/B2BStatsBar';
import B2BListingCard from '@/components/b2b/B2BListingCard';
import B2BRequestCard from '@/components/b2b/B2BRequestCard';
import B2BDealsPanel from '@/components/b2b/B2BDealsPanel';
import CreateB2BListingDialog from '@/components/b2b/CreateB2BListingDialog';
import CreateB2BRequestDialog from '@/components/b2b/CreateB2BRequestDialog';
import {
  ORG_TYPE_LABELS, ORG_TYPE_COLORS, ALL_WASTE_CATEGORIES,
  DEFAULT_TARGET_AUDIENCE,
  type OrgType,
} from '@/components/b2b/B2BVisibilityEngine';
import { toast } from 'sonner';

const B2BMarketplace = () => {
  const { organization } = useAuth();
  const myOrgType = (organization?.organization_type as OrgType) || 'generator';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sellerTypeFilter, setSellerTypeFilter] = useState('all');
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);

  // Listings (supply)
  const { data: listings = [], isLoading: listingsLoading } = useB2BListings({
    category: categoryFilter, search, sellerType: sellerTypeFilter,
  });
  const { data: myListings = [], isLoading: myListingsLoading } = useMyB2BListings();
  const updateStatus = useUpdateListingStatus();

  // Requests (demand)
  const { data: requests = [], isLoading: requestsLoading } = useB2BRequests({
    category: categoryFilter, search,
  });
  const { data: myRequests = [] } = useMyB2BRequests();

  const handleCloseListing = (listing: any) => updateStatus.mutate({ id: listing.id, status: 'closed' });

  const handleRequestQuote = (listing: any) => {
    toast.info(`سيتم إرسال طلب عرض سعر لـ ${listing.organization_name || 'البائع'}`, {
      description: `العرض: ${listing.title}`,
    });
  };

  const handleRespondToRequest = (request: any) => {
    toast.info(`سيتم تقديم عرضك لـ ${request.organization_name || 'الطالب'}`, {
      description: `الطلب: ${request.title}`,
    });
  };

  const visibilityExplainer = () => {
    const targets = DEFAULT_TARGET_AUDIENCE[myOrgType];
    const targetLabels = targets.map(t => ORG_TYPE_LABELS[t]).join('، ');
    if (myOrgType === 'transporter') {
      return 'كناقل، عروضك تظهر للمدورين وجهات التخلص فقط — لا تظهر للمولدين. وترى أنت عروض المولدين والمدورين وجهات التخلص.';
    }
    return `كـ${ORG_TYPE_LABELS[myOrgType]}، عروضك وطلباتك تظهر لـ: ${targetLabels}`;
  };

  return (
    <DashboardLayout>
        <div className="p-3 md:p-6 space-y-4" dir="rtl">
        <BackButton />

        {/* Header */}
        <div className="space-y-3">
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-bold text-foreground flex items-center gap-2 truncate">
              <Store className="h-5 w-5 sm:h-7 sm:w-7 text-primary shrink-0" />
              سوق B2B المتكامل
            </h1>
            <p className="text-muted-foreground text-[11px] sm:text-sm mt-0.5 truncate">
              منصة تبادل شاملة — عرض وطلب مواد وخدمات بين كافة الجهات المسجلة
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <Button onClick={() => setShowCreateListing(true)} className="gap-1.5 text-xs sm:text-sm whitespace-nowrap" size="sm">
              <Plus className="h-3.5 w-3.5" />
              نشر عرض
            </Button>
            <Button onClick={() => setShowCreateRequest(true)} variant="outline" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap" size="sm">
              <Megaphone className="h-3.5 w-3.5" />
              نشر طلب
            </Button>
          </div>
        </div>

        {/* Visibility hint */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-2.5 sm:p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-foreground font-medium flex items-center gap-1.5 flex-wrap">
                أنت مسجل كـ
                <Badge variant="outline" className={ORG_TYPE_COLORS[myOrgType]}>
                  {ORG_TYPE_LABELS[myOrgType]}
                </Badge>
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{visibilityExplainer()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <B2BStatsBar />

        {/* Main Tabs */}
        <Tabs defaultValue="supply" dir="rtl">
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
            <TabsList className="inline-flex w-max gap-0.5 h-auto p-1">
              <TabsTrigger value="supply" className="gap-1 text-[10px] sm:text-xs px-2 py-1.5 whitespace-nowrap">
                <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                العروض
                {listings.length > 0 && <Badge variant="secondary" className="text-[9px] px-1">{listings.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="demand" className="gap-1 text-[10px] sm:text-xs px-2 py-1.5 whitespace-nowrap">
                <Megaphone className="h-3.5 w-3.5 shrink-0" />
                الطلبات
                {requests.length > 0 && <Badge variant="secondary" className="text-[9px] px-1">{requests.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="my-listings" className="gap-1 text-[10px] sm:text-xs px-2 py-1.5 whitespace-nowrap">
                <Package className="h-3.5 w-3.5 shrink-0" />
                عروضي
                {(myListings.length + myRequests.length) > 0 && (
                  <Badge variant="secondary" className="text-[9px] px-1">{myListings.length + myRequests.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="deals" className="gap-1 text-[10px] sm:text-xs px-2 py-1.5 whitespace-nowrap">
                <Handshake className="h-3.5 w-3.5 shrink-0" />
                صفقاتي
              </TabsTrigger>
              <TabsTrigger value="rules" className="gap-1 text-[10px] sm:text-xs px-2 py-1.5 whitespace-nowrap">
                <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
                قواعد الرؤية
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ==================== SUPPLY TAB ==================== */}
          <TabsContent value="supply" className="space-y-4 mt-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ابحث عن منتج، خدمة، أو مدينة..."
                  value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-44">
                  <Filter className="h-4 w-4 ml-1" /><SelectValue placeholder="التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_WASTE_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sellerTypeFilter} onValueChange={setSellerTypeFilter}>
                <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="نوع البائع" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الجهات</SelectItem>
                  <SelectItem value="generator">مولّد</SelectItem>
                  <SelectItem value="transporter">ناقل</SelectItem>
                  <SelectItem value="recycler">مُدوّر</SelectItem>
                  <SelectItem value="disposal">تخلص آمن</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {listingsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
              </div>
            ) : listings.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-lg font-medium text-muted-foreground">لا توجد عروض متاحة لنوع جهتك حالياً</p>
                <p className="text-sm text-muted-foreground mt-1">العروض الموجهة لـ ({ORG_TYPE_LABELS[myOrgType]}) ستظهر هنا</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {listings.map(l => (
                  <B2BListingCard key={l.id} listing={l} onRequestQuote={handleRequestQuote} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ==================== DEMAND TAB ==================== */}
          <TabsContent value="demand" className="space-y-4 mt-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ابحث في طلبات الشراء..."
                  value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
              </div>
              <Button onClick={() => setShowCreateRequest(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />أنشئ طلب شراء
              </Button>
            </div>

            {requestsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
              </div>
            ) : requests.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-lg font-medium text-muted-foreground">لا توجد طلبات شراء متاحة</p>
                <p className="text-sm text-muted-foreground mt-1">الطلبات الموجهة لنوع جهتك ستظهر هنا</p>
                <Button className="mt-4 gap-2" onClick={() => setShowCreateRequest(true)}>
                  <Plus className="h-4 w-4" />أنشئ أول طلب
                </Button>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {requests.map(r => (
                  <B2BRequestCard key={r.id} request={r} onRespond={handleRespondToRequest} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ==================== MY LISTINGS & REQUESTS TAB ==================== */}
          <TabsContent value="my-listings" className="space-y-6 mt-4">
            {/* My Listings */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />عروضي المنشورة
                <Badge variant="secondary">{myListings.length}</Badge>
              </h3>
              {myListingsLoading ? (
                <Skeleton className="h-48" />
              ) : myListings.length === 0 ? (
                <Card><CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">لم تنشر أي عروض بعد</p>
                  <Button className="mt-3 gap-2" size="sm" onClick={() => setShowCreateListing(true)}>
                    <Plus className="h-4 w-4" />نشر عرض جديد
                  </Button>
                </CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {myListings.map(l => (
                    <B2BListingCard key={l.id} listing={l} isOwn onClose={handleCloseListing} />
                  ))}
                </div>
              )}
            </div>

            {/* My Requests */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-600" />طلباتي المنشورة
                <Badge variant="secondary">{myRequests.length}</Badge>
              </h3>
              {myRequests.length === 0 ? (
                <Card><CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">لم تنشر أي طلبات شراء بعد</p>
                  <Button className="mt-3 gap-2" size="sm" variant="outline" onClick={() => setShowCreateRequest(true)}>
                    <Plus className="h-4 w-4" />نشر طلب شراء
                  </Button>
                </CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {myRequests.map(r => (
                    <B2BRequestCard key={r.id} request={r} isOwn />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ==================== DEALS TAB ==================== */}
          <TabsContent value="deals" className="mt-4">
            <B2BDealsPanel />
          </TabsContent>

          {/* ==================== RULES TAB ==================== */}
          <TabsContent value="rules" className="mt-4">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="text-center mb-4">
                  <ArrowLeftRight className="h-10 w-10 text-primary mx-auto mb-2" />
                  <h2 className="text-xl font-bold">قواعد الرؤية في سوق B2B</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    كل جهة ترى فقط العروض والطلبات الموجهة لنوعها — لضمان سرية العلاقات التجارية
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Object.entries(DEFAULT_TARGET_AUDIENCE) as [OrgType, OrgType[]][]).map(([seller, targets]) => (
                    <Card key={seller} className={`border-2 ${seller === myOrgType ? 'border-primary ring-2 ring-primary/20' : 'border-border/40'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={ORG_TYPE_COLORS[seller]}>{ORG_TYPE_LABELS[seller]}</Badge>
                          {seller === myOrgType && <Badge variant="default" className="text-[10px]">أنت</Badge>}
                          <span className="text-sm text-muted-foreground">ينشر عرضاً أو طلباً</span>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground font-medium">يظهر لـ:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {targets.map(t => (
                              <Badge key={t} variant="outline" className={`text-xs ${ORG_TYPE_COLORS[t]}`}>
                                ✓ {ORG_TYPE_LABELS[t]}
                              </Badge>
                            ))}
                          </div>
                          {seller === 'transporter' && (
                            <div className="flex items-start gap-1 mt-2 text-xs text-amber-700 bg-amber-50 rounded p-2">
                              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                              <span>عروض وطلبات الناقل لا تظهر للمولدين — لحماية المصالح التجارية</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* How it works */}
                <div className="bg-muted/50 rounded-xl p-5 space-y-3">
                  <h3 className="font-semibold text-foreground">كيف يعمل السوق؟</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                      <p className="font-medium">انشر عرضاً أو طلباً</p>
                      <p className="text-muted-foreground text-xs">حدد المادة والكمية والسعر والجهات المستهدفة</p>
                    </div>
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                      <p className="font-medium">تلقّى العروض وتفاوض</p>
                      <p className="text-muted-foreground text-xs">الجهات المستهدفة تراسلك وتقدم عروض أسعار</p>
                    </div>
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                      <p className="font-medium">أتمم الصفقة</p>
                      <p className="text-muted-foreground text-xs">وثّق الاتفاق وتابع التنفيذ والتسليم والتقييم</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CreateB2BListingDialog open={showCreateListing} onOpenChange={setShowCreateListing} />
        <CreateB2BRequestDialog open={showCreateRequest} onOpenChange={setShowCreateRequest} />
      </div>
    </DashboardLayout>
  );
};

export default B2BMarketplace;
