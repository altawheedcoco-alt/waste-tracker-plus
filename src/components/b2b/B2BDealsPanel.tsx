import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Handshake, CheckCircle2, XCircle, Clock, ArrowLeftRight, Star,
  Package, CalendarDays, CreditCard,
} from 'lucide-react';
import { useMyDeals, useUpdateDeal, type B2BDeal } from '@/hooks/useB2BMarketplace';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  negotiating: { label: 'جاري التفاوض', color: 'bg-blue-100 text-blue-800', icon: ArrowLeftRight },
  agreed: { label: 'تم الاتفاق', color: 'bg-amber-100 text-amber-800', icon: Handshake },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-purple-100 text-purple-800', icon: Clock },
  completed: { label: 'مكتملة', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  cancelled: { label: 'ملغاة', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const UNIT_LABELS: Record<string, string> = {
  ton: 'طن', kg: 'كجم', unit: 'وحدة', trip: 'رحلة', container: 'حاوية', cubic_meter: 'م³',
};

const B2BDealsPanel = () => {
  const { organization } = useAuth();
  const { data: deals = [], isLoading } = useMyDeals();
  const updateDeal = useUpdateDeal();

  const isSeller = (deal: B2BDeal) => deal.seller_organization_id === organization?.id;

  const handleConfirm = (deal: B2BDeal) => {
    const field = isSeller(deal) ? 'seller_confirmed' : 'buyer_confirmed';
    const otherConfirmed = isSeller(deal) ? deal.buyer_confirmed : deal.seller_confirmed;
    updateDeal.mutate({
      id: deal.id,
      [field]: true,
      status: otherConfirmed ? 'agreed' : deal.status,
    });
  };

  const handleComplete = (deal: B2BDeal) => {
    updateDeal.mutate({ id: deal.id, status: 'completed', completed_at: new Date().toISOString() } as any);
  };

  const handleCancel = (deal: B2BDeal) => {
    updateDeal.mutate({ id: deal.id, status: 'cancelled', cancelled_at: new Date().toISOString() } as any);
  };

  if (isLoading) return <div className="grid gap-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;

  if (deals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Handshake className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">لا توجد صفقات بعد</p>
          <p className="text-sm text-muted-foreground mt-1">عند الاتفاق على عرض أو طلب ستظهر الصفقة هنا</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {deals.map(deal => {
        const status = STATUS_MAP[deal.status || 'negotiating'] || STATUS_MAP.negotiating;
        const StatusIcon = status.icon;
        const seller = isSeller(deal);
        const counterpartName = seller ? deal.buyer_name : deal.seller_name;
        const myConfirmed = seller ? deal.seller_confirmed : deal.buyer_confirmed;
        const unitLabel = UNIT_LABELS[deal.unit || 'ton'] || deal.unit;

        return (
          <Card key={deal.id} className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base leading-tight">{deal.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {seller ? 'أنت البائع' : 'أنت المشتري'} • مع: <span className="font-medium text-foreground">{counterpartName || '—'}</span>
                  </p>
                </div>
                <Badge className={`text-[10px] ${status.color}`} variant="secondary">
                  <StatusIcon className="h-3 w-3 ml-0.5" />{status.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center bg-muted/50 rounded-lg p-3">
                <div>
                  <CreditCard className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">{deal.agreed_price?.toLocaleString() || '—'}</p>
                  <p className="text-[10px] text-muted-foreground">ج.م</p>
                </div>
                <div>
                  <Package className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">{deal.agreed_quantity || '—'}</p>
                  <p className="text-[10px] text-muted-foreground">{unitLabel}</p>
                </div>
                <div>
                  <CalendarDays className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">
                    {deal.delivery_date ? new Date(deal.delivery_date).toLocaleDateString('ar-EG') : '—'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">التسليم</p>
                </div>
              </div>

              {deal.notes && <p className="text-sm text-muted-foreground">{deal.notes}</p>}

              {/* Confirmation status */}
              <div className="flex items-center gap-4 text-xs">
                <span className={`flex items-center gap-1 ${deal.seller_confirmed ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {deal.seller_confirmed ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  البائع {deal.seller_confirmed ? 'أكّد' : 'لم يؤكد'}
                </span>
                <span className={`flex items-center gap-1 ${deal.buyer_confirmed ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {deal.buyer_confirmed ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  المشتري {deal.buyer_confirmed ? 'أكّد' : 'لم يؤكد'}
                </span>
              </div>

              {/* Rating */}
              {deal.status === 'completed' && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>تقييم البائع: {deal.seller_rating || '—'}/5</span>
                  <span>• تقييم المشتري: {deal.buyer_rating || '—'}/5</span>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  #{deal.deal_number} • {formatDistanceToNow(new Date(deal.created_at), { locale: ar, addSuffix: true })}
                </span>
                <div className="flex gap-2">
                  {(deal.status === 'negotiating' || deal.status === 'agreed') && !myConfirmed && (
                    <Button size="sm" onClick={() => handleConfirm(deal)}>تأكيد</Button>
                  )}
                  {deal.status === 'agreed' && (
                    <Button size="sm" variant="outline" onClick={() => handleComplete(deal)}>اكتمال</Button>
                  )}
                  {deal.status !== 'completed' && deal.status !== 'cancelled' && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleCancel(deal)}>
                      إلغاء
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default B2BDealsPanel;
