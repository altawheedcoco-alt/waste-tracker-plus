import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { KeyRound, Plus, XCircle, Clock, ArrowLeftRight } from 'lucide-react';
import { useSovereignGovernance, DELEGATION_SCOPES } from '@/hooks/useSovereignGovernance';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const SovereignDelegationPanel = () => {
  const { delegations, createDelegation, revokeDelegation } = useSovereignGovernance();
  const [open, setOpen] = useState(false);
  const [delegateId, setDelegateId] = useState('');
  const [scope, setScope] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  const { data: users } = useQuery({
    queryKey: ['users-for-delegation'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, user_id, full_name, email').limit(100);
      return data || [];
    },
  });

  const handleCreate = () => {
    if (!delegateId || scope.length === 0) return;
    createDelegation.mutate({
      delegate_id: delegateId,
      scope,
      reason: reason || undefined,
      expires_at: expiresAt || undefined,
    }, {
      onSuccess: () => { setOpen(false); setDelegateId(''); setScope([]); setReason(''); setExpiresAt(''); },
    });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">التفويضات السيادية</h3>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 ml-1" />تفويض جديد</Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader><DialogTitle>إنشاء تفويض سيادي</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={delegateId} onValueChange={setDelegateId}>
                <SelectTrigger><SelectValue placeholder="اختر المفوَّض إليه" /></SelectTrigger>
                <SelectContent>
                  {(users || []).map(u => (
                    <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div>
                <p className="text-sm font-medium mb-2">نطاق التفويض:</p>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {DELEGATION_SCOPES.map(s => (
                    <label key={s.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={scope.includes(s.value)}
                        onCheckedChange={checked => {
                          setScope(prev => checked ? [...prev, s.value] : prev.filter(v => v !== s.value));
                        }}
                      />
                      {s.ar}
                    </label>
                  ))}
                </div>
              </div>

              <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
              <p className="text-xs text-muted-foreground -mt-2">تاريخ انتهاء التفويض (اختياري)</p>

              <Textarea placeholder="سبب التفويض" value={reason} onChange={e => setReason(e.target.value)} />

              <Button onClick={handleCreate} disabled={createDelegation.isPending} className="w-full">
                {createDelegation.isPending ? 'جاري الإنشاء...' : 'تأكيد التفويض'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Delegations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <ArrowLeftRight className="w-6 h-6 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{delegations.length}</div>
            <p className="text-xs text-muted-foreground">تفويضات نشطة</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-1 text-amber-500" />
            <div className="text-2xl font-bold">
              {delegations.filter(d => d.expires_at && new Date(d.expires_at) < new Date(Date.now() + 7 * 86400000)).length}
            </div>
            <p className="text-xs text-muted-foreground">تنتهي خلال 7 أيام</p>
          </CardContent>
        </Card>
      </div>

      {/* Delegation List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">التفويضات المفعّلة</CardTitle>
        </CardHeader>
        <CardContent>
          {delegations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد تفويضات نشطة</p>
          ) : (
            <div className="space-y-3">
              {delegations.map(d => {
                const delegate = users?.find(u => u.user_id === d.delegate_id);
                return (
                  <div key={d.id} className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{delegate?.full_name || 'مستخدم'}</p>
                        <p className="text-xs text-muted-foreground">{d.reason || 'بدون سبب محدد'}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>سحب التفويض</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل تريد سحب هذا التفويض؟ لن يتمكن المفوَّض من استخدام الصلاحيات بعد ذلك.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <Textarea placeholder="سبب السحب" value={revokeReason} onChange={e => setRevokeReason(e.target.value)} />
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => revokeDelegation.mutate({ id: d.id, reason: revokeReason })}>
                              سحب التفويض
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {d.scope.map(s => {
                        const label = DELEGATION_SCOPES.find(ds => ds.value === s);
                        return <Badge key={s} variant="secondary" className="text-[10px]">{label?.ar || s}</Badge>;
                      })}
                    </div>
                    {d.expires_at && (
                      <p className="text-[10px] text-muted-foreground">
                        ينتهي: {format(new Date(d.expires_at), 'dd MMM yyyy', { locale: ar })}
                      </p>
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
};

export default SovereignDelegationPanel;
