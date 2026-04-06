import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Upload, Clock, Send, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface RenewalRequest {
  id: string;
  licenseType: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string;
  authority: string;
  notes: string;
}

const LICENSE_TYPES = [
  { value: 'eeaa', label: 'ترخيص جهاز شؤون البيئة (EEAA)', authority: 'جهاز شؤون البيئة' },
  { value: 'wmra', label: 'ترخيص جهاز تنظيم المخلفات (WMRA)', authority: 'جهاز تنظيم إدارة المخلفات' },
  { value: 'land_transport', label: 'رخصة النقل البري', authority: 'هيئة النقل البري' },
  { value: 'civil_defense', label: 'موافقة الدفاع المدني', authority: 'الدفاع المدني' },
  { value: 'health', label: 'موافقة وزارة الصحة', authority: 'وزارة الصحة' },
  { value: 'petroleum', label: 'موافقة هيئة البترول', authority: 'هيئة البترول' },
  { value: 'commercial_register', label: 'تجديد السجل التجاري', authority: 'السجل التجاري' },
  { value: 'tax_card', label: 'تجديد البطاقة الضريبية', authority: 'مصلحة الضرائب' },
];

const STATUS_MAP = {
  draft: { label: 'مسودة', color: 'bg-muted text-muted-foreground' },
  submitted: { label: 'مُقدّم', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  under_review: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  approved: { label: 'مُعتمد', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

// Mock data - in production this would come from the database
const MOCK_REQUESTS: RenewalRequest[] = [
  { id: '1', licenseType: 'eeaa', status: 'under_review', submittedAt: '2026-03-15', authority: 'جهاز شؤون البيئة', notes: 'تم تقديم كافة المستندات' },
  { id: '2', licenseType: 'wmra', status: 'submitted', submittedAt: '2026-03-28', authority: 'جهاز تنظيم المخلفات', notes: 'بانتظار الرد' },
];

export default function LicenseRenewalPortal() {
  const [requests, setRequests] = useState<RenewalRequest[]>(MOCK_REQUESTS);
  const [showNew, setShowNew] = useState(false);
  const [newType, setNewType] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const handleSubmit = () => {
    if (!newType) return;
    const licenseInfo = LICENSE_TYPES.find(l => l.value === newType);
    const newReq: RenewalRequest = {
      id: Date.now().toString(),
      licenseType: newType,
      status: 'draft',
      submittedAt: new Date().toISOString().split('T')[0],
      authority: licenseInfo?.authority || '',
      notes: newNotes,
    };
    setRequests(prev => [newReq, ...prev]);
    setShowNew(false);
    setNewType('');
    setNewNotes('');
    toast.success('تم إنشاء طلب التجديد');
  };

  const submitRequest = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'submitted' as const } : r));
    toast.success('تم تقديم الطلب بنجاح');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 ml-1" />
          طلب تجديد جديد
        </Button>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          بوابة تقديم طلبات التجديد
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showNew && (
          <Card className="border-dashed border-2 border-primary/30">
            <CardContent className="p-4 space-y-3">
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الترخيص" />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map(lt => (
                    <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea placeholder="ملاحظات..." value={newNotes} onChange={e => setNewNotes(e.target.value)} className="text-right" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSubmit}>إنشاء</Button>
                <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>إلغاء</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {requests.map(req => {
          const licenseInfo = LICENSE_TYPES.find(l => l.value === req.licenseType);
          const statusInfo = STATUS_MAP[req.status];
          return (
            <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
              <div className="flex items-center gap-2">
                {req.status === 'draft' && (
                  <Button size="sm" variant="outline" onClick={() => submitRequest(req.id)}>
                    <Send className="w-3 h-3 ml-1" />
                    تقديم
                  </Button>
                )}
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{licenseInfo?.label}</p>
                <p className="text-xs text-muted-foreground">{req.authority} • {req.submittedAt}</p>
              </div>
            </div>
          );
        })}

        {requests.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-6">لا توجد طلبات تجديد حالياً</p>
        )}
      </CardContent>
    </Card>
  );
}
