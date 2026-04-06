import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, ArrowUpRight, ArrowDownLeft, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Correspondence {
  id: string;
  direction: 'incoming' | 'outgoing';
  authority: string;
  subject: string;
  date: string;
  linkedLicense: string;
  status: 'new' | 'read' | 'replied' | 'archived';
}

const mockData: Correspondence[] = [
  { id: '1', direction: 'incoming', authority: 'EEAA', subject: 'إخطار تجديد ترخيص النقل', date: '2026-03-28', linkedLicense: 'رخصة النقل البيئي', status: 'new' },
  { id: '2', direction: 'outgoing', authority: 'WMRA', subject: 'طلب توسيع النطاق الجغرافي', date: '2026-03-15', linkedLicense: 'ترخيص إدارة المخلفات', status: 'replied' },
  { id: '3', direction: 'incoming', authority: 'هيئة النقل البري', subject: 'نتيجة الفحص الفني الدوري', date: '2026-03-10', linkedLicense: 'رخصة النقل البري', status: 'read' },
  { id: '4', direction: 'outgoing', authority: 'الدفاع المدني', subject: 'إفادة باستكمال تدريبات السلامة', date: '2026-02-20', linkedLicense: 'شهادة السلامة', status: 'archived' },
];

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  read: 'bg-gray-100 text-gray-800',
  replied: 'bg-green-100 text-green-800',
  archived: 'bg-yellow-100 text-yellow-800',
};
const statusLabels: Record<string, string> = { new: 'جديد', read: 'مقروء', replied: 'تم الرد', archived: 'مؤرشف' };

export default function OfficialCorrespondenceLog() {
  const [search, setSearch] = useState('');
  const filtered = mockData.filter(c => c.subject.includes(search) || c.authority.includes(search));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="w-5 h-5 text-primary" />
            سجل المراسلات الرسمية
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1 h-7">
            <Plus className="w-3 h-3" /> إضافة
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث..." className="pr-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filtered.map(item => (
            <div key={item.id} className="p-2.5 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {item.direction === 'incoming' ? <ArrowDownLeft className="w-3.5 h-3.5 text-blue-500" /> : <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />}
                  <span className="text-xs font-semibold text-primary">{item.authority}</span>
                </div>
                <Badge variant="outline" className={`text-[10px] ${statusColors[item.status]}`}>{statusLabels[item.status]}</Badge>
              </div>
              <p className="text-sm">{item.subject}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{item.date}</span>
                <span className="text-[10px] text-muted-foreground">مرتبط بـ: {item.linkedLicense}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
