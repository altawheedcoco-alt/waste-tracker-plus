import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Network, Plus, ArrowRight, ArrowLeft, Factory, MapPin,
  TrendingUp, Handshake, Leaf, Package
} from 'lucide-react';

const materialTypes = [
  'بلاستيك PET', 'بلاستيك HDPE', 'حديد خردة', 'ألمنيوم خردة',
  'نحاس خردة', 'ورق وكرتون', 'زجاج مكسور', 'إطارات مستعملة',
  'نشارة خشب', 'رماد متطاير', 'حمأة معالجة', 'كسر رخام',
];

const SymbiosisNetwork = () => {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useQuery({
    queryKey: ['symbiosis-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('symbiosis_listings')
        .select('*, organizations(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: matches } = useQuery({
    queryKey: ['symbiosis-matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('symbiosis_matches')
        .select('*, output_org:organizations!symbiosis_matches_output_org_id_fkey(name), input_org:organizations!symbiosis_matches_input_org_id_fkey(name)')
        .order('match_score', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', userData.user?.id || '')
        .eq('is_active', true)
        .single();

      if (!userOrg) throw new Error('لم يتم العثور على المنظمة');

      const { error } = await supabase.from('symbiosis_listings').insert({
        ...formData,
        organization_id: userOrg.organization_id,
        created_by: userData.user?.id,
        quantity_tons_per_month: Number(formData.quantity_tons_per_month) || 0,
        price_per_ton: Number(formData.price_per_ton) || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symbiosis-listings'] });
      setShowCreate(false);
      toast.success('تم نشر العرض بنجاح');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      listing_type: fd.get('listing_type'),
      material_type: fd.get('material_type'),
      material_description: fd.get('material_description'),
      quantity_tons_per_month: fd.get('quantity_tons_per_month'),
      price_per_ton: fd.get('price_per_ton'),
      location_governorate: fd.get('location_governorate'),
    });
  };

  const outputs = listings?.filter(l => l.listing_type === 'output') || [];
  const inputs = listings?.filter(l => l.listing_type === 'input') || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-500" />
            شبكة التكافل الصناعي
          </h2>
          <p className="text-xs text-muted-foreground">Industrial Symbiosis - ربط مخرجات المصانع بمدخلات مصانع أخرى</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              نشر عرض
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>نشر عرض تكافل صناعي</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <Label>نوع العرض</Label>
                <Select name="listing_type" required>
                  <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="output">🏭 لدي مخرجات (أبحث عن مشترٍ)</SelectItem>
                    <SelectItem value="input">📦 أحتاج مدخلات (أبحث عن مورّد)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>نوع المادة</Label>
                <Select name="material_type" required>
                  <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                  <SelectContent>
                    {materialTypes.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الوصف التفصيلي</Label>
                <Input name="material_description" placeholder="مواصفات المادة وحالتها..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>الكمية (طن/شهر)</Label>
                  <Input name="quantity_tons_per_month" type="number" min="0" placeholder="50" />
                </div>
                <div>
                  <Label>السعر (ج.م/طن)</Label>
                  <Input name="price_per_ton" type="number" min="0" placeholder="5000" />
                </div>
              </div>
              <div>
                <Label>المحافظة</Label>
                <Input name="location_governorate" placeholder="القاهرة" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'جاري النشر...' : 'نشر العرض'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Factory, label: 'مخرجات معروضة', value: outputs.length, color: 'text-orange-500' },
          { icon: Package, label: 'مدخلات مطلوبة', value: inputs.length, color: 'text-blue-500' },
          { icon: Handshake, label: 'مطابقات', value: matches?.length || 0, color: 'text-emerald-500' },
          { icon: Leaf, label: 'CO₂ تم توفيره', value: `${Math.round((matches?.reduce((s, m) => s + Number(m.carbon_saved_kg || 0), 0) || 0) / 1000)} طن`, color: 'text-green-500' },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Network Visualization */}
      {matches && matches.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Handshake className="w-4 h-4 text-emerald-500" />
              مطابقات التكافل النشطة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {matches.map((m: any) => (
              <div key={m.id} className="p-3 rounded-xl border bg-card flex items-center gap-3">
                <div className="flex-1 text-right">
                  <p className="text-sm font-bold">{(m.output_org as any)?.name || 'مصنع مُنتج'}</p>
                  <p className="text-[10px] text-muted-foreground">مخرجات</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ArrowLeft className="w-4 h-4 text-emerald-500" />
                  <Badge variant="outline" className="text-[9px]">{m.material_type}</Badge>
                  <p className="text-[9px] text-muted-foreground">{m.matched_quantity_tons} طن</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{(m.input_org as any)?.name || 'مصنع مُستقبل'}</p>
                  <p className="text-[10px] text-muted-foreground">مدخلات</p>
                </div>
                <Badge variant="outline" className={m.status === 'active' ? 'text-emerald-500 border-emerald-500/30' : ''}>
                  {m.match_score}% تطابق
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Listings */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Outputs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Factory className="w-4 h-4 text-orange-500" />
              مخرجات متاحة ({outputs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {outputs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">لا توجد مخرجات معروضة</p>
            ) : outputs.map((l: any) => (
              <div key={l.id} className="p-3 rounded-lg border bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[10px]">{l.material_type}</Badge>
                  <p className="text-sm font-bold">{(l.organizations as any)?.name}</p>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {l.location_governorate || 'غير محدد'}
                  </div>
                  <span>{l.quantity_tons_per_month} طن/شهر</span>
                </div>
                {l.price_per_ton && (
                  <p className="text-xs font-medium text-emerald-600 mt-1">{Number(l.price_per_ton).toLocaleString()} ج.م/طن</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              مدخلات مطلوبة ({inputs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inputs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">لا توجد طلبات مدخلات</p>
            ) : inputs.map((l: any) => (
              <div key={l.id} className="p-3 rounded-lg border bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[10px]">{l.material_type}</Badge>
                  <p className="text-sm font-bold">{(l.organizations as any)?.name}</p>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {l.location_governorate || 'غير محدد'}
                  </div>
                  <span>{l.quantity_tons_per_month} طن/شهر</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SymbiosisNetwork;
