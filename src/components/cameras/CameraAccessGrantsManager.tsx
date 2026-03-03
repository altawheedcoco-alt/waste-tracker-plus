import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Shield, ShieldCheck, ShieldOff, Plus, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLinkedPartners } from '@/hooks/useLinkedPartners';

const GRANT_TYPE_LABELS: Record<string, string> = {
  arrival_proof: 'إثبات الوصول',
  live_feed: 'بث مباشر',
  full_access: 'وصول كامل',
};

const CameraAccessGrantsManager = () => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [selectedGrantType, setSelectedGrantType] = useState<string>('arrival_proof');

  const { data: linkedGenerators = [] } = useLinkedPartners('generator');

  const { data: grants = [], isLoading } = useQuery({
    queryKey: ['camera-access-grants', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('camera_access_grants')
        .select(`
          *,
          granted_to:organizations!camera_access_grants_granted_to_organization_id_fkey(id, name, logo_url, organization_type)
        `)
        .eq('facility_organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const addGrant = useMutation({
    mutationFn: async () => {
      if (!organization?.id || !selectedPartner || !user?.id) return;
      const { error } = await supabase.from('camera_access_grants').insert({
        facility_organization_id: organization.id,
        granted_to_organization_id: selectedPartner,
        granted_by: user.id,
        grant_type: selectedGrantType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camera-access-grants'] });
      toast.success('تم منح صلاحية الكاميرا بنجاح');
      setSelectedPartner('');
    },
    onError: (err: any) => {
      if (err.message?.includes('duplicate')) {
        toast.error('هذا التصريح موجود بالفعل');
      } else {
        toast.error('فشل في منح الصلاحية');
      }
    },
  });

  const toggleGrant = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('camera_access_grants')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camera-access-grants'] });
      toast.success('تم تحديث الصلاحية');
    },
  });

  const deleteGrant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('camera_access_grants')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camera-access-grants'] });
      toast.success('تم إلغاء الصلاحية');
    },
  });

  // Filter out generators that already have this grant type
  const availableGenerators = linkedGenerators.filter(
    g => !grants.some((gr: any) => gr.granted_to_organization_id === g.id && gr.grant_type === selectedGrantType)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="w-5 h-5 text-primary" />
          تصاريح وصول الكاميرات
          <Badge variant="outline" className="mr-auto text-[10px]">
            {grants.filter((g: any) => g.is_active).length} تصريح نشط
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          تحكم في الجهات المسموح لها برؤية إثبات وصول الشحنات عبر الكاميرات
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new grant */}
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground mb-1 block">الجهة المولدة</label>
            <Select value={selectedPartner} onValueChange={setSelectedPartner}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="اختر جهة مولدة..." />
              </SelectTrigger>
              <SelectContent>
                {availableGenerators.map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    <span className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" />
                      {g.name}
                    </span>
                  </SelectItem>
                ))}
                {availableGenerators.length === 0 && (
                  <div className="text-xs text-muted-foreground p-2 text-center">
                    لا توجد جهات مولدة متاحة
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">نوع الوصول</label>
            <Select value={selectedGrantType} onValueChange={setSelectedGrantType}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="arrival_proof">إثبات الوصول</SelectItem>
                <SelectItem value="live_feed">بث مباشر</SelectItem>
                <SelectItem value="full_access">وصول كامل</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            onClick={() => addGrant.mutate()}
            disabled={!selectedPartner || addGrant.isPending}
            className="h-9"
          >
            <Plus className="w-4 h-4 ml-1" />
            منح تصريح
          </Button>
        </div>

        {/* Grants list */}
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-4">جاري التحميل...</div>
        ) : grants.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Camera className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">لم يتم منح أي تصريح بعد</p>
            <p className="text-xs">امنح الجهات المولدة صلاحية رؤية إثبات وصول شحناتهم</p>
          </div>
        ) : (
          <div className="space-y-2">
            {grants.map((grant: any) => (
              <div
                key={grant.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  grant.is_active
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-muted/30 border-border opacity-60'
                }`}
              >
                {grant.is_active ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <ShieldOff className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {(grant.granted_to as any)?.name || 'جهة غير معروفة'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {GRANT_TYPE_LABELS[grant.grant_type] || grant.grant_type}
                  </div>
                </div>
                <Switch
                  checked={grant.is_active}
                  onCheckedChange={(checked) => toggleGrant.mutate({ id: grant.id, is_active: checked })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteGrant.mutate(grant.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CameraAccessGrantsManager;
