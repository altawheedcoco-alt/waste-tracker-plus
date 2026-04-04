/**
 * SecondaryMaterialsExchange — Enhanced B2B marketplace
 * With price charts, negotiation, quality certificates, and market analytics
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Recycle, Search, TrendingUp, TrendingDown, Minus,
  Star, ShieldCheck, Globe, FlaskConical, Package,
  BarChart3, MessageCircle, Bell, ArrowUpDown, Clock,
  Factory, Handshake, FileCheck, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

interface SecondaryMaterial {
  id: string;
  material_type: string;
  base_material: string;
  quality_grade: string;
  quantity_available_kg: number;
  min_order_kg: number;
  price_per_kg_egp: number;
  certifications: string[];
  available_for_export: boolean;
  status: string;
  organization_name?: string;
  production_date?: string;
  trend: 'up' | 'down' | 'stable';
  purity_percent?: number;
  lab_report?: boolean;
}

const DEMO_MATERIALS: SecondaryMaterial[] = [
  { id: '1', material_type: 'حبيبات', base_material: 'بولي إيثيلين (HDPE)', quality_grade: 'A', quantity_available_kg: 5000, min_order_kg: 500, price_per_kg_egp: 28, certifications: ['ISO 9001', 'REACH'], available_for_export: true, status: 'available', organization_name: 'مصنع التدوير الأخضر', production_date: '2026-03-15', trend: 'up', purity_percent: 98, lab_report: true },
  { id: '2', material_type: 'رقائق', base_material: 'PET شفاف', quality_grade: 'A', quantity_available_kg: 3200, min_order_kg: 300, price_per_kg_egp: 35, certifications: ['ISO 14001'], available_for_export: true, status: 'available', organization_name: 'شركة النيل للتدوير', production_date: '2026-03-20', trend: 'up', purity_percent: 95, lab_report: true },
  { id: '3', material_type: 'بالات', base_material: 'كرتون مقوى', quality_grade: 'B', quantity_available_kg: 12000, min_order_kg: 1000, price_per_kg_egp: 8, certifications: [], available_for_export: false, status: 'available', organization_name: 'مركز جمع الورق', production_date: '2026-03-25', trend: 'stable', purity_percent: 85 },
  { id: '4', material_type: 'سبائك', base_material: 'ألمنيوم', quality_grade: 'A', quantity_available_kg: 800, min_order_kg: 100, price_per_kg_egp: 120, certifications: ['ISO 9001'], available_for_export: true, status: 'available', organization_name: 'مصنع المعادن المتحدة', production_date: '2026-03-18', trend: 'down', purity_percent: 99, lab_report: true },
  { id: '5', material_type: 'كسر زجاج', base_material: 'زجاج شفاف', quality_grade: 'B', quantity_available_kg: 7500, min_order_kg: 500, price_per_kg_egp: 4, certifications: [], available_for_export: false, status: 'available', organization_name: 'مصنع الزجاج الحديث', production_date: '2026-03-22', trend: 'stable', purity_percent: 88 },
  { id: '6', material_type: 'حبيبات', base_material: 'بولي بروبيلين (PP)', quality_grade: 'A', quantity_available_kg: 2800, min_order_kg: 200, price_per_kg_egp: 32, certifications: ['FDA', 'REACH'], available_for_export: true, status: 'available', organization_name: 'البيئة للتدوير', production_date: '2026-04-01', trend: 'up', purity_percent: 97, lab_report: true },
];

const PRICE_HISTORY = [
  { month: 'يناير', hdpe: 24, pet: 30, aluminum: 130, cardboard: 7 },
  { month: 'فبراير', hdpe: 25, pet: 31, aluminum: 128, cardboard: 7.5 },
  { month: 'مارس', hdpe: 28, pet: 35, aluminum: 120, cardboard: 8 },
  { month: 'أبريل', hdpe: 29, pet: 36, aluminum: 118, cardboard: 8.5 },
];

const MARKET_STATS = [
  { name: 'بلاستيك', value: 38, fill: '#3b82f6' },
  { name: 'ورق', value: 25, fill: '#f59e0b' },
  { name: 'معادن', value: 18, fill: '#8b5cf6' },
  { name: 'زجاج', value: 12, fill: '#10b981' },
  { name: 'أخرى', value: 7, fill: '#6b7280' },
];

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  B: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  C: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const TREND_ICONS = {
  up: <TrendingUp className="h-3 w-3 text-emerald-600" />,
  down: <TrendingDown className="h-3 w-3 text-red-600" />,
  stable: <Minus className="h-3 w-3 text-muted-foreground" />,
};

const SecondaryMaterialsExchange = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = DEMO_MATERIALS.filter(m =>
    m.base_material.includes(searchTerm) ||
    m.material_type.includes(searchTerm) ||
    (m.organization_name || '').includes(searchTerm)
  );

  const totalValue = DEMO_MATERIALS.reduce((s, m) => s + m.quantity_available_kg * m.price_per_kg_egp, 0);
  const totalTons = DEMO_MATERIALS.reduce((s, m) => s + m.quantity_available_kg, 0) / 1000;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Recycle className="h-6 w-6 text-primary" />
            سوق السلع الثانوية
          </h1>
          <p className="text-xs text-muted-foreground">Secondary Materials B2B Exchange</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs">
            <Bell className="h-3.5 w-3.5 ml-1" />
            تنبيهات الأسعار
          </Button>
          <Button size="sm" className="text-xs">
            <Package className="h-3.5 w-3.5 ml-1" />
            أضف منتج
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Package className="h-4 w-4" />} label="مواد متاحة" value={DEMO_MATERIALS.length} trend="up" />
        <StatCard icon={<Recycle className="h-4 w-4" />} label="إجمالي الكمية" value={`${totalTons.toFixed(1)} طن`} />
        <StatCard icon={<BarChart3 className="h-4 w-4" />} label="قيمة السوق" value={`${(totalValue / 1e6).toFixed(2)}M ج.م`} trend="up" />
        <StatCard icon={<Globe className="h-4 w-4" />} label="قابل للتصدير" value={DEMO_MATERIALS.filter(m => m.available_for_export).length} />
      </div>

      <Tabs defaultValue="browse" dir="rtl">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="browse" className="text-xs">تصفح المواد</TabsTrigger>
          <TabsTrigger value="prices" className="text-xs">مؤشر الأسعار</TabsTrigger>
          <TabsTrigger value="market" className="text-xs">تحليل السوق</TabsTrigger>
          <TabsTrigger value="requests" className="text-xs">طلبات الشراء</TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-3 mt-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بنوع المادة، المورد..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pr-9"
            />
          </div>

          {filtered.map(material => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={GRADE_COLORS[material.quality_grade]}>
                      درجة {material.quality_grade}
                    </Badge>
                    {material.available_for_export && (
                      <Badge variant="outline" className="text-[9px] h-5">
                        <Globe className="h-3 w-3 ml-1" />تصدير
                      </Badge>
                    )}
                    {material.lab_report && (
                      <Badge variant="outline" className="text-[9px] h-5 border-emerald-300 text-emerald-600">
                        <FileCheck className="h-3 w-3 ml-1" />معمل
                      </Badge>
                    )}
                  </div>
                  <div className="text-left flex items-center gap-1">
                    {TREND_ICONS[material.trend]}
                    <span className="text-lg font-bold text-primary">{material.price_per_kg_egp}</span>
                    <span className="text-xs text-muted-foreground">ج.م/كجم</span>
                  </div>
                </div>

                <h3 className="font-semibold text-sm mb-1">{material.base_material}</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {material.material_type} • {material.organization_name}
                  {material.purity_percent && <span className="mr-2">• نقاوة {material.purity_percent}%</span>}
                </p>

                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-3">
                    <span>متاح: <strong>{(material.quantity_available_kg / 1000).toFixed(1)} طن</strong></span>
                    <span>حد أدنى: <strong>{material.min_order_kg} كجم</strong></span>
                  </div>
                  {material.certifications.length > 0 && (
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600 text-[10px]">{material.certifications.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-8 text-xs">
                    <Handshake className="h-3 w-3 ml-1" />طلب عرض سعر
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    <MessageCircle className="h-3 w-3 ml-1" />تواصل
                  </Button>
                  {material.lab_report && (
                    <Button size="sm" variant="outline" className="h-8 text-xs">
                      <FlaskConical className="h-3 w-3 ml-1" />تقرير المعمل
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Prices Tab */}
        <TabsContent value="prices" className="space-y-4 mt-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">مؤشر أسعار المواد الثانوية (ج.م/كجم)</p>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={PRICE_HISTORY}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="hdpe" stroke="hsl(var(--primary))" name="HDPE" strokeWidth={2} />
                    <Line type="monotone" dataKey="pet" stroke="#10b981" name="PET" strokeWidth={2} />
                    <Line type="monotone" dataKey="aluminum" stroke="#8b5cf6" name="ألمنيوم" strokeWidth={2} />
                    <Line type="monotone" dataKey="cardboard" stroke="#f59e0b" name="كرتون" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'HDPE', price: 28, change: '+12%', up: true },
              { name: 'PET', price: 35, change: '+16%', up: true },
              { name: 'ألمنيوم', price: 120, change: '-7%', up: false },
              { name: 'كرتون', price: 8, change: '+14%', up: true },
            ].map(p => (
              <Card key={p.name}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{p.name}</span>
                    {p.up ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> : <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
                  </div>
                  <div className="text-lg font-bold mt-1">{p.price} <span className="text-xs font-normal text-muted-foreground">ج.م/كجم</span></div>
                  <p className={`text-[10px] font-semibold ${p.up ? 'text-emerald-600' : 'text-red-600'}`}>{p.change} هذا الشهر</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Market Analysis Tab */}
        <TabsContent value="market" className="space-y-4 mt-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">توزيع السوق حسب نوع المادة</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={MARKET_STATS} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3}>
                      {MARKET_STATS.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v}%`, 'الحصة']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap text-[10px]">
                {MARKET_STATS.map(s => (
                  <span key={s.name} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                    {s.name}: {s.value}%
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Factory className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-lg font-bold">24</div>
                <p className="text-[10px] text-muted-foreground">مورد نشط</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Handshake className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                <div className="text-lg font-bold">156</div>
                <p className="text-[10px] text-muted-foreground">صفقة مكتملة</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Purchase Requests Tab */}
        <TabsContent value="requests" className="space-y-3 mt-3">
          {[
            { id: 'PR-001', material: 'HDPE حبيبات', qty: '2 طن', budget: '56,000 ج.م', buyer: 'مصنع تغليف الدلتا', urgent: true },
            { id: 'PR-002', material: 'PET رقائق شفاف', qty: '1.5 طن', budget: '52,500 ج.م', buyer: 'شركة المشروبات العربية', urgent: false },
            { id: 'PR-003', material: 'ألمنيوم سبائك', qty: '500 كجم', budget: '60,000 ج.م', buyer: 'مصنع الأدوات المنزلية', urgent: true },
          ].map(req => (
            <Card key={req.id} className={req.urgent ? 'border-amber-200 dark:border-amber-800' : ''}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] h-5">{req.id}</Badge>
                    {req.urgent && <Badge className="text-[9px] h-5 bg-amber-500">عاجل</Badge>}
                  </div>
                  <span className="text-xs font-bold text-primary">{req.budget}</span>
                </div>
                <p className="text-xs font-semibold">{req.material} — {req.qty}</p>
                <p className="text-[10px] text-muted-foreground mb-2">{req.buyer}</p>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-7 text-[10px]">تقديم عرض</Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px]">التفاصيل</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string | number; trend?: 'up' | 'down' }) => (
  <Card>
    <CardContent className="p-3 text-center">
      <div className="flex justify-center mb-1 text-primary">{icon}</div>
      <div className="text-lg font-bold flex items-center justify-center gap-1">
        {value}
        {trend && (trend === 'up' ? <TrendingUp className="h-3 w-3 text-emerald-600" /> : <TrendingDown className="h-3 w-3 text-red-600" />)}
      </div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default SecondaryMaterialsExchange;
