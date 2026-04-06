import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSignature, Download, Printer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const letterTypes = [
  { value: 'renewal', label: 'طلب تجديد ترخيص', authority: 'EEAA' },
  { value: 'scope_change', label: 'إخطار تغيير نطاق جغرافي', authority: 'WMRA' },
  { value: 'compliance_statement', label: 'إفادة امتثال', authority: 'WMRA' },
  { value: 'incident_report', label: 'تقرير حادث', authority: 'EEAA' },
  { value: 'vehicle_addition', label: 'إخطار إضافة مركبات', authority: 'هيئة النقل البري' },
  { value: 'training_completion', label: 'شهادة إتمام تدريب', authority: 'الدفاع المدني' },
];

export default function ComplianceLetterGenerator() {
  const [selectedType, setSelectedType] = useState<string>('');

  const generate = () => {
    if (!selectedType) return;
    toast.success('تم إنشاء الخطاب بنجاح');
  };

  const selected = letterTypes.find(l => l.value === selectedType);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignature className="w-5 h-5 text-primary" />
          مولّد خطابات الامتثال
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger><SelectValue placeholder="اختر نوع الخطاب" /></SelectTrigger>
          <SelectContent>
            {letterTypes.map(lt => (
              <SelectItem key={lt.value} value={lt.value}>
                {lt.label} — {lt.authority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selected && (
          <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1">
            <p><strong>النوع:</strong> {selected.label}</p>
            <p><strong>الجهة:</strong> {selected.authority}</p>
            <p className="text-muted-foreground">سيتم ملء البيانات تلقائياً من ملف الجهة</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={generate} disabled={!selectedType} className="flex-1 gap-1" size="sm">
            <Download className="w-4 h-4" /> إنشاء
          </Button>
          <Button variant="outline" size="sm" disabled={!selectedType} className="gap-1">
            <Printer className="w-4 h-4" /> طباعة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
