import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Plus, Shield, Ban, Bell, Pause, CheckCircle2, Siren, Radio } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const SEVERITY_MAP: Record<string, { label: string; color: string; icon: any }> = {
  level_1: { label: 'المستوى 1 — تنبيه', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', icon: Bell },
  level_2: { label: 'المستوى 2 — تحذير', color: 'text-orange-500 bg-orange-500/10 border-orange-500/30', icon: AlertTriangle },
  level_3: { label: 'المستوى 3 — حرج', color: 'text-red-500 bg-red-500/10 border-red-500/30', icon: Siren },
  level_4: { label: 'المستوى 4 — طوارئ قصوى', color: 'text-red-700 bg-red-700/10 border-red-700/30 animate-pulse', icon: Radio },
};

const EMERGENCY_ACTIONS = [
  { id: 'freeze_accounts', label: 'تجميد الحسابات المتأثرة', icon: Ban },
  { id: 'stop_operations', label: 'إيقاف العمليات الجارية', icon: Pause },
  { id: 'mass_alert', label: 'إرسال تنبيه جماعي', icon: Bell },
  { id: 'lockdown', label: 'تفعيل وضع الإغلاق الأمني', icon: Shield },
];

const CrisisManagementPanel = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('level_1');

  const { data: crises } = useQuery({
    queryKey: ['crisis-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('crisis_incidents').select('*').order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15_000,
  });

  const createCrisis = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('crisis_incidents').insert({
        title, description, severity, initiated_by: user?.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crisis-incidents'] });
      toast.success('تم إنشاء حادث الأزمة');
      setOpen(false); setTitle(''); setDescription(''); setSeverity('level_1');
    },
    onError: () => toast.error('فشل الإنشاء'),
  });

  const resolveCrisis = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from('crisis_incidents').update({
        status: 'resolved', resolved_by: user?.id, resolved_at: new Date().toISOString(), resolution_notes: notes,
      } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crisis-incidents'] });
      toast.success('تم حل الأزمة');
    },
  });

  const executeAction = async (crisisId: string, actionId: string) => {
    const { error } = await supabase.from('crisis_incidents').update({
      actions_taken: [...((crises?.find(c => c.id === crisisId) as any)?.actions_taken || []), { action: actionId, at: new Date().toISOString(), by: user?.id }],
    } as any).eq('id', crisisId);
    if (!error) {
      qc.invalidateQueries({ queryKey: ['crisis-incidents'] });
      toast.success(`تم تنفيذ الإجراء: ${EMERGENCY_ACTIONS.find(a => a.id === actionId)?.label}`);
    }
  };

  const activeCrises = (crises || []).filter((c: any) => c.status === 'active');
  const resolvedCrises = (crises || []).filter((c: any) => c.status === 'resolved');

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Siren className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-bold">مركز إدارة الأزمات</h3>
          {activeCrises.length > 0 && <Badge variant="destructive" className="animate-pulse">{activeCrises.length} نشطة</Badge>}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="destructive"><Plus className="w-4 h-4 ml-1" />إعلان أزمة</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>إعلان حادث أزمة جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="عنوان الأزمة" value={title} onChange={e => setTitle(e.target.value)} />
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SEVERITY_MAP).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea placeholder="وصف الأزمة والتفاصيل..." value={description} onChange={e => setDescription(e.target.value)} />
              <Button onClick={() => createCrisis.mutate()} disabled={!title || createCrisis.isPending} className="w-full" variant="destructive">
                {createCrisis.isPending ? 'جاري الإعلان...' : 'إعلان الأزمة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Emergency Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {EMERGENCY_ACTIONS.map(action => (
          <Card key={action.id} className="cursor-pointer hover:border-red-500/30 transition-colors border-border/50">
            <CardContent className="p-3 text-center">
              <action.icon className="w-5 h-5 mx-auto mb-1 text-red-500" />
              <p className="text-[11px] font-medium">{action.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Crises */}
      {activeCrises.length > 0 && (
        <Card className="border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-500">أزمات نشطة ({activeCrises.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeCrises.map((crisis: any) => {
              const sev = SEVERITY_MAP[crisis.severity] || SEVERITY_MAP.level_1;
              const SevIcon = sev.icon;
              return (
                <div key={crisis.id} className={`p-4 rounded-lg border ${sev.color} space-y-3`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <SevIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{crisis.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{crisis.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(crisis.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{sev.label}</Badge>
                  </div>

                  {/* Emergency Actions */}
                  <div className="flex flex-wrap gap-1">
                    {EMERGENCY_ACTIONS.map(action => {
                      const taken = (crisis.actions_taken as any[])?.some((a: any) => a.action === action.id);
                      return (
                        <AlertDialog key={action.id}>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant={taken ? 'secondary' : 'outline'} className="text-[10px] h-7" disabled={taken}>
                              <action.icon className="w-3 h-3 ml-1" />
                              {taken ? '✓ تم' : action.label}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد تنفيذ الإجراء</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من تنفيذ "{action.label}"؟ هذا إجراء حساس.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => executeAction(crisis.id, action.id)}>تنفيذ</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      );
                    })}
                  </div>

                  <Button size="sm" variant="outline" className="w-full text-emerald-500 border-emerald-500/30"
                    onClick={() => resolveCrisis.mutate({ id: crisis.id, notes: 'تم الحل' })}>
                    <CheckCircle2 className="w-3 h-3 ml-1" /> إغلاق الأزمة
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* No active crises */}
      {activeCrises.length === 0 && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-medium text-emerald-600">لا توجد أزمات نشطة — الوضع مستقر ✅</p>
          </CardContent>
        </Card>
      )}

      {/* Resolved */}
      {resolvedCrises.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">أزمات محلولة ({resolvedCrises.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {resolvedCrises.slice(0, 5).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>{c.title}</span>
                  </div>
                  <span className="text-muted-foreground">{format(new Date(c.resolved_at || c.created_at), 'dd/MM', { locale: ar })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CrisisManagementPanel;
