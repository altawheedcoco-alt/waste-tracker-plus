import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mountain, Plus, AlertTriangle, Lock, Unlock, MapPin, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LandfillCellsTabProps {
  facilityId?: string | null;
  organizationId?: string | null;
}

const LandfillCellsTab = ({ facilityId, organizationId }: LandfillCellsTabProps) => {
  const queryClient = useQueryClient();
  const [showAddCell, setShowAddCell] = useState(false);
  const [showDumpDialog, setShowDumpDialog] = useState(false);
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const [dumpWeight, setDumpWeight] = useState('');
  const [cellForm, setCellForm] = useState({ cell_code: '', sector: '', total_capacity_tons: '', waste_types_allowed: '' });

  const { data: cells = [] } = useQuery({
    queryKey: ['landfill-cells', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase
        .from('landfill_cells')
        .select('*')
        .eq('organization_id', organizationId)
        .order('cell_code', { ascending: true });
      return data || [];
    },
    enabled: !!organizationId,
  });

  const addCellMutation = useMutation({
    mutationFn: async (form: typeof cellForm) => {
      const { error } = await supabase.from('landfill_cells').insert({
        organization_id: organizationId!,
        disposal_facility_id: facilityId,
        cell_code: form.cell_code,
        sector: form.sector,
        total_capacity_tons: Number(form.total_capacity_tons) || 0,
        waste_types_allowed: form.waste_types_allowed ? form.waste_types_allowed.split(',').map(s => s.trim()) : [],
        status: 'empty',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إضافة الخلية بنجاح');
      setShowAddCell(false);
      setCellForm({ cell_code: '', sector: '', total_capacity_tons: '', waste_types_allowed: '' });
      queryClient.invalidateQueries({ queryKey: ['landfill-cells'] });
    },
  });

  const dumpMutation = useMutation({
    mutationFn: async ({ cellId, weight }: { cellId: string; weight: number }) => {
      const cell = cells.find((c: any) => c.id === cellId);
      if (!cell) throw new Error('Cell not found');
      const newUsed = (cell.used_capacity_tons || 0) + weight;
      const pct = (newUsed / cell.total_capacity_tons) * 100;
      const newStatus = pct >= 100 ? 'closed' : pct >= 80 ? 'active' : 'active';
      
      const { error } = await supabase.from('landfill_cells').update({
        used_capacity_tons: newUsed,
        status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', cellId);
      if (error) throw error;
      return { pct, newStatus };
    },
    onSuccess: (result) => {
      toast.success(`تم تسجيل الدفن — الخلية الآن ${result.pct.toFixed(0)}%`);
      if (result.pct >= 80) {
        toast.warning('⚠️ تنبيه: الخلية وصلت 80%+ من سعتها — جهّز الخلية التالية!');
      }
      setShowDumpDialog(false);
      setDumpWeight('');
      setSelectedCell(null);
      queryClient.invalidateQueries({ queryKey: ['landfill-cells'] });
    },
  });

  const closeCellMutation = useMutation({
    mutationFn: async (cellId: string) => {
      const { error } = await supabase.from('landfill_cells').update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', cellId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إغلاق الخلية');
      queryClient.invalidateQueries({ queryKey: ['landfill-cells'] });
    },
  });

  const totalCapacity = cells.reduce((s: number, c: any) => s + (c.total_capacity_tons || 0), 0);
  const totalUsed = cells.reduce((s: number, c: any) => s + (c.used_capacity_tons || 0), 0);
  const overallPct = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;
  const activeCells = cells.filter((c: any) => c.status === 'active');
  const closedCells = cells.filter((c: any) => c.status === 'closed');

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30"><Mountain className="w-5 h-5" /></div>
            <div className="text-right flex-1">
              <p className="text-2xl font-bold">{cells.length}</p>
              <p className="text-xs text-muted-foreground">إجمالي الخلايا</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100 dark:bg-blue-900/30"><Unlock className="w-5 h-5" /></div>
            <div className="text-right flex-1">
              <p className="text-2xl font-bold">{activeCells.length}</p>
              <p className="text-xs text-muted-foreground">خلايا نشطة</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-red-600 bg-red-100 dark:bg-red-900/30"><Lock className="w-5 h-5" /></div>
            <div className="text-right flex-1">
              <p className="text-2xl font-bold">{closedCells.length}</p>
              <p className="text-xs text-muted-foreground">خلايا مغلقة</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-amber-600 bg-amber-100 dark:bg-amber-900/30"><TrendingUp className="w-5 h-5" /></div>
            <div className="text-right flex-1">
              <p className="text-2xl font-bold">{overallPct.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">الامتلاء الكلي</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Overall capacity bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{totalUsed.toFixed(1)} / {totalCapacity.toFixed(0)} طن</span>
          <span className="text-sm font-bold">السعة الإجمالية للمدفن</span>
        </div>
        <Progress value={overallPct} className="h-3" />
      </Card>

      {/* Cells Grid (Digital Map) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowAddCell(true)}>
              <Plus className="w-3 h-3" /> إضافة خلية
            </Button>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> خريطة خلايا الدفن
            </CardTitle>
          </div>
          <CardDescription className="text-right">اضغط على خلية نشطة لتسجيل عملية دفن جديدة</CardDescription>
        </CardHeader>
        <CardContent>
          {cells.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mountain className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>لم يتم تسجيل خلايا دفن بعد</p>
              <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => setShowAddCell(true)}>
                <Plus className="w-3 h-3" /> إضافة أول خلية
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cells.map((cell: any) => {
                const pct = cell.total_capacity_tons > 0 ? (cell.used_capacity_tons / cell.total_capacity_tons) * 100 : 0;
                const isWarning = pct >= 80 && cell.status !== 'closed';
                return (
                  <div
                    key={cell.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      cell.status === 'closed' ? 'border-muted bg-muted/30 opacity-60' :
                      isWarning ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 hover:shadow-md' :
                      cell.status === 'active' ? 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10 hover:shadow-md' :
                      'border-border bg-card hover:shadow-md'
                    }`}
                    onClick={() => {
                      if (cell.status !== 'closed') {
                        setSelectedCell(cell);
                        setShowDumpDialog(true);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={cell.status === 'closed' ? 'secondary' : cell.status === 'active' ? 'default' : 'outline'} className="text-xs">
                        {cell.status === 'closed' ? '🔒 مغلقة' : cell.status === 'active' ? '🟢 نشطة' : '⚪ فارغة'}
                      </Badge>
                      <span className="font-mono font-bold text-lg">{cell.cell_code}</span>
                    </div>
                    {cell.sector && <p className="text-xs text-muted-foreground text-right mb-2">قطاع: {cell.sector}</p>}
                    <Progress value={pct} className={`h-3 mb-2 ${isWarning ? '[&>div]:bg-amber-500' : ''}`} />
                    <div className="flex items-center justify-between">
                      {isWarning && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      <p className="text-xs text-muted-foreground text-right flex-1">
                        {cell.used_capacity_tons.toFixed(1)} / {cell.total_capacity_tons} طن ({pct.toFixed(0)}%)
                      </p>
                    </div>
                    {cell.status !== 'closed' && pct > 0 && (
                      <Button
                        size="sm" variant="ghost"
                        className="w-full mt-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); closeCellMutation.mutate(cell.id); }}
                      >
                        <Lock className="w-3 h-3 mr-1" /> إغلاق الخلية
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Cell Dialog */}
      <Dialog open={showAddCell} onOpenChange={setShowAddCell}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mountain className="w-5 h-5" /> إضافة خلية دفن جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>رمز الخلية *</Label>
                <Input placeholder="مثال: Cell-A1" value={cellForm.cell_code} onChange={(e) => setCellForm(p => ({ ...p, cell_code: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>القطاع</Label>
                <Input placeholder="مثال: قطاع أ" value={cellForm.sector} onChange={(e) => setCellForm(p => ({ ...p, sector: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>السعة الإجمالية (طن) *</Label>
              <Input type="number" placeholder="1000" value={cellForm.total_capacity_tons} onChange={(e) => setCellForm(p => ({ ...p, total_capacity_tons: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>أنواع النفايات المسموحة (مفصولة بفاصلة)</Label>
              <Input placeholder="صناعية، طبية، كيميائية" value={cellForm.waste_types_allowed} onChange={(e) => setCellForm(p => ({ ...p, waste_types_allowed: e.target.value }))} />
            </div>
            <Button className="w-full gap-2" onClick={() => addCellMutation.mutate(cellForm)} disabled={!cellForm.cell_code || !cellForm.total_capacity_tons || addCellMutation.isPending}>
              <Plus className="w-4 h-4" /> {addCellMutation.isPending ? 'جاري الإضافة...' : 'إضافة الخلية'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dump Dialog */}
      <Dialog open={showDumpDialog} onOpenChange={setShowDumpDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mountain className="w-5 h-5" /> تسجيل عملية دفن — {selectedCell?.cell_code}</DialogTitle>
          </DialogHeader>
          {selectedCell && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-right">
                <p className="text-sm">السعة الحالية: <span className="font-bold">{selectedCell.used_capacity_tons.toFixed(1)} / {selectedCell.total_capacity_tons} طن</span></p>
                <p className="text-sm">المتبقي: <span className="font-bold text-emerald-600">{(selectedCell.total_capacity_tons - selectedCell.used_capacity_tons).toFixed(1)} طن</span></p>
              </div>
              <div className="space-y-2">
                <Label>الوزن المراد دفنه (طن) *</Label>
                <Input type="number" placeholder="0" value={dumpWeight} onChange={(e) => setDumpWeight(e.target.value)} />
              </div>
              {Number(dumpWeight) > 0 && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground">السعة بعد الدفن</p>
                  <p className="text-2xl font-bold">
                    {(((selectedCell.used_capacity_tons + Number(dumpWeight)) / selectedCell.total_capacity_tons) * 100).toFixed(0)}%
                  </p>
                </div>
              )}
              <Button className="w-full gap-2" onClick={() => dumpMutation.mutate({ cellId: selectedCell.id, weight: Number(dumpWeight) })}
                disabled={!dumpWeight || Number(dumpWeight) <= 0 || dumpMutation.isPending}>
                <Mountain className="w-4 h-4" /> {dumpMutation.isPending ? 'جاري التسجيل...' : 'تسجيل الدفن'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandfillCellsTab;
