import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronRight, ChevronLeft, Clock, Package, Bell,
  CheckCircle2, CircleDot, AlertTriangle, Loader2,
} from 'lucide-react';

const WEEKDAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

interface DayEvent {
  id: string;
  title: string;
  time: string;
  type: 'shipment' | 'notification' | 'activity';
  status?: string;
}

const MyCalendarTab = () => {
  const { user, organization } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Fetch events for the month
  const startOfMonth = new Date(year, month, 1).toISOString();
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data: monthEvents = [], isLoading } = useQuery({
    queryKey: ['my-calendar-events', user?.id, year, month],
    queryFn: async () => {
      if (!user?.id) return [];
      const events: (DayEvent & { day: number })[] = [];

      // Fetch shipments
      if (organization?.id) {
        const { data: shipments } = await (supabase.from('shipments') as any)
          .select('id, shipment_number, status, created_at, scheduled_date')
          .eq('organization_id', organization.id)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth)
          .order('created_at', { ascending: false })
          .limit(50);

        (shipments || []).forEach((s: any) => {
          const d = new Date(s.scheduled_date || s.created_at);
          events.push({
            id: s.id,
            title: `شحنة ${s.shipment_number || ''}`,
            time: d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            type: 'shipment',
            status: s.status,
            day: d.getDate(),
          });
        });
      }

      // Fetch notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('id, title, created_at, priority')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .order('created_at', { ascending: false })
        .limit(50);

      (notifs || []).forEach(n => {
        const d = new Date(n.created_at);
        events.push({
          id: n.id,
          title: n.title,
          time: d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          type: 'notification',
          status: n.priority,
          day: d.getDate(),
        });
      });

      // Fetch activity logs
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('id, action, created_at, action_type')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .order('created_at', { ascending: false })
        .limit(30);

      (logs || []).forEach(l => {
        const d = new Date(l.created_at);
        events.push({
          id: l.id,
          title: l.action,
          time: d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          type: 'activity',
          status: l.action_type,
          day: d.getDate(),
        });
      });

      return events;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 3,
  });

  const eventsForDay = (day: number) => monthEvents.filter(e => e.day === day);
  const eventCountForDay = (day: number) => eventsForDay(day).length;
  const selectedEvents = eventsForDay(selectedDay);

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
    setSelectedDay(1);
  };

  const typeConfig = {
    shipment: { icon: Package, color: 'text-primary', bg: 'bg-primary/10', label: 'شحنة' },
    notification: { icon: Bell, color: 'text-amber-600', bg: 'bg-amber-500/10', label: 'إشعار' },
    activity: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10', label: 'نشاط' },
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card className="border-border/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
            <h3 className="font-bold text-lg">
              {MONTHS[month]} {year}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const isToday = isCurrentMonth && day === today.getDate();
              const isSelected = day === selectedDay;
              const eventCount = eventCountForDay(day);

              return (
                <motion.button
                  key={day}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all
                    ${isSelected ? 'bg-primary text-primary-foreground shadow-md' : ''}
                    ${isToday && !isSelected ? 'bg-primary/10 text-primary font-bold ring-1 ring-primary/30' : ''}
                    ${!isSelected && !isToday ? 'hover:bg-muted/50' : ''}
                  `}
                >
                  {day}
                  {eventCount > 0 && (
                    <div className={`flex gap-0.5 mt-0.5 ${isSelected ? '' : ''}`}>
                      {eventCount <= 3 ? (
                        Array.from({ length: eventCount }).map((_, di) => (
                          <div
                            key={di}
                            className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`}
                          />
                        ))
                      ) : (
                        <span className={`text-[8px] font-bold ${isSelected ? 'text-primary-foreground' : 'text-primary'}`}>
                          {eventCount}
                        </span>
                      )}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Events */}
      <Card className="border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            أحداث {selectedDay} {MONTHS[month]}
            {selectedEvents.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">{selectedEvents.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : selectedEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد أحداث في هذا اليوم</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {selectedEvents.map((event, i) => {
                  const config = typeConfig[event.type];
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{event.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {event.time}
                          </span>
                          <Badge variant="outline" className="text-[8px] h-4 px-1.5">{config.label}</Badge>
                        </div>
                      </div>
                      {event.status && (
                        <Badge variant="secondary" className="text-[9px] shrink-0">
                          {event.status}
                        </Badge>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(typeConfig).map(([key, config]) => {
          const count = monthEvents.filter(e => e.type === key).length;
          const Icon = config.icon;
          return (
            <Card key={key} className="border-border/30">
              <CardContent className="p-3 text-center">
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center mx-auto mb-1.5`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-[10px] text-muted-foreground">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyCalendarTab;
