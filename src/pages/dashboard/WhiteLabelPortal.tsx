/**
 * WhiteLabelPortal — Organizations create branded client portals
 * Clients track shipments, view invoices, certificates via a custom branded page
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Globe, Plus, Users, Settings, Copy, ExternalLink, Palette, Eye, Link2 } from 'lucide-react';
import { toast } from 'sonner';

const WhiteLabelPortal = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<any>(null);
  const [newPortal, setNewPortal] = useState({
    portal_name: '', portal_slug: '', primary_color: '#1a365d',
    secondary_color: '#16a34a', welcome_message: 'مرحباً بك في بوابة العملاء',
  });
  const [newClient, setNewClient] = useState({ client_name: '', client_email: '', client_phone: '' });

  const { data: portals = [] } = useQuery({
    queryKey: ['client-portals', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data } = await supabase
        .from('client_portals')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['portal-clients', selectedPortal?.id],
    queryFn: async () => {
      if (!selectedPortal) return [];
      const { data } = await supabase
        .from('portal_clients')
        .select('*')
        .eq('portal_id', selectedPortal.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!selectedPortal,
  });

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 30);
  const generateAccessCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const createPortalMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error('Not auth');
      const { error } = await supabase.from('client_portals').insert({
        organization_id: profile.organization_id,
        portal_name: newPortal.portal_name,
        portal_slug: newPortal.portal_slug || generateSlug(newPortal.portal_name),
        primary_color: newPortal.primary_color,
        secondary_color: newPortal.secondary_color,
        welcome_message: newPortal.welcome_message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إنشاء البوابة');
      setCreateOpen(false);
      setNewPortal({ portal_name: '', portal_slug: '', primary_color: '#1a365d', secondary_color: '#16a34a', welcome_message: 'مرحباً بك في بوابة العملاء' });
      queryClient.invalidateQueries({ queryKey: ['client-portals'] });
    },
    onError: (e: any) => toast.error(e.message?.includes('unique') ? 'هذا الرابط مستخدم بالفعل' : 'فشل الإنشاء'),
  });

  const addClientMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPortal || !profile?.organization_id) throw new Error('Missing');
      const { error } = await supabase.from('portal_clients').insert({
        portal_id: selectedPortal.id,
        organization_id: profile.organization_id,
        client_name: newClient.client_name,
        client_email: newClient.client_email || null,
        client_phone: newClient.client_phone || null,
        access_code: generateAccessCode(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إضافة العميل');
      setAddClientOpen(false);
      setNewClient({ client_name: '', client_email: '', client_phone: '' });
      queryClient.invalidateQueries({ queryKey: ['portal-clients'] });
    },
    onError: () => toast.error('فشل إضافة العميل'),
  });

  const portalUrl = (slug: string) => `${window.location.origin}/portal/${slug}`;

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(portalUrl(slug));
    toast.success('تم نسخ الرابط');
  };

  return (
    <div className="space-y-6 p-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-7 h-7 text-primary" />
            بوابة العملاء (White-Label)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">أنشئ بوابة مخصصة بشعار جهتك يدخلها عملاؤك لمتابعة شحناتهم</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />إنشاء بوابة جديدة</Button></DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>إنشاء بوابة عملاء</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>اسم البوابة</Label><Input value={newPortal.portal_name} onChange={e => { setNewPortal(p => ({ ...p, portal_name: e.target.value, portal_slug: generateSlug(e.target.value) })); }} placeholder="مثال: بوابة عملاء شركة النقل" /></div>
              <div><Label>رابط البوابة</Label>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1"><Link2 className="w-3 h-3" />{window.location.origin}/portal/<strong>{newPortal.portal_slug || '...'}</strong></div>
                <Input value={newPortal.portal_slug} onChange={e => setNewPortal(p => ({ ...p, portal_slug: e.target.value }))} placeholder="company-name" dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>اللون الأساسي</Label><Input type="color" value={newPortal.primary_color} onChange={e => setNewPortal(p => ({ ...p, primary_color: e.target.value }))} /></div>
                <div><Label>اللون الثانوي</Label><Input type="color" value={newPortal.secondary_color} onChange={e => setNewPortal(p => ({ ...p, secondary_color: e.target.value }))} /></div>
              </div>
              <div><Label>رسالة الترحيب</Label><Textarea value={newPortal.welcome_message} onChange={e => setNewPortal(p => ({ ...p, welcome_message: e.target.value }))} rows={2} /></div>
              <Button className="w-full" onClick={() => createPortalMutation.mutate()} disabled={!newPortal.portal_name || createPortalMutation.isPending}>
                إنشاء البوابة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Portals list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portals.map((portal: any) => (
          <Card key={portal.id} className={`cursor-pointer hover:shadow-lg transition-all ${selectedPortal?.id === portal.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedPortal(portal)}>
            <div className="h-2" style={{ background: `linear-gradient(90deg, ${portal.primary_color}, ${portal.secondary_color})` }} />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{portal.portal_name}</CardTitle>
                <Badge variant={portal.is_active ? 'default' : 'secondary'}>{portal.is_active ? 'نشطة' : 'معطلة'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span className="font-mono truncate">/portal/{portal.portal_slug}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); copyLink(portal.portal_slug); }}>
                  <Copy className="w-3 h-3 ml-1" />نسخ الرابط
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); window.open(portalUrl(portal.portal_slug), '_blank'); }}>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {portals.length === 0 && (
          <Card className="col-span-full border-dashed">
            <CardContent className="p-12 text-center">
              <Globe className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">أنشئ أول بوابة لعملائك</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected portal details */}
      {selectedPortal && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                عملاء بوابة: {selectedPortal.portal_name}
              </CardTitle>
              <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="w-3 h-3" />إضافة عميل</Button></DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader><DialogTitle>إضافة عميل جديد</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>اسم العميل</Label><Input value={newClient.client_name} onChange={e => setNewClient(p => ({ ...p, client_name: e.target.value }))} /></div>
                    <div><Label>البريد الإلكتروني</Label><Input type="email" value={newClient.client_email} onChange={e => setNewClient(p => ({ ...p, client_email: e.target.value }))} /></div>
                    <div><Label>رقم الهاتف</Label><Input value={newClient.client_phone} onChange={e => setNewClient(p => ({ ...p, client_phone: e.target.value }))} /></div>
                    <Button className="w-full" onClick={() => addClientMutation.mutate()} disabled={!newClient.client_name || addClientMutation.isPending}>إضافة العميل</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {clients.length > 0 ? (
              <div className="space-y-2">
                {clients.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{c.client_name}</p>
                      <p className="text-xs text-muted-foreground">{c.client_email} • {c.client_phone}</p>
                    </div>
                    <div className="text-left">
                      <Badge variant="outline" className="font-mono text-xs">{c.access_code}</Badge>
                      <p className="text-[9px] text-muted-foreground mt-0.5">كود الدخول</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">لا يوجد عملاء — أضف أول عميل</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhiteLabelPortal;
