import { useState, useMemo } from 'react';
import { useOrgMembers, OrgMember } from '@/hooks/useOrgMembers';
import { useOrgStructure } from '@/hooks/useOrgStructure';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  UserPlus, User, Mail, Phone, Building2, Briefcase, Shield,
  MoreVertical, UserX, Edit, Eye, Loader2, Search, Hash, Crown, Key, Filter,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PositionPermissionsEditor from './PositionPermissionsEditor';
import MemberProfileSheet from './MemberProfileSheet';
import MemberCredentialsDialog from './MemberCredentialsDialog';
import MyCredentialsCard from './MyCredentialsCard';
import {
  MEMBER_ROLE_LABELS, MEMBER_ROLE_LEVELS,
  ALL_MEMBER_PERMISSIONS, PERMISSION_LABELS, PERMISSION_CATEGORIES,
  getAssignableRoles,
  type MemberRole, type MemberPermission,
} from '@/types/memberRoles';

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'نشط', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  suspended: { label: 'موقوف', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  terminated: { label: 'منتهي', color: 'bg-muted text-muted-foreground' },
  on_leave: { label: 'إجازة', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  pending_invitation: { label: 'دعوة معلقة', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
};

const roleColorMap: Record<MemberRole, string> = {
  entity_head: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  assistant: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  deputy_assistant: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  agent: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  delegate: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  member: 'bg-muted text-muted-foreground',
};

export default function OrgMembersPanel() {
  const { members, isLoading, currentUserMember, registerMember, updateMember, removeMember } = useOrgMembers();
  const { departments, positions } = useOrgStructure();
  const { organization } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
  const [editPermsId, setEditPermsId] = useState<string | null>(null);
  const [dialogTab, setDialogTab] = useState<'info' | 'permissions'>('info');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [confirmAction, setConfirmAction] = useState<{ type: 'suspend' | 'activate' | 'terminate'; member: OrgMember } | null>(null);

  const [form, setForm] = useState({
    email: '', password: '', fullName: '', phone: '',
    memberRole: 'member' as MemberRole,
    jobTitleAr: '', departmentId: '', positionId: '',
    grantedPermissions: [] as MemberPermission[],
  });

  const myRole = currentUserMember?.member_role as MemberRole || 'member';
  const assignableRoles = getAssignableRoles(myRole);
  const myPermissions = currentUserMember?.granted_permissions || [];
  const isEntityHead = myRole === 'entity_head';

  const grantablePermissions = isEntityHead
    ? [...ALL_MEMBER_PERMISSIONS]
    : ALL_MEMBER_PERMISSIONS.filter(p => myPermissions.includes(p));

  const handleRegister = () => {
    if (!form.email || !form.password || !form.fullName || !form.phone) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (form.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    registerMember.mutate({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      phone: form.phone,
      memberRole: form.memberRole,
      jobTitleAr: form.jobTitleAr || undefined,
      departmentId: form.departmentId || undefined,
      positionId: form.positionId || undefined,
      grantedPermissions: form.grantedPermissions.length > 0 ? form.grantedPermissions : undefined,
    }, {
      onSuccess: () => {
        setAddOpen(false);
        setForm({ email: '', password: '', fullName: '', phone: '', memberRole: 'member', jobTitleAr: '', departmentId: '', positionId: '', grantedPermissions: [] });
        setDialogTab('info');
      },
    });
  };

  const togglePermission = (perm: MemberPermission) => {
    setForm(prev => ({
      ...prev,
      grantedPermissions: prev.grantedPermissions.includes(perm)
        ? prev.grantedPermissions.filter(p => p !== perm)
        : [...prev.grantedPermissions, perm],
    }));
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const { type, member } = confirmAction;
    if (type === 'terminate') {
      removeMember.mutate(member.id);
    } else {
      updateMember.mutate({ id: member.id, status: type === 'suspend' ? 'suspended' : 'active' });
    }
    setConfirmAction(null);
  };

  const activeMembers = members.filter(m => m.status !== 'terminated');
  
  const filtered = useMemo(() => {
    return activeMembers.filter(m => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (deptFilter !== 'all' && m.department_id !== deptFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.profile?.full_name?.toLowerCase().includes(q) ||
          m.profile?.email?.toLowerCase().includes(q) ||
          m.invitation_email?.toLowerCase().includes(q) ||
          m.job_title_ar?.toLowerCase().includes(q) ||
          m.employee_number?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeMembers, search, statusFilter, deptFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const levelA = MEMBER_ROLE_LEVELS[a.member_role as MemberRole] || 6;
      const levelB = MEMBER_ROLE_LEVELS[b.member_role as MemberRole] || 6;
      return levelA - levelB;
    });
  }, [filtered]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const canManage = isEntityHead || currentUserMember?.can_manage_members;
  const usedDepts = [...new Set(activeMembers.map(m => m.department_id).filter(Boolean))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو البريد أو الرقم..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 text-right" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <Filter className="w-3 h-3 ml-1" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {Object.entries(statusConfig).filter(([k]) => k !== 'terminated').map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {usedDepts.length > 0 && (
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <Building2 className="w-3 h-3 ml-1" />
                <SelectValue placeholder="القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأقسام</SelectItem>
                {departments.filter(d => usedDepts.includes(d.id)).map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name_ar}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Badge variant="secondary">{filtered.length} / {activeMembers.length} عضو</Badge>
        </div>
        {canManage && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><UserPlus className="w-4 h-4 ml-1" /> تسجيل عضو جديد</Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-primary" /> تسجيل عضو جديد بحساب مستقل</DialogTitle></DialogHeader>

              <Tabs value={dialogTab} onValueChange={v => setDialogTab(v as any)} className="mt-2">
                <TabsList className="w-full">
                  <TabsTrigger value="info" className="flex-1">البيانات الأساسية</TabsTrigger>
                  <TabsTrigger value="permissions" className="flex-1">الصلاحيات</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-3 mt-3">
                  <div>
                    <Label>الاسم الكامل *</Label>
                    <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="أحمد محمد علي" className="text-right" />
                  </div>
                  <div>
                    <Label>البريد الإلكتروني *</Label>
                    <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="member@example.com" type="email" dir="ltr" />
                  </div>
                  <div>
                    <Label>كلمة المرور *</Label>
                    <Input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="6 أحرف على الأقل" type="password" dir="ltr" />
                  </div>
                  <div>
                    <Label>رقم الجوال *</Label>
                    <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+966..." dir="ltr" />
                  </div>
                  <div>
                    <Label>الدور الهرمي *</Label>
                    <Select value={form.memberRole} onValueChange={v => setForm(p => ({ ...p, memberRole: v as MemberRole }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map(role => (
                          <SelectItem key={role} value={role}>
                            {MEMBER_ROLE_LABELS[role].icon} {MEMBER_ROLE_LABELS[role].ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>المسمى الوظيفي</Label>
                    <Input value={form.jobTitleAr} onChange={e => setForm(p => ({ ...p, jobTitleAr: e.target.value }))} placeholder="مثال: محاسب، مراجع بيئي..." className="text-right" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>القسم</Label>
                      <Select value={form.departmentId} onValueChange={v => setForm(p => ({ ...p, departmentId: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                        <SelectContent>
                          {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name_ar}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>المنصب</Label>
                      <Select value={form.positionId} onValueChange={v => setForm(p => ({ ...p, positionId: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                        <SelectContent>
                          {positions
                            .filter(p => !form.departmentId || p.department_id === form.departmentId)
                            .map(p => <SelectItem key={p.id} value={p.id}>{p.title_ar}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={() => setDialogTab('permissions')} variant="outline" className="w-full">
                    <Key className="w-4 h-4 ml-1" /> التالي: تحديد الصلاحيات
                  </Button>
                </TabsContent>

                <TabsContent value="permissions" className="space-y-3 mt-3">
                  <p className="text-xs text-muted-foreground">
                    حدد الصلاحيات التي سيتمتع بها هذا العضو. يمكنك فقط منح صلاحيات تملكها أنت.
                  </p>
                  {Object.entries(PERMISSION_CATEGORIES).map(([catKey, catLabel]) => {
                    const catPerms = grantablePermissions.filter(p => PERMISSION_LABELS[p]?.category === catKey);
                    if (catPerms.length === 0) return null;
                    return (
                      <div key={catKey} className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-muted-foreground">{catLabel}</h4>
                        <div className="grid grid-cols-2 gap-1">
                          {catPerms.map(perm => (
                            <label key={perm} className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                              <Checkbox
                                checked={form.grantedPermissions.includes(perm)}
                                onCheckedChange={() => togglePermission(perm)}
                              />
                              <span>{PERMISSION_LABELS[perm].ar}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => setDialogTab('info')} variant="outline" className="flex-1">السابق</Button>
                    <Button onClick={handleRegister} disabled={registerMember.isPending} className="flex-1">
                      {registerMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تسجيل العضو'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {sorted.map(member => {
          const sc = statusConfig[member.status] || statusConfig.active;
          const roleLabel = MEMBER_ROLE_LABELS[member.member_role as MemberRole] || MEMBER_ROLE_LABELS.member;
          const roleColor = roleColorMap[member.member_role as MemberRole] || roleColorMap.member;

          return (
            <Card key={member.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setSelectedMember(member)}>
                          <Eye className="w-4 h-4 ml-2" /> عرض الملف
                        </DropdownMenuItem>
                        {member.position_id && (
                          <DropdownMenuItem onClick={() => setEditPermsId(member.position_id!)}>
                            <Shield className="w-4 h-4 ml-2" /> الصلاحيات
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setConfirmAction({
                          type: member.status === 'suspended' ? 'activate' : 'suspend',
                          member,
                        })}>
                          <Edit className="w-4 h-4 ml-2" /> {member.status === 'suspended' ? 'إعادة تفعيل' : 'إيقاف مؤقت'}
                        </DropdownMenuItem>
                        {member.member_role !== 'entity_head' && (
                          <DropdownMenuItem className="text-destructive" onClick={() => setConfirmAction({ type: 'terminate', member })}>
                            <UserX className="w-4 h-4 ml-2" /> إنهاء العضوية
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="text-right flex-1">
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <Badge className={sc.color} variant="secondary">{sc.label}</Badge>
                        <Badge className={roleColor} variant="secondary">
                          {roleLabel.icon} {roleLabel.ar}
                        </Badge>
                        <p className="font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedMember(member)}>
                          {member.profile?.full_name || member.invitation_email || 'عضو'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 justify-end flex-wrap">
                        {member.job_title_ar && (
                          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{member.job_title_ar}</span>
                        )}
                        {member.department?.name_ar && (
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{member.department.name_ar}</span>
                        )}
                        {member.employee_number && (
                          <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{member.employee_number}</span>
                        )}
                        {(member.profile?.email || member.invitation_email) && (
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{member.profile?.email || member.invitation_email}</span>
                        )}
                        {member.granted_permissions?.length > 0 && (
                          <span className="flex items-center gap-1"><Key className="w-3 h-3" />{member.granted_permissions.length} صلاحية</span>
                        )}
                      </div>
                    </div>
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {member.member_role === 'entity_head' ? <Crown className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">لا يوجد أعضاء {search ? 'مطابقون للبحث' : 'بعد'}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'terminate' ? 'تأكيد إنهاء العضوية' :
               confirmAction?.type === 'suspend' ? 'تأكيد الإيقاف المؤقت' : 'تأكيد إعادة التفعيل'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'terminate'
                ? `هل أنت متأكد من إنهاء عضوية "${confirmAction?.member.profile?.full_name || confirmAction?.member.invitation_email}"؟ هذا الإجراء لا يمكن التراجع عنه.`
                : confirmAction?.type === 'suspend'
                ? `سيتم إيقاف "${confirmAction?.member.profile?.full_name || confirmAction?.member.invitation_email}" مؤقتاً ولن يتمكن من الوصول للنظام.`
                : `سيتم إعادة تفعيل "${confirmAction?.member.profile?.full_name || confirmAction?.member.invitation_email}" وسيستعيد صلاحياته.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmAction?.type === 'terminate' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {confirmAction?.type === 'terminate' ? 'إنهاء العضوية' :
               confirmAction?.type === 'suspend' ? 'إيقاف مؤقت' : 'إعادة التفعيل'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Sheet */}
      {selectedMember && (
        <MemberProfileSheet
          member={selectedMember}
          open={!!selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* Permissions Editor */}
      {editPermsId && (
        <PositionPermissionsEditor
          positionId={editPermsId}
          open={!!editPermsId}
          onClose={() => setEditPermsId(null)}
        />
      )}
    </div>
  );
}
