import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, BookOpen, FileText, TrendingUp, Calculator, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';

const accountTypeLabels: Record<string, string> = {
  asset: 'أصول',
  liability: 'خصوم',
  equity: 'حقوق ملكية',
  revenue: 'إيرادات',
  expense: 'مصروفات',
};

const ERPAccounting = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newAccount, setNewAccount] = useState({ account_code: '', account_name: '', account_type: 'asset', notes: '' });
  const [newEntry, setNewEntry] = useState({ description: '', lines: [{ account_id: '', debit: 0, credit: 0 }] });

  // Fetch chart of accounts
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['erp-accounts', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('erp_chart_of_accounts')
        .select('*')
        .eq('organization_id', orgId)
        .order('account_code');
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch journal entries
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['erp-journal-entries', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('erp_journal_entries')
        .select('*')
        .eq('organization_id', orgId)
        .order('entry_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Add account mutation
  const addAccountMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');
      const { error } = await supabase.from('erp_chart_of_accounts').insert({
        organization_id: orgId,
        ...newAccount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-accounts'] });
      setShowAddAccount(false);
      setNewAccount({ account_code: '', account_name: '', account_type: 'asset', notes: '' });
      toast.success('تم إضافة الحساب بنجاح');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Add journal entry mutation
  const addEntryMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');
      const totalDebit = newEntry.lines.reduce((s, l) => s + (l.debit || 0), 0);
      const totalCredit = newEntry.lines.reduce((s, l) => s + (l.credit || 0), 0);
      if (totalDebit !== totalCredit) throw new Error('المدين يجب أن يساوي الدائن');
      
      const entryNumber = `JE-${Date.now().toString(36).toUpperCase()}`;
      const { data: entry, error } = await supabase
        .from('erp_journal_entries')
        .insert({
          organization_id: orgId,
          entry_number: entryNumber,
          description: newEntry.description,
          total_debit: totalDebit,
          total_credit: totalCredit,
          status: 'draft',
        })
        .select()
        .single();
      if (error) throw error;

      const lines = newEntry.lines.filter(l => l.account_id).map(l => ({
        journal_entry_id: entry.id,
        account_id: l.account_id,
        debit: l.debit || 0,
        credit: l.credit || 0,
      }));
      if (lines.length > 0) {
        const { error: linesError } = await supabase.from('erp_journal_lines').insert(lines);
        if (linesError) throw linesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-journal-entries'] });
      setShowAddEntry(false);
      setNewEntry({ description: '', lines: [{ account_id: '', debit: 0, credit: 0 }] });
      toast.success('تم إضافة القيد بنجاح');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addLine = () => setNewEntry(prev => ({ ...prev, lines: [...prev.lines, { account_id: '', debit: 0, credit: 0 }] }));
  const removeLine = (i: number) => setNewEntry(prev => ({ ...prev, lines: prev.lines.filter((_, idx) => idx !== i) }));
  const updateLine = (i: number, field: string, value: any) => {
    setNewEntry(prev => ({
      ...prev,
      lines: prev.lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l),
    }));
  };

  // Summary stats
  const totalAssets = accounts.filter(a => a.account_type === 'asset').reduce((s, a) => s + (a.balance || 0), 0);
  const totalLiabilities = accounts.filter(a => a.account_type === 'liability').reduce((s, a) => s + (a.balance || 0), 0);
  const totalRevenue = accounts.filter(a => a.account_type === 'revenue').reduce((s, a) => s + (a.balance || 0), 0);
  const totalExpenses = accounts.filter(a => a.account_type === 'expense').reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6" dir="rtl">
        <BackButton />
        <div className="flex items-center justify-between">
          <div className="text-right">
            <h1 className="text-2xl font-bold">المحاسبة والمالية</h1>
            <p className="text-muted-foreground">إدارة الحسابات والقيود والتقارير المالية</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الأصول', value: totalAssets, icon: TrendingUp, color: 'text-green-600' },
            { label: 'إجمالي الخصوم', value: totalLiabilities, icon: Calculator, color: 'text-red-600' },
            { label: 'الإيرادات', value: totalRevenue, icon: TrendingUp, color: 'text-blue-600' },
            { label: 'المصروفات', value: totalExpenses, icon: Calculator, color: 'text-orange-600' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-right">
                <div className="flex items-center justify-between">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold">{stat.value.toLocaleString()} ج.م</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="accounts" dir="rtl">
          <TabsList>
            <TabsTrigger value="accounts">شجرة الحسابات</TabsTrigger>
            <TabsTrigger value="journal">القيود اليومية</TabsTrigger>
            <TabsTrigger value="reports">التقارير المالية</TabsTrigger>
          </TabsList>

          {/* Chart of Accounts */}
          <TabsContent value="accounts" className="space-y-4">
            <div className="flex justify-between items-center">
              <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
                <DialogTrigger asChild>
                  <Button><Plus className="ml-2 h-4 w-4" />إضافة حساب</Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader><DialogTitle>إضافة حساب جديد</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>رقم الحساب</Label><Input value={newAccount.account_code} onChange={e => setNewAccount(p => ({ ...p, account_code: e.target.value }))} /></div>
                      <div>
                        <Label>نوع الحساب</Label>
                        <Select value={newAccount.account_type} onValueChange={v => setNewAccount(p => ({ ...p, account_type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(accountTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label>اسم الحساب</Label><Input value={newAccount.account_name} onChange={e => setNewAccount(p => ({ ...p, account_name: e.target.value }))} /></div>
                    <div><Label>ملاحظات</Label><Input value={newAccount.notes} onChange={e => setNewAccount(p => ({ ...p, notes: e.target.value }))} /></div>
                    <Button className="w-full" onClick={() => addAccountMutation.mutate()} disabled={addAccountMutation.isPending}>حفظ</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الحساب</TableHead>
                      <TableHead className="text-right">اسم الحساب</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الرصيد</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingAccounts ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                    ) : accounts.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد حسابات بعد</TableCell></TableRow>
                    ) : accounts.map(acc => (
                      <TableRow key={acc.id}>
                        <TableCell className="font-mono">{acc.account_code}</TableCell>
                        <TableCell>{acc.account_name}</TableCell>
                        <TableCell><Badge variant="outline">{accountTypeLabels[acc.account_type] || acc.account_type}</Badge></TableCell>
                        <TableCell>{(acc.balance || 0).toLocaleString()} ج.م</TableCell>
                        <TableCell><Badge variant={acc.is_active ? 'default' : 'secondary'}>{acc.is_active ? 'نشط' : 'معطل'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Journal Entries */}
          <TabsContent value="journal" className="space-y-4">
            <div className="flex justify-between items-center">
              <Dialog open={showAddEntry} onOpenChange={setShowAddEntry}>
                <DialogTrigger asChild>
                  <Button><Plus className="ml-2 h-4 w-4" />قيد جديد</Button>
                </DialogTrigger>
                <DialogContent dir="rtl" className="max-w-2xl">
                  <DialogHeader><DialogTitle>إضافة قيد يومي</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>الوصف</Label><Input value={newEntry.description} onChange={e => setNewEntry(p => ({ ...p, description: e.target.value }))} /></div>
                    <div className="space-y-2">
                      <Label>بنود القيد</Label>
                      {newEntry.lines.map((line, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <Select value={line.account_id} onValueChange={v => updateLine(i, 'account_id', v)}>
                            <SelectTrigger className="flex-1"><SelectValue placeholder="اختر الحساب" /></SelectTrigger>
                            <SelectContent>
                              {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.account_code} - {a.account_name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input type="number" placeholder="مدين" className="w-24" value={line.debit || ''} onChange={e => updateLine(i, 'debit', parseFloat(e.target.value) || 0)} />
                          <Input type="number" placeholder="دائن" className="w-24" value={line.credit || ''} onChange={e => updateLine(i, 'credit', parseFloat(e.target.value) || 0)} />
                          {newEntry.lines.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeLine(i)}><Trash2 className="h-4 w-4" /></Button>}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addLine}><Plus className="ml-1 h-3 w-3" />إضافة سطر</Button>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span>المدين: {newEntry.lines.reduce((s, l) => s + (l.debit || 0), 0).toLocaleString()}</span>
                      <span>الدائن: {newEntry.lines.reduce((s, l) => s + (l.credit || 0), 0).toLocaleString()}</span>
                    </div>
                    <Button className="w-full" onClick={() => addEntryMutation.mutate()} disabled={addEntryMutation.isPending}>حفظ القيد</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم القيد</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                      <TableHead className="text-right">المدين</TableHead>
                      <TableHead className="text-right">الدائن</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingEntries ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                    ) : entries.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد قيود بعد</TableCell></TableRow>
                    ) : entries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono">{entry.entry_number}</TableCell>
                        <TableCell>{new Date(entry.entry_date).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>{entry.description || '-'}</TableCell>
                        <TableCell>{(entry.total_debit || 0).toLocaleString()}</TableCell>
                        <TableCell>{(entry.total_credit || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={entry.status === 'posted' ? 'default' : 'secondary'}>
                            {entry.status === 'posted' ? 'مرحّل' : entry.status === 'reversed' ? 'ملغي' : 'مسودة'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Reports */}
          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'الميزانية العمومية', desc: 'ملخص الأصول والخصوم وحقوق الملكية', icon: BookOpen },
                { title: 'قائمة الدخل', desc: 'الإيرادات والمصروفات وصافي الربح', icon: TrendingUp },
                { title: 'ميزان المراجعة', desc: 'مراجعة أرصدة جميع الحسابات', icon: Calculator },
                { title: 'التدفقات النقدية', desc: 'حركة الأموال الواردة والصادرة', icon: FileText },
              ].map(report => (
                <Card key={report.title} className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => toast.info(`تقرير "${report.title}" قيد التطوير — سيتوفر قريباً`)}>
                  <CardContent className="p-4 sm:p-6 text-right">
                    <div className="flex items-start gap-3">
                      <report.icon className="h-8 w-8 text-primary shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                      <div>
                        <h3 className="font-semibold">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">{report.desc}</p>
                        <Badge variant="outline" className="mt-2 text-[10px]">قريباً</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default ERPAccounting;
