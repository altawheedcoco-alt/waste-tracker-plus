import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  Clock, 
  Route, 
  Milestone, 
  RefreshCw,
  Navigation,
  Loader2,
  CheckCircle2,
  Truck,
  Flag,
  Gauge
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProgressLog {
  id: string;
  status: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  changed_by: string | null;
  profile?: {
    full_name: string;
  } | null;
}

interface ShipmentProgressLogsProps {
  shipmentId: string;
  showCard?: boolean;
  maxHeight?: number;
}

const getLogIcon = (notes: string | null, status: string) => {
  if (notes?.includes('منتصف الطريق')) return <Flag className="h-4 w-4 text-amber-500" />;
  if (notes?.includes('ربع الطريق')) return <Milestone className="h-4 w-4 text-blue-500" />;
  if (notes?.includes('ثلاثة أرباع')) return <Navigation className="h-4 w-4 text-purple-500" />;
  if (notes?.includes('كم')) return <Route className="h-4 w-4 text-green-500" />;
  if (status === 'in_transit') return <Truck className="h-4 w-4 text-orange-500" />;
  if (status === 'delivered' || status === 'confirmed') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  return <MapPin className="h-4 w-4 text-primary" />;
};

const getLogBadge = (notes: string | null) => {
  if (notes?.includes('تقدم تلقائي')) {
    if (notes.includes('50%') || notes.includes('منتصف')) {
      return <Badge className="bg-amber-100 text-amber-700 text-xs">منتصف الطريق</Badge>;
    }
    if (notes.includes('25%') || notes.includes('ربع')) {
      return <Badge className="bg-blue-100 text-blue-700 text-xs">25%</Badge>;
    }
    if (notes.includes('75%') || notes.includes('ثلاثة')) {
      return <Badge className="bg-purple-100 text-purple-700 text-xs">75%</Badge>;
    }
    // Distance milestone
    const kmMatch = notes.match(/(\d+)\s*كم/);
    if (kmMatch) {
      return <Badge className="bg-green-100 text-green-700 text-xs gap-1">
        <Gauge className="h-3 w-3" />
        {kmMatch[1]} كم
      </Badge>;
    }
    return <Badge variant="outline" className="text-xs">تلقائي</Badge>;
  }
  return null;
};

const ShipmentProgressLogs = ({ 
  shipmentId, 
  showCard = true,
  maxHeight = 400 
}: ShipmentProgressLogsProps) => {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipment_logs')
        .select(`
          id,
          status,
          notes,
          latitude,
          longitude,
          created_at,
          changed_by,
          profile:profiles!shipment_logs_changed_by_fkey(full_name)
        `)
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs((data as unknown as ProgressLog[]) || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shipmentId) {
      fetchLogs();
    }
  }, [shipmentId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!shipmentId) return;

    const channel = supabase
      .channel(getTabChannelName(`logs-${shipmentId}`))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipment_logs',
          filter: `shipment_id=eq.${shipmentId}`,
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId]);

  const autoLogs = logs.filter(log => log.notes?.includes('تقدم تلقائي'));
  const manualLogs = logs.filter(log => !log.notes?.includes('تقدم تلقائي'));

  const content = (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-primary/5 text-center">
          <p className="text-2xl font-bold text-primary">{logs.length}</p>
          <p className="text-xs text-muted-foreground">إجمالي السجلات</p>
        </div>
        <div className="p-3 rounded-lg bg-green-500/10 text-center">
          <p className="text-2xl font-bold text-green-600">{autoLogs.length}</p>
          <p className="text-xs text-muted-foreground">تلقائية</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/10 text-center">
          <p className="text-2xl font-bold text-blue-600">{manualLogs.length}</p>
          <p className="text-xs text-muted-foreground">يدوية</p>
        </div>
      </div>

      <Separator />

      {/* Logs List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Route className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>لا توجد سجلات بعد</p>
        </div>
      ) : (
        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-3 pl-2">
            <AnimatePresence mode="popLayout">
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "relative flex gap-3 p-3 rounded-lg border transition-all hover:shadow-sm",
                    log.notes?.includes('تقدم تلقائي') 
                      ? "bg-green-50/50 dark:bg-green-900/10 border-green-200/50" 
                      : "bg-muted/30"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    log.notes?.includes('تقدم تلقائي') ? "bg-green-100" : "bg-primary/10"
                  )}>
                    {getLogIcon(log.notes, log.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getLogBadge(log.notes)}
                        {log.latitude && log.longitude && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <MapPin className="h-3 w-3" />
                            موقع مسجل
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.created_at), 'HH:mm:ss', { locale: ar })}
                      </span>
                    </div>
                    
                    <p className="text-sm mt-1 text-right">{log.notes || 'تحديث الحالة'}</p>
                    
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{format(new Date(log.created_at), 'dd/MM/yyyy', { locale: ar })}</span>
                      {log.profile?.full_name && (
                        <span>بواسطة: {log.profile.full_name}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <div className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <Route className="h-5 w-5 text-primary" />
              سجل تقدم الشحنة
            </CardTitle>
            <CardDescription>التسجيل التلقائي للمسافة والموقع</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};

export default ShipmentProgressLogs;
