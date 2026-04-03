import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Recycle, Search, Filter, TrendingUp, TrendingDown, Minus,
  Star, ShieldCheck, Globe, FlaskConical, Package, ChevronLeft
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
}

// Demo data for when tables don't exist yet
const DEMO_MATERIALS: SecondaryMaterial[] = [
  {
    id: '1', material_type: 'حبيبات', base_material: 'بولي إيثيلين (HDPE)',
    quality_grade: 'A', quantity_available_kg: 5000, min_order_kg: 500,
    price_per_kg_egp: 28, certifications: ['ISO 9001', 'REACH'],
    available_for_export: true, status: 'available', organization_name: 'مصنع التدوير الأخضر',
    production_date: '2026-03-15',
  },
  {
    id: '2', material_type: 'رقائق', base_material: 'PET شفاف',
    quality_grade: 'A', quantity_available_kg: 3200, min_order_kg: 300,
    price_per_kg_egp: 35, certifications: ['ISO 14001'],
    available_for_export: true, status: 'available', organization_name: 'شركة النيل للتدوير',
    production_date: '2026-03-20',
  },
  {
    id: '3', material_type: 'بالات', base_material: 'كرتون مقوى',
    quality_grade: 'B', quantity_available_kg: 12000, min_order_kg: 1000,
    price_per_kg_egp: 8, certifications: [],
    available_for_export: false, status: 'available', organization_name: 'مركز جمع الورق',
    production_date: '2026-03-25',
  },
  {
    id: '4', material_type: 'سبائك', base_material: 'ألمنيوم',
    quality_grade: 'A', quantity_available_kg: 800, min_order_kg: 100,
    price_per_kg_egp: 120, certifications: ['ISO 9001'],
    available_for_export: true, status: 'available', organization_name: 'مصنع المعادن المتحدة',
    production_date: '2026-03-18',
  },
  {
    id: '5', material_type: 'كسر زجاج', base_material: 'زجاج شفاف',
    quality_grade: 'B', quantity_available_kg: 7500, min_order_kg: 500,
    price_per_kg_egp: 4, certifications: [],
    available_for_export: false, status: 'available', organization_name: 'مصنع الزجاج الحديث',
    production_date: '2026-03-22',
  },
];

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  B: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  C: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  D: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const SecondaryMaterialsExchange = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('browse');

  const materials = DEMO_MATERIALS;

  const filtered = materials.filter(m =>
    m.base_material.includes(searchTerm) ||
    m.material_type.includes(searchTerm) ||
    (m.organization_name || '').includes(searchTerm)
  );

  const totalValue = materials.reduce((s, m) => s + m.quantity_available_kg * m.price_per_kg_egp, 0);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Package className="h-4 w-4" />} label="مواد متاحة" value={materials.length} />
        <StatCard icon={<Recycle className="h-4 w-4" />} label="إجمالي الكمية" value={`${(materials.reduce((s, m) => s + m.quantity_available_kg, 0) / 1000).toFixed(1)} طن`} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="قيمة السوق" value={`${(totalValue / 1000).toFixed(0)}K ج.م`} />
        <StatCard icon={<Globe className="h-4 w-4" />} label="قابل للتصدير" value={materials.filter(m => m.available_for_export).length} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث بنوع المادة، المورد..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pr-9"
        />
      </div>

      {/* Materials List */}
      <div className="space-y-3">
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
                      <Globe className="h-3 w-3 ml-1" />
                      تصدير
                    </Badge>
                  )}
                </div>
                <div className="text-left">
                  <span className="text-lg font-bold text-primary">{material.price_per_kg_egp}</span>
                  <span className="text-xs text-muted-foreground"> ج.م/كجم</span>
                </div>
              </div>

              <h3 className="font-semibold text-sm mb-1">{material.base_material}</h3>
              <p className="text-xs text-muted-foreground mb-2">
                {material.material_type} • {material.organization_name}
              </p>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span>متاح: <strong>{(material.quantity_available_kg / 1000).toFixed(1)} طن</strong></span>
                  <span>حد أدنى: <strong>{material.min_order_kg} كجم</strong></span>
                </div>
                {material.certifications.length > 0 && (
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-600">{material.certifications.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <Button size="sm" className="flex-1 h-8 text-xs">طلب عرض سعر</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  <FlaskConical className="h-3 w-3 ml-1" />
                  تقرير المعمل
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <Card>
    <CardContent className="p-3 text-center">
      <div className="flex justify-center mb-1 text-primary">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default SecondaryMaterialsExchange;
