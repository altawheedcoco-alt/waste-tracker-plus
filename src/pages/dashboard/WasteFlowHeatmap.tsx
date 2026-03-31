import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Map, AlertTriangle, TrendingUp, Recycle, Truck, Factory, Flame,
  Bell, RefreshCw, Loader2, MapPin, ArrowRight, Activity, Eye, Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '@/components/ui/back-button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';

const WasteFlowLeafletMap = lazy(() => import('@/components/maps/WasteFlowLeafletMap'));

interface WasteFlow {
  id: string;
  source_region: string;
  source_lat: number;
  source_lng: number;
  destination_region: string;
  destination_lat: number;
  destination_lng: number;
  waste_type: string;
  waste_category: string;
  quantity_tons: number;
  flow_date: string;
  shipment_count: number;
}

interface GeoAlert {
  id: string;
  region_name: string;
  region_lat: number;
  region_lng: number;
  alert_type: string;
  waste_type: string | null;
  severity: string;
  message: string;
  message_ar: string;
  is_active: boolean;
  created_at: string;
}

const FLOW_COLORS: Record<string, string> = {
  commodity: '#22c55e',
  rdf: '#f97316',
  hazardous: '#ef4444',
  organic: '#84cc16',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  critical: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const WasteFlowHeatmap = () => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [wasteFilter, setWasteFilter] = useState('all');
  const [flows, setFlows] = useState<WasteFlow[]>([]);
  const [alerts, setAlerts] = useState<GeoAlert[]>([]);
  const [flowStats, setFlowStats] = useState<any>(null);

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      commodity: t('wasteFlow.commodities'),
      rdf: t('wasteFlow.rdfType'),
      hazardous: t('wasteFlow.hazardous'),
      organic: t('wasteFlow.organicType'),
    };
    return map[cat] || cat;
  };

  const fetchFlowData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('waste-flow-analysis', {
        body: { waste_category: wasteFilter === 'all' ? undefined : wasteFilter }
      });

      if (error) throw error;

      setFlows(data?.flows || []);
      setAlerts(data?.alerts || []);
      setFlowStats(data?.stats || null);

      toast.success(t('wasteFlow.flowUpdated'));
    } catch (err) {
      console.error('Flow data error:', err);
      toast.error(t('wasteFlow.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, [wasteFilter, t]);

  useEffect(() => { fetchFlowData(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel('geo-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'geo_concentration_alerts' }, (payload) => {
        const newAlert = payload.new as GeoAlert;
        setAlerts(prev => [newAlert, ...prev]);
        toast.warning(isRTL ? newAlert.message_ar : newAlert.message, { duration: 10000 });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isRTL]);

  const regionDistribution = flows.reduce((acc, f) => {
    const key = f.destination_region || t('wasteFlow.undetermined');
    acc[key] = (acc[key] || 0) + f.quantity_tons;
    return acc;
  }, {} as Record<string, number>);

  const categoryDistribution = flows.reduce((acc, f) => {
    acc[f.waste_category] = (acc[f.waste_category] || 0) + f.quantity_tons;
    return acc;
  }, {} as Record<string, number>);

  const PIE_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#f59e0b'];

  return (
    <div className={`space-y-6 p-4 md:p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Map className="w-7 h-7 text-primary" />
              {t('wasteFlow.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('wasteFlow.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={wasteFilter} onValueChange={setWasteFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('wasteFlow.allTypes')}</SelectItem>
              <SelectItem value="commodity">{t('wasteFlow.commodities')}</SelectItem>
              <SelectItem value="rdf">{t('wasteFlow.rdfType')}</SelectItem>
              <SelectItem value="hazardous">{t('wasteFlow.hazardous')}</SelectItem>
              <SelectItem value="organic">{t('wasteFlow.organicType')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchFlowData} disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {t('wasteFlow.refresh')}
          </Button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: t('wasteFlow.totalFlow'), value: `${flowStats?.totalTons || 0}T`, icon: Activity, color: 'text-primary' },
          { label: t('wasteFlow.activeShipments'), value: flowStats?.activeShipments || 0, icon: Truck, color: 'text-blue-500' },
          { label: t('wasteFlow.activeRegions'), value: flowStats?.activeRegions || 0, icon: MapPin, color: 'text-green-500' },
          { label: t('wasteFlow.recyclingRate'), value: `${flowStats?.recyclingRate || 0}%`, icon: Recycle, color: 'text-emerald-500' },
          { label: t('wasteFlow.activeAlerts'), value: alerts.filter(a => a.is_active).length, icon: Bell, color: 'text-orange-500' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="map" className="gap-1"><Map className="w-4 h-4" />{t('wasteFlow.map')}</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1"><Activity className="w-4 h-4" />{t('wasteFlow.analytics')}</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1"><Bell className="w-4 h-4" />{t('wasteFlow.alerts')}</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-lg">
              <Suspense fallback={<Skeleton className="w-full h-[500px] md:h-[600px] rounded-lg" />}>
                <WasteFlowLeafletMap flows={flows} alerts={alerts} height="500px" />
              </Suspense>
            </CardContent>
          </Card>
          <div className="flex items-center gap-4 flex-wrap mt-3">
            {Object.entries(FLOW_COLORS).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-1.5 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                {categoryLabel(cat)}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              {t('wasteFlow.sourceGenerator')}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>{t('wasteFlow.flowByCategory')}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={Object.entries(categoryDistribution).map(([k, v]) => ({ name: k, value: v }))}
                      cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                      {Object.keys(categoryDistribution).map((k, i) => (
                        <Cell key={k} fill={FLOW_COLORS[k] || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t('wasteFlow.topReceivingRegions')}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(regionDistribution).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ region: k, tons: v }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tons" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>{t('wasteFlow.flowDetails')}</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-right">{t('wasteFlow.source')}</th>
                      <th className="p-2 text-right">{t('wasteFlow.destination')}</th>
                      <th className="p-2 text-right">{t('wasteFlow.typeCol')}</th>
                      <th className="p-2 text-right">{t('wasteFlow.qtyTons')}</th>
                      <th className="p-2 text-right">{t('wasteFlow.shipments')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flows.slice(0, 20).map((flow, i) => (
                      <tr key={flow.id || i} className="border-b hover:bg-accent/5">
                        <td className="p-2">{flow.source_region}</td>
                        <td className="p-2 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          {flow.destination_region}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" style={{ borderColor: FLOW_COLORS[flow.waste_category] }}>
                            {flow.waste_category}
                          </Badge>
                        </td>
                        <td className="p-2 font-mono font-bold">{flow.quantity_tons}</td>
                        <td className="p-2">{flow.shipment_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-3">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t('wasteFlow.noActiveAlerts')}
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert, i) => (
              <motion.div key={alert.id || i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`border-l-4 ${
                  alert.severity === 'critical' ? 'border-l-red-500' :
                  alert.severity === 'high' ? 'border-l-orange-500' :
                  alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                }`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                      alert.severity === 'critical' ? 'text-red-500' :
                      alert.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{alert.region_name}</span>
                        <Badge variant="outline" className={SEVERITY_COLORS[alert.severity]}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">{alert.alert_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{isRTL ? alert.message_ar : alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(alert.created_at).toLocaleString(isRTL ? 'ar-EG' : 'en')}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WasteFlowHeatmap;
