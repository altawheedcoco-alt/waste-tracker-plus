import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSafetyPartnerPermissions, useSafetyExternalLinks, useMyPartnerSafetyAccess } from '@/hooks/useSafetyPartnerPermissions';
import { useLinkedPartners } from '@/hooks/useLinkedPartners';
import { useAuth } from '@/contexts/AuthContext';
import { Settings2, Shield, Link2, Users, Eye, EyeOff, Plus, X, Copy, Loader2, ExternalLink, Lock, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SAFETY_MODULES = [
  { key: 'can_view_hazards', label: 'رؤية سجل المخاطر', icon: '⚠️' },
  { key: 'can_report_hazards', label: 'الإبلاغ عن مخاطر', icon: '📢' },
  { key: 'can_view_inspections', label: 'رؤية التفتيشات', icon: '🔍' },
  { key: 'can_request_inspection', label: 'طلب تفتيش', icon: '📋' },
  { key: 'can_view_ppe', label: 'رؤية معدات الوقاية', icon: '⛑️' },
  { key: 'can_view_jsa', label: 'رؤية تحليلات JSA', icon: '📊' },
  { key: 'can_view_toolbox_talks', label: 'رؤية Toolbox Talks', icon: '💬' },
  { key: 'can_attend_toolbox_talks', label: 'حضور Toolbox Talks', icon: '🤝' },
  { key: 'can_view_certificates', label: 'رؤية الشهادات', icon: '🏆' },
  { key: 'can_receive_certificates', label: 'استلام شهادات', icon: '📜' },
  { key: 'can_view_incidents', label: 'رؤية سجل الحوادث', icon: '🚨' },
  { key: 'can_report_incidents', label: 'الإبلاغ عن حوادث', icon: '🆘' },
  { key: 'can_view_emergency_plans', label: 'رؤية خطط الطوارئ', icon: '🚒' },
  { key: 'can_view_safety_team', label: 'رؤية فريق السلامة', icon: '👷' },
];

const LINK_MODULES = [
  { id: 'hazards', label: 'سجل المخاطر' },
  { id: 'inspections', label: 'التفتيشات' },
  { id: 'ppe', label: 'معدات الوقاية' },
  { id: 'jsa', label: 'تحليلات JSA' },
  { id: 'toolbox_talks', label: 'Toolbox Talks' },
  { id: 'certificates', label: 'الشهادات' },
  { id: 'incidents', label: 'الحوادث' },
  { id: 'emergency_plans', label: 'خطط الطوارئ' },
  { id: 'safety_team', label: 'فريق السلامة' },
];

const SafetyPartnerPermissionsPanel = memo(() => {
  const { organization } = useAuth();
  const { data: partners, isLoading: partnersLoading } = useLinkedPartners();
  const { permissions, upsert, getPermissionsForPartner } = useSafetyPartnerPermissions();
  const { data: myAccess } = useMyPartnerSafetyAccess();
  const { links, create: createLink, toggle: toggleLink } = useSafetyExternalLinks();
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkForm, setLinkForm] = useState<Record<string, any>>({ allowed_modules: [] });

  const handleTogglePermission = (partnerOrgId: string, key: string, value: boolean) => {
    const existing = getPermissionsForPartner(partnerOrgId);
    upsert.mutate({
      partner_organization_id: partnerOrgId,
      ...(existing || {}),
      [key]: value,
    });
  };

  const handleCreateLink = () => {
    if (!linkForm.link_name || linkForm.allowed_modules.length === 0) return;
    createLink.mutate({
      link_name: linkForm.link_name,
      pin_code: linkForm.pin_code || null,
      allowed_modules: linkForm.allowed_modules,
      expires_at: linkForm.expires_at || null,
    }, {
      onSuccess: () => { setShowLinkForm(false); setLinkForm({ allowed_modules: [] }); },
    });
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/safety-access/${code}`);
    toast.success('تم نسخ الرابط');
  };

  const toggleModule = (moduleId: string) => {
    setLinkForm(prev => ({
      ...prev,
      allowed_modules: prev.allowed_modules.includes(moduleId)
        ? prev.allowed_modules.filter((m: string) => m !== moduleId)
        : [...prev.allowed_modules, moduleId],
    }));
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Settings2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">صلاحيات السيفتي بين الجهات</h3>
      </div>

      <Tabs defaultValue="partners" dir="rtl">
        <TabsList>
          <TabsTrigger value="partners" className="gap-1.5">
            <Shield className="w-4 h-4" />
            الجهات المرتبطة
          </TabsTrigger>
          <TabsTrigger value="my-access" className="gap-1.5">
            <Eye className="w-4 h-4" />
            صلاحياتي لدى الآخرين
          </TabsTrigger>
          <TabsTrigger value="external" className="gap-1.5">
            <Link2 className="w-4 h-4" />
            روابط خارجية
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Partner Permissions */}
        <TabsContent value="partners" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">تحكم في ما يمكن لكل جهة مرتبطة رؤيته أو فعله في بيانات السيفتي الخاصة بك</p>

          {partners?.map((partner) => {
            const perms = getPermissionsForPartner(partner.id);
            const isExpanded = selectedPartner === partner.id;
            const enabledCount = perms ? SAFETY_MODULES.filter(m => (perms as any)?.[m.key]).length : 0;

            return (
              <Card key={partner.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedPartner(isExpanded ? null : partner.id)}>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{partner.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {partner.organization_type === 'generator' ? 'مولد' : partner.organization_type === 'transporter' ? 'ناقل' : partner.organization_type === 'recycler' ? 'مدور' : partner.organization_type === 'disposal' ? 'تخلص نهائي' : partner.organization_type}
                        {' • '}{partner.city || ''}
                      </p>
                    </div>
                    <Badge variant={enabledCount > 0 ? 'default' : 'secondary'} className="text-[10px]">
                      {enabledCount}/{SAFETY_MODULES.length} صلاحية
                    </Badge>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg bg-muted/30">
                          {SAFETY_MODULES.map(mod => (
                            <div key={mod.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-background transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{mod.icon}</span>
                                <span className="text-xs">{mod.label}</span>
                              </div>
                              <Switch
                                checked={(perms as any)?.[mod.key] ?? false}
                                onCheckedChange={v => handleTogglePermission(partner.id, mod.key, v)}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end mt-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const allOn: any = { partner_organization_id: partner.id };
                              SAFETY_MODULES.forEach(m => { allOn[m.key] = true; });
                              upsert.mutate(allOn);
                            }}
                            className="text-xs gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            تفعيل الكل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const allOff: any = { partner_organization_id: partner.id };
                              SAFETY_MODULES.forEach(m => { allOff[m.key] = false; });
                              upsert.mutate(allOff);
                            }}
                            className="text-xs gap-1"
                          >
                            <EyeOff className="w-3 h-3" />
                            إيقاف الكل
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            );
          })}

          {!partnersLoading && (!partners || partners.length === 0) && (
            <div className="text-center py-8 text-muted-foreground text-sm">لا توجد جهات مرتبطة — اربط جهات أولاً لتتمكن من ضبط صلاحيات السيفتي</div>
          )}
        </TabsContent>

        {/* Tab 2: My Access to Others */}
        <TabsContent value="my-access" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">الصلاحيات التي منحتك إياها الجهات الأخرى في بيانات السيفتي الخاصة بهم</p>

          {myAccess?.map((access: any) => {
            const enabledModules = SAFETY_MODULES.filter(m => access[m.key]);
            return (
              <Card key={access.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">جهة: {access.organization_id?.slice(0, 8)}...</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {enabledModules.map(m => (
                          <Badge key={m.key} variant="outline" className="text-[8px]">{m.icon} {m.label}</Badge>
                        ))}
                      </div>
                    </div>
                    <Badge variant="default" className="text-[10px]">{enabledModules.length} صلاحية</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {(!myAccess || myAccess.length === 0) && (
            <div className="text-center py-8 text-muted-foreground text-sm">لم يتم منحك صلاحيات سيفتي من أي جهة بعد</div>
          )}
        </TabsContent>

        {/* Tab 3: External Safety Links */}
        <TabsContent value="external" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">روابط خارجية لمشاركة بيانات السيفتي مع جهات غير مسجلة</p>
            <Button size="sm" className="gap-1.5" onClick={() => setShowLinkForm(!showLinkForm)}>
              {showLinkForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showLinkForm ? 'إلغاء' : 'رابط جديد'}
            </Button>
          </div>

          <AnimatePresence>
            {showLinkForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <Card className="border-primary/20">
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><Label>اسم الرابط *</Label><Input value={linkForm.link_name || ''} onChange={e => setLinkForm(p => ({ ...p, link_name: e.target.value }))} placeholder="مثال: رابط سيفتي للمقاول" /></div>
                      <div><Label>رمز PIN (اختياري)</Label><Input value={linkForm.pin_code || ''} onChange={e => setLinkForm(p => ({ ...p, pin_code: e.target.value }))} placeholder="4-6 أرقام" /></div>
                    </div>

                    <div><Label>تاريخ الانتهاء (اختياري)</Label><Input type="datetime-local" value={linkForm.expires_at || ''} onChange={e => setLinkForm(p => ({ ...p, expires_at: e.target.value }))} className="w-64" /></div>

                    <div>
                      <Label className="font-bold">الأقسام المتاحة *</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {LINK_MODULES.map(mod => (
                          <button
                            key={mod.id}
                            onClick={() => toggleModule(mod.id)}
                            className={`p-2 rounded-lg text-xs border transition-colors ${linkForm.allowed_modules.includes(mod.id) ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border'}`}
                          >
                            {mod.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowLinkForm(false)}>إلغاء</Button>
                      <Button onClick={handleCreateLink} disabled={createLink.isPending} className="gap-1.5">
                        {createLink.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                        إنشاء الرابط
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Links List */}
          <div className="space-y-2">
            {links.map((link: any) => (
              <Card key={link.id} className={`hover:shadow-sm transition-shadow ${!link.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${link.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                    {link.pin_code ? <Lock className="w-5 h-5 text-primary" /> : <Globe className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{link.link_name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-mono">{link.link_code}</span>
                      <span>• {link.access_count || 0} زيارة</span>
                      {link.pin_code && <span>• محمي بـ PIN</span>}
                      {link.allowed_modules?.length > 0 && <span>• {link.allowed_modules.length} قسم</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(link.link_code)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Switch checked={link.is_active} onCheckedChange={v => toggleLink.mutate({ id: link.id, is_active: v })} />
                  </div>
                </CardContent>
              </Card>
            ))}
            {links.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">لم يتم إنشاء روابط سيفتي خارجية بعد</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

SafetyPartnerPermissionsPanel.displayName = 'SafetyPartnerPermissionsPanel';
export default SafetyPartnerPermissionsPanel;
