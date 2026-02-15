import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ShieldAlert, ShieldCheck, ShieldX,
  LogIn, LogOut, Key, UserX, AlertTriangle,
  Eye, CheckCircle2, Clock, ChevronDown, ChevronUp,
  Globe, Monitor, FileText
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  useSecurityEvents, 
  useResolveSecurityEvent,
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
  SecurityEventsFilters,
  eventTypeLabels,
  severityConfig
} from '@/hooks/useSecurityEvents';
import { cn } from '@/lib/utils';

// Event type icons
const eventIcons: Record<string, React.ReactNode> = {
  login_success: <LogIn className="w-4 h-4 text-green-500" />,
  login_failed: <UserX className="w-4 h-4 text-red-500" />,
  logout: <LogOut className="w-4 h-4 text-blue-500" />,
  password_change: <Key className="w-4 h-4 text-yellow-500" />,
  password_reset_request: <Key className="w-4 h-4 text-orange-500" />,
  '2fa_enabled': <ShieldCheck className="w-4 h-4 text-green-500" />,
  '2fa_disabled': <ShieldX className="w-4 h-4 text-red-500" />,
  '2fa_failed': <ShieldAlert className="w-4 h-4 text-red-500" />,
  api_key_created: <Key className="w-4 h-4 text-blue-500" />,
  api_key_revoked: <Key className="w-4 h-4 text-red-500" />,
  suspicious_activity: <AlertTriangle className="w-4 h-4 text-red-500" />,
  brute_force_detected: <ShieldAlert className="w-4 h-4 text-red-600" />,
  unauthorized_access: <ShieldX className="w-4 h-4 text-red-600" />,
  default: <Shield className="w-4 h-4 text-muted-foreground" />,
};

interface SecurityEventsListProps {
  filters?: SecurityEventsFilters;
  compact?: boolean;
}

export const SecurityEventsList = memo(function SecurityEventsList({
  filters,
  compact = false,
}: SecurityEventsListProps) {
  const { data: events, isLoading } = useSecurityEvents(filters);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const resolveEvent = useResolveSecurityEvent();
  
  const handleResolve = async () => {
    if (!selectedEvent) return;
    
    await resolveEvent.mutateAsync({
      eventId: selectedEvent.id,
      resolutionNotes: resolutionNotes || undefined,
    });
    
    setSelectedEvent(null);
    setResolutionNotes('');
  };
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }
  
  if (!events?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <ShieldCheck className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-muted-foreground">لا توجد أحداث أمنية</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <ScrollArea className={compact ? "h-[300px]" : "h-[500px]"}>
        <div className="space-y-2 pl-2">
          <AnimatePresence mode="popLayout">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card 
                  className={cn(
                    "transition-all hover:shadow-sm cursor-pointer",
                    event.is_suspicious && !event.is_resolved && "border-red-300 bg-red-50/50 dark:bg-red-950/20",
                    event.is_resolved && "opacity-60"
                  )}
                  onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-muted/50 shrink-0">
                          {eventIcons[event.event_type] || eventIcons.default}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {eventTypeLabels[event.event_type as SecurityEventType] || event.event_type}
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-xs",
                                severityConfig[event.severity as SecuritySeverity]?.bgColor,
                                severityConfig[event.severity as SecuritySeverity]?.color
                              )}
                            >
                              {severityConfig[event.severity as SecuritySeverity]?.label || event.severity}
                            </Badge>
                            {event.is_suspicious && !event.is_resolved && (
                              <Badge variant="destructive" className="text-xs">
                                مشبوه
                              </Badge>
                            )}
                            {event.is_resolved && (
                              <Badge variant="outline" className="text-xs text-green-600">
                                <CheckCircle2 className="w-3 h-3 ml-1" />
                                تم الحل
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatDistanceToNow(new Date(event.created_at), { 
                                addSuffix: true, 
                                locale: ar 
                              })}
                            </span>
                            {event.ip_address && (
                              <>
                                <span className="mx-1">•</span>
                                <Globe className="w-3 h-3" />
                                <span className="font-mono text-[10px]">{event.ip_address}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                        {expandedId === event.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Expanded details */}
                    <AnimatePresence>
                      {expandedId === event.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">الوقت:</span>
                                <span className="mr-1 font-mono">
                                  {format(new Date(event.created_at), 'yyyy/MM/dd hh:mm:ss a', { locale: ar })}
                                </span>
                              </div>
                              {event.user_agent && (
                                <div className="flex items-center gap-1">
                                  <Monitor className="w-3 h-3 text-muted-foreground" />
                                  <span className="truncate text-muted-foreground">
                                    {event.user_agent.slice(0, 50)}...
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {Object.keys(event.event_data || {}).length > 0 && (
                              <div className="p-2 bg-muted/50 rounded text-xs font-mono">
                                <pre className="whitespace-pre-wrap overflow-x-auto" dir="ltr">
                                  {JSON.stringify(event.event_data, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {event.is_resolved && event.resolution_notes && (
                              <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded text-xs">
                                <div className="flex items-center gap-1 text-green-600 mb-1">
                                  <FileText className="w-3 h-3" />
                                  <span>ملاحظات الحل:</span>
                                </div>
                                <p className="text-muted-foreground">{event.resolution_notes}</p>
                              </div>
                            )}
                            
                            <div className="flex gap-2 justify-end">
                              {event.is_suspicious && !event.is_resolved && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                  }}
                                >
                                  <CheckCircle2 className="w-4 h-4 ml-1" />
                                  تحديد كمحلول
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Could open detailed view
                                }}
                              >
                                <Eye className="w-4 h-4 ml-1" />
                                التفاصيل
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
      
      {/* Resolve Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديد الحدث كمحلول</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              هل تريد تحديد هذا الحدث الأمني كمحلول؟ يمكنك إضافة ملاحظات حول كيفية الحل.
            </p>
            <Textarea
              placeholder="ملاحظات الحل (اختياري)..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleResolve}
              disabled={resolveEvent.isPending}
            >
              {resolveEvent.isPending ? 'جاري الحفظ...' : 'تحديد كمحلول'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
