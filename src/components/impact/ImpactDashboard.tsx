import { memo, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  Zap, TrendingUp, Shield, Leaf, DollarSign, Package,
  ArrowUpRight, ArrowDownRight, Clock, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecentImpactEvents, useImpactSummaries, useChainDefinitions } from '@/hooks/useImpactChain';

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  operations: { label: 'تشغيلي', icon: Package, color: 'text-blue-500' },
  financial: { label: 'مالي', icon: DollarSign, color: 'text-amber-500' },
  compliance: { label: 'امتثال', icon: Shield, color: 'text-purple-500' },
  environmental: { label: 'بيئي', icon: Leaf, color: 'text-emerald-500' },
};

const ImpactDashboard = memo(() => {
  const [periodType, setPeriodType] = useState('monthly');
  const { data: recentEvents = [], isLoading: eventsLoading } = useRecentImpactEvents(30);
  const { data: summaries = [], isLoading: summariesLoading } = useImpactSummaries(periodType);
  const { data: definitions = [] } = useChainDefinitions();

  // Aggregate stats from recent events
  const aggregateStats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byCascade = { triggered: 0, total: 0 };
    recentEvents.forEach(e => {
      byCategory[e.chain_key] = (byCategory[e.chain_key] || 0) + 1;
      byCascade.total++;
      if (e.cascade_triggered) byCascade.triggered++;
    });
    return { byCategory, byCascade };
  }, [recentEvents]);

  // Chain name resolver
  const chainName = (key: string) => definitions.find(d => d.chain_key === key)?.chain_name_ar || key;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Select value={periodType} onValueChange={setPeriodType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">يومي</SelectItem>
            <SelectItem value="weekly">أسبوعي</SelectItem>
            <SelectItem value="monthly">شهري</SelectItem>
            <SelectItem value="quarterly">ربع سنوي</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-right">
          <h2 className="text-lg font-bold flex items-center gap-2 justify-end">
            <Zap className="w-5 h-5 text-primary" />
            لوحة تحليل الأثر
          </h2>
          <p className="text-xs text-muted-foreground">ربط النتائج — لكل زر وظيفة، ولكل وظيفة نتيجة، ولكل نتيجة أثر</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const count = recentEvents.filter(e => {
            const def = definitions.find(d => d.chain_key === e.chain_key);
            return def?.category === key;
          }).length;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Object.keys(CATEGORY_CONFIG).indexOf(key) * 0.1 }}
            >
              <Card className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-2xl font-bold', config.color)}>{count}</span>
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center bg-muted', config.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-l from-transparent" style={{
                    background: `linear-gradient(to left, transparent, hsl(var(--primary) / 0.2))`
                  }} />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Cascade Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-primary">{aggregateStats.byCascade.total}</p>
                <p className="text-[10px] text-muted-foreground">إجمالي الأحداث</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-500">{aggregateStats.byCascade.triggered}</p>
                <p className="text-[10px] text-muted-foreground">أتمتة متسلسلة</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold text-amber-500">
                  {aggregateStats.byCascade.total > 0
                    ? Math.round((aggregateStats.byCascade.triggered / aggregateStats.byCascade.total) * 100)
                    : 0}%
                </p>
                <p className="text-[10px] text-muted-foreground">نسبة الأتمتة</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              معدل الأتمتة
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Recent Events / By Chain / Summaries */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="timeline" className="gap-1 text-xs">
            <Clock className="w-3.5 h-3.5" /> الجدول الزمني
          </TabsTrigger>
          <TabsTrigger value="chains" className="gap-1 text-xs">
            <Zap className="w-3.5 h-3.5" /> حسب السلسلة
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1 text-xs">
            <TrendingUp className="w-3.5 h-3.5" /> الاتجاهات
          </TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline" className="mt-4 space-y-2">
          {eventsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />)}
            </div>
          ) : recentEvents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد أحداث مسجلة بعد</p>
                <p className="text-xs mt-1">ستظهر هنا سلسلة الأثر لكل عملية يتم تنفيذها</p>
              </CardContent>
            </Card>
          ) : (
            recentEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-medium truncate">{event.action_label}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {event.result_label && <span>📋 {event.result_label}</span>}
                        {event.impact_label && <span>🎯 {event.impact_label}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className="text-[9px]">
                        {chainName(event.chain_key)}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString('ar-EG')}
                      </span>
                      {event.cascade_triggered && (
                        <Badge variant="default" className="text-[8px] bg-emerald-500">
                          <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
                          أتمتة
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* By Chain */}
        <TabsContent value="chains" className="mt-4 space-y-3">
          {definitions.map(def => {
            const chainEvents = recentEvents.filter(e => e.chain_key === def.chain_key);
            const cascadeCount = chainEvents.filter(e => e.cascade_triggered).length;
            const catConfig = CATEGORY_CONFIG[def.category] || CATEGORY_CONFIG.operations;
            const CatIcon = catConfig.icon;

            return (
              <Card key={def.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{catConfig.label}</Badge>
                      <span className="text-lg font-bold">{chainEvents.length}</span>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <p className="font-medium text-sm">{def.chain_name_ar}</p>
                        <p className="text-[10px] text-muted-foreground">{def.description_ar}</p>
                      </div>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', catConfig.color, 'bg-muted')}>
                        <CatIcon className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{def.steps.length} خطوات</span>
                    <span>•</span>
                    <span>{cascadeCount} أتمتة متسلسلة</span>
                    <span>•</span>
                    <span>{chainEvents.length} حدث</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends" className="mt-4">
          {summariesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-20 bg-muted rounded-lg" />)}
            </div>
          ) : summaries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد ملخصات بعد</p>
                <p className="text-xs mt-1">ستتراكم البيانات مع تسجيل الأحداث</p>
              </CardContent>
            </Card>
          ) : (
            summaries.map(s => (
              <Card key={s.id} className="mb-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{s.total_events} حدث</span>
                      {s.total_cascades > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {s.total_cascades} أتمتة
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px]">
                        {CATEGORY_CONFIG[s.category]?.label || s.category}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(s.period_start).toLocaleDateString('ar-EG')} — {new Date(s.period_end).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
});

ImpactDashboard.displayName = 'ImpactDashboard';
export default ImpactDashboard;
