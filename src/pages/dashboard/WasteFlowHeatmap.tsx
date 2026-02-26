import { useState, useEffect, useCallback } from 'react';
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
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [wasteFilter, setWasteFilter] = useState('all');
  const [flows, setFlows] = useState<WasteFlow[]>([]);
  const [alerts, setAlerts] = useState<GeoAlert[]>([]);
  const [flowStats, setFlowStats] = useState<any>(null);

  const fetchFlowData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch from edge function that aggregates shipment data into flow analytics
      const { data, error } = await supabase.functions.invoke('waste-flow-analysis', {
        body: { waste_category: wasteFilter === 'all' ? undefined : wasteFilter }
      });

      if (error) throw error;

      setFlows(data?.flows || []);
      setAlerts(data?.alerts || []);
      setFlowStats(data?.stats || null);

      toast.success(isRTL ? 'تم تحديث خريطة التدفق' : 'Flow map updated');
    } catch (err) {
      console.error('Flow data error:', err);
      toast.error(isRTL ? 'خطأ في تحميل البيانات' : 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [wasteFilter, isRTL]);

  useEffect(() => { fetchFlowData(); }, []);

  // Maps disabled - Leaflet initialization removed

  // Subscribe to realtime alerts
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
    const key = f.destination_region || 'غير محدد';
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
              {isRTL ? 'خريطة تدفق المخلفات' : 'Waste Flow Heatmap'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL ? 'تتبع حركة المخلفات من المولد للمدور/المدفن مع تنبيهات التركز الجغرافي' : 'Track waste movement from generator to recycler/disposal with geo-concentration alerts'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={wasteFilter} onValueChange={setWasteFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? 'جميع الأنواع' : 'All Types'}</SelectItem>
              <SelectItem value="commodity">{isRTL ? 'سلع (تدوير)' : 'Commodities'}</SelectItem>
              <SelectItem value="rdf">{isRTL ? 'وقود بديل' : 'RDF'}</SelectItem>
              <SelectItem value="hazardous">{isRTL ? 'خطرة' : 'Hazardous'}</SelectItem>
              <SelectItem value="organic">{isRTL ? 'عضوية' : 'Organic'}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchFlowData} disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: isRTL ? 'إجمالي التدفق' : 'Total Flow', value: `${flowStats?.totalTons || 0}T`, icon: Activity, color: 'text-primary' },
          { label: isRTL ? 'شحنات نشطة' : 'Active Shipments', value: flowStats?.activeShipments || 0, icon: Truck, color: 'text-blue-500' },
          { label: isRTL ? 'مناطق نشطة' : 'Active Regions', value: flowStats?.activeRegions || 0, icon: MapPin, color: 'text-green-500' },
          { label: isRTL ? 'نسبة التدوير' : 'Recycling Rate', value: `${flowStats?.recyclingRate || 0}%`, icon: Recycle, color: 'text-emerald-500' },
          { label: isRTL ? 'تنبيهات نشطة' : 'Active Alerts', value: alerts.filter(a => a.is_active).length, icon: Bell, color: 'text-orange-500' },
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
          <TabsTrigger value="map" className="gap-1"><Map className="w-4 h-4" />{isRTL ? 'الخريطة' : 'Map'}</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1"><Activity className="w-4 h-4" />{isRTL ? 'تحليلات' : 'Analytics'}</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1"><Bell className="w-4 h-4" />{isRTL ? 'تنبيهات' : 'Alerts'}</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <Card>
            <CardContent className="p-0">
              <div className="w-full h-[500px] md:h-[600px] rounded-lg flex items-center justify-center bg-muted/50 text-muted-foreground"><p>الخرائط معطلة حالياً</p></div>
            </CardContent>
          </Card>
          {/* Flow Legend */}
          <div className="flex items-center gap-4 flex-wrap mt-3">
            {Object.entries(FLOW_COLORS).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-1.5 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                {cat === 'commodity' ? (isRTL ? 'سلع (تدوير)' : 'Commodities') :
                 cat === 'rdf' ? (isRTL ? 'وقود بديل' : 'RDF') :
                 cat === 'hazardous' ? (isRTL ? 'خطرة' : 'Hazardous') :
                 (isRTL ? 'عضوية' : 'Organic')}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              {isRTL ? 'مصدر (مولد)' : 'Source (Generator)'}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>{isRTL ? 'توزيع التدفق حسب الفئة' : 'Flow by Category'}</CardTitle></CardHeader>
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
              <CardHeader><CardTitle>{isRTL ? 'أكبر المناطق استقبالاً' : 'Top Receiving Regions'}</CardTitle></CardHeader>
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

          {/* Flow Table */}
          <Card>
            <CardHeader><CardTitle>{isRTL ? 'تفاصيل التدفق' : 'Flow Details'}</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-right">{isRTL ? 'المصدر' : 'Source'}</th>
                      <th className="p-2 text-right">{isRTL ? 'الوجهة' : 'Destination'}</th>
                      <th className="p-2 text-right">{isRTL ? 'النوع' : 'Type'}</th>
                      <th className="p-2 text-right">{isRTL ? 'الكمية (طن)' : 'Qty (Tons)'}</th>
                      <th className="p-2 text-right">{isRTL ? 'الشحنات' : 'Shipments'}</th>
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
                {isRTL ? 'لا توجد تنبيهات نشطة حالياً' : 'No active alerts at this time'}
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
