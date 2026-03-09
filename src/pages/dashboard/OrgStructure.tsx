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
import PositionAssignDialog from '@/components/org-structure/PositionAssignDialog';
import PositionPermissionsEditor from '@/components/org-structure/PositionPermissionsEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Crown, Settings, Truck, Users, Shield, Calculator, Headphones,
  Leaf, Package, FileText, DoorOpen, Factory, FlaskConical, Scale,
  Cog, Activity, FileCheck, Building2, Plus, User, ChevronDown, ChevronUp,
  Network, ArrowRight, Share2, Bot, Monitor, TrendingUp, UserCog, ShieldCheck,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Crown, Settings, Truck, Users, Shield, Calculator, Headphones,
  Leaf, Package, FileText, DoorOpen, Factory, FlaskConical, Scale,
  Cog, Activity, FileCheck, Building2, Network, Monitor, TrendingUp,
};

const colorMap: Record<string, string> = {
  purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  green: 'bg-green-500/10 text-green-600 border-green-500/20',
  red: 'bg-red-500/10 text-red-600 border-red-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  orange: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  violet: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
};

const levelLabels: Record<number, string> = {
  0: 'موظف', 1: 'مشرف', 2: 'مدير', 3: 'مدير أول', 4: 'إدارة عليا',
};

const levelColors: Record<number, string> = {
  0: 'bg-muted text-muted-foreground',
  1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  3: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  4: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const OrgStructure = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { structure, isLoading, addDepartment, addPosition, seedStructure, refetch } = useOrgStructure();
  const { registerMember } = useOrgMembers();
  const [expandedDepts, setExpandedDepts] = useState<Set<string> | 'all'>('all');
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

  const toggleDept = (id: string) => {
    setExpandedDepts(prev => {
      if (prev === 'all') {
        const next = new Set(structure.map(d => d.id));
        next.delete(id);
        return next;
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isDeptExpanded = (id: string) => expandedDepts === 'all' || expandedDepts.has(id);
  const expandAll = () => setExpandedDepts('all');
  const collapseAll = () => setExpandedDepts(new Set());

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Network className="h-7 w-7 text-primary" />
              الهيكل التنظيمي
            </h1>
            <p className="text-muted-foreground mt-1">
              {structure.length} قسم • {totalPositions} منصب • {filledPositions} مشغول {aiPositions > 0 && `• ${aiPositions} 🤖 AI`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={expandAll}>توسيع الكل</Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>طي الكل</Button>
          <Dialog open={newDeptOpen} onOpenChange={setNewDeptOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 ml-1" />إضافة قسم</Button>
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{structure.length}</p>
          <p className="text-xs text-muted-foreground">أقسام</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{totalPositions}</p>
          <p className="text-xs text-muted-foreground">مناصب</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{filledPositions}</p>
          <p className="text-xs text-muted-foreground">مشغول</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{totalPositions - filledPositions}</p>
          <p className="text-xs text-muted-foreground">شاغر</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{aiPositions}</p>
          <p className="text-xs text-muted-foreground">🤖 AI</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="structure" dir="rtl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="structure"><Network className="w-4 h-4 ml-1" /> الهيكل التنظيمي</TabsTrigger>
          <TabsTrigger value="members"><Users className="w-4 h-4 ml-1" /> الأعضاء والصلاحيات</TabsTrigger>
          <TabsTrigger value="sharing"><Share2 className="w-4 h-4 ml-1" /> مشاركة الملف</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4"><OrgMembersPanel /></TabsContent>
        <TabsContent value="sharing" className="mt-4"><OrgPublicProfileSettings /></TabsContent>

        <TabsContent value="structure" className="mt-4">
          <div className="space-y-4">
            {structure.map((dept, idx) => {
              const IconComp = iconMap[dept.icon] || Building2;
              const colorClass = colorMap[dept.color] || colorMap.blue;
              const isExpanded = isDeptExpanded(dept.id);
              const deptAiCount = dept.positions?.filter(p => p.operator_type === 'ai').length || 0;

              return (
                <motion.div key={dept.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                  <Card className="overflow-hidden">
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleDept(dept.id)}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{dept.name_ar}</h3>
                          <p className="text-xs text-muted-foreground">{dept.name}</p>
                        </div>
                        <Badge variant="secondary" className="mr-2">{dept.positions?.length || 0} منصب</Badge>
                        {deptAiCount > 0 && <Badge variant="outline" className="text-xs border-primary/30 text-primary">🤖 {deptAiCount}</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setSelectedDeptId(dept.id); setNewPosOpen(true); }}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </div>

                    {isExpanded && dept.positions && dept.positions.length > 0 && (
                      <CardContent className="border-t pt-4 pb-4">
                        <div className="space-y-2">
                          {dept.positions
                            .sort((a, b) => b.level - a.level || a.sort_order - b.sort_order)
                            .map(pos => {
                              const isAI = pos.operator_type === 'ai';
                              const isOccupied = pos.assigned_user_id || pos.holder_name;

                              return (
                                <div
                                  key={pos.id}
                                  className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                                    isAI
                                      ? 'bg-primary/5 hover:bg-primary/10 border border-primary/10'
                                      : 'bg-muted/30 hover:bg-muted/50'
                                  }`}
                                  onClick={() => setAssignPos(pos)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                                      isAI ? 'bg-primary/10 border-primary/30' : 'bg-background'
                                    }`}>
                                      {isAI ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{pos.title_ar}</p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs text-muted-foreground">{pos.title}</p>
                                        {pos.holder_name && (
                                          <span className="text-xs text-foreground/70">— {pos.holder_name}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                    <Badge className={levelColors[pos.level] || levelColors[0]} variant="secondary">
                                      {levelLabels[pos.level] || 'موظف'}
                                    </Badge>
                                    {isAI ? (
                                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">🤖 AI</Badge>
                                    ) : isOccupied ? (
                                      <Badge variant="default" className="bg-green-600 text-white text-[10px]">مشغول</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">شاغر</Badge>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={e => { e.stopPropagation(); setPermsPositionId(pos.id); }}
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>

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

          {structure.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Network className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا يوجد هيكل تنظيمي بعد</h3>
                <p className="text-muted-foreground mb-4">يمكنك إنشاء الهيكل التنظيمي الافتراضي المتخصص لنوع جهتك أو البدء يدوياً</p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="eco" onClick={() => seedStructure.mutate()} disabled={seedStructure.isPending}>
                    {seedStructure.isPending ? <><span className="animate-spin mr-2">⏳</span> جاري الإنشاء...</> : <><Network className="h-4 w-4 ml-1" />إنشاء الهيكل الافتراضي</>}
                  </Button>
                  <Button variant="outline" onClick={() => setNewDeptOpen(true)}><Plus className="h-4 w-4 ml-1" />إضافة يدوياً</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
    </motion.div>
  );
};

export default OrgStructure;
