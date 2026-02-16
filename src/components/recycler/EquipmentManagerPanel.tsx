import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Camera, Loader2, Wrench, Plus, Zap, Droplets, Clock, ShieldCheck,
  AlertTriangle, Settings, Trash2, RotateCcw, Sparkles, Gauge,
  Calendar, Package, ThermometerSun, Cog, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EquipmentAIResult {
  equipment_name: string;
  equipment_name_en: string;
  manufacturer: string;
  model_estimate: string;
  category: string;
  description: string;
  suitable_materials: string[];
  estimated_capacity: { value: number; unit: string; description: string };
  power_consumption: { kw: number; description: string };
  water_usage: { liters_per_hour: number; description: string };
  maintenance_schedule: { daily: string[]; weekly: string[]; monthly: string[]; annual: string[] };
  safety_requirements: string[];
  estimated_lifespan_years: number;
  estimated_price_range_egp: string;
  spare_parts_critical: string[];
  operational_tips: string[];
  common_issues: string[];
  efficiency_rating: string;
  confidence: number;
}

interface Equipment {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  status: 'running' | 'idle' | 'maintenance' | 'broken';
  imageUrl?: string;
  capacityKgH: number;
  powerKw: number;
  waterLph: number;
  hoursUsed: number;
  lastMaintenance: string;
  nextMaintenance: string;
  aiData?: EquipmentAIResult;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  running: { label: 'يعمل', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Activity },
  idle: { label: 'متوقف', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
  maintenance: { label: 'صيانة', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Wrench },
  broken: { label: 'عطل', color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle },
};

const EquipmentManagerPanel = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<EquipmentAIResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'add'>('list');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const [equipment, setEquipment] = useState<Equipment[]>([
    { id: '1', name: 'ماكينة تقطيع بلاستيك', nameEn: 'Plastic Shredder', category: 'تقطيع', status: 'running', capacityKgH: 500, powerKw: 45, waterLph: 0, hoursUsed: 12500, lastMaintenance: '2025-01-15', nextMaintenance: '2025-02-15' },
    { id: '2', name: 'خط غسيل وتجفيف', nameEn: 'Washing Line', category: 'غسيل', status: 'running', capacityKgH: 800, powerKw: 60, waterLph: 500, hoursUsed: 8200, lastMaintenance: '2025-01-20', nextMaintenance: '2025-02-20' },
    { id: '3', name: 'ماكينة كبس معادن', nameEn: 'Metal Baler', category: 'كبس', status: 'maintenance', capacityKgH: 300, powerKw: 30, waterLph: 0, hoursUsed: 15000, lastMaintenance: '2025-02-01', nextMaintenance: '2025-03-01' },
  ]);

