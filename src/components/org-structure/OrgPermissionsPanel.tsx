import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield, ShieldCheck, ShieldAlert, Search, User, Bot, Building2,
  ChevronDown, ChevronUp, Crown, Lock, Unlock, CheckCircle2, XCircle,
  Copy, LayoutDashboard, UserCircle, Loader2, Save, RotateCcw, Filter, Eye,
} from 'lucide-react';
import { useOrgStructure, type Position } from '@/hooks/useOrgStructure';
import { usePositionPermissions } from '@/hooks/useOrgMembers';
import { useOrgMembers, type OrgMember } from '@/hooks/useOrgMembers';
import { MEMBER_ROLE_LABELS, type MemberRole, ALL_MEMBER_PERMISSIONS, PERMISSION_LABELS, PERMISSION_CATEGORIES } from '@/types/memberRoles';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

// تصنيف الصلاحيات: أساسية / مهمة / اختيارية
type PermTier = 'essential' | 'important' | 'optional';

const PERM_TIER_META: Record<PermTier, { label: string; icon: string; color: string; bgClass: string; borderClass: string }> = {
  essential: { label: 'أساسية', icon: '🔴', color: 'text-red-600', bgClass: 'bg-red-500/10', borderClass: 'border-red-300' },
  important: { label: 'مهمة', icon: '🟡', color: 'text-amber-600', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-300' },
  optional: { label: 'اختيارية', icon: '🟢', color: 'text-green-600', bgClass: 'bg-green-500/10', borderClass: 'border-green-300' },
};

interface PermDef {
  key: string;
  label: string;
  tier: PermTier;
  description?: string;
}

const permissionGroups = [
  {
    title: 'الشحنات',
    icon: '📦',
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
    permissions: [
      { key: 'can_create_shipments', label: 'إنشاء شحنات', tier: 'essential' as PermTier, description: 'إنشاء طلبات شحن جديدة' },
      { key: 'can_edit_shipments', label: 'تعديل شحنات', tier: 'important' as PermTier, description: 'تعديل بيانات الشحنات القائمة' },
      { key: 'can_delete_shipments', label: 'حذف شحنات', tier: 'optional' as PermTier, description: 'حذف شحنات من النظام' },
      { key: 'can_approve_shipments', label: 'اعتماد شحنات', tier: 'essential' as PermTier, description: 'الموافقة أو رفض الشحنات' },
      { key: 'can_change_status', label: 'تغيير الحالة', tier: 'important' as PermTier, description: 'تحديث حالة الشحنة' },
    ],
  },
  {
    title: 'المالية',
    icon: '💰',
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    permissions: [
      { key: 'can_view_financials', label: 'عرض البيانات المالية', tier: 'essential' as PermTier, description: 'الاطلاع على التقارير والأرصدة المالية' },
      { key: 'can_create_invoices', label: 'إنشاء فواتير', tier: 'important' as PermTier, description: 'إصدار فواتير جديدة' },
      { key: 'can_approve_payments', label: 'اعتماد مدفوعات', tier: 'essential' as PermTier, description: 'الموافقة على صرف المبالغ' },
      { key: 'can_manage_deposits', label: 'إدارة الإيداعات', tier: 'important' as PermTier, description: 'تسجيل ومتابعة الإيداعات' },
    ],
  },
  {
    title: 'السائقين والمركبات',
    icon: '🚛',
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    permissions: [
      { key: 'can_manage_drivers', label: 'إدارة السائقين', tier: 'important' as PermTier, description: 'إضافة وتعديل بيانات السائقين' },
      { key: 'can_assign_drivers', label: 'تعيين السائقين', tier: 'essential' as PermTier, description: 'تخصيص سائقين للشحنات' },
      { key: 'can_track_vehicles', label: 'تتبع المركبات', tier: 'optional' as PermTier, description: 'مراقبة مواقع المركبات' },
    ],
  },
  {
    title: 'الإدارة',
    icon: '⚙️',
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
    permissions: [
      { key: 'can_manage_users', label: 'إدارة المستخدمين', tier: 'essential' as PermTier, description: 'إضافة وتعديل حسابات الموظفين' },
      { key: 'can_manage_settings', label: 'إدارة الإعدادات', tier: 'essential' as PermTier, description: 'ضبط إعدادات النظام العامة' },
      { key: 'can_view_reports', label: 'عرض التقارير', tier: 'important' as PermTier, description: 'الاطلاع على تقارير الأداء' },
      { key: 'can_export_data', label: 'تصدير البيانات', tier: 'optional' as PermTier, description: 'تنزيل البيانات بصيغ مختلفة' },
      { key: 'can_manage_contracts', label: 'إدارة العقود', tier: 'optional' as PermTier, description: 'إنشاء وتعديل العقود' },
    ],
  },
  {
    title: 'الشركاء والمستندات',
    icon: '📋',
    color: 'text-teal-600',
    bg: 'bg-teal-500/10',
    permissions: [
      { key: 'can_manage_partners', label: 'إدارة الجهات المرتبطة', tier: 'important' as PermTier, description: 'إدارة بيانات الشركاء والجهات' },
      { key: 'can_view_partner_data', label: 'عرض بيانات الشركاء', tier: 'optional' as PermTier, description: 'الاطلاع على معلومات الشركاء' },
      { key: 'can_sign_documents', label: 'توقيع المستندات', tier: 'essential' as PermTier, description: 'التوقيع الإلكتروني على الوثائق' },
      { key: 'can_issue_certificates', label: 'إصدار شهادات', tier: 'important' as PermTier, description: 'إنشاء شهادات رسمية' },
      { key: 'can_manage_templates', label: 'إدارة القوالب', tier: 'optional' as PermTier, description: 'تخصيص وإدارة قوالب المستندات' },
    ],
  },
];

// فلتر حسب التصنيف
type TierFilter = 'all' | PermTier;

const allPermKeys = permissionGroups.flatMap(g => g.permissions.map(p => p.key));

// Individual Position Permission Editor (inline)
function PositionPermEditor({ position }: { position: Position }) {
  const { permissions, isLoading, updatePermissions } = usePositionPermissions(position.id);
  const [localPerms, setLocalPerms] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const initPerms = () => {
    const perms: Record<string, boolean> = {};
    allPermKeys.forEach(key => {
      perms[key] = (permissions as any)?.[key] || false;
    });
    setLocalPerms(perms);
    setHasChanges(false);
  };

  // Re-init when permissions load
  const [initialized, setInitialized] = useState(false);
  if (permissions && !initialized) {
    initPerms();
    setInitialized(true);
  }

  const [tierFilter, setTierFilter] = useState<TierFilter>('all');

  const togglePerm = (key: string) => {
    setLocalPerms(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const toggleGroup = (group: typeof permissionGroups[0], value: boolean) => {
    const updates: Record<string, boolean> = {};
    group.permissions.forEach(p => { updates[p.key] = value; });
    setLocalPerms(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const enabledCount = Object.values(localPerms).filter(Boolean).length;
  const totalCount = allPermKeys.length;

  const handleSave = () => {
    updatePermissions.mutate(localPerms as any, {
      onSuccess: () => {
        setHasChanges(false);
        toast.success(`تم حفظ صلاحيات "${position.title_ar}"`);
      },
    });
  };

  const grantAll = () => {
    const all: Record<string, boolean> = {};
    allPermKeys.forEach(k => { all[k] = true; });
    setLocalPerms(all);
    setHasChanges(true);
  };

  const revokeAll = () => {
    const none: Record<string, boolean> = {};
    allPermKeys.forEach(k => { none[k] = false; });
    setLocalPerms(none);
    setHasChanges(true);
  };

  const isAI = position.operator_type === 'ai';
  const dashboardLabel = position.dashboard_mode === 'management' ? 'إدارة' : 'عضو';

  return (
    <Card className={`transition-all ${expanded ? 'ring-1 ring-primary/30 shadow-md' : 'hover:shadow-sm'}`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <div className="flex gap-1.5 items-center flex-wrap">
            <Badge variant={position.dashboard_mode === 'management' ? 'default' : 'secondary'} className="text-[10px]">
              {position.dashboard_mode === 'management' ? <LayoutDashboard className="w-3 h-3 ml-0.5" /> : <UserCircle className="w-3 h-3 ml-0.5" />}
              {dashboardLabel}
            </Badge>
            {isAI && <Badge className="bg-primary/20 text-primary text-[10px]">🤖 AI</Badge>}
            <Badge variant="outline" className={`text-[10px] ${enabledCount > 0 ? 'text-green-600 border-green-300' : 'text-muted-foreground'}`}>
              {enabledCount}/{totalCount} صلاحية
            </Badge>
            {hasChanges && <Badge className="bg-amber-500/20 text-amber-600 text-[10px] animate-pulse">تغييرات غير محفوظة</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold">{position.title_ar}</p>
            <p className="text-[10px] text-muted-foreground">{position.holder_name || 'شاغر'}</p>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAI ? 'bg-primary/10' : 'bg-muted'}`}>
            {isAI ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="border-t pt-4 pb-3 space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : (
                <>
                  {/* Quick actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={grantAll} className="text-xs h-7">
                      <Unlock className="w-3 h-3 ml-1" /> منح الكل
                    </Button>
                    <Button size="sm" variant="outline" onClick={revokeAll} className="text-xs h-7">
                      <Lock className="w-3 h-3 ml-1" /> سحب الكل
                    </Button>
                    {hasChanges && (
                      <>
                        <Button size="sm" variant="outline" onClick={initPerms} className="text-xs h-7">
                          <RotateCcw className="w-3 h-3 ml-1" /> تراجع
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={updatePermissions.isPending} className="text-xs h-7">
                          {updatePermissions.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Save className="w-3 h-3 ml-1" />}
                          حفظ
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Tier filter */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground font-medium">تصفية حسب الأهمية:</span>
                    <Button size="sm" variant={tierFilter === 'all' ? 'default' : 'outline'} onClick={() => setTierFilter('all')} className="text-[10px] h-6 px-2">
                      الكل
                    </Button>
                    {(['essential', 'important', 'optional'] as PermTier[]).map(t => (
                      <Button
                        key={t}
                        size="sm"
                        variant={tierFilter === t ? 'default' : 'outline'}
                        onClick={() => setTierFilter(t)}
                        className="text-[10px] h-6 px-2"
                      >
                        {PERM_TIER_META[t].icon} {PERM_TIER_META[t].label}
                      </Button>
                    ))}
                  </div>

                  {/* Permission groups */}
                  <div className="space-y-3">
                    {permissionGroups.map(group => {
                      const filteredPerms = tierFilter === 'all'
                        ? group.permissions
                        : group.permissions.filter(p => p.tier === tierFilter);

                      if (filteredPerms.length === 0) return null;

                      const allOn = filteredPerms.every(p => localPerms[p.key]);
                      const groupCount = filteredPerms.filter(p => localPerms[p.key]).length;

                      return (
                        <div key={group.title} className={`rounded-lg border p-3 ${group.bg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] px-2"
                                onClick={() => toggleGroup(group, !allOn)}
                              >
                                {allOn ? <XCircle className="w-3 h-3 ml-1" /> : <CheckCircle2 className="w-3 h-3 ml-1" />}
                                {allOn ? 'إلغاء' : 'تحديد الكل'}
                              </Button>
                              <Badge variant="outline" className="text-[10px]">{groupCount}/{filteredPerms.length}</Badge>
                            </div>
                            <h4 className={`font-semibold text-sm flex items-center gap-1.5 ${group.color}`}>
                              <span>{group.icon}</span>
                              {group.title}
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {filteredPerms.map(perm => {
                              const tierMeta = PERM_TIER_META[perm.tier];
                              return (
                                <div
                                  key={perm.key}
                                  className={`flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer border ${
                                    localPerms[perm.key]
                                      ? `bg-background/80 shadow-sm ${tierMeta.borderClass}`
                                      : 'border-transparent hover:bg-background/50'
                                  }`}
                                  onClick={() => togglePerm(perm.key)}
                                  title={perm.description}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Switch
                                      checked={localPerms[perm.key] || false}
                                      onCheckedChange={() => togglePerm(perm.key)}
                                      className="scale-75"
                                    />
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${tierMeta.bgClass} ${tierMeta.color}`}>
                                      {tierMeta.label}
                                    </span>
                                  </div>
                                  <span className="text-xs font-medium">{perm.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// Member Permission Editor
function MemberPermEditor({ member, onUpdate }: { member: OrgMember; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [localPerms, setLocalPerms] = useState<string[]>(member.granted_permissions || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dashboardMode, setDashboardMode] = useState<'management' | 'workspace'>('workspace');
  const queryClient = useQueryClient();

  const roleLabel = MEMBER_ROLE_LABELS[member.member_role as MemberRole] || MEMBER_ROLE_LABELS.member;

  const togglePerm = (perm: string) => {
    setLocalPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organization_members' as any)
        .update({ granted_permissions: localPerms } as any)
        .eq('id', member.id);
      if (error) throw error;

      // Update dashboard mode on position if linked
      if (member.position_id) {
        await supabase
          .from('organization_positions')
          .update({ dashboard_mode: dashboardMode } as any)
          .eq('id', member.position_id);
      }

      toast.success('تم تحديث صلاحيات العضو');
      setHasChanges(false);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'خطأ في التحديث');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={`transition-all ${expanded ? 'ring-1 ring-primary/30 shadow-md' : 'hover:shadow-sm'}`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <Badge className={`text-[10px] ${
            member.member_role === 'entity_head' ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground'
          }`}>
            {roleLabel.icon} {roleLabel.ar}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {localPerms.length} صلاحية
          </Badge>
          {hasChanges && <Badge className="bg-amber-500/20 text-amber-600 text-[10px] animate-pulse">غير محفوظ</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold">{member.profile?.full_name || member.invitation_email}</p>
            <p className="text-[10px] text-muted-foreground">{member.job_title_ar || member.position?.title_ar || '—'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            {member.member_role === 'entity_head' ? <Crown className="w-4 h-4 text-amber-500" /> : <User className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="border-t pt-4 pb-3 space-y-4">
              {/* Dashboard mode toggle */}
              {member.position_id && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={dashboardMode === 'management' ? 'default' : 'outline'}
                      onClick={() => { setDashboardMode('management'); setHasChanges(true); }}
                      className="text-xs h-7"
                    >
                      <LayoutDashboard className="w-3 h-3 ml-1" /> إدارة
                    </Button>
                    <Button
                      size="sm"
                      variant={dashboardMode === 'workspace' ? 'default' : 'outline'}
                      onClick={() => { setDashboardMode('workspace'); setHasChanges(true); }}
                      className="text-xs h-7"
                    >
                      <UserCircle className="w-3 h-3 ml-1" /> عضو
                    </Button>
                  </div>
                  <span className="text-xs font-medium">نوع الحساب</span>
                </div>
              )}

              {/* Member permissions by category */}
              {Object.entries(PERMISSION_CATEGORIES).map(([catKey, catLabel]) => {
                const catPerms = ALL_MEMBER_PERMISSIONS.filter(p => PERMISSION_LABELS[p]?.category === catKey);
                if (catPerms.length === 0) return null;
                return (
                  <div key={catKey}>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">{catLabel}</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {catPerms.map(perm => {
                        const tier = MEMBER_PERM_TIERS[perm] || 'optional';
                        const tierMeta = PERM_TIER_META[tier];
                        return (
                          <div
                            key={perm}
                            className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors border ${
                              localPerms.includes(perm) ? `bg-primary/5 shadow-sm ${tierMeta.borderClass}` : 'border-transparent hover:bg-muted/50'
                            }`}
                            onClick={() => togglePerm(perm)}
                          >
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={localPerms.includes(perm)}
                                onCheckedChange={() => togglePerm(perm)}
                                className="scale-75"
                              />
                              <span className={`text-[8px] px-1 py-0.5 rounded-full ${tierMeta.bgClass} ${tierMeta.color}`}>
                                {tierMeta.label}
                              </span>
                            </div>
                            <span className="text-xs">{PERMISSION_LABELS[perm].ar}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {hasChanges && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setLocalPerms(member.granted_permissions || []); setHasChanges(false); }}
                    className="flex-1"
                  >
                    <RotateCcw className="w-3 h-3 ml-1" /> تراجع
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Save className="w-3 h-3 ml-1" />}
                    حفظ الصلاحيات
                  </Button>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// Main Panel
export default function OrgPermissionsPanel() {
  const { positions, departments } = useOrgStructure();
  const { members, refetch } = useOrgMembers();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'positions' | 'members'>('positions');

  const activePositions = positions.filter(p => {
    if (deptFilter !== 'all' && p.department_id !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title_ar.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.holder_name?.toLowerCase().includes(q);
    }
    return true;
  });

  const activeMembers = members.filter(m => {
    if (m.status !== 'active') return false;
    if (deptFilter !== 'all' && m.department_id !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.profile?.full_name?.toLowerCase().includes(q) ||
        m.profile?.email?.toLowerCase().includes(q) ||
        m.job_title_ar?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Stats
  const totalPermsGranted = positions.length; // simplified
  const managementCount = positions.filter(p => p.dashboard_mode === 'management').length;
  const workspaceCount = positions.filter(p => p.dashboard_mode === 'workspace').length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Shield className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{positions.length}</p>
            <p className="text-[10px] text-muted-foreground">منصب وظيفي</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <LayoutDashboard className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold">{managementCount}</p>
            <p className="text-[10px] text-muted-foreground">حساب إدارة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <UserCircle className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-lg font-bold">{workspaceCount}</p>
            <p className="text-[10px] text-muted-foreground">حساب عضو</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <ShieldCheck className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold">{activeMembers.length}</p>
            <p className="text-[10px] text-muted-foreground">عضو نشط</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالمنصب أو الاسم..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 text-right"
          />
        </div>
        {departments.length > 0 && (
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <Building2 className="w-3 h-3 ml-1" />
              <SelectValue placeholder="القسم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأقسام</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name_ar}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tabs: By Position / By Member */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} dir="rtl">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="positions" className="text-xs gap-1">
            <Shield className="w-3.5 h-3.5" /> حسب المنصب ({activePositions.length})
          </TabsTrigger>
          <TabsTrigger value="members" className="text-xs gap-1">
            <User className="w-3.5 h-3.5" /> حسب العضو ({activeMembers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="mt-3 space-y-2">
          {activePositions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">لا يوجد مناصب {search ? 'مطابقة' : 'بعد'}</p>
              </CardContent>
            </Card>
          ) : (
            activePositions
              .sort((a, b) => b.level - a.level || a.sort_order - b.sort_order)
              .map(pos => <PositionPermEditor key={pos.id} position={pos} />)
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-3 space-y-2">
          {activeMembers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">لا يوجد أعضاء {search ? 'مطابقون' : 'بعد'}</p>
              </CardContent>
            </Card>
          ) : (
            activeMembers.map(m => <MemberPermEditor key={m.id} member={m} onUpdate={refetch} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
