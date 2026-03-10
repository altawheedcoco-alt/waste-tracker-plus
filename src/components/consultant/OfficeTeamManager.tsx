import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, Search, Loader2, Building2, ShieldCheck,
  XCircle, CheckCircle2, Crown, UserCheck, Eye, EyeOff,
} from 'lucide-react';

interface OfficeTeamManagerProps {
  officeConsultantId: string; // The environmental_consultants.id of the office entity
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير',
  senior: 'استشاري أول',
  member: 'عضو',
  trainee: 'متدرب',
};

const OfficeTeamManager = memo(({ officeConsultantId }: OfficeTeamManagerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [newRole, setNewRole] = useState('member');

  // Fetch current members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['office-members', officeConsultantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('consulting_office_members')
        .select('*, consultant:environmental_consultants!consulting_office_members_consultant_id_fkey(id, full_name, specialization, consultant_code, phone, email, is_active, profile_photo_url)')
        .eq('office_id', officeConsultantId)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!officeConsultantId,
  });

  // Search consultant by code
  const searchConsultant = async () => {
    if (!searchCode.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const { data } = await supabase
        .from('environmental_consultants')
        .select('id, full_name, specialization, consultant_code, email, phone, entity_type, is_active')
        .eq('consultant_code', searchCode.trim().toUpperCase())
        .eq('entity_type', 'individual')
        .maybeSingle();
      
      if (!data) {
        toast.error('لم يتم العثور على استشاري بهذا الكود');
        return;
      }
      if (!data.is_active) {
        toast.error('هذا الاستشاري غير نشط');
        return;
      }
      // Check if already a member
      const existing = members.find(m => (m.consultant as any)?.id === data.id);
      if (existing) {
        toast.error('هذا الاستشاري عضو بالفعل في المكتب');
        return;
      }
      setSearchResult(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSearching(false);
    }
  };

  // Add member mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!searchResult) return;
      const { error } = await supabase.from('consulting_office_members').insert({
        office_id: officeConsultantId,
        consultant_id: searchResult.id,
        role_in_office: newRole,
        invited_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`تم إضافة ${searchResult.full_name} للمكتب`);
      setSearchResult(null);
      setSearchCode('');
      queryClient.invalidateQueries({ queryKey: ['office-members'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('consulting_office_members')
        .update({ is_active: false })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إزالة العضو');
      queryClient.invalidateQueries({ queryKey: ['office-members'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {/* Add Consultant */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5 text-primary" />
            إضافة استشاري للمكتب
          </CardTitle>
          <CardDescription>ابحث بكود الاستشاري (EC-XXXX) لإضافته لفريق المكتب</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={searchCode}
              onChange={e => setSearchCode(e.target.value.toUpperCase())}
              placeholder="أدخل كود الاستشاري (مثال: EC-1234)"
              className="font-mono"
              onKeyDown={e => e.key === 'Enter' && searchConsultant()}
            />
            <Button onClick={searchConsultant} disabled={searching || !searchCode.trim()} className="gap-1.5">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              بحث
            </Button>
          </div>

          {searchResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {searchResult.full_name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-bold">{searchResult.full_name}</p>
                  <p className="text-sm text-muted-foreground">{searchResult.specialization || 'استشاري بيئي'}</p>
                  <Badge variant="outline" className="text-[10px] font-mono mt-1">{searchResult.consultant_code}</Badge>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">الدور في المكتب:</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending} className="w-full gap-1.5">
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                إضافة للمكتب
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Current Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            أعضاء المكتب ({members.length})
          </CardTitle>
          <CardDescription>جميع الاستشاريين المرتبطين بالمكتب — يرثون تلقائياً صلاحيات الوصول لجهات المكتب</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>لا يوجد أعضاء بعد</p>
              <p className="text-sm">ابحث بكود الاستشاري لإضافته</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {members.map((m: any) => {
                const c = m.consultant;
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-border hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold">
                            {c?.full_name?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-sm truncate">{c?.full_name}</p>
                              {m.role_in_office === 'admin' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{c?.specialization || 'استشاري بيئي'}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge variant="outline" className="text-[9px] font-mono">{c?.consultant_code}</Badge>
                              <Badge variant="secondary" className="text-[9px]">{ROLE_LABELS[m.role_in_office] || m.role_in_office}</Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => removeMutation.mutate(m.id)}
                            className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

OfficeTeamManager.displayName = 'OfficeTeamManager';
export default OfficeTeamManager;
