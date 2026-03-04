import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Trash2, Send, Loader2, Play, Pause } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ScheduledMessage {
  id: string;
  scheduled_at: string;
  status: string;
  message_text: string;
  recipients: any;
  recipient_type: string;
  sent_count: number;
  failed_count: number;
  notes: string | null;
  created_at: string;
}

const WaPilotScheduler = () => {
  const [scheduled, setScheduled] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newSchedule, setNewSchedule] = useState({
    scheduled_at: '',
    message_text: '',
    notes: '',
    recipient_type: 'all_users',
  });

  useEffect(() => { fetchScheduled(); }, []);

  const fetchScheduled = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('whatsapp_scheduled_messages' as any)
      .select('*')
      .order('scheduled_at', { ascending: true });
    if (data) setScheduled(data as any);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newSchedule.scheduled_at || !newSchedule.message_text) {
      toast.error('يرجى تحديد الوقت ونص الرسالة');
      return;
    }
    setCreating(true);
    const { error } = await supabase.from('whatsapp_scheduled_messages' as any).insert({
      scheduled_at: new Date(newSchedule.scheduled_at).toISOString(),
      message_text: newSchedule.message_text,
      notes: newSchedule.notes || null,
      recipient_type: newSchedule.recipient_type,
      recipients: [],
      status: 'pending',
    } as any);

    if (error) toast.error('فشل في إنشاء الرسالة المجدولة');
    else {
      toast.success('تم جدولة الرسالة بنجاح');
      setNewSchedule({ scheduled_at: '', message_text: '', notes: '', recipient_type: 'all_users' });
      fetchScheduled();
    }
    setCreating(false);
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from('whatsapp_scheduled_messages' as any)
      .update({ status: 'cancelled' } as any)
      .eq('id', id);
    if (error) toast.error('فشل في إلغاء الرسالة');
    else { toast.success('تم إلغاء الرسالة المجدولة'); fetchScheduled(); }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-100 text-amber-800 text-xs">قيد الانتظار</Badge>;
      case 'sent': return <Badge className="bg-green-100 text-green-800 text-xs">تم الإرسال</Badge>;
      case 'cancelled': return <Badge variant="secondary" className="text-xs">ملغاة</Badge>;
      case 'failed': return <Badge variant="destructive" className="text-xs">فشل</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Create scheduled message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5" />جدولة رسالة جديدة</CardTitle>
          <CardDescription>أرسل رسائل في وقت محدد مستقبلاً لجميع المستخدمين أو مجموعة مختارة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>تاريخ ووقت الإرسال</Label>
              <Input
                type="datetime-local"
                value={newSchedule.scheduled_at}
                onChange={e => setNewSchedule(p => ({ ...p, scheduled_at: e.target.value }))}
                dir="ltr"
              />
            </div>
            <div>
              <Label>المستهدفون</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newSchedule.recipient_type}
                onChange={e => setNewSchedule(p => ({ ...p, recipient_type: e.target.value }))}
              >
                <option value="all_users">جميع المستخدمين</option>
                <option value="all_orgs">جميع الجهات</option>
                <option value="generators">المولّدين فقط</option>
                <option value="transporters">الناقلين فقط</option>
                <option value="recyclers">المدوّرين فقط</option>
              </select>
            </div>
          </div>
          <div>
            <Label>نص الرسالة</Label>
            <Textarea
              value={newSchedule.message_text}
              onChange={e => setNewSchedule(p => ({ ...p, message_text: e.target.value }))}
              placeholder="اكتب الرسالة المجدولة هنا..."
              rows={3}
            />
          </div>
          <div>
            <Label>ملاحظات (اختياري)</Label>
            <Input
              value={newSchedule.notes}
              onChange={e => setNewSchedule(p => ({ ...p, notes: e.target.value }))}
              placeholder="سبب الجدولة أو ملاحظات إضافية"
            />
          </div>
          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Calendar className="h-4 w-4 ml-1" />}
            جدولة الإرسال
          </Button>
        </CardContent>
      </Card>

      {/* Scheduled messages list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" />الرسائل المجدولة</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموعد</TableHead>
                  <TableHead>الرسالة</TableHead>
                  <TableHead>المستهدفون</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>النتيجة</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduled.map(msg => (
                  <TableRow key={msg.id}>
                    <TableCell className="text-xs">
                      {new Date(msg.scheduled_at).toLocaleString('ar-EG')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{msg.message_text}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{msg.recipient_type}</Badge></TableCell>
                    <TableCell>{statusBadge(msg.status)}</TableCell>
                    <TableCell className="text-xs">
                      {msg.status === 'sent' && (
                        <span className="text-green-600">{msg.sent_count} ✓ / {msg.failed_count} ✗</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {msg.status === 'pending' && (
                        <Button variant="ghost" size="sm" onClick={() => handleCancel(msg.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {scheduled.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا توجد رسائل مجدولة</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaPilotScheduler;