  const handleCapture = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setIsAnalyzing(true);
    setAiResult(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader(); r.readAsDataURL(file);
        r.onload = () => resolve(r.result as string); r.onerror = reject;
      });

      const { data, error } = await supabase.functions.invoke('recognize-equipment', {
        body: { image: base64, context: 'مصنع إعادة تدوير مخلفات' },
      });

      if (error) throw error;
      if (data && !data.error) {
        setAiResult(data);
        toast({ title: '✅ تم التعرف على المعدة', description: data.equipment_name });
      } else if (data?.error) {
        toast({ title: 'تنبيه', description: data.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  const addFromAI = () => {
    if (!aiResult) return;
    const newEq: Equipment = {
      id: Date.now().toString(), name: aiResult.equipment_name, nameEn: aiResult.equipment_name_en,
      category: aiResult.category, status: 'idle', imageUrl: preview || undefined,
      capacityKgH: aiResult.estimated_capacity.value, powerKw: aiResult.power_consumption.kw,
      waterLph: aiResult.water_usage.liters_per_hour, hoursUsed: 0,
      lastMaintenance: new Date().toISOString().split('T')[0],
      nextMaintenance: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      aiData: aiResult,
    };
    setEquipment(prev => [...prev, newEq]);
    setAiResult(null); setPreview(null); setActiveView('list');
    toast({ title: '✅ تمت إضافة المعدة', description: aiResult.equipment_name });
  };

  const toggleStatus = (id: string) => {
    setEquipment(prev => prev.map(eq => {
      if (eq.id !== id) return eq;
      const order: Equipment['status'][] = ['running', 'idle', 'maintenance', 'broken'];
      const next = order[(order.indexOf(eq.status) + 1) % order.length];
      return { ...eq, status: next };
    }));
  };

  const totalPowerKw = equipment.filter(e => e.status === 'running').reduce((s, e) => s + e.powerKw, 0);
  const totalWaterLph = equipment.filter(e => e.status === 'running').reduce((s, e) => s + e.waterLph, 0);
  const totalCapacity = equipment.filter(e => e.status === 'running').reduce((s, e) => s + e.capacityKgH, 0);
  const needsMaintenance = equipment.filter(e => e.status === 'maintenance' || e.status === 'broken').length;

  return (
    <div className="space-y-4">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCapture(f); }} />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-4 text-center">
          <Cog className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
          <p className="text-2xl font-bold">{equipment.length}</p>
          <p className="text-[10px] text-muted-foreground">إجمالي المعدات</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <Zap className="w-5 h-5 mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold">{totalPowerKw} kW</p>
          <p className="text-[10px] text-muted-foreground">استهلاك كهرباء حالي</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <Droplets className="w-5 h-5 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold">{totalWaterLph} L/h</p>
          <p className="text-[10px] text-muted-foreground">استهلاك مياه حالي</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <Gauge className="w-5 h-5 mx-auto text-purple-500 mb-1" />
          <p className="text-2xl font-bold">{totalCapacity} kg/h</p>
          <p className="text-[10px] text-muted-foreground">طاقة إنتاجية</p>
        </CardContent></Card>
      </div>

      {needsMaintenance > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-3 pb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold text-amber-600">{needsMaintenance} معدة تحتاج صيانة أو متعطلة</span>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant={activeView === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('list')} className="flex-1">
          <Settings className="w-4 h-4 ml-1" /> سجل المعدات
        </Button>
        <Button variant={activeView === 'add' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('add')} className="flex-1">
          <Camera className="w-4 h-4 ml-1" /> إضافة بالكاميرا AI
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'add' ? (
          <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {!preview ? (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-3 hover:bg-primary/10 transition-colors">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">صوّر المعدة للتعرف عليها تلقائياً</p>
                  <p className="text-xs text-muted-foreground mt-1">AI يحدد النوع والقدرة والصيانة وقطع الغيار</p>
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
                  <img src={preview} alt="Equipment" className="w-full h-full object-cover" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm font-semibold">جاري التعرف على المعدة...</p>
                      </div>
                    </div>
                  )}
                </div>

                {aiResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <Card className="border-emerald-500/30">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Cog className="w-6 h-6 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-base font-bold">{aiResult.equipment_name}</p>
                            <p className="text-xs text-muted-foreground">{aiResult.equipment_name_en} • {aiResult.manufacturer}</p>
                            <Badge variant="outline" className="text-[10px] mt-1">{aiResult.category} • ثقة {aiResult.confidence}%</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{aiResult.description}</p>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                          <div className="p-2 rounded-lg bg-muted/50">
                            <Gauge className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                            <p className="font-bold">{aiResult.estimated_capacity.value} {aiResult.estimated_capacity.unit}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/50">
                            <Zap className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                            <p className="font-bold">{aiResult.power_consumption.kw} kW</p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/50">
                            <Droplets className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                            <p className="font-bold">{aiResult.water_usage.liters_per_hour} L/h</p>
                          </div>
                        </div>

                        {/* Materials */}
                        <p className="text-xs font-bold mb-1">المواد المناسبة:</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {aiResult.suitable_materials.map((m, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">{m}</Badge>
                          ))}
                        </div>

                        {/* Safety */}
                        {aiResult.safety_requirements.length > 0 && (
                          <>
                            <p className="text-xs font-bold mb-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-amber-500" /> السلامة:</p>
                            <ul className="mb-3">
                              {aiResult.safety_requirements.map((s, i) => (
                                <li key={i} className="text-[10px] text-muted-foreground">⚠️ {s}</li>
                              ))}
                            </ul>
                          </>
                        )}

                        {/* Maintenance */}
                        <Tabs defaultValue="daily" dir="rtl">
                          <TabsList className="w-full h-auto">
                            <TabsTrigger value="daily" className="text-[10px]">يومي</TabsTrigger>
                            <TabsTrigger value="weekly" className="text-[10px]">أسبوعي</TabsTrigger>
                            <TabsTrigger value="monthly" className="text-[10px]">شهري</TabsTrigger>
                            <TabsTrigger value="annual" className="text-[10px]">سنوي</TabsTrigger>
                          </TabsList>
                          {(['daily', 'weekly', 'monthly', 'annual'] as const).map(period => (
                            <TabsContent key={period} value={period}>
                              <ul className="space-y-1">
                                {aiResult.maintenance_schedule[period].map((m, i) => (
                                  <li key={i} className="text-[10px] flex items-start gap-1"><Wrench className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />{m}</li>
                                ))}
                              </ul>
                            </TabsContent>
                          ))}
                        </Tabs>

                        {/* Spare Parts */}
                        <p className="text-xs font-bold mt-3 mb-1">قطع غيار حرجة:</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {aiResult.spare_parts_critical.map((p, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] border-destructive/30 text-destructive">{p}</Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>العمر: {aiResult.estimated_lifespan_years} سنة</span>
                          <span>السعر: {aiResult.estimated_price_range_egp} ج.م</span>
                          <Badge>{aiResult.efficiency_rating}</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => { setPreview(null); setAiResult(null); }}>
                        <RotateCcw className="w-4 h-4 ml-1" /> صورة أخرى
                      </Button>
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={addFromAI}>
                        <Plus className="w-4 h-4 ml-1" /> إضافة للسجل
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {equipment.map((eq) => {
              const st = statusConfig[eq.status];
              const StIcon = st.icon;
              return (
                <Card key={eq.id} className="overflow-hidden">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      {eq.imageUrl ? (
                        <img src={eq.imageUrl} alt={eq.name} className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                          <Cog className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Button variant="ghost" size="sm" className={`h-6 px-2 text-[10px] ${st.color} ${st.bg}`} onClick={() => toggleStatus(eq.id)}>
                            <StIcon className="w-3 h-3 ml-1" />{st.label}
                          </Button>
                          <p className="text-sm font-bold truncate">{eq.name}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-right">{eq.nameEn} • {eq.category}</p>
                        <div className="grid grid-cols-3 gap-1 mt-2 text-center text-[10px]">
                          <div className="p-1 rounded bg-muted/50">
                            <span className="font-bold">{eq.capacityKgH}</span> kg/h
                          </div>
                          <div className="p-1 rounded bg-muted/50">
                            <span className="font-bold">{eq.powerKw}</span> kW
                          </div>
                          <div className="p-1 rounded bg-muted/50">
                            <span className="font-bold">{eq.hoursUsed.toLocaleString()}</span> ساعة
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />صيانة: {eq.nextMaintenance}</span>
                          {eq.waterLph > 0 && <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{eq.waterLph} L/h</span>}
                        </div>
                      </div>
                    </div>
                    {eq.aiData && (
                      <Button variant="ghost" size="sm" className="w-full mt-2 text-[10px] gap-1"
                        onClick={() => setSelectedEquipment(selectedEquipment?.id === eq.id ? null : eq)}>
                        <Sparkles className="w-3 h-3" /> عرض تقرير AI
                      </Button>
                    )}
                    {selectedEquipment?.id === eq.id && eq.aiData && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-2 p-2 rounded-lg bg-muted/50 text-[10px] space-y-1">
                        <p><strong>نصائح:</strong></p>
                        {eq.aiData.operational_tips.map((t, i) => <p key={i}>💡 {t}</p>)}
                        <p><strong>أعطال شائعة:</strong></p>
                        {eq.aiData.common_issues.map((c, i) => <p key={i}>⚠️ {c}</p>)}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EquipmentManagerPanel;
