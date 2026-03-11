import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Store, Search, Plus, Package, ShoppingBag, Filter,
  ArrowLeftRight, Info, AlertTriangle,
} from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useB2BListings, useMyB2BListings, useUpdateListingStatus } from '@/hooks/useB2BMarketplace';
import B2BStatsBar from '@/components/b2b/B2BStatsBar';
import B2BListingCard from '@/components/b2b/B2BListingCard';
import CreateB2BListingDialog from '@/components/b2b/CreateB2BListingDialog';
import {
  ORG_TYPE_LABELS, ORG_TYPE_COLORS, ALL_WASTE_CATEGORIES,
  DEFAULT_TARGET_AUDIENCE, ALLOWED_TARGETS,
  type OrgType,
} from '@/components/b2b/B2BVisibilityEngine';
import { toast } from 'sonner';

const B2BMarketplace = () => {
  const { organization } = useAuth();
  const myOrgType = (organization?.organization_type as OrgType) || 'generator';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sellerTypeFilter, setSellerTypeFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: listings = [], isLoading } = useB2BListings({
    category: categoryFilter,
    search,
    sellerType: sellerTypeFilter,
  });

  const { data: myListings = [], isLoading: myLoading } = useMyB2BListings();
  const updateStatus = useUpdateListingStatus();

  const handleClose = (listing: any) => {
    updateStatus.mutate({ id: listing.id, status: 'closed' });
  };

  const handleRequestQuote = (listing: any) => {
    toast.info(`سيتم إرسال طلب عرض سعر لـ ${listing.organization_name || 'البائع'}`, {
      description: `العرض: ${listing.title}`,
    });
  };

  // Visibility explanation based on org type
  const visibilityExplainer = () => {
    const targets = DEFAULT_TARGET_AUDIENCE[myOrgType];
    const targetLabels = targets.map(t => ORG_TYPE_LABELS[t]).join('، ');
    
    if (myOrgType === 'transporter') {
      return `كناقل، عروضك تظهر للمدورين وجهات التخلص فقط — لا تظهر للمولدين. وترى أنت عروض المولدين والمدورين وجهات التخلص.`;
    }
    return `كـ${ORG_TYPE_LABELS[myOrgType]}، عروضك تظهر لـ: ${targetLabels}`;
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5" dir="rtl">
        <BackButton />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Store className="h-7 w-7 text-primary" />
              سوق B2B — تبادل بين الجهات
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              منصة تداول المواد والخدمات بين الجهات المسجلة في المنظومة
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            نشر عرض جديد
          </Button>
        </div>

        {/* Visibility hint */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-foreground font-medium flex items-center gap-2">
                أنت مسجل كـ
                <Badge variant="outline" className={`${ORG_TYPE_COLORS[myOrgType]}`}>
                  {ORG_TYPE_LABELS[myOrgType]}
                </Badge>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{visibilityExplainer()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <B2BStatsBar />

        {/* Tabs: Browse / My Listings */}
        <Tabs defaultValue="browse" dir="rtl">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="browse" className="gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              تصفح السوق
            </TabsTrigger>
            <TabsTrigger value="my-listings" className="gap-1.5">
              <Package className="h-4 w-4" />
              عروضي
              {myListings.length > 0 && (
                <Badge variant="secondary" className="mr-1 text-[10px]">{myListings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-1.5">
              <ArrowLeftRight className="h-4 w-4" />
              قواعد الرؤية
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن منتج، خدمة، أو مدينة..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 ml-1" />
                  <SelectValue placeholder="التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_WASTE_CATEGORIES.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sellerTypeFilter} onValueChange={setSellerTypeFilter}>
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="نوع البائع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الجهات</SelectItem>
                  <SelectItem value="generator">مولّد</SelectItem>
                  <SelectItem value="transporter">ناقل</SelectItem>
                  <SelectItem value="recycler">مُدوّر</SelectItem>
                  <SelectItem value="disposal">تخلص آمن</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Listings grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
              </div>
            ) : listings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-lg font-medium text-muted-foreground">لا توجد عروض متاحة حالياً</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    العروض المتاحة لنوع جهتك ({ORG_TYPE_LABELS[myOrgType]}) ستظهر هنا
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {listings.map(listing => (
                  <B2BListingCard
                    key={listing.id}
                    listing={listing}
                    onRequestQuote={handleRequestQuote}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Listings Tab */}
          <TabsContent value="my-listings" className="space-y-4 mt-4">
            {myLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
              </div>
            ) : myListings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-lg font-medium text-muted-foreground">لم تنشر أي عروض بعد</p>
                  <Button className="mt-4 gap-2" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4" />
                    أنشئ أول عرض لك
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {myListings.map(listing => (
                  <B2BListingCard
                    key={listing.id}
                    listing={listing}
                    isOwn
                    onClose={handleClose}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="mt-4">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="text-center mb-4">
                  <ArrowLeftRight className="h-10 w-10 text-primary mx-auto mb-2" />
                  <h2 className="text-xl font-bold">قواعد الرؤية في سوق B2B</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    كل جهة ترى فقط العروض الموجهة لنوعها — لضمان سرية العلاقات التجارية
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Object.entries(DEFAULT_TARGET_AUDIENCE) as [OrgType, OrgType[]][]).map(([seller, targets]) => (
                    <Card key={seller} className={`border-2 ${seller === myOrgType ? 'border-primary ring-2 ring-primary/20' : 'border-border/40'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={ORG_TYPE_COLORS[seller]}>{ORG_TYPE_LABELS[seller]}</Badge>
                          {seller === myOrgType && (
                            <Badge variant="default" className="text-[10px]">أنت</Badge>
                          )}
                          <span className="text-sm text-muted-foreground">ينشر عرضاً</span>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground font-medium">يظهر العرض لـ:</p>
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
                              <span>عروض الناقل لا تظهر للمولدين — لحماية المصالح التجارية</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CreateB2BListingDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      </div>
    </DashboardLayout>
  );
};

export default B2BMarketplace;
