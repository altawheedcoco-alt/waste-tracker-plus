import { useState, useEffect, useMemo } from 'react';
import { useOrgMembers, OrgMember } from '@/hooks/useOrgMembers';
import { useOrgStructure } from '@/hooks/useOrgStructure';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  UserPlus, User, Mail, Phone, Building2, Briefcase, Shield,
  MoreVertical, UserX, Edit, Eye, Loader2, Search, Hash, Wand2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PositionPermissionsEditor from './PositionPermissionsEditor';
import MemberProfileSheet from './MemberProfileSheet';

/**
 * Generates an automatic email in the format:
 * job_title-firstname.lastname@orgname.ayrecycle.com
 */
function generateAutoEmail(fullName: string, jobTitle: string, orgName: string): string {
  // Transliterate Arabic to Latin for email
  const arabicToLatin: Record<string, string> = {
    'أ': 'a', 'إ': 'e', 'آ': 'a', 'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm',
    'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'a',
    'ؤ': 'w', 'ئ': 'y', 'ء': 'a',
  };

  const transliterate = (text: string) => {
    // If already latin, just lowercase and clean
    if (/^[a-zA-Z\s\-_]+$/.test(text)) {
      return text.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    }
    let result = '';
    for (const char of text) {
      if (arabicToLatin[char]) {
        result += arabicToLatin[char];
      } else if (/[a-zA-Z0-9]/.test(char)) {
        result += char.toLowerCase();
      }
      // Skip spaces, diacritics, etc.
    }
    return result;
  };

  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ? transliterate(nameParts[0]) : '';
  const lastName = nameParts[1] ? transliterate(nameParts[1]) : '';
  const nameSlug = lastName ? `${firstName}.${lastName}` : firstName;

  const jobSlug = transliterate(jobTitle || 'employee');
  const orgSlug = transliterate(orgName || 'org');

  if (!nameSlug) return '';
  return `${jobSlug}-${nameSlug}@${orgSlug}.irecycle.com`;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'نشط', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  suspended: { label: 'موقوف', color: 'bg-red-100 text-red-800' },
  terminated: { label: 'منتهي', color: 'bg-muted text-muted-foreground' },
  on_leave: { label: 'إجازة', color: 'bg-yellow-100 text-yellow-800' },
  pending_invitation: { label: 'دعوة معلقة', color: 'bg-blue-100 text-blue-800' },
};

