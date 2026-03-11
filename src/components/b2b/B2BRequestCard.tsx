import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Package, Eye, MessageSquare, Shield, AlertCircle, Zap } from 'lucide-react';
import { ORG_TYPE_LABELS, ORG_TYPE_COLORS, type OrgType } from './B2BVisibilityEngine';
import type { B2BRequest } from '@/hooks/useB2BMarketplace';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Props {
  request: B2BRequest;
  isOwn?: boolean;
  onRespond?: (r: B2BRequest) => void;
  onClose?: (r: B2BRequest) => void;
}

const UNIT_LABELS: Record<string, string> = {
  ton: 'طن', kg: 'كجم', unit: 'وحدة', trip: 'رحلة', container: 'حاوية', cubic_meter: 'م³',
};

const URGENCY_MAP: Record<string, { label: string; color: string; icon: typeof Zap }> = {
  low: { label: 'منخفضة', color: 'bg-muted text-muted-foreground', icon: Clock },
  normal: { label: 'عادية', color: 'bg-blue-100 text-blue-800', icon: Clock },
  high: { label: 'مستعجلة', color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
  critical: { label: 'طارئة', color: 'bg-red-100 text-red-800', icon: Zap },
};

const B2BRequestCard = ({ request, isOwn, onRespond, onClose }: Props) => {
  const requesterType = (request.requester_type || 'generator') as OrgType;
  const unitLabel = UNIT_LABELS[request.unit || 'ton'] || request.unit;
  const urgency = URGENCY_MAP[request.urgency || 'normal'] || URGENCY_MAP.normal;
  const UrgencyIcon = urgency.icon;
  const timeAgo = formatDistanceToNow(new Date(request.created_at), { locale: ar, addSuffix: true });

  return (
    <Card className="hover:shadow-md transition-all border-border/60 border-r-4 border-r-amber-400">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground leading-tight line-clamp-2">{request.title}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge className={`text-[10px] border ${ORG_TYPE_COLORS[requesterType]}`} variant="outline">
                {ORG_TYPE_LABELS[requesterType]}
              </Badge>
              <Badge className={`text-[10px] ${urgency.color}`} variant="secondary">
                <UrgencyIcon className="h-3 w-3 ml-0.5" />
                {urgency.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                طلب شراء
              </Badge>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Clock className="h-3 w-3" />{timeAgo}
          </span>
        </div>

        {request.organization_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>{request.organization_name}</span>
            {request.location_city && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{request.location_city}</span>
              </>
            )}
          </div>
        )}

        {request.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
        )}

        <div className="flex items-center justify-between bg-amber-50/50 rounded-lg p-3">
          <div>
            {(request.budget_min || request.budget_max) ? (
              <div>
                <span className="text-xl font-bold text-amber-700">
                  {request.budget_min?.toLocaleString() || '—'} - {request.budget_max?.toLocaleString() || '—'}
                </span>
                <span className="text-sm text-muted-foreground mr-1">ج.م (ميزانية)</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">مفتوح للعروض</span>
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              {request.quantity} {unitLabel}
            </div>
            {request.deadline && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                حتى: {new Date(request.deadline).toLocaleDateString('ar-EG')}
              </p>
            )}
          </div>
        </div>

        {request.target_audience && request.target_audience.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground ml-1">موجّه لـ:</span>
            {request.target_audience.map(t => (
              <Badge key={t} variant="outline" className={`text-[9px] py-0 ${ORG_TYPE_COLORS[t as OrgType] || ''}`}>
                {ORG_TYPE_LABELS[t as OrgType] || t}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{request.views_count || 0}</span>
            <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{request.responses_count || 0} رد</span>
            <span className="text-[10px]">#{request.request_number}</span>
          </div>
          <div className="flex gap-2">
            {isOwn ? (
              request.status === 'open' && (
                <Button size="sm" variant="destructive" onClick={() => onClose?.(request)}>إغلاق</Button>
              )
            ) : (
              <Button size="sm" onClick={() => onRespond?.(request)}>تقديم عرض</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default B2BRequestCard;
