import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus, Link2, Copy, Trash2, Loader2, ExternalLink,
  Eye, Clock, Hash, MessageCircle, QrCode,
  ToggleLeft, ToggleRight, Shield, Users,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ScopedLink {
  id: string;
  link_code: string;
  link_name: string;
  description: string | null;
  assigned_to_name: string;
  assigned_to_phone: string | null;
  assigned_to_email: string | null;
  access_pin: string | null;
  scoped_organization_ids: string[];
  can_view_shipments: boolean;
  can_create_shipments: boolean;
  can_view_deposits: boolean;
  can_create_deposits: boolean;
  can_view_ledger: boolean;
  can_view_invoices: boolean;
  waste_types_filter: string[] | null;
  is_active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  created_at: string;
}

export default function ScopedLinksManager() {
  const { profile } = useAuth();
  const [links, setLinks] = useState<ScopedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrLink, setQrLink] = useState<ScopedLink | null>(null);

  // Partners for scoping
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);

  // Form state
  const [form, setForm] = useState({
    link_name: '',
    description: '',
    assigned_to_name: '',
    assigned_to_phone: '',
    assigned_to_email: '',
    access_pin: '',
    selectedOrgs: [] as string[],
    can_view_shipments: true,
    can_create_shipments: false,
    can_view_deposits: true,
    can_create_deposits: false,
    can_view_ledger: true,
    can_view_invoices: false,
    expires_at: '',
    max_uses: '',
  });

  const loadLinks = useCallback(async () => {
    if (!profile?.organization_id) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('scoped_access_links')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      setLinks((data as any[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  const loadPartners = useCallback(async () => {
    if (!profile?.organization_id) return;
    // Get linked partner orgs
    const { data: partnerLinks } = await supabase
      .from('partner_links')
      .select('organization_id, partner_organization_id')
      .or(`organization_id.eq.${profile.organization_id},partner_organization_id.eq.${profile.organization_id}`)
      .eq('status', 'active');

    const orgIds = new Set<string>();
    (partnerLinks || []).forEach((p: any) => {
      if (p.organization_id !== profile.organization_id) orgIds.add(p.organization_id);
      if (p.partner_organization_id !== profile.organization_id) orgIds.add(p.partner_organization_id);
    });

    if (orgIds.size > 0) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', Array.from(orgIds));
      setPartners(orgs || []);
    }
  }, [profile?.organization_id]);

  useEffect(() => { loadLinks(); loadPartners(); }, [loadLinks, loadPartners]);

  const getLinkUrl = (code: string) => `${window.location.origin}/scoped/${code}`;

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(getLinkUrl(code));
    toast.success('تم نسخ الرابط');
  };

  const shareWhatsApp = (link: ScopedLink) => {
    const url = getLinkUrl(link.link_code);
    const text = `🔗 ${link.link_name}\nمرحباً ${link.assigned_to_name}، يمكنك الوصول إلى بياناتك عبر:\n${url}`;
    window.open(`https://wa.me/${link.assigned_to_phone || ''}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCreate = async () => {
    if (!profile?.organization_id || !form.link_name || !form.assigned_to_name) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('scoped_access_links').insert({
        organization_id: profile.organization_id,
        created_by: profile.id,
        link_name: form.link_name,
        description: form.description || null,
        assigned_to_name: form.assigned_to_name,
        assigned_to_phone: form.assigned_to_phone || null,
        assigned_to_email: form.assigned_to_email || null,
        access_pin: form.access_pin || null,
        scoped_organization_ids: form.selectedOrgs,
        can_view_shipments: form.can_view_shipments,
        can_create_shipments: form.can_create_shipments,
        can_view_deposits: form.can_view_deposits,
        can_create_deposits: form.can_create_deposits,
        can_view_ledger: form.can_view_ledger,
        can_view_invoices: form.can_view_invoices,
        expires_at: form.expires_at || null,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      } as any);
      if (error) throw error;
      toast.success('✅ تم إنشاء رابط الوصول المحدد بنجاح');
      setShowCreate(false);
      setForm({
        link_name: '', description: '', assigned_to_name: '', assigned_to_phone: '',
        assigned_to_email: '', access_pin: '', selectedOrgs: [],
        can_view_shipments: true, can_create_shipments: false,
        can_view_deposits: true, can_create_deposits: false,
        can_view_ledger: true, can_view_invoices: false,
        expires_at: '', max_uses: '',
      });
      loadLinks();
    } catch (e: any) {
      toast.error('فشل في إنشاء الرابط');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleLink = async (id: string, isActive: boolean) => {
    await supabase.from('scoped_access_links').update({ is_active: !isActive } as any).eq('id', id);
    toast.success(isActive ? 'تم إيقاف الرابط' : 'تم تفعيل الرابط');
    loadLinks();
  };

  const deleteLink = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرابط؟')) return;
    await supabase.from('scoped_access_links').delete().eq('id', id);
    toast.success('تم حذف الرابط');
    loadLinks();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                روابط الوصول المحدد
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                أنشئ روابط خارجية بصلاحيات محددة — شحنات، إيداعات، كشف حساب — بين جهات محددة فقط
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              رابط جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Link2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">لا توجد روابط وصول محدد بعد</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                أنشئ رابطاً مخصصاً لشخص معين ليرى فقط الشحنات والإيداعات وكشف الحساب بين الجهات التي تحددها
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map(link => (
                <div key={link.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{link.link_name}</h4>
                        <Badge variant={link.is_active ? 'default' : 'secondary'} className="text-[10px]">
                          {link.is_active ? 'نشط' : 'معطل'}
                        </Badge>
                        {link.access_pin && <Badge variant="outline" className="text-[10px]">🔒 محمي</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        <Users className="h-3 w-3 inline ml-1" />
                        {link.assigned_to_name}
                        {link.assigned_to_phone && ` — ${link.assigned_to_phone}`}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {link.can_view_shipments && <Badge variant="outline" className="text-[9px]">شحنات</Badge>}
                        {link.can_view_deposits && <Badge variant="outline" className="text-[9px]">إيداعات</Badge>}
                        {link.can_view_ledger && <Badge variant="outline" className="text-[9px]">كشف حساب</Badge>}
                        {link.can_create_shipments && <Badge variant="outline" className="text-[9px] border-green-500">+ شحن</Badge>}
                        {link.can_create_deposits && <Badge variant="outline" className="text-[9px] border-green-500">+ إيداع</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />{link.link_code}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />{link.current_uses} زيارة
                        </span>
                        {link.expires_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ينتهي: {new Date(link.expires_at).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(link.link_code)} title="نسخ">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQrLink(link)} title="QR">
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shareWhatsApp(link)} title="واتساب">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(getLinkUrl(link.link_code), '_blank')} title="معاينة">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleLink(link.id, link.is_active)}>
                        {link.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteLink(link.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء رابط وصول محدد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>اسم الرابط *</Label>
                <Input value={form.link_name} onChange={e => setForm(f => ({ ...f, link_name: e.target.value }))} placeholder="مثال: وصول حمدي للحسابات" />
              </div>
              <div>
                <Label>اسم المستلم *</Label>
                <Input value={form.assigned_to_name} onChange={e => setForm(f => ({ ...f, assigned_to_name: e.target.value }))} placeholder="مثال: حمدي محمد" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>هاتف المستلم</Label>
                <Input value={form.assigned_to_phone} onChange={e => setForm(f => ({ ...f, assigned_to_phone: e.target.value }))} placeholder="01xxxxxxxxx" dir="ltr" />
              </div>
              <div>
                <Label>بريد المستلم</Label>
                <Input value={form.assigned_to_email} onChange={e => setForm(f => ({ ...f, assigned_to_email: e.target.value }))} placeholder="email@example.com" dir="ltr" />
              </div>
            </div>
            <div>
              <Label>وصف الرابط</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف اختياري..." rows={2} />
            </div>
            <div>
              <Label>رمز PIN (اختياري للحماية)</Label>
              <Input value={form.access_pin} onChange={e => setForm(f => ({ ...f, access_pin: e.target.value }))} placeholder="مثال: 1234" dir="ltr" />
            </div>

            <Separator />

            {/* Scoped Organizations */}
            <div>
              <Label className="mb-2 block">الجهات المرتبطة (نطاق البيانات)</Label>
              <p className="text-xs text-muted-foreground mb-2">اختر الجهات التي سيرى المستلم بياناتها معك</p>
              {partners.length === 0 ? (
                <p className="text-xs text-muted-foreground">لا توجد جهات مرتبطة حالياً</p>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {partners.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={form.selectedOrgs.includes(p.id)}
                        onCheckedChange={checked => {
                          setForm(f => ({
                            ...f,
                            selectedOrgs: checked
                              ? [...f.selectedOrgs, p.id]
                              : f.selectedOrgs.filter(id => id !== p.id),
                          }));
                        }}
                      />
                      <span className="text-sm">{p.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Permissions */}
            <div>
              <Label className="mb-2 block">الصلاحيات</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'can_view_shipments', label: 'عرض الشحنات' },
                  { key: 'can_create_shipments', label: 'رفع شحنات' },
                  { key: 'can_view_deposits', label: 'عرض الإيداعات' },
                  { key: 'can_create_deposits', label: 'رفع إيداعات' },
                  { key: 'can_view_ledger', label: 'كشف الحساب' },
                  { key: 'can_view_invoices', label: 'عرض الفواتير' },
                ].map(perm => (
                  <div key={perm.key} className="flex items-center justify-between gap-2 border rounded-lg p-2">
                    <span className="text-sm">{perm.label}</span>
                    <Switch
                      checked={(form as any)[perm.key]}
                      onCheckedChange={checked => setForm(f => ({ ...f, [perm.key]: checked }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ينتهي في</Label>
                <Input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} dir="ltr" />
              </div>
              <div>
                <Label>حد الاستخدامات</Label>
                <Input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="بدون حد" dir="ltr" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={saving || !form.link_name || !form.assigned_to_name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              إنشاء الرابط
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={!!qrLink} onOpenChange={() => setQrLink(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>{qrLink?.link_name}</DialogTitle>
          </DialogHeader>
          {qrLink && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <QRCodeSVG value={getLinkUrl(qrLink.link_code)} size={200} />
              </div>
              <p className="text-xs text-muted-foreground font-mono">{qrLink.link_code}</p>
              <Button variant="outline" size="sm" onClick={() => copyLink(qrLink.link_code)} className="gap-2">
                <Copy className="h-3 w-3" />
                نسخ الرابط
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
