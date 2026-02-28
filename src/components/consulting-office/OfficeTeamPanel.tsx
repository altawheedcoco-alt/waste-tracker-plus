import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useConsultingOffice, type OfficeMembership } from '@/hooks/useConsultingOffice';
import {
  Users, UserPlus, Shield, Settings, Loader2, Trash2,
  Eye, EyeOff, UserCheck, Crown, Briefcase, GraduationCap,
  User, Search,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ROLE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  director: { label: 'مدير المكتب', icon: Crown, color: 'text-amber-600 bg-amber-50' },
  senior_consultant: { label: 'استشاري أول', icon: Shield, color: 'text-blue-600 bg-blue-50' },
  consultant: { label: 'استشاري', icon: Briefcase, color: 'text-emerald-600 bg-emerald-50' },
  assistant: { label: 'مساعد', icon: User, color: 'text-purple-600 bg-purple-50' },
  delegate: { label: 'مفوّض', icon: UserCheck, color: 'text-indigo-600 bg-indigo-50' },
  trainee: { label: 'متدرب', icon: GraduationCap, color: 'text-orange-600 bg-orange-50' },
};

const OfficeTeamPanel = memo(() => {
  const { members, addMember, updateMember, removeMember, isDirector, loadingMembers } = useConsultingOffice();
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const searchConsultant = async () => {
    if (!searchCode.trim()) return;
    setSearching(true);
    setSearchResult(null);
    const { data } = await supabase
      .from('environmental_consultants')
      .select('id, full_name, consultant_code, specialization, phone, email, is_active')
      .or(`consultant_code.eq.${searchCode.trim()},national_id.eq.${searchCode.trim()}`)
      .maybeSingle();
    setSearchResult(data);
    setSearching(false);
  };

  const handleAddMember = async (consultantId: string, role: string = 'consultant') => {
    await addMember.mutateAsync({ consultant_id: consultantId, role, membership_type: 'linked' });
    setShowAddDialog(false);
    setSearchCode('');
    setSearchResult(null);
  };

  if (loadingMembers) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                فريق المكتب الاستشاري
                <Badge variant="outline">{members.length} عضو</Badge>
              </CardTitle>
              <CardDescription>إدارة الاستشاريين والأدوار والصلاحيات داخل المكتب</CardDescription>
            </div>
            {isDirector && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <UserPlus className="w-4 h-4" />إضافة استشاري
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إضافة استشاري للمكتب</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">البحث بكود الاستشاري أو رقم الهوية</label>
                      <div className="flex gap-2 mt-1">
                        <Input value={searchCode} onChange={e => setSearchCode(e.target.value)}
                          placeholder="EC-XXXXX أو رقم الهوية" className="flex-1"
                          onKeyDown={e => e.key === 'Enter' && searchConsultant()} />
                        <Button onClick={searchConsultant} disabled={searching} size="sm" className="gap-1.5">
                          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {searchResult === null && searchCode && !searching && (
                      <p className="text-sm text-destructive text-center">لم يتم العثور على استشاري بهذا الكود</p>
                    )}

                    {searchResult && (
                      <Card className="border-emerald-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                              {searchResult.full_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{searchResult.full_name}</p>
                              <p className="text-xs text-muted-foreground">{searchResult.consultant_code} — {searchResult.specialization || 'استشاري بيئي'}</p>
                            </div>
                          </div>
                          <Button onClick={() => handleAddMember(searchResult.id)} disabled={addMember.isPending}
                            className="w-full gap-1.5" size="sm">
                            <UserPlus className="w-4 h-4" />ربط بالمكتب
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium">لا يوجد أعضاء في المكتب بعد</p>
              <p className="text-sm mt-1">ابحث بكود الاستشاري لإضافته للفريق</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map(member => {
                const roleInfo = ROLE_LABELS[member.role] || ROLE_LABELS.consultant;
                const RoleIcon = roleInfo.icon;
                const isEditing = editingId === member.id;

                return (
                  <div key={member.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {member.consultant?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.consultant?.full_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`text-[10px] ${roleInfo.color}`}>
                              <RoleIcon className="w-3 h-3 ml-1" />{roleInfo.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {member.consultant?.consultant_code}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {member.membership_type === 'linked' ? 'ربط خارجي' : 'داخلي'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.can_sign_independently ? (
                          <Badge variant="outline" className="text-[10px] text-emerald-700">يوقع مستقلاً</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-700">يحتاج موافقة</Badge>
                        )}
                        {isDirector && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setEditingId(isEditing ? null : member.id)} className="h-7">
                              <Settings className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => removeMember.mutateAsync(member.id)}
                              className="h-7 text-destructive hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing && isDirector && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-muted-foreground">الدور</label>
                            <Select defaultValue={member.role} onValueChange={v => updateMember.mutateAsync({ id: member.id, updates: { role: v } })}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">المسمى الوظيفي</label>
                            <Input defaultValue={member.role_title_ar || ''} placeholder="مثال: رئيس قسم التدقيق"
                              className="h-9" onBlur={e => updateMember.mutateAsync({ id: member.id, updates: { role_title_ar: e.target.value } })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">يوقع باستقلالية</span>
                            <Switch checked={member.can_sign_independently}
                              onCheckedChange={v => updateMember.mutateAsync({ id: member.id, updates: { can_sign_independently: v } })} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">يحتاج موافقة المدير</span>
                            <Switch checked={member.requires_director_approval}
                              onCheckedChange={v => updateMember.mutateAsync({ id: member.id, updates: { requires_director_approval: v } })} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">يرى كل العملاء</span>
                            <Switch checked={member.can_view_all_clients}
                              onCheckedChange={v => updateMember.mutateAsync({ id: member.id, updates: { can_view_all_clients: v } })} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

OfficeTeamPanel.displayName = 'OfficeTeamPanel';
export default OfficeTeamPanel;
