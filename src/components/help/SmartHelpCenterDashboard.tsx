import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, MessageCircle, BookOpen, Ticket, Send, Bot,
  ChevronLeft, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';

const FAQ_ITEMS = [
  { q: 'كيف أنشئ شحنة جديدة؟', a: 'اذهب إلى لوحة التحكم ← الشحنات ← زر "إنشاء شحنة" واملأ البيانات المطلوبة.' },
  { q: 'كيف أضيف سائق لشركتي؟', a: 'من إدارة السائقين ← "إضافة سائق" وأدخل بياناته. سيتم إنشاء حساب تلقائي.' },
  { q: 'كيف أصدر فاتورة؟', a: 'الفواتير تُصدر تلقائياً عند اكتمال الشحنة، أو يمكنك إصدارها يدوياً من صفحة الفواتير.' },
  { q: 'كيف أرفع ترخيص بيئي؟', a: 'من الإعدادات ← المستندات والتراخيص ← ارفع الملف واختر نوع الترخيص وتاريخ الانتهاء.' },
  { q: 'ما هي أنواع الحسابات المتاحة؟', a: 'المنصة تدعم: مولد، ناقل، مدور، تخلص، استشاري، جهة رقابية، مكتب نقل، ومقاول بلديات.' },
];

const DEMO_TICKETS = [
  { id: 'T-001', subject: 'مشكلة في تحميل الشحنات', status: 'open', priority: 'high', created: 'منذ ساعة' },
  { id: 'T-002', subject: 'طلب تفعيل خدمة API', status: 'in_progress', priority: 'medium', created: 'منذ يوم' },
  { id: 'T-003', subject: 'استفسار عن باقة الاشتراك', status: 'resolved', priority: 'low', created: 'منذ 3 أيام' },
];

const TICKET_STATUS = {
  open: { label: 'مفتوحة', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  in_progress: { label: 'قيد المعالجة', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'تم الحل', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

const SmartHelpCenterDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  const filteredFAQ = FAQ_ITEMS.filter(f => f.q.includes(searchTerm) || f.a.includes(searchTerm));

  return (
    <div className="space-y-4" dir="rtl">
      <Tabs defaultValue="faq">
        <TabsList className="w-full grid grid-cols-3 h-8">
          <TabsTrigger value="faq" className="text-xs">
            <BookOpen className="h-3 w-3 ml-1" />
            الأسئلة الشائعة
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-xs">
            <Bot className="h-3 w-3 ml-1" />
            مساعد ذكي
          </TabsTrigger>
          <TabsTrigger value="tickets" className="text-xs">
            <Ticket className="h-3 w-3 ml-1" />
            التذاكر
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-3 mt-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ابحث في قاعدة المعرفة..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-9" />
          </div>
          {filteredFAQ.map((faq, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <p className="text-xs font-semibold mb-1">{faq.q}</p>
                <p className="text-[10px] text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="chat" className="space-y-3 mt-3">
          <Card className="min-h-[300px] flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col">
              <div className="flex-1 space-y-3 mb-4">
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-2.5 max-w-[80%]">
                    <p className="text-xs">مرحباً! أنا المساعد الذكي لمنصة iRecycle. كيف أقدر أساعدك اليوم؟</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="اكتب سؤالك..."
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  className="flex-1"
                />
                <Button size="icon" className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-3 mt-3">
          <Button size="sm" className="w-full">
            <Ticket className="h-4 w-4 ml-1" />
            فتح تذكرة جديدة
          </Button>

          {DEMO_TICKETS.map(ticket => {
            const statusCfg = TICKET_STATUS[ticket.status as keyof typeof TICKET_STATUS];
            return (
              <Card key={ticket.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-xs font-semibold">{ticket.subject}</p>
                      <p className="text-[9px] text-muted-foreground">{ticket.id} • {ticket.created}</p>
                    </div>
                    <Badge className={statusCfg.class + ' text-[8px] h-4'}>{statusCfg.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartHelpCenterDashboard;
