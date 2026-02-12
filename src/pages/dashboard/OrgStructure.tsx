import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useOrgStructure, Department } from '@/hooks/useOrgStructure';
import { useAuth } from '@/contexts/auth/AuthContext';
import {
  Crown, Settings, Truck, Users, Shield, Calculator, Headphones,
  Leaf, Package, FileText, DoorOpen, Factory, FlaskConical, Scale,
  Cog, Activity, FileCheck, Building2, Plus, User, ChevronDown, ChevronUp,
  Network,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Crown, Settings, Truck, Users, Shield, Calculator, Headphones,
  Leaf, Package, FileText, DoorOpen, Factory, FlaskConical, Scale,
  Cog, Activity, FileCheck, Building2, Network,
};

const colorMap: Record<string, string> = {
  purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  green: 'bg-green-500/10 text-green-600 border-green-500/20',
  red: 'bg-red-500/10 text-red-600 border-red-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
};

const levelLabels: Record<number, string> = {
  0: 'موظف',
  1: 'مشرف',
  2: 'مدير',
  3: 'مدير أول',
  4: 'إدارة عليا',
};

const levelColors: Record<number, string> = {
  0: 'bg-muted text-muted-foreground',
  1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  3: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  4: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const OrgStructure = () => {
  const { profile } = useAuth();
  const { structure, isLoading, addDepartment, addPosition } = useOrgStructure();
  const [expandedDepts, setExpandedDepts] = useState<Set<string> | 'all'>('all');
  const [newDeptOpen, setNewDeptOpen] = useState(false);
  const [newPosOpen, setNewPosOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptNameAr, setNewDeptNameAr] = useState('');
  const [newPosTitle, setNewPosTitle] = useState('');
  const [newPosTitleAr, setNewPosTitleAr] = useState('');
  const [newPosLevel, setNewPosLevel] = useState(0);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalPositions = structure.reduce((acc, d) => acc + (d.positions?.length || 0), 0);
  const filledPositions = structure.reduce(
    (acc, d) => acc + (d.positions?.filter(p => p.assigned_user_id).length || 0), 0
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-7 w-7 text-primary" />
            الهيكل التنظيمي
          </h1>
          <p className="text-muted-foreground mt-1">
            {structure.length} قسم • {totalPositions} منصب • {filledPositions} مشغول
          </p>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{structure.length}</p>
          <p className="text-sm text-muted-foreground">أقسام</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{totalPositions}</p>
          <p className="text-sm text-muted-foreground">مناصب</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{filledPositions}</p>
          <p className="text-sm text-muted-foreground">مشغول</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{totalPositions - filledPositions}</p>
          <p className="text-sm text-muted-foreground">شاغر</p>
        </CardContent></Card>
      </div>

      {/* Departments */}
      <div className="space-y-4">
        {structure.map((dept, idx) => {
          const IconComp = iconMap[dept.icon] || Building2;
          const colorClass = colorMap[dept.color] || colorMap.blue;
          const isExpanded = isDeptExpanded(dept.id);

          return (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleDept(dept.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{dept.name_ar}</h3>
                      <p className="text-xs text-muted-foreground">{dept.name}</p>
                    </div>
                    <Badge variant="secondary" className="mr-2">
                      {dept.positions?.length || 0} منصب
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDeptId(dept.id);
                        setNewPosOpen(true);
                      }}
                    >
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
                        .map(pos => (
                          <div
                            key={pos.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-background border flex items-center justify-center">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{pos.title_ar}</p>
                                <p className="text-xs text-muted-foreground">{pos.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={levelColors[pos.level] || levelColors[0]} variant="secondary">
                                {levelLabels[pos.level] || 'موظف'}
                              </Badge>
                              {pos.assigned_user_id ? (
                                <Badge variant="default" className="bg-green-600 text-white">مشغول</Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-300">شاغر</Badge>
                              )}
                            </div>
                          </div>
                        ))}
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
              <select
                className="w-full border rounded-md p-2 mt-1 bg-background"
                value={newPosLevel}
                onChange={e => setNewPosLevel(Number(e.target.value))}
              >
                {Object.entries(levelLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
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
            <p className="text-muted-foreground mb-4">ابدأ بإضافة الأقسام والمناصب لتنظيم فريق العمل</p>
            <Button onClick={() => setNewDeptOpen(true)}><Plus className="h-4 w-4 ml-1" />إضافة قسم</Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default OrgStructure;
