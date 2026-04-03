import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  CalendarClock, Repeat, Truck, CheckCircle2, Clock, Plus,
  FileText, DollarSign, Package
} from 'lucide-react';

interface RecurringService {
  id: string;
  client_name: string;
  service_type: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  material_type: string;
  estimated_qty: string;
  price_per_trip: number;
  next_pickup: string;
  is_active: boolean;
  total_trips: number;
  auto_invoice: boolean;
}

const FREQ_LABELS = { daily: 'يومي', weekly: 'أسبوعي', biweekly: 'نصف شهري', monthly: 'شهري' };

const DEMO_SERVICES: RecurringService[] = [
  { id: '1', client_name: 'مصنع الأغذية المتحدة', service_type: 'جمع مخلفات عضوية', frequency: 'daily', material_type: 'عضوية', estimated_qty: '500 كجم/يوم', price_per_trip: 350, next_pickup: '2026-04-04', is_active: true, total_trips: 245, auto_invoice: true },
  { id: '2', client_name: 'مول سيتي ستارز', service_type: 'جمع كرتون وبلاستيك', frequency: 'weekly', material_type: 'كرتون + بلاستيك', estimated_qty: '2 طن/أسبوع', price_per_trip: 800, next_pickup: '2026-04-07', is_active: true, total_trips: 52, auto_invoice: true },
  { id: '3', client_name: 'مستشفى النيل', service_type: 'جمع مخلفات طبية', frequency: 'biweekly', material_type: 'طبية خطرة', estimated_qty: '300 كجم', price_per_trip: 1500, next_pickup: '2026-04-15', is_active: true, total_trips: 24, auto_invoice: true },
  { id: '4', client_name: 'مصنع الحديد والصلب', service_type: 'جمع خردة معادن', frequency: 'monthly', material_type: 'معادن', estimated_qty: '5 طن', price_per_trip: 2000, next_pickup: '2026-05-01', is_active: false, total_trips: 8, auto_invoice: false },
];

const RecurringServicesDashboard = () => {
  const active = DEMO_SERVICES.filter(s => s.is_active);
  const monthlyRevenue = active.reduce((s, srv) => {
    const multiplier = srv.frequency === 'daily' ? 26 : srv.frequency === 'weekly' ? 4 : srv.frequency === 'biweekly' ? 2 : 1;
    return s + srv.price_per_trip * multiplier;
  }, 0);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Repeat className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{active.length}</div>
            <p className="text-[10px] text-muted-foreground">خدمة نشطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <div className="text-lg font-bold">{(monthlyRevenue/1000).toFixed(0)}K</div>
            <p className="text-[10px] text-muted-foreground">إيراد شهري (ج.م)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Truck className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{DEMO_SERVICES.reduce((s, srv) => s + srv.total_trips, 0)}</div>
            <p className="text-[10px] text-muted-foreground">رحلة منفذة</p>
          </CardContent>
        </Card>
      </div>

      <Button size="sm" className="w-full">
        <Plus className="h-4 w-4 ml-1" />
        إنشاء خدمة دورية جديدة
      </Button>

      <div className="space-y-3">
        {DEMO_SERVICES.map(srv => (
          <Card key={srv.id} className={!srv.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold">{srv.client_name}</h3>
                  <p className="text-[10px] text-muted-foreground">{srv.service_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] h-5">{FREQ_LABELS[srv.frequency]}</Badge>
                  <Switch checked={srv.is_active} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-3">
                <div className="bg-muted/50 rounded p-1.5">
                  <Package className="h-3 w-3 mx-auto mb-0.5 text-muted-foreground" />
                  <div className="font-bold">{srv.estimated_qty}</div>
                </div>
                <div className="bg-muted/50 rounded p-1.5">
                  <DollarSign className="h-3 w-3 mx-auto mb-0.5 text-muted-foreground" />
                  <div className="font-bold">{srv.price_per_trip} ج.م</div>
                </div>
                <div className="bg-muted/50 rounded p-1.5">
                  <CheckCircle2 className="h-3 w-3 mx-auto mb-0.5 text-muted-foreground" />
                  <div className="font-bold">{srv.total_trips} رحلة</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CalendarClock className="h-3 w-3" />
                  القادم: {new Date(srv.next_pickup).toLocaleDateString('ar-EG')}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className={srv.auto_invoice ? 'text-emerald-600' : 'text-muted-foreground'}>
                    فوترة {srv.auto_invoice ? 'تلقائية' : 'يدوية'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecurringServicesDashboard;
