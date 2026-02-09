import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Globe, Settings, Users, FileText, Key, Plus, Copy, ExternalLink, Lock, Unlock, Package, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import BackButton from '@/components/ui/back-button';

const CustomerPortalSettings: React.FC = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [showAddToken, setShowAddToken] = useState(false);
  const [newToken, setNewToken] = useState({ name: '', email: '', phone: '', permissions: ['track_shipments'] });

  const { data: portalSettings } = useQuery({
    queryKey: ['portal-settings', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('customer_portal_settings')
        .select('*')
        .eq('organization_id', organization!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!organization,
  });

  const { data: accessTokens } = useQuery({
    queryKey: ['portal-tokens', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('portal_access_tokens')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization,
  });

  const { data: serviceRequests } = useQuery({
    queryKey: ['portal-requests', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('portal_service_requests')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!organization,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (portalSettings) {
        const { error } = await supabase.from('customer_portal_settings').update(updates).eq('id', portalSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('customer_portal_settings').insert({ organization_id: organization!.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-settings'] });
      toast.success('تم حفظ الإعدادات');
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const token = crypto.randomUUID().replace(/-/g, '');
      const prefix = token.substring(0, 8);
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase.from('portal_access_tokens').insert({
        organization_id: organization!.id,
        name: newToken.name,
        email: newToken.email || null,
        phone: newToken.phone || null,
        token_hash: hash,
        token_prefix: prefix,
        permissions: newToken.permissions,
      });
      if (error) throw error;
      return { token, prefix };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portal-tokens'] });
      setShowAddToken(false);
      navigator.clipboard.writeText(data.token);
      toast.success('تم إنشاء رمز الوصول ونسخه للحافظة', { description: `الرمز: ${data.token.substring(0, 12)}...` });
      setNewToken({ name: '', email: '', phone: '', permissions: ['track_shipments'] });
    },
    onError: () => toast.error('فشل في إنشاء رمز الوصول'),
  });

  const updateRequestStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('portal_service_requests').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-requests'] });
      toast.success('تم تحديث حالة الطلب');
    },
  });

  const isEnabled = portalSettings?.is_enabled || false;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    pending: 'جديد',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتمل',
    rejected: 'مرفوض',
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="w-7 h-7 text-primary" />
              بوابة العملاء الخارجية
            </h1>
            <p className="text-muted-foreground">بوابة خارجية للعملاء لتتبع الشحنات وطلب الخدمات</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isEnabled ? 'default' : 'secondary'} className="gap-1">
            {isEnabled ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isEnabled ? 'مفعّلة' : 'غير مفعّلة'}
          </Badge>
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => saveSettingsMutation.mutate({ is_enabled: checked })}
          />
        </div>
      </div>

      {!isEnabled && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 text-center">
            <Lock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">البوابة غير مفعّلة</h3>
            <p className="text-muted-foreground mb-4">فعّل البوابة من الزر أعلاه لإتاحة الوصول للعملاء الخارجيين</p>
            <p className="text-xs text-muted-foreground">يمكنك إعداد كل شيء أولاً ثم تفعيل البوابة عندما تكون جاهزاً</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'عملاء مسجلون', value: accessTokens?.filter(t => t.is_active).length || 0, color: 'text-blue-500' },
          { icon: Key, label: 'رموز وصول', value: accessTokens?.length || 0, color: 'text-purple-500' },
          { icon: FileText, label: 'طلبات جديدة', value: serviceRequests?.filter(r => r.status === 'pending').length || 0, color: 'text-yellow-500' },
          { icon: Package, label: 'طلبات مكتملة', value: serviceRequests?.filter(r => r.status === 'completed').length || 0, color: 'text-green-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="gap-2"><Settings className="w-4 h-4" />الإعدادات</TabsTrigger>
          <TabsTrigger value="tokens" className="gap-2"><Key className="w-4 h-4" />رموز الوصول</TabsTrigger>
          <TabsTrigger value="requests" className="gap-2"><FileText className="w-4 h-4" />طلبات الخدمة</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات البوابة</CardTitle>
              <CardDescription>تخصيص بوابة العملاء الخارجية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>اسم البوابة</Label>
                  <Input
                    defaultValue={portalSettings?.portal_name || ''}
                    onBlur={e => saveSettingsMutation.mutate({ portal_name: e.target.value })}
                    placeholder="بوابة خدمة العملاء"
                  />
                </div>
                <div>
                  <Label>اللون الأساسي</Label>
                  <Input
                    type="color"
                    defaultValue={portalSettings?.primary_color || '#10b981'}
                    onBlur={e => saveSettingsMutation.mutate({ primary_color: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>رسالة الترحيب</Label>
                <Textarea
                  defaultValue={portalSettings?.welcome_message || ''}
                  onBlur={e => saveSettingsMutation.mutate({ welcome_message: e.target.value })}
                  placeholder="مرحباً بكم في بوابة خدمة العملاء..."
                />
              </div>

              <div className="space-y-3 border rounded-lg p-4">
                <h3 className="font-semibold text-sm">صلاحيات البوابة</h3>
                {[
                  { key: 'allow_shipment_tracking', label: 'تتبع الشحنات', icon: Package },
                  { key: 'allow_service_requests', label: 'طلب خدمات جديدة', icon: FileText },
                  { key: 'allow_document_download', label: 'تحميل المستندات', icon: FileText },
                  { key: 'allow_invoices_view', label: 'عرض الفواتير', icon: Receipt },
                ].map(perm => (
                  <div key={perm.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <perm.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{perm.label}</span>
                    </div>
                    <Switch
                      checked={portalSettings?.[perm.key as keyof typeof portalSettings] as boolean || false}
                      onCheckedChange={(checked) => saveSettingsMutation.mutate({ [perm.key]: checked })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>رموز الوصول</CardTitle>
                <CardDescription>إنشاء رموز وصول للعملاء الخارجيين</CardDescription>
              </div>
              <Dialog open={showAddToken} onOpenChange={setShowAddToken}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="w-4 h-4" />إنشاء رمز</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إنشاء رمز وصول جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div><Label>اسم العميل *</Label><Input value={newToken.name} onChange={e => setNewToken(p => ({ ...p, name: e.target.value }))} /></div>
                    <div><Label>البريد الإلكتروني</Label><Input value={newToken.email} onChange={e => setNewToken(p => ({ ...p, email: e.target.value }))} dir="ltr" /></div>
                    <div><Label>رقم الهاتف</Label><Input value={newToken.phone} onChange={e => setNewToken(p => ({ ...p, phone: e.target.value }))} dir="ltr" /></div>
                    <Button onClick={() => generateTokenMutation.mutate()} disabled={!newToken.name || generateTokenMutation.isPending} className="w-full">
                      {generateTokenMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الرمز'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {accessTokens?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد رموز وصول</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accessTokens?.map(token => (
                    <div key={token.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{token.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {token.email || token.phone || 'بدون بيانات اتصال'} • 
                          <span className="font-mono mr-1">{token.token_prefix}...</span>
                        </p>
                      </div>
                      <Badge variant={token.is_active ? 'default' : 'secondary'}>
                        {token.is_active ? 'نشط' : 'معطّل'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardContent className="p-4">
              {serviceRequests?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد طلبات خدمة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {serviceRequests?.map(req => (
                    <div key={req.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">{req.request_number}</p>
                          <p className="text-xs text-muted-foreground">{req.request_type} • {new Date(req.created_at).toLocaleDateString('ar-EG')}</p>
                        </div>
                        <Badge className={statusColors[req.status]}>{statusLabels[req.status]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{req.description}</p>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateRequestStatus.mutate({ id: req.id, status: 'in_progress' })}>قبول</Button>
                          <Button size="sm" variant="destructive" onClick={() => updateRequestStatus.mutate({ id: req.id, status: 'rejected' })}>رفض</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerPortalSettings;
