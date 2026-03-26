import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Package, Settings2, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const WasteGenerationIntelligence = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [newWasteType, setNewWasteType] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Fetch inventory settings
  const { data: inventorySettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['waste-inventory-settings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('waste_inventory_settings')
        .select('*')
        .eq('organization_id', organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Fetch shipments for calculations
  const { data: shipments, isLoading: shipmentsLoading } = useQuery({
    queryKey: ['waste-intelligence-shipments', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const { data } = await supabase
        .from('shipments')
        .select('id, waste_type, quantity, unit, status, created_at')
        .eq('generator_id', organization.id)
        .gte('created_at', twoYearsAgo.toISOString())
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const isLoading = settingsLoading || shipmentsLoading;

  // Calculate live inventory for each waste type with settings
  const liveInventory = (inventorySettings || []).map(setting => {
    const used = (shipments || [])
      .filter(s => s.waste_type === setting.waste_type && ['delivered', 'confirmed', 'in_transit'].includes(s.status))
      .reduce((sum, s) => sum + (s.quantity || 0), 0);
    const remaining = Math.max(0, setting.capacity_tons - used);
    const percent = setting.capacity_tons > 0 ? (remaining / setting.capacity_tons) * 100 : 0;
    const isLow = percent <= (setting.alert_threshold_percent || 20);
    return { ...setting, used, remaining, percent, isLow };
  });

  // YoY comparison
  const yoyData = (() => {
    if (!shipments?.length) return [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map(month => {
      const currentYearShipments = shipments.filter(s => {
        const d = new Date(s.created_at);
        return d.getFullYear() === currentYear && d.getMonth() + 1 === month;
      });
      const lastYearShipments = shipments.filter(s => {
        const d = new Date(s.created_at);
        return d.getFullYear() === lastYear && d.getMonth() + 1 === month;
      });
      const currentTotal = currentYearShipments.reduce((s, sh) => s + (sh.quantity || 0), 0);
      const lastTotal = lastYearShipments.reduce((s, sh) => s + (sh.quantity || 0), 0);
      const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      return {
        month: monthNames[month - 1],
        [`${currentYear}`]: Math.round(currentTotal * 10) / 10,
        [`${lastYear}`]: Math.round(lastTotal * 10) / 10,
      };
    }).filter((_, i) => i <= now.getMonth());
  })();

  const handleAddSetting = async () => {
    if (!organization?.id || !newWasteType || !newCapacity) return;
    const { error } = await supabase.from('waste_inventory_settings').upsert({
      organization_id: organization.id,
      waste_type: newWasteType,
      capacity_tons: parseFloat(newCapacity),
    }, { onConflict: 'organization_id,waste_type' });
    if (error) {
      toast.error('فشل في الحفظ');
    } else {
      toast.success('تم حفظ إعدادات المخزون');
      queryClient.invalidateQueries({ queryKey: ['waste-inventory-settings'] });
      setNewWasteType('');
      setNewCapacity('');
      setShowSettings(false);
    }
  };

  if (isLoading) return <Skeleton className="h-[400px]" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة سعة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إعدادات سعة المخلفات</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>نوع المخلفات</Label>
                  <Input value={newWasteType} onChange={e => setNewWasteType(e.target.value)} placeholder="مثال: خشب، بلاستيك، حديد" />
                </div>
                <div>
                  <Label>السعة (طن)</Label>
                  <Input type="number" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} placeholder="500" />
                </div>
                <Button onClick={handleAddSetting} className="w-full gap-2">
                  <Save className="w-4 h-4" />
                  حفظ
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <div className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <Package className="w-5 h-5" />
              ذكاء أنماط التوليد
            </CardTitle>
            <CardDescription>مخزون حي + مقارنة سنوية</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Inventory */}
        {liveInventory.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-right">📦 المخزون الحي</h4>
            {liveInventory.map(item => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {item.isLow && <AlertTriangle className="w-4 h-4 text-destructive" />}
                    <span className={item.isLow ? 'text-destructive font-semibold' : ''}>
                      {item.remaining.toLocaleString()} / {item.capacity_tons.toLocaleString()} طن
                    </span>
                  </div>
                  <span className="font-medium">{item.waste_type}</span>
                </div>
                <Progress value={item.percent} className={`h-2 ${item.isLow ? '[&>div]:bg-destructive' : ''}`} />
                {item.isLow && (
                  <Badge variant="destructive" className="text-xs">⚠️ المخزون منخفض — أقل من {item.alert_threshold_percent}%</Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* YoY Chart */}
        {yoyData.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-right mb-3">📊 مقارنة سنوية (طن)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={yoyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey={`${new Date().getFullYear() - 1}`} fill="hsl(var(--muted-foreground))" name={`${new Date().getFullYear() - 1}`} radius={[4, 4, 0, 0]} />
                <Bar dataKey={`${new Date().getFullYear()}`} fill="hsl(var(--primary))" name={`${new Date().getFullYear()}`} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {liveInventory.length === 0 && yoyData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>لا توجد بيانات كافية بعد</p>
            <p className="text-xs">أضف سعة المخلفات أو أنشئ شحنات لبدء التحليل</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WasteGenerationIntelligence;