export default function OrgMembersPanel() {
  const { members, isLoading, addMember, updateMember, removeMember } = useOrgMembers();
  const { departments, positions } = useOrgStructure();
  const { organization } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
  const [editPermsId, setEditPermsId] = useState<string | null>(null);
  const [useAutoEmail, setUseAutoEmail] = useState(true);
  const [form, setForm] = useState({
    email: '', full_name: '', phone: '', position_id: '', department_id: '',
    job_title_ar: '', employee_number: '',
  });

  const autoEmail = useMemo(() => {
    if (!form.full_name || !organization?.name) return '';
    return generateAutoEmail(form.full_name, form.job_title_ar, organization.name);
  }, [form.full_name, form.job_title_ar, organization?.name]);

  useEffect(() => {
    if (useAutoEmail && autoEmail) {
      setForm(p => ({ ...p, email: autoEmail }));
    }
  }, [useAutoEmail, autoEmail]);

  const handleAdd = () => {
    if (!form.email || !form.full_name) {
      toast.error('البريد والاسم مطلوبان');
      return;
    }
    addMember.mutate(form, {
      onSuccess: () => {
        setAddOpen(false);
        setForm({ email: '', full_name: '', phone: '', position_id: '', department_id: '', job_title_ar: '', employee_number: '' });
        setUseAutoEmail(true);
      },
    });
  };

  const activeMembers = members.filter(m => m.status !== 'terminated');
  const filtered = activeMembers.filter(m =>
    !search || 
    m.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.invitation_email?.toLowerCase().includes(search.toLowerCase()) ||
    m.job_title_ar?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو البريد..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 text-right" />
          </div>
          <Badge variant="secondary">{activeMembers.length} عضو</Badge>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><UserPlus className="w-4 h-4 ml-1" /> إضافة عضو</Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-md">
            <DialogHeader><DialogTitle>إضافة عضو جديد</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>الاسم الكامل *</Label>
                <Input fieldContext="full_name" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="أحمد محمد" className="text-right" />
              </div>
              <div>
                <Label>المسمى الوظيفي</Label>
                <Input fieldContext="job_title" value={form.job_title_ar} onChange={e => setForm(p => ({ ...p, job_title_ar: e.target.value }))} placeholder="مثال: محاسب" className="text-right" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="auto-email"
                      checked={useAutoEmail}
                      onCheckedChange={(v) => {
                        setUseAutoEmail(!!v);
                        if (!v) setForm(p => ({ ...p, email: '' }));
                      }}
                    />
                    <label htmlFor="auto-email" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                      <Wand2 className="w-3 h-3" /> توليد تلقائي
                    </label>
                  </div>
                  <Label>البريد الإلكتروني *</Label>
                </div>
                <Input
                  value={form.email}
                  onChange={e => {
                    if (!useAutoEmail) setForm(p => ({ ...p, email: e.target.value }));
                  }}
                  readOnly={useAutoEmail}
                  placeholder={useAutoEmail ? 'سيتم التوليد تلقائياً...' : 'ahmed@company.com'}
                  type="email"
                  dir="ltr"
                  className={useAutoEmail ? 'bg-muted/50 text-xs' : ''}
                />
                {useAutoEmail && autoEmail && (
                  <p className="text-[10px] text-muted-foreground mt-1 dir-ltr text-left">
                    ✨ {autoEmail}
                  </p>
                )}
              </div>
              <div>
                <Label>رقم الجوال</Label>
                <Input fieldContext="phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+966..." dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>القسم</Label>
                  <Select value={form.department_id} onValueChange={v => setForm(p => ({ ...p, department_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name_ar}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المنصب</Label>
                  <Select value={form.position_id} onValueChange={v => setForm(p => ({ ...p, position_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                    <SelectContent>
                      {positions
                        .filter(p => !form.department_id || p.department_id === form.department_id)
                        .map(p => <SelectItem key={p.id} value={p.id}>{p.title_ar}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>الرقم الوظيفي</Label>
                <Input fieldContext="employee_number" value={form.employee_number} onChange={e => setForm(p => ({ ...p, employee_number: e.target.value }))} placeholder="EMP-001" dir="ltr" />
              </div>
              <Button onClick={handleAdd} disabled={addMember.isPending} className="w-full">
                {addMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إضافة العضو'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {filtered.map(member => {
          const sc = statusConfig[member.status] || statusConfig.active;
          return (
            <Card key={member.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                      <DropdownMenuItem onClick={() => updateMember.mutate({ id: member.id, status: member.status === 'suspended' ? 'active' : 'suspended' })}>
                        <Edit className="w-4 h-4 ml-2" /> {member.status === 'suspended' ? 'إعادة تفعيل' : 'إيقاف مؤقت'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => removeMember.mutate(member.id)}>
                        <UserX className="w-4 h-4 ml-2" /> إنهاء العضوية
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="text-right flex-1">
                      <div className="flex items-center gap-2 justify-end">
                        <Badge className={sc.color} variant="secondary">{sc.label}</Badge>
                        <p className="font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedMember(member)}>{member.profile?.full_name || member.invitation_email || 'عضو'}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 justify-end flex-wrap">
                        {member.department?.name_ar && (
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{member.department.name_ar}</span>
                        )}
                        {member.position?.title_ar && (
                          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{member.position.title_ar}</span>
                        )}
                        {member.employee_number && (
                          <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{member.employee_number}</span>
                        )}
                        {(member.profile?.email || member.invitation_email) && (
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{member.profile?.email || member.invitation_email}</span>
                        )}
                      </div>
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="w-5 h-5" />
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
