import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle, CheckCircle, Clock, Eye, MapPin, Radio,
  Thermometer, Scale, Route, Camera, Cpu, Shield
} from 'lucide-react';
import { useWMISEvents, useAcknowledgeWMISEvent, useResolveWMISEvent, WMIS_SEVERITY_CONFIG } from '@/hooks/useWMIS';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const EVENT_ICONS: Record<string, any> = {
  temperature_alert: Thermometer,
  weight_mismatch: Scale,
  route_deviation: Route,
  geofence_breach: MapPin,
  spill_detected: AlertTriangle,
  photo_verification: Camera,
  waste_classification: Cpu,
  compliance_check: Shield,
};

interface Props {
  shipmentId?: string;
  compact?: boolean;
}

const WMISEventsFeed = memo(({ shipmentId, compact }: Props) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [resolveDialog, setResolveDialog] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data: events = [], isLoading } = useWMISEvents({
    shipmentId,
    severity: severityFilter !== 'all' ? severityFilter : undefined,
    resolved: showResolved ? undefined : false,
    limit: compact ? 10 : 50,
  });

  const { mutate: acknowledge } = useAcknowledgeWMISEvent();
  const { mutate: resolve } = useResolveWMISEvent();

  const handleResolve = () => {
    if (!resolveDialog) return;
    resolve({ eventId: resolveDialog, resolutionNotes });
    setResolveDialog(null);
    setResolutionNotes('');
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              أحداث WMIS
              {events.length > 0 && (
                <Badge variant="secondary" className="text-xs">{events.length}</Badge>
              )}
            </CardTitle>
            {!compact && (
              <div className="flex items-center gap-2">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="emergency">🚨 طوارئ</SelectItem>
                    <SelectItem value="critical">🔶 حرج</SelectItem>
                    <SelectItem value="warning">⚠️ تحذير</SelectItem>
                    <SelectItem value="info">ℹ️ معلومة</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={showResolved ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowResolved(!showResolved)}
                >
                  {showResolved ? 'إخفاء المحلولة' : 'عرض المحلولة'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8 text-sm">جاري التحميل...</div>
          ) : events.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
              لا توجد أحداث
            </div>
          ) : (
            <ScrollArea className={compact ? 'max-h-[300px]' : 'max-h-[500px]'}>
              <div className="space-y-2">
                {events.map(event => {
                  const severity = WMIS_SEVERITY_CONFIG[event.event_severity as keyof typeof WMIS_SEVERITY_CONFIG] || WMIS_SEVERITY_CONFIG.info;
                  const EventIcon = EVENT_ICONS[event.event_type] || AlertTriangle;

                  return (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        event.resolved ? 'opacity-60 bg-muted/20' : 
                        event.event_severity === 'emergency' ? 'bg-red-50 dark:bg-red-950/20 border-red-200' :
                        event.event_severity === 'critical' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200' :
                        'bg-card'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <EventIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severity.color}`}>
                              {severity.icon} {severity.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ar })}
                            </span>
                            {event.resolved && (
                              <Badge variant="outline" className="text-[10px] h-4">
                                <CheckCircle className="h-3 w-3 mr-1" /> تم الحل
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium">{event.event_title}</p>
                          {event.event_description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{event.event_description}</p>
                          )}
                          {event.location_name && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {event.location_name}
                            </p>
                          )}
                        </div>
                        {!event.resolved && (
                          <div className="flex items-center gap-1">
                            {!event.acknowledged && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => acknowledge(event.id)}>
                                <Eye className="h-3 w-3 mr-1" /> اطلعت
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setResolveDialog(event.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" /> حل
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حل الحدث</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="ملاحظات الحل..."
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResolveDialog(null)}>إلغاء</Button>
            <Button onClick={handleResolve}>تأكيد الحل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

WMISEventsFeed.displayName = 'WMISEventsFeed';
export default WMISEventsFeed;
