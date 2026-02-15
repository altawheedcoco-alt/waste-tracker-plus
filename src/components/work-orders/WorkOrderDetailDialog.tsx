import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ClipboardList, Calendar, MapPin, AlertTriangle, Package, Clock, User, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ar as arLocale, enUS } from 'date-fns/locale';

interface WorkOrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: any;
}

const WorkOrderDetailDialog = ({ open, onOpenChange, workOrder }: WorkOrderDetailDialogProps) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ar' ? arLocale : enUS;

  const { data: items = [] } = useQuery({
    queryKey: ['work-order-items', workOrder?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('work_order_items')
        .select('*')
        .eq('work_order_id', workOrder.id);
      return data || [];
    },
    enabled: !!workOrder?.id && open,
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['work-order-activity', workOrder?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('work_order_activity')
        .select('*')
        .eq('work_order_id', workOrder.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!workOrder?.id && open,
  });

  if (!workOrder) return null;

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      draft: { label: t('workOrder.statusDraft'), className: 'bg-muted text-muted-foreground' },
      sent: { label: t('workOrder.statusSent'), className: 'bg-blue-500/10 text-blue-600' },
      pending: { label: t('workOrder.statusPending'), className: 'bg-amber-500/10 text-amber-600' },
      viewed: { label: t('workOrder.statusViewed'), className: 'bg-slate-500/10 text-slate-600' },
      accepted: { label: t('workOrder.statusAccepted'), className: 'bg-green-500/10 text-green-600' },
      rejected: { label: t('workOrder.statusRejected'), className: 'bg-red-500/10 text-red-600' },
      counter_offer: { label: t('workOrder.statusCounterOffer'), className: 'bg-purple-500/10 text-purple-600' },
      partially_accepted: { label: t('workOrder.statusPartiallyAccepted'), className: 'bg-amber-500/10 text-amber-600' },
      in_progress: { label: t('workOrder.statusInProgress'), className: 'bg-blue-500/10 text-blue-600' },
      completed: { label: t('workOrder.statusCompleted'), className: 'bg-green-500/10 text-green-600' },
      cancelled: { label: t('workOrder.statusCancelled'), className: 'bg-red-500/10 text-red-600' },
    };
    const s = map[status] || { label: status, className: 'bg-muted' };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      created_draft: t('workOrder.savedDraft'),
      sent: t('workOrder.statusSent'),
      accepted: t('workOrder.accept'),
      rejected: t('workOrder.reject'),
      counter_offer: t('workOrder.counterOffer'),
      cancelled: t('workOrder.statusCancelled'),
    };
    return map[action] || action;
  };

  const urgencyMap: Record<string, string> = {
    low: t('workOrder.urgencyLow'),
    normal: t('workOrder.urgencyNormal'),
    high: t('workOrder.urgencyHigh'),
    urgent: t('workOrder.urgencyUrgent'),
  };

  const timeSlotMap: Record<string, string> = {
    anytime: t('workOrder.anytime'),
    morning: t('workOrder.morning'),
    afternoon: t('workOrder.afternoon'),
    evening: t('workOrder.evening'),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            {t('workOrder.orderNumber')}: {workOrder.order_number}
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">{t('workOrder.wasteType')}</span>
            </div>
            <p className="font-semibold text-sm">{workOrder.waste_type}</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">{t('workOrder.estimatedQty')}</span>
            </div>
            <p className="font-semibold text-sm">{workOrder.estimated_quantity} {workOrder.unit}</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">{t('workOrder.urgency')}</span>
            </div>
            <p className="font-semibold text-sm">{urgencyMap[workOrder.urgency] || workOrder.urgency}</p>
          </Card>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">{t('common.status')}: {getStatusBadge(workOrder.status)}</div>
          {workOrder.is_hazardous && (
            <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" /><Badge variant="destructive">{t('workOrder.isHazardous')}</Badge></div>
          )}
          {workOrder.pickup_location && (
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{workOrder.pickup_location}</div>
          )}
          {workOrder.preferred_date && (
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />{format(new Date(workOrder.preferred_date), 'dd/MM/yyyy', { locale: dateLocale })} — {timeSlotMap[workOrder.preferred_time_slot] || ''}</div>
          )}
          {workOrder.waste_description && <p className="text-muted-foreground">{workOrder.waste_description}</p>}
          {workOrder.special_instructions && (
            <div className="p-2 rounded bg-muted/50 text-muted-foreground">{workOrder.special_instructions}</div>
          )}
        </div>

        {/* Items */}
        {items.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-2">{t('workOrder.items')} ({items.length})</h4>
              <div className="space-y-2">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded border text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{item.waste_type}</span>
                      {item.waste_description && <span className="text-muted-foreground ml-2">— {item.waste_description}</span>}
                    </div>
                    <span>{item.quantity} {item.unit}</span>
                    {item.packaging_type && <Badge variant="outline" className="text-[10px]">{item.packaging_type}</Badge>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Recipients */}
        {workOrder.work_order_recipients?.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-2">{t('workOrder.recipients')}</h4>
              <div className="space-y-2">
                {workOrder.work_order_recipients.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{r.recipient_name || r.recipient_organization_id?.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(r.status)}
                      {r.responded_at && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(r.responded_at), 'dd/MM hh:mm a', { locale: dateLocale })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Counter offer details */}
        {workOrder.recipient?.status === 'counter_offer' && (
          <>
            <Separator />
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-sm mb-2 text-purple-700 dark:text-purple-300">{t('workOrder.counterOffer')}</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {workOrder.recipient.counter_quantity && <div><span className="text-muted-foreground">{t('workOrder.counterQty')}:</span> <strong>{workOrder.recipient.counter_quantity}</strong></div>}
                {workOrder.recipient.counter_date && <div><span className="text-muted-foreground">{t('workOrder.counterDate')}:</span> <strong>{workOrder.recipient.counter_date}</strong></div>}
                {workOrder.recipient.counter_price && <div><span className="text-muted-foreground">{t('workOrder.counterPrice')}:</span> <strong>{workOrder.recipient.counter_price}</strong></div>}
              </div>
              {workOrder.recipient.response_notes && <p className="text-sm mt-2 text-muted-foreground">{workOrder.recipient.response_notes}</p>}
            </div>
          </>
        )}

        {/* Activity */}
        {activity.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-2">{t('workOrder.activity')}</h4>
              <div className="space-y-1.5">
                {activity.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(a.created_at), 'dd/MM hh:mm a', { locale: dateLocale })}</span>
                    <span>—</span>
                    <span className="font-medium text-foreground">{getActionLabel(a.action)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderDetailDialog;
