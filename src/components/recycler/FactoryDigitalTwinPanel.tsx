import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Factory, Cog, Zap, Droplets, ThermometerSun, Activity,
  AlertTriangle, CheckCircle2, Clock, Gauge, Wifi, WifiOff,
  BarChart3, TrendingUp, Volume2, Wind, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DigitalEquipment {
  id: string;
  name: string;
  zone: string;
  status: 'running' | 'idle' | 'maintenance' | 'alarm';
  healthScore: number;
  temperature: number;
  vibration: number;
  noiseDb: number;
  powerKw: number;
  throughputKgH: number;
  maxThroughputKgH: number;
  uptime: number;
  lastAlert?: string;
}

interface ZoneSummary {
  name: string;
  equipment: DigitalEquipment[];
  overallHealth: number;
  totalPower: number;
  totalThroughput: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; pulse: boolean }> = {
  running: { label: 'يعمل', color: 'text-emerald-500', bg: 'bg-emerald-500', pulse: true },
  idle: { label: 'متوقف', color: 'text-amber-500', bg: 'bg-amber-500', pulse: false },
  maintenance: { label: 'صيانة', color: 'text-blue-500', bg: 'bg-blue-500', pulse: false },
  alarm: { label: 'تنبيه', color: 'text-destructive', bg: 'bg-destructive', pulse: true },
};

