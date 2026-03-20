import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Factory, Search, Lock, Unlock, ToggleLeft, ToggleRight,
  Shield, Building2,
} from 'lucide-react';

interface GeneratorOrg {
  id: string;
  name: string;
  city: string | null;
  can_create_shipments: boolean;
  is_active: boolean;
}

const AdminShipmentCreationControl = () => {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: generators = [], isLoading } = useQuery({
    queryKey: ['admin-generators-shipment-control'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, city, can_create_shipments, is_active')
        .eq('organization_type', 'generator')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as GeneratorOrg[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ orgId, value }: { orgId: string; value: boolean }) => {
      const { error } = await supabase
        .from('organizations')
        .update({ can_create_shipments: value })
        .eq('id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-generators-shipment-control'] });
    },
  });

  const toggleAllMutation = useMutation({
    mutationFn: async (value: boolean) => {
      const { error } = await supabase
        .from('organizations')
        .update({ can_create_shipments: value })
        .eq('organization_type', 'generator');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-generators-shipment-control'] });
      toast.success('تم تحديث جميع الجهات المولدة');
    },
  });

  const handleToggle = (org: GeneratorOrg) => {
    const newValue = !org.can_create_shipments;
    toggleMutation.mutate({ orgId: org.id, value: newValue });
    toast.success(
      newValue
        ? `✅ تم تفعيل إنشاء الشحنات لـ ${org.name}`
        : `🔒 تم تجميد إنشاء الشحنات لـ ${org.name}`
    );
  };

  const filtered = generators.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.city?.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = generators.filter(g => g.can_create_shipments).length;
  const frozenCount = generators.length - enabledCount;

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="gap-1.5 text-xs">
          <Factory className="w-3 h-3" />
          {generators.length} جهة مولدة
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
          <Unlock className="w-3 h-3" />
          {enabledCount} مفعّلة
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-xs text-amber-600 border-amber-200 bg-amber-50">
          <Lock className="w-3 h-3" />
          {frozenCount} مجمّدة
        </Badge>
      </div>

      {/* Bulk Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          onClick={() => toggleAllMutation.mutate(true)}
          disabled={toggleAllMutation.isPending}
        >
          <ToggleRight className="w-4 h-4" />
          تفعيل الجميع
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
          onClick={() => toggleAllMutation.mutate(false)}
          disabled={toggleAllMutation.isPending}
        >
          <ToggleLeft className="w-4 h-4" />
          تجميد الجميع
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو المدينة..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10 text-right"
        />
      </div>

      {/* Generator List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
        {filtered.map(org => (
          <Card key={org.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                org.can_create_shipments 
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' 
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
              }`}>
                {org.can_create_shipments ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="font-semibold text-sm truncate">{org.name}</p>
                <p className="text-xs text-muted-foreground">{org.city || '—'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-muted-foreground">
                  {org.can_create_shipments ? 'مفعّل' : 'مجمّد'}
                </span>
                <Switch
                  checked={org.can_create_shipments}
                  onCheckedChange={() => handleToggle(org)}
                  disabled={toggleMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">لا توجد جهات مطابقة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminShipmentCreationControl;
