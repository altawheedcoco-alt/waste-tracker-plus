import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, Calendar, Scale, Eye, MessageSquare, Heart, 
  TrendingUp, TrendingDown, Minus, Truck, Package
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    listing_type: 'sell' | 'buy';
    waste_type: string;
    waste_subtype?: string;
    quantity_tons: number;
    price_per_ton?: number;
    currency: string;
    price_negotiable: boolean;
    location_governorate?: string;
    location_city?: string;
    quality_grade?: string;
    pickup_available: boolean;
    delivery_available: boolean;
    available_until?: string;
    views_count: number;
    bids_count: number;
    status: string;
    organization_name?: string;
    organization_type?: string;
    created_at: string;
  };
  isRTL: boolean;
  onView: (id: string) => void;
  onBid: (id: string) => void;
  onWatchlist?: (id: string) => void;
  isWatched?: boolean;
}

const WASTE_TYPE_COLORS: Record<string, string> = {
  metals: 'bg-red-500/10 text-red-600 border-red-500/30',
  paper: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  plastics: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  wood: 'bg-lime-500/10 text-lime-600 border-lime-500/30',
  organic: 'bg-green-500/10 text-green-600 border-green-500/30',
  glass: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
  textiles: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  rdf: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
};

const WASTE_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  metals: { ar: 'معادن', en: 'Metals' },
  paper: { ar: 'ورق/كرتون', en: 'Paper' },
  plastics: { ar: 'بلاستيك', en: 'Plastics' },
  wood: { ar: 'خشب', en: 'Wood' },
  organic: { ar: 'عضوي', en: 'Organic' },
  glass: { ar: 'زجاج', en: 'Glass' },
  textiles: { ar: 'منسوجات', en: 'Textiles' },
  rdf: { ar: 'وقود بديل', en: 'RDF' },
};

const QUALITY_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  premium: { ar: 'ممتاز', en: 'Premium', color: 'bg-emerald-500/10 text-emerald-600' },
  standard: { ar: 'قياسي', en: 'Standard', color: 'bg-blue-500/10 text-blue-600' },
  economy: { ar: 'اقتصادي', en: 'Economy', color: 'bg-amber-500/10 text-amber-600' },
  mixed: { ar: 'مختلط', en: 'Mixed', color: 'bg-muted-foreground/10 text-muted-foreground' },
};

export const ExchangeListingCard = ({ listing, isRTL, onView, onBid, onWatchlist, isWatched }: ListingCardProps) => {
  const wasteColor = WASTE_TYPE_COLORS[listing.waste_type] || 'bg-muted-foreground/10 text-muted-foreground border-gray-500/30';
  const wasteLabel = WASTE_TYPE_LABELS[listing.waste_type];
  const qualityInfo = listing.quality_grade ? QUALITY_LABELS[listing.quality_grade] : null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="hover:shadow-lg transition-all duration-300 border-border/50 group">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className={listing.listing_type === 'sell' 
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                  : 'bg-blue-500/10 text-blue-600 border-blue-500/30'}>
                  {listing.listing_type === 'sell' ? (isRTL ? '🏷️ للبيع' : '🏷️ Sell') : (isRTL ? '🛒 للشراء' : '🛒 Buy')}
                </Badge>
                <Badge variant="outline" className={wasteColor}>
                  {isRTL ? wasteLabel?.ar : wasteLabel?.en}
                </Badge>
                {qualityInfo && (
                  <Badge variant="outline" className={qualityInfo.color}>
                    {isRTL ? qualityInfo.ar : qualityInfo.en}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-foreground line-clamp-1">{listing.title}</h3>
              {listing.organization_name && (
                <p className="text-xs text-muted-foreground mt-0.5">{listing.organization_name}</p>
              )}
            </div>
            {onWatchlist && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onWatchlist(listing.id)}>
                <Heart className={`w-4 h-4 ${isWatched ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
              </Button>
            )}
          </div>

          {/* Price & Quantity */}
          <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-muted/50">
            <div>
              <span className="text-xs text-muted-foreground">{isRTL ? 'السعر/طن' : 'Price/Ton'}</span>
              <div className="font-bold text-lg text-foreground">
                {listing.price_per_ton 
                  ? `${listing.price_per_ton.toLocaleString('ar-EG')} ${isRTL ? 'ج.م' : 'EGP'}`
                  : (isRTL ? 'قابل للتفاوض' : 'Negotiable')}
              </div>
            </div>
            <div className="text-end">
              <span className="text-xs text-muted-foreground">{isRTL ? 'الكمية' : 'Quantity'}</span>
              <div className="font-bold text-lg flex items-center gap-1">
                <Scale className="w-4 h-4 text-muted-foreground" />
                {listing.quantity_tons.toLocaleString('ar-EG')} {isRTL ? 'طن' : 'T'}
              </div>
            </div>
          </div>

          {/* Info Row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
            {listing.location_governorate && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {listing.location_governorate}
              </span>
            )}
            {listing.available_until && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(listing.available_until).toLocaleDateString('ar-EG')}
              </span>
            )}
            <div className="flex items-center gap-2">
              {listing.pickup_available && (
                <Badge variant="outline" className="text-[10px] h-5">
                  <Package className="w-3 h-3 mr-1" />
                  {isRTL ? 'استلام' : 'Pickup'}
                </Badge>
              )}
              {listing.delivery_available && (
                <Badge variant="outline" className="text-[10px] h-5">
                  <Truck className="w-3 h-3 mr-1" />
                  {isRTL ? 'توصيل' : 'Delivery'}
                </Badge>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {listing.views_count}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> {listing.bids_count} {isRTL ? 'عرض' : 'bids'}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onView(listing.id)}>
                {isRTL ? 'تفاصيل' : 'Details'}
              </Button>
              <Button size="sm" onClick={() => onBid(listing.id)}>
                {listing.listing_type === 'sell' 
                  ? (isRTL ? 'تقديم عرض' : 'Place Bid') 
                  : (isRTL ? 'عرض سعر' : 'Quote')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
