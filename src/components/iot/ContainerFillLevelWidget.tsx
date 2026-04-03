import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Trash2, AlertTriangle, TrendingUp, Clock, MapPin, Bell
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface ContainerData {
  id: string;
  container_name?: string;
  container_type: string;
  current_fill_level: number | null;
  capacity_kg?: number | null;
  location_name?: string | null;
  status: string;
  last_emptied_at?: string | null;
  updated_at?: string;
}

const fillColor = (level: number) => {
  if (level >= 90) return 'bg-red-500';
  if (level >= 70) return 'bg-orange-500';
  if (level >= 50) return 'bg-yellow-500';
  return 'bg-emerald-500';
};

const fillStatus = (level: number) => {
  if (level >= 90) return { label: 'ممتلئة', variant: 'destructive' as const };
  if (level >= 70) return { label: 'شبه ممتلئة', variant: 'default' as const };
  if (level >= 50) return { label: 'نصف', variant: 'secondary' as const };
  return { label: 'فارغة', variant: 'outline' as const };
};

/** Predict hours until full based on current fill rate */
const predictHoursToFull = (currentLevel: number, lastUpdated?: string): number | null => {
  if (!lastUpdated || currentLevel >= 95) return null;
  const hoursAgo = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 1 || currentLevel < 5) return null;
  const ratePerHour = currentLevel / Math.max(hoursAgo, 1);
  if (ratePerHour <= 0) return null;
  return Math.round((100 - currentLevel) / ratePerHour);
};

const ContainerFillLevelWidget: React.FC = () => {
  const { organization } = useAuth();

  const { data: containers } = useQuery({
    queryKey: ['containers-fill', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('containers')
        .select('id, container_type, current_fill_level, capacity_kg, location_name, status, last_emptied_at, updated_at')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('current_fill_level', { ascending: false });
      if (error) throw error;
      return (data || []) as ContainerData[];
    },
    enabled: !!organization?.id,
    refetchInterval: 60000, // Refresh every minute
  });

  const stats = useMemo(() => {
    if (!containers?.length) return null;
    const total = containers.length;
    const critical = containers.filter(c => (c.current_fill_level || 0) >= 90).length;
    const warning = containers.filter(c => {
      const l = c.current_fill_level || 0;
      return l >= 70 && l < 90;
    }).length;
    const avgFill = Math.round(containers.reduce((s, c) => s + (c.current_fill_level || 0), 0) / total);
    return { total, critical, warning, avgFill };
  }, [containers]);

  if (!containers || containers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Trash2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">لا توجد حاويات مسجلة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="إجمالي" value={stats.total} icon={<Trash2 className="w-4 h-4 text-primary" />} />
          <StatCard label="حرجة" value={stats.critical} icon={<AlertTriangle className="w-4 h-4 text-red-500" />} alert={stats.critical > 0} />
          <StatCard label="تحذير" value={stats.warning} icon={<Bell className="w-4 h-4 text-orange-500" />} />
          <StatCard label="متوسط %" value={`${stats.avgFill}%`} icon={<TrendingUp className="w-4 h-4 text-blue-500" />} />
        </div>
      )}

      {/* Container List */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <Badge variant="outline" className="text-[10px]">
              {containers.length} حاوية
            </Badge>
            <div className="flex items-center gap-1.5">
              <span>مستويات الامتلاء</span>
              <Trash2 className="w-4 h-4 text-primary" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {containers.slice(0, 10).map((c, i) => {
            const level = c.current_fill_level || 0;
            const status = fillStatus(level);
            const hoursToFull = predictHoursToFull(level, c.updated_at);

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`p-2.5 rounded-lg border ${level >= 90 ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10' : 'bg-muted/20'}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant} className="text-[9px] h-5 px-1.5">
                      {status.label}
                    </Badge>
                    {hoursToFull && hoursToFull < 24 && (
                      <span className="text-[9px] text-orange-600 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        ~{hoursToFull}س للامتلاء
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium truncate max-w-[120px]">
                    {c.container_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={level} className="h-2 flex-1" />
                  <span className={`text-xs font-bold min-w-[32px] text-left ${level >= 90 ? 'text-red-600' : level >= 70 ? 'text-orange-600' : 'text-foreground'}`}>
                    {level}%
                  </span>
                </div>
                {c.location_name && (
                  <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" />
                    {c.location_name}
                  </p>
                )}
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ label, value, icon, alert }: { 
  label: string; value: string | number; icon: React.ReactNode; alert?: boolean;
}) => (
  <Card className={alert ? 'border-red-300 bg-red-50/50 dark:bg-red-950/10' : ''}>
    <CardContent className="p-2.5 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className={`text-lg font-bold ${alert ? 'text-red-600' : ''}`}>{value}</div>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default ContainerFillLevelWidget;
