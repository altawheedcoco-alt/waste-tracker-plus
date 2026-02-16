import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Link2, Package, Truck, Factory, CheckCircle2, Search,
  ArrowDown, ShieldCheck, QrCode, Clock, Sparkles,
  FileText, ThermometerSun, Droplets, Scale, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TraceNode {
  id: string;
  stage: 'source' | 'transport' | 'intake' | 'processing' | 'output' | 'delivery';
  title: string;
  timestamp: string;
  details: Record<string, string>;
  verified: boolean;
  hash: string;
}

interface Batch {
  id: string;
  batchNumber: string;
  materialType: string;
  productName: string;
  inputKg: number;
  outputKg: number;
  yieldPct: number;
  grade: string;
  status: 'in_progress' | 'completed' | 'certified';
  chain: TraceNode[];
  certHash: string;
}

const stageConfig: Record<string, { label: string; icon: any; color: string }> = {
  source: { label: 'المصدر', icon: MapPin, color: 'text-blue-500' },
  transport: { label: 'النقل', icon: Truck, color: 'text-amber-500' },
  intake: { label: 'الاستلام', icon: Scale, color: 'text-purple-500' },
  processing: { label: 'المعالجة', icon: Factory, color: 'text-emerald-500' },
  output: { label: 'المخرج', icon: Package, color: 'text-primary' },
  delivery: { label: 'التسليم', icon: CheckCircle2, color: 'text-green-500' },
};

const BatchTraceabilityPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const [batches] = useState<Batch[]>([
    {
      id: '1', batchNumber: 'BTR-2026-0042', materialType: 'بلاستيك PET', productName: 'حبيبات PET نقية',
      inputKg: 5200, outputKg: 3950, yieldPct: 76, grade: 'Food Grade',
      status: 'certified', certHash: 'a3f8c2e1...d9b4',
      chain: [
        { id: 'n1', stage: 'source', title: 'شركة القاهرة للمشروبات', timestamp: '2026-02-10 08:00',
          details: { 'نوع المخلف': 'زجاجات PET شفافة', 'الكمية': '5,200 كجم', 'شهادة المصدر': 'GEN-2026-1842' },
          verified: true, hash: '7a2b1c...' },
        { id: 'n2', stage: 'transport', title: 'شحنة SH-2026-3201', timestamp: '2026-02-10 10:30',
          details: { 'الناقل': 'شركة النقل الأخضر', 'لوحة': 'أ ق و 4521', 'المسافة': '45 كم', 'المانيفست': 'MNF-8842' },
          verified: true, hash: 'b3c4d5...' },
        { id: 'n3', stage: 'intake', title: 'وزن الاستلام', timestamp: '2026-02-10 12:15',
          details: { 'الوزن الفعلي': '5,180 كجم', 'الفرق': '-20 كجم (0.38%)', 'فحص بصري': 'مطابق', 'نسبة التلوث': '3.2%' },
          verified: true, hash: 'c5d6e7...' },
        { id: 'n4', stage: 'processing', title: 'أمر تشغيل WO-2026-017', timestamp: '2026-02-11 07:00',
          details: { 'خط الإنتاج': 'خط البلاستيك', 'حرارة صهر': '272°C', 'مدة التشغيل': '8 ساعات', 'العمال': '8', 'استهلاك كهرباء': '960 kWh', 'استهلاك مياه': '12 م³' },
          verified: true, hash: 'd7e8f9...' },
        { id: 'n5', stage: 'output', title: 'فحص جودة المخرج', timestamp: '2026-02-11 16:00',
          details: { 'الناتج': '3,950 كجم حبيبات', 'النقاء': '99.2%', 'الدرجة': 'Food Grade', 'لون': 'شفاف', 'اختبار FDA': 'مطابق' },
          verified: true, hash: 'e9f0a1...' },
        { id: 'n6', stage: 'delivery', title: 'تسليم لمصنع التغليف', timestamp: '2026-02-12 09:00',
          details: { 'المشتري': 'شركة النيل للتغليف', 'فاتورة': 'INV-2026-445', 'سعر الطن': '14,500 ج.م' },
          verified: true, hash: 'f1a2b3...' },
      ],
    },
    {
      id: '2', batchNumber: 'BTR-2026-0043', materialType: 'كرتون مختلط', productName: 'لب كرتون مضغوط',
      inputKg: 3000, outputKg: 2400, yieldPct: 80, grade: 'Industrial',
      status: 'in_progress', certHash: '',
      chain: [
        { id: 'n1', stage: 'source', title: 'مجمع هايبر وان التجاري', timestamp: '2026-02-14 07:00',
          details: { 'نوع المخلف': 'كراتين تغليف مختلطة', 'الكمية': '3,000 كجم' },
          verified: true, hash: 'x1y2z3...' },
        { id: 'n2', stage: 'transport', title: 'شحنة SH-2026-3215', timestamp: '2026-02-14 09:00',
          details: { 'الناقل': 'أسطول داخلي', 'لوحة': 'ج ه ب 9988' },
          verified: true, hash: 'a4b5c6...' },
        { id: 'n3', stage: 'intake', title: 'وزن الاستلام', timestamp: '2026-02-14 11:00',
          details: { 'الوزن الفعلي': '2,980 كجم', 'فحص بصري': 'مطابق' },
          verified: true, hash: 'd7e8f9...' },
        { id: 'n4', stage: 'processing', title: 'جاري المعالجة...', timestamp: '2026-02-15 07:00',
          details: { 'خط الإنتاج': 'خط الورق', 'الحالة': 'جاري الكبس' },
          verified: false, hash: '...' },
      ],
    },
  ]);

  const filtered = searchQuery
    ? batches.filter(b => b.batchNumber.includes(searchQuery) || b.materialType.includes(searchQuery))
    : batches;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-2 justify-end">
            <span className="text-sm font-bold">سلسلة الحفظ الرقمية</span>
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground text-right mb-3">
            تتبع كامل للمادة من مصدرها حتى المنتج النهائي - كل خطوة موثقة وموقعة رقمياً
          </p>
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الدُفعة أو نوع المادة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 text-right"
            />
          </div>
        </CardContent>
      </Card>

      {/* Batches */}
      <div className="space-y-3">
        {filtered.map((batch) => {
          const isExpanded = expandedBatch === batch.id;
          const completedSteps = batch.chain.filter(n => n.verified).length;
          const progressPct = (completedSteps / 6) * 100;

          return (
            <Card key={batch.id} className="overflow-hidden">
              <button className="w-full text-right" onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Badge variant={batch.status === 'certified' ? 'default' : 'outline'} className="text-[10px] gap-1">
                        {batch.status === 'certified' && <ShieldCheck className="w-3 h-3" />}
                        {batch.status === 'certified' ? 'مُعتمدة' : batch.status === 'completed' ? 'مكتملة' : 'جارية'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{batch.grade}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{batch.batchNumber}</p>
                      <p className="text-[10px] text-muted-foreground">{batch.materialType} → {batch.productName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-2">
                    <div className="p-1 rounded bg-muted/50">
                      <p className="font-bold">{batch.inputKg.toLocaleString()} كجم</p>
                      <p className="text-muted-foreground">مدخل</p>
                    </div>
                    <div className="p-1 rounded bg-muted/50">
                      <p className="font-bold text-emerald-500">{batch.outputKg.toLocaleString()} كجم</p>
                      <p className="text-muted-foreground">مخرج</p>
                    </div>
                    <div className="p-1 rounded bg-muted/50">
                      <p className="font-bold">{batch.yieldPct}%</p>
                      <p className="text-muted-foreground">تحويل</p>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="flex items-center gap-0.5">
                    {Object.keys(stageConfig).map((stage, i) => {
                      const node = batch.chain.find(n => n.stage === stage);
                      const st = stageConfig[stage];
                      const StIcon = st.icon;
                      return (
                        <div key={stage} className="flex-1 flex flex-col items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${node?.verified ? 'bg-emerald-500/20' : node ? 'bg-amber-500/20' : 'bg-muted'}`}>
                            <StIcon className={`w-3 h-3 ${node?.verified ? 'text-emerald-500' : node ? 'text-amber-500' : 'text-muted-foreground'}`} />
                          </div>
                          <span className="text-[7px] text-muted-foreground mt-0.5">{st.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t">
                    <div className="p-3 space-y-0">
                      {batch.chain.map((node, i) => {
                        const st = stageConfig[node.stage];
                        const StIcon = st.icon;
                        const isLast = i === batch.chain.length - 1;
                        return (
                          <div key={node.id} className="flex gap-3">
                            {/* Timeline */}
                            <div className="flex flex-col items-center shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${node.verified ? 'bg-emerald-500/20' : 'bg-muted'}`}>
                                <StIcon className={`w-4 h-4 ${node.verified ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                              </div>
                              {!isLast && <div className="w-0.5 h-full bg-border min-h-[20px]" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-4">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1">
                                  {node.verified && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                  <span className="text-[10px] text-muted-foreground">{node.hash}</span>
                                </div>
                                <p className="text-xs font-bold">{node.title}</p>
                              </div>
                              <p className="text-[10px] text-muted-foreground mb-1">{node.timestamp}</p>

                              <div className="space-y-0.5">
                                {Object.entries(node.details).map(([key, val]) => (
                                  <div key={key} className="flex items-center justify-between text-[10px]">
                                    <span className="font-medium">{val}</span>
                                    <span className="text-muted-foreground">{key}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {batch.certHash && (
                      <div className="mx-3 mb-3 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                        <p className="text-[10px] font-bold text-emerald-500">سلسلة حفظ موثقة رقمياً</p>
                        <p className="text-[8px] text-muted-foreground font-mono">{batch.certHash}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BatchTraceabilityPanel;
