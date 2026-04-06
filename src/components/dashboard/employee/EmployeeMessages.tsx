/**
 * رسائل وتعليمات الإدارة للموظف
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User, Clock, Pin } from 'lucide-react';

const messages = [
  { from: 'رئيس الجهة', message: 'يرجى الانتهاء من فواتير شهر مارس قبل الخميس', time: 'منذ ساعتين', pinned: true, read: false },
  { from: 'م. أحمد (عضو)', message: 'تم إسناد 3 شحنات جديدة لمتابعتك مع شركة النهضة', time: 'منذ 5 ساعات', pinned: false, read: false },
  { from: 'النظام', message: 'تم تحديث صلاحياتك: إضافة "إصدار فواتير" لشركة البلاستيك', time: 'أمس', pinned: false, read: true },
  { from: 'رئيس الجهة', message: 'اجتماع أسبوعي يوم الأحد الساعة 10 صباحاً', time: 'منذ يومين', pinned: true, read: true },
];

const EmployeeMessages = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        الرسائل والتعليمات
        <Badge variant="destructive" className="mr-auto text-[9px]">
          {messages.filter(m => !m.read).length} جديد
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {messages.map((m, i) => (
        <div key={i} className={`p-2 rounded border ${!m.read ? 'bg-primary/5 border-primary/20' : ''}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-medium">{m.from}</span>
              {m.pinned && <Pin className="h-2.5 w-2.5 text-primary" />}
            </div>
            <span className="text-[9px] text-muted-foreground">{m.time}</span>
          </div>
          <p className="text-xs">{m.message}</p>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default EmployeeMessages;
