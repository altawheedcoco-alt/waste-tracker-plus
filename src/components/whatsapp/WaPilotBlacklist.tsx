import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldBan, Plus, Trash2, Search, Phone, AlertTriangle, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface BlacklistEntry {
  phone: string;
  reason: string;
  added_at: string;
  added_by: string;
}

const WaPilotBlacklist = () => {
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ phones: '', reason: '' });

  // Store blacklist in localStorage since we don't have a dedicated table
  useEffect(() => {
    const stored = localStorage.getItem('wapilot_blacklist');
    if (stored) setBlacklist(JSON.parse(stored));
  }, []);

  const saveBlacklist = (list: BlacklistEntry[]) => {
    setBlacklist(list);
    localStorage.setItem('wapilot_blacklist', JSON.stringify(list));
  };

  const handleAdd = () => {
    if (!newEntry.phones) { toast.error('يرجى إدخال رقم واحد على الأقل'); return; }
    const phones = newEntry.phones.split(/[\n,]/).map(p => p.trim()).filter(Boolean);
    const newEntries = phones.map(phone => ({
      phone,
      reason: newEntry.reason || 'بدون سبب',
      added_at: new Date().toISOString(),
      added_by: 'admin',
    }));
    const updated = [...blacklist, ...newEntries.filter(e => !blacklist.some(b => b.phone === e.phone))];
    saveBlacklist(updated);
    toast.success(`تمت إضافة ${newEntries.length} رقم للقائمة السوداء`);
    setNewEntry({ phones: '', reason: '' });
    setShowAdd(false);
  };

  const handleRemove = (phone: string) => {
    saveBlacklist(blacklist.filter(b => b.phone !== phone));
    toast.success('تم إزالة الرقم من القائمة السوداء');
  };

  const exportBlacklist = () => {
    const csv = ['الرقم,السبب,تاريخ الإضافة', ...blacklist.map(b => `${b.phone},${b.reason},${b.added_at}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'wapilot_blacklist.csv';
    link.click();
  };

  const filtered = blacklist.filter(b => !search || b.phone.includes(search) || b.reason.includes(search));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 text-center">
          <ShieldBan className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <div className="text-2xl font-bold text-destructive">{blacklist.length}</div>
          <p className="text-xs text-muted-foreground">أرقام محظورة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-amber-600" />
          <div className="text-2xl font-bold">
            {blacklist.filter(b => new Date(b.added_at) > new Date(Date.now() - 7 * 86400000)).length}
          </div>
          <p className="text-xs text-muted-foreground">أضيفت هذا الأسبوع</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Phone className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold">{new Set(blacklist.map(b => b.reason)).size}</div>
          <p className="text-xs text-muted-foreground">أسباب مختلفة</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldBan className="h-5 w-5 text-destructive" />
              القائمة السوداء
            </CardTitle>
            <CardDescription>أرقام محظورة من استلام رسائل واتساب من النظام</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportBlacklist} disabled={blacklist.length === 0}>
              <Download className="h-3.5 w-3.5 ml-1" />تصدير
            </Button>
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 ml-1" />إضافة</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>إضافة أرقام للقائمة السوداء</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>الأرقام (كل رقم في سطر أو مفصولة بفاصلة)</Label>
                    <Textarea
                      value={newEntry.phones}
                      onChange={e => setNewEntry(p => ({ ...p, phones: e.target.value }))}
                      placeholder="966501234567&#10;201012345678"
                      rows={4}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label>السبب</Label>
                    <Input value={newEntry.reason} onChange={e => setNewEntry(p => ({ ...p, reason: e.target.value }))} placeholder="رقم غير صالح / طلب العميل / spam" />
                  </div>
                  <Button onClick={handleAdd} className="w-full">إضافة للقائمة السوداء</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالرقم أو السبب..." className="pr-9" />
          </div>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرقم</TableHead>
                  <TableHead>السبب</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm" dir="ltr">{entry.phone}</TableCell>
                    <TableCell className="text-sm">{entry.reason}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(entry.added_at).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(entry.phone)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">القائمة فارغة</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaPilotBlacklist;