const FactoryDigitalTwinPanel = () => {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [equipment] = useState<DigitalEquipment[]>([
    { id: '1', name: 'ماكينة تقطيع رئيسية', zone: 'التقطيع والفرز', status: 'running', healthScore: 92, temperature: 68, vibration: 2.1, noiseDb: 85, powerKw: 45, throughputKgH: 480, maxThroughputKgH: 500, uptime: 94.5 },
    { id: '2', name: 'حزام ناقل فرز', zone: 'التقطيع والفرز', status: 'running', healthScore: 88, temperature: 42, vibration: 1.2, noiseDb: 65, powerKw: 8, throughputKgH: 600, maxThroughputKgH: 800, uptime: 97.2 },
    { id: '3', name: 'خط غسيل أساسي', zone: 'الغسيل والتنظيف', status: 'running', healthScore: 85, temperature: 55, vibration: 1.8, noiseDb: 72, powerKw: 60, throughputKgH: 750, maxThroughputKgH: 800, uptime: 91.0 },
    { id: '4', name: 'مجفف حراري', zone: 'الغسيل والتنظيف', status: 'idle', healthScore: 78, temperature: 35, vibration: 0, noiseDb: 40, powerKw: 0, throughputKgH: 0, maxThroughputKgH: 400, uptime: 82.5 },
    { id: '5', name: 'ماكينة صهر وبثق', zone: 'الصهر والتشكيل', status: 'running', healthScore: 95, temperature: 245, vibration: 3.5, noiseDb: 78, powerKw: 120, throughputKgH: 350, maxThroughputKgH: 400, uptime: 96.8 },
    { id: '6', name: 'ماكينة كبس بالات', zone: 'التعبئة والتخزين', status: 'maintenance', healthScore: 45, temperature: 30, vibration: 0, noiseDb: 38, powerKw: 0, throughputKgH: 0, maxThroughputKgH: 300, uptime: 65.0, lastAlert: 'تسرب زيت هيدروليك - جاري الإصلاح' },
    { id: '7', name: 'رافعة شوكية #1', zone: 'التعبئة والتخزين', status: 'running', healthScore: 80, temperature: 50, vibration: 1.5, noiseDb: 70, powerKw: 15, throughputKgH: 200, maxThroughputKgH: 200, uptime: 88.0 },
    { id: '8', name: 'فلتر هواء صناعي', zone: 'السلامة والبيئة', status: 'alarm', healthScore: 35, temperature: 90, vibration: 5.2, noiseDb: 95, powerKw: 25, throughputKgH: 0, maxThroughputKgH: 0, uptime: 55.0, lastAlert: 'انسداد فلتر - يحتاج تغيير فوري' },
  ]);

  const zones: ZoneSummary[] = [...new Set(equipment.map(e => e.zone))].map(zone => {
    const zoneEquip = equipment.filter(e => e.zone === zone);
    return {
      name: zone,
      equipment: zoneEquip,
      overallHealth: Math.round(zoneEquip.reduce((s, e) => s + e.healthScore, 0) / zoneEquip.length),
      totalPower: zoneEquip.filter(e => e.status === 'running').reduce((s, e) => s + e.powerKw, 0),
      totalThroughput: zoneEquip.filter(e => e.status === 'running').reduce((s, e) => s + e.throughputKgH, 0),
    };
  });

  const totalPower = equipment.filter(e => e.status === 'running').reduce((s, e) => s + e.powerKw, 0);
  const totalThroughput = equipment.filter(e => e.status === 'running').reduce((s, e) => s + e.throughputKgH, 0);
  const alarms = equipment.filter(e => e.status === 'alarm').length;
  const avgHealth = Math.round(equipment.reduce((s, e) => s + e.healthScore, 0) / equipment.length);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-destructive';
  };

  return (
    <div className="space-y-4">
      {/* Live Header */}
      <Card className="border-emerald-500/20 bg-gradient-to-l from-emerald-500/5 to-transparent">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className="gap-1 text-[10px] animate-pulse border-emerald-500/50 text-emerald-500">
              <Wifi className="w-3 h-3" />
              LIVE {liveTime.toLocaleTimeString('ar-EG')}
            </Badge>
            <div className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold">التوأم الرقمي للمصنع</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className={`text-lg font-bold ${getHealthColor(avgHealth)}`}>{avgHealth}%</p>
              <p className="text-[10px] text-muted-foreground">صحة المصنع</p>
            </div>
            <div>
              <p className="text-lg font-bold">{totalPower} kW</p>
              <p className="text-[10px] text-muted-foreground">طاقة حالية</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-500">{(totalThroughput / 1000).toFixed(1)} t/h</p>
              <p className="text-[10px] text-muted-foreground">إنتاجية</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${alarms > 0 ? 'text-destructive' : 'text-emerald-500'}`}>{alarms}</p>
              <p className="text-[10px] text-muted-foreground">تنبيهات</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Factory Zones */}
      <div className="space-y-3">
        {zones.map((zone) => (
          <Card key={zone.name} className="overflow-hidden">
            <button
              className="w-full text-right"
              onClick={() => setSelectedZone(selectedZone === zone.name ? null : zone.name)}
            >
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{zone.totalPower} kW</span>
                    <span className={`text-xs font-bold ${getHealthColor(zone.overallHealth)}`}>{zone.overallHealth}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{zone.name}</span>
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Factory className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {zone.equipment.map((eq) => {
                    const st = statusConfig[eq.status];
                    return (
                      <div key={eq.id} className="flex-1 h-2 rounded-full relative overflow-hidden bg-muted">
                        <motion.div
                          className={`absolute inset-0 rounded-full ${st.bg}`}
                          animate={st.pulse ? { opacity: [0.6, 1, 0.6] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1 mt-1">
                  {zone.equipment.map((eq) => (
                    <span key={eq.id} className="text-[8px] text-muted-foreground flex-1 text-center truncate">{eq.name.split(' ')[0]}</span>
                  ))}
                </div>
              </CardContent>
            </button>

            <AnimatePresence>
              {selectedZone === zone.name && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t"
                >
                  <div className="p-3 space-y-2">
                    {zone.equipment.map((eq) => {
                      const st = statusConfig[eq.status];
                      const utilization = eq.maxThroughputKgH > 0 ? Math.round((eq.throughputKgH / eq.maxThroughputKgH) * 100) : 0;
                      return (
                        <div key={eq.id} className="p-3 rounded-xl border bg-card/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className={`${st.color} ${st.bg}/10 text-[10px] gap-1`}>
                              {st.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                              {st.label}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold">{eq.name}</span>
                              <div className={`w-2 h-2 rounded-full ${st.bg} ${st.pulse ? 'animate-pulse' : ''}`} />
                            </div>
                          </div>

                          {eq.lastAlert && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                              <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                              <span className="text-[10px] text-destructive">{eq.lastAlert}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                            <div className="p-1.5 rounded-lg bg-muted/50">
                              <Activity className={`w-3 h-3 mx-auto mb-0.5 ${getHealthColor(eq.healthScore)}`} />
                              <p className="font-bold">{eq.healthScore}%</p>
                              <p className="text-muted-foreground">صحة</p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-muted/50">
                              <ThermometerSun className={`w-3 h-3 mx-auto mb-0.5 ${eq.temperature > 100 ? 'text-destructive' : 'text-amber-500'}`} />
                              <p className="font-bold">{eq.temperature}°C</p>
                              <p className="text-muted-foreground">حرارة</p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-muted/50">
                              <Volume2 className={`w-3 h-3 mx-auto mb-0.5 ${eq.vibration > 4 ? 'text-destructive' : 'text-blue-500'}`} />
                              <p className="font-bold">{eq.vibration}</p>
                              <p className="text-muted-foreground">اهتزاز</p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-muted/50">
                              <Zap className="w-3 h-3 mx-auto text-amber-500 mb-0.5" />
                              <p className="font-bold">{eq.powerKw}</p>
                              <p className="text-muted-foreground">kW</p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-muted/50">
                              <Gauge className="w-3 h-3 mx-auto text-purple-500 mb-0.5" />
                              <p className="font-bold">{eq.uptime}%</p>
                              <p className="text-muted-foreground">تشغيل</p>
                            </div>
                          </div>

                          {eq.maxThroughputKgH > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px]">{eq.throughputKgH} kg/h</span>
                              <Progress value={utilization} className="flex-1 h-2" />
                              <span className="text-[10px] font-bold">{utilization}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FactoryDigitalTwinPanel;
