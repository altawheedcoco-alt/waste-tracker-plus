import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Clock, Package, Eye, MessageSquare, Shield } from 'lucide-react';
import { ORG_TYPE_LABELS, ORG_TYPE_COLORS } from './B2BVisibilityEngine';
import type { OrgType } from './B2BVisibilityEngine';
import type { B2BListing } from '@/hooks/useB2BMarketplace';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface B2BListingCardProps {
  listing: B2BListing;
  isOwn?: boolean;
  onRequestQuote?: (listing: B2BListing) => void;
  onViewDetails?: (listing: B2BListing) => void;
  onClose?: (listing: B2BListing) => void;
}

const UNIT_LABELS: Record<string, string> = {
  ton: 'طن', kg: 'كجم', unit: 'وحدة', trip: 'رحلة', container: 'حاوية', cubic_meter: 'م³',
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open: { label: 'مفتوح', color: 'bg-emerald-100 text-emerald-800' },
  bidding: { label: 'جاري التسعير', color: 'bg-blue-100 text-blue-800' },
  closed: { label: 'مغلق', color: 'bg-muted text-muted-foreground' },
  awarded: { label: 'تم الترسية', color: 'bg-amber-100 text-amber-800' },
  expired: { label: 'منتهي', color: 'bg-red-100 text-red-800' },
};

const DELIVERY_LABELS: Record<string, string> = {
  pickup: 'استلام من الموقع',
  delivery: 'توصيل',
  both: 'استلام أو توصيل',
};

const B2BListingCard = ({ listing, isOwn, onRequestQuote, onViewDetails, onClose }: B2BListingCardProps) => {
  const sellerType = (listing.seller_type || 'generator') as OrgType;
  const status = STATUS_MAP[listing.status || 'open'] || STATUS_MAP.open;
  const unitLabel = UNIT_LABELS[listing.unit || 'ton'] || listing.unit;
  const timeAgo = formatDistanceToNow(new Date(listing.created_at), { locale: ar, addSuffix: true });

  return (
    <Card className="hover:shadow-md transition-all border-border/60 group">
      <CardContent className="p-4 space-y-3">
        {/* Top row: title + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground leading-tight line-clamp-2">{listing.title}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge className={`text-[10px] border ${ORG_TYPE_COLORS[sellerType]}`} variant="outline">
                {ORG_TYPE_LABELS[sellerType]}
              </Badge>
              <Badge className={`text-[10px] ${status.color}`} variant="secondary">
                {status.label}
              </Badge>
              {listing.hazardous && (
                <Badge className="text-[10px] bg-red-100 text-red-700 border-red-300" variant="outline">
                  ⚠️ خطر
                </Badge>
              )}
              {listing.is_negotiable && (
                <Badge className="text-[10px] bg-purple-100 text-purple-700" variant="secondary">
                  قابل للتفاوض
                </Badge>
              )}
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
        </div>

        {/* Organization info */}
        {listing.organization_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>{listing.organization_name}</span>
            {listing.pickup_city && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {listing.pickup_city}
                </span>
              </>
            )}
          </div>
        )}

        {/* Description */}
        {listing.waste_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{listing.waste_description}</p>
        )}

        {/* Price & Quantity row */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
          <div>
            {listing.price_per_unit ? (
              <div>
                <span className="text-xl font-bold text-primary">
                  {listing.price_per_unit.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground mr-1">
                  ج.م / {unitLabel}
                </span>
              </div>
            ) : listing.min_price || listing.max_price ? (
              <div>
                <span className="text-xl font-bold text-primary">
                  {listing.min_price?.toLocaleString() || '—'} - {listing.max_price?.toLocaleString() || '—'}
                </span>
                <span className="text-sm text-muted-foreground mr-1">ج.م</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">اتصل للسعر</span>
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              {listing.quantity} {unitLabel}
            </div>
            {listing.delivery_option && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {DELIVERY_LABELS[listing.delivery_option] || listing.delivery_option}
              </p>
            )}
          </div>
        </div>

        {/* Target audience chips */}
        {listing.target_audience && listing.target_audience.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground ml-1">متاح لـ:</span>
            {listing.target_audience.map(t => (
              <Badge key={t} variant="outline" className={`text-[9px] py-0 ${ORG_TYPE_COLORS[t as OrgType] || ''}`}>
                {ORG_TYPE_LABELS[t as OrgType] || t}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer stats + actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{listing.views_count || 0}</span>
            <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{listing.bids_count || 0} عرض</span>
            <span className="text-[10px]">#{listing.listing_number}</span>
          </div>
          <div className="flex gap-2">
            {isOwn ? (
              <>
                <Button size="sm" variant="outline" onClick={() => onViewDetails?.(listing)}>
                  تفاصيل
                </Button>
                {(listing.status === 'open' || listing.status === 'bidding') && (
                  <Button size="sm" variant="destructive" onClick={() => onClose?.(listing)}>
                    إغلاق
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => onViewDetails?.(listing)}>
                  تفاصيل
                </Button>
                <Button size="sm" onClick={() => onRequestQuote?.(listing)}>
                  طلب عرض سعر
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default B2BListingCard;
