import { useState } from 'react';
import BackButton from '@/components/ui/back-button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrgStructure, Position } from '@/hooks/useOrgStructure';
import { useOrgMembers } from '@/hooks/useOrgMembers';
import { useAuth } from '@/contexts/auth/AuthContext';
import OrgMembersPanel from '@/components/org-structure/OrgMembersPanel';
import OrgPublicProfileSettings from '@/components/org-structure/OrgPublicProfileSettings';
import OrgStatsPanel from '@/components/org-structure/OrgStatsPanel';
import OrgTreeView from '@/components/org-structure/OrgTreeView';
import OrgDriversPanel from '@/components/org-structure/OrgDriversPanel';
import PositionAssignDialog from '@/components/org-structure/PositionAssignDialog';
import PositionPermissionsEditor from '@/components/org-structure/PositionPermissionsEditor';
import MemberProfileSheet from '@/components/org-structure/MemberProfileSheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import OrgPermissionsPanel from '@/components/org-structure/OrgPermissionsPanel';
import {
  Network, Plus, Share2, Bot, Users, Truck,
  BarChart3, Building2, ArrowRight, Shield,
} from 'lucide-react';
import type { OrgMember } from '@/hooks/useOrgMembers';

const OrgStructure = () => {
  const navigate = useNavigate();
  const { profile, organization } = useAuth();
  const { structure, departments, positions, isLoading, addDepartment, addPosition, seedStructure, refetch } = useOrgStructure();
  const { members, registerMember } = useOrgMembers();
  const [newDeptOpen, setNewDeptOpen] = useState(false);
  const [newPosOpen, setNewPosOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptNameAr, setNewDeptNameAr] = useState('');
  const [newPosTitle, setNewPosTitle] = useState('');
  const [newPosTitleAr, setNewPosTitleAr] = useState('');
  const [newPosLevel, setNewPosLevel] = useState(0);

  // Position assignment
  const [assignPos, setAssignPos] = useState<Position | null>(null);
  const [assignSaving, setAssignSaving] = useState(false);

  // Permissions editor
  const [permsPositionId, setPermsPositionId] = useState<string | null>(null);

  // Member profile sheet
  const [viewMember, setViewMember] = useState<OrgMember | null>(null);

  const levelLabels: Record<number, string> = {
    0: 'موظف', 1: 'مشرف', 2: 'مدير', 3: 'مدير أول', 4: 'إدارة عليا',
  };

  const handleAddDept = () => {
    if (!newDeptName || !newDeptNameAr) return;
    addDepartment.mutate(
      { name: newDeptName, name_ar: newDeptNameAr, sort_order: structure.length + 1 },
      { onSuccess: () => { setNewDeptOpen(false); setNewDeptName(''); setNewDeptNameAr(''); } }
    );
  };

  const handleAddPos = () => {
    if (!newPosTitle || !newPosTitleAr || !selectedDeptId) return;
    addPosition.mutate(
      { title: newPosTitle, title_ar: newPosTitleAr, department_id: selectedDeptId, level: newPosLevel },
      { onSuccess: () => { setNewPosOpen(false); setNewPosTitle(''); setNewPosTitleAr(''); } }
    );
  };

  const handlePositionSave = async (positionId: string, updates: Record<string, any>) => {
    setAssignSaving(true);
    try {
      const { error } = await supabase
        .from('organization_positions')
        .update(updates as any)
        .eq('id', positionId);
      if (error) throw error;
      toast.success('تم حفظ بيانات المنصب');
      refetch();
      setAssignPos(null);
    } catch (err: any) {
      toast.error(err.message || 'خطأ في الحفظ');
    } finally {
      setAssignSaving(false);
    }
  };

  const handleRegisterMember = (data: any) => {
    registerMember.mutate(data);
  };

  const isTransporter = organization?.organization_type === 'transporter';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const totalPositions = structure.reduce((acc, d) => acc + (d.positions?.length || 0), 0);
  const filledPositions = structure.reduce((acc, d) => acc + (d.positions?.filter(p => p.assigned_user_id || p.holder_name).length || 0), 0);
  const aiPositions = structure.reduce((acc, d) => acc + (d.positions?.filter(p => p.operator_type === 'ai').length || 0), 0);
  const activeMembers = members.filter(m => m.status === 'active').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4" dir="rtl">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              مركز القيادة والهيكل التنظيمي
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {structure.length} قسم • {totalPositions} منصب • {activeMembers} عضو نشط
              {aiPositions > 0 && ` • ${aiPositions} 🤖 AI`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Dialog open={newDeptOpen} onOpenChange={setNewDeptOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 ml-1" />قسم جديد</Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>إضافة قسم جديد</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>اسم القسم (عربي)</Label><Input value={newDeptNameAr} onChange={e => setNewDeptNameAr(e.target.value)} placeholder="مثال: التسويق" /></div>
                <div><Label>اسم القسم (إنجليزي)</Label><Input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="e.g. Marketing" /></div>
                <Button onClick={handleAddDept} disabled={addDepartment.isPending} className="w-full">إضافة</Button>
              </div>
            </DialogContent>
          </Dialog>
          {structure.length === 0 && (
            <Button variant="eco" size="sm" onClick={() => seedStructure.mutate()} disabled={seedStructure.isPending}>
              <Network className="h-4 w-4 ml-1" />إنشاء هيكل افتراضي
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="tree" dir="rtl">
        <TabsList className={`grid w-full ${isTransporter ? 'grid-cols-6' : 'grid-cols-5'} h-10`}>
          <TabsTrigger value="tree" className="text-xs gap-1"><Network className="w-3.5 h-3.5" /> الشجرة</TabsTrigger>
          <TabsTrigger value="members" className="text-xs gap-1"><Users className="w-3.5 h-3.5" /> الأعضاء</TabsTrigger>
          <TabsTrigger value="permissions" className="text-xs gap-1"><Shield className="w-3.5 h-3.5" /> الصلاحيات</TabsTrigger>
          <TabsTrigger value="stats" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" /> إحصائيات</TabsTrigger>
          {isTransporter && (
            <TabsTrigger value="drivers" className="text-xs gap-1"><Truck className="w-3.5 h-3.5" /> السائقين</TabsTrigger>
          )}
          <TabsTrigger value="sharing" className="text-xs gap-1"><Share2 className="w-3.5 h-3.5" /> المشاركة</TabsTrigger>
        </TabsList>

        {/* Tree View */}
        <TabsContent value="tree" className="mt-4">
          <OrgTreeView
            departments={departments}
            positions={positions}
            members={members}
            onPositionClick={setAssignPos}
            onMemberClick={setViewMember}
          />

          {structure.length === 0 && (
            <Card className="mt-4">
              <CardContent className="p-12 text-center">
                <Network className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا يوجد هيكل تنظيمي بعد</h3>
                <p className="text-muted-foreground mb-4">يمكنك إنشاء الهيكل الافتراضي المتخصص لنوع جهتك أو البدء يدوياً</p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="eco" onClick={() => seedStructure.mutate()} disabled={seedStructure.isPending}>
                    {seedStructure.isPending ? '⏳ جاري الإنشاء...' : <><Network className="h-4 w-4 ml-1" />إنشاء الهيكل الافتراضي</>}
                  </Button>
                  <Button variant="outline" onClick={() => setNewDeptOpen(true)}><Plus className="h-4 w-4 ml-1" />إضافة يدوياً</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="mt-4">
          <OrgMembersPanel />
        </TabsContent>

        {/* Stats */}
        <TabsContent value="stats" className="mt-4">
          <OrgStatsPanel departments={departments} positions={positions} members={members} />
        </TabsContent>

        {/* Drivers (transporter only) */}
        {isTransporter && (
          <TabsContent value="drivers" className="mt-4">
            <OrgDriversPanel />
          </TabsContent>
        )}

        {/* Sharing */}
        <TabsContent value="sharing" className="mt-4">
          <OrgPublicProfileSettings />
        </TabsContent>
      </Tabs>

      {/* Add Position Dialog */}
      <Dialog open={newPosOpen} onOpenChange={setNewPosOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إضافة منصب جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>المسمى الوظيفي (عربي)</Label><Input value={newPosTitleAr} onChange={e => setNewPosTitleAr(e.target.value)} placeholder="مثال: مدير التسويق" /></div>
            <div><Label>المسمى الوظيفي (إنجليزي)</Label><Input value={newPosTitle} onChange={e => setNewPosTitle(e.target.value)} placeholder="e.g. Marketing Manager" /></div>
            <div>
              <Label>المستوى الوظيفي</Label>
              <select className="w-full border rounded-md p-2 mt-1 bg-background" value={newPosLevel} onChange={e => setNewPosLevel(Number(e.target.value))}>
                {Object.entries(levelLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <Button onClick={handleAddPos} disabled={addPosition.isPending} className="w-full">إضافة</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Position Assignment Dialog */}
      <PositionAssignDialog
        position={assignPos}
        open={!!assignPos}
        onClose={() => setAssignPos(null)}
        onSave={handlePositionSave}
        onRegisterMember={handleRegisterMember}
        isSaving={assignSaving}
      />

      {/* Position Permissions Editor */}
      {permsPositionId && (
        <PositionPermissionsEditor
          positionId={permsPositionId}
          open={!!permsPositionId}
          onClose={() => setPermsPositionId(null)}
        />
      )}

      {/* Member Profile Sheet */}
      {viewMember && (
        <MemberProfileSheet
          member={viewMember}
          open={!!viewMember}
          onClose={() => setViewMember(null)}
        />
      )}
    </motion.div>
  );
};

export default OrgStructure;
