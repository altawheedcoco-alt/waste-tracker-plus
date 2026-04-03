import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeSync';
import {
  Activity, Package, Truck, CheckCircle2, AlertTriangle, Clock,
  Bell, ArrowUpRight, ChevronDown, ChevronUp, Loader2,
  FileText, Users, DollarSign, Shield, Eye, MessageSquare,
  Zap, Star, MapPin, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

/**
 * LiveActivityFeed — شريط نشاط حي يعرض آخر الأحداث في المنصة
 * يجمع البيانات من activity_logs + notifications + shipments
 */

interface ActivityEvent {
  id: string;
  type: 'shipment' | 'notification' | 'approval' | 'financial' | 'partner' | 'system';
  title: string;
  subtitle?: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  route?: string;
  icon: React.ElementType;
}

const EVENT_STYLES = {
  info: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  critical: { bg: 'bg-destructive/10', text: 'text-destructive', dot: 'bg-destructive' },
};

const LiveActivityFeed = memo(() => {
  const { organization, user } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const orgId = organization?.id;

  // Subscribe to realtime updates
  useRealtimeTable('activity_logs', ['live-activity'], {
    filter: orgId ? `organization_id=eq.${orgId}` : undefined,
    enabled: !!orgId,
  });

  const { data: recentActivity, isLoading, refetch } = useQuery({
    queryKey: ['live-activity', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const since = new Date();
      since.setHours(since.getHours() - 24);

      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, action, action_type, details, created_at, resource_type, resource_id')
        .eq('organization_id', orgId)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });

  const events = useMemo<ActivityEvent[]>(() => {
    if (!recentActivity) return [];

    return recentActivity.map((log: any) => {
      const details = log.details as any;
      let type: ActivityEvent['type'] = 'system';
      let severity: ActivityEvent['severity'] = 'info';
      let icon: React.ElementType = Activity;
      let title = log.action || 'نشاط';
      let subtitle = '';
      let route: string | undefined;

      // Categorize based on resource_type and action_type
      if (log.resource_type === 'shipment' || log.action_type?.includes('shipment')) {
        type = 'shipment';
        icon = Package;
        severity = log.action_type?.includes('cancel') ? 'warning' : 'success';
        route = `/dashboard/shipments/${log.resource_id}`;
      } else if (log.action_type?.includes('approval')) {
        type = 'approval';
        icon = Shield;
        severity = 'warning';
        route = '/dashboard/approvals';
      } else if (log.action_type?.includes('financial') || log.action_type?.includes('deposit') || log.action_type?.includes('invoice')) {
        type = 'financial';
        icon = DollarSign;
        severity = 'info';
      } else if (log.action_type?.includes('partner') || log.action_type?.includes('organization')) {
        type = 'partner';
        icon = Users;
      } else if (log.action_type?.includes('notification')) {
        type = 'notification';
        icon = Bell;
      }

      if (details?.description) subtitle = details.description;

      return {
        id: log.id,
        type,
        title,
        subtitle,
        timestamp: log.created_at,
        severity,
        route,
        icon,
      };
    });
  }, [recentActivity]);

  const visibleEvents = expanded ? events : events.slice(0, 5);

  if (!orgId) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 px-2">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] h-5">
            {events.length} حدث
          </Badge>
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-primary" />
            النشاط الحي
          </h3>
        </div>
      </div>

      {/* Events */}
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Zap className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">لا يوجد نشاط خلال 24 ساعة</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visibleEvents.map((event, i) => {
              const style = EVENT_STYLES[event.severity];
              const Icon = event.icon;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors',
                    event.route && 'cursor-pointer'
                  )}
                  onClick={() => event.route && navigate(event.route)}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div className={cn('w-2 h-2 rounded-full', style.dot)} />
                    {i < visibleEvents.length - 1 && (
                      <div className="w-px flex-1 bg-border min-h-[16px]" />
                    )}
                  </div>

                  {/* Icon */}
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', style.bg)}>
                    <Icon className={cn('w-4 h-4', style.text)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm font-medium leading-tight truncate">{event.title}</p>
                    {event.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.subtitle}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true, locale: ar })}
                    </p>
                  </div>

                  {/* Arrow */}
                  {event.route && (
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-1" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Expand/Collapse */}
      {events.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full h-9 rounded-none border-t border-border text-xs"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 ml-1" />
              عرض أقل
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
              عرض {events.length - 5} أحداث أخرى
            </>
          )}
        </Button>
      )}
    </div>
  );
});

LiveActivityFeed.displayName = 'LiveActivityFeed';
export default LiveActivityFeed;
