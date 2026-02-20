import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ClipboardCheck, Calendar, Percent, AlertTriangle, CheckCircle2, Loader2, FileText } from 'lucide-react';

interface Props {
  contract: any;
  onRefresh: () => void;
}

const TransportOfficeContract = ({ contract, onRefresh }: Props) => {
  const { organization, user } = useAuth();
  const [requesting, setRequesting] = useState(false);
  const [notes, setNotes] = useState('');

  const handleRequestContract = async () => {
    if (!organization?.id) return;
    setRequesting(true);
    try {
      const contractNumber = `TO-${Date.now().toString(36).toUpperCase()}`;
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const { error } = await supabase.from('transport_office_contracts').insert({
        organization_id: organization.id,
        contract_number: contractNumber,
        contract_type: 'standard',
        status: 'pending',
        commission_rate: 5.00,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        notes: notes || null,
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success('تم تقديم طلب العقد بنجاح، في انتظار الموافقة');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'خطأ في تقديم الطلب');
    } finally {
      setRequesting(false);
    }
  };

  if (contract) {
    const statusMap: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
      active: { label: 'فعال', variant: 'default' },
      pending: { label: 'قيد المراجعة', variant: 'secondary' },
      suspended: { label: 'معلق', variant: 'destructive' },
      expired: { label: 'منتهي', variant: 'destructive' },
    };
    const s = statusMap[contract.status] || statusMap.pending;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            عقد مكتب النقل مع المنصة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">رقم العقد</p>
              <p className="font-mono font-bold">{contract.contract_number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الحالة</p>
              <Badge variant={s.variant}>{s.label}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">العمولة</p>
              <p className="font-bold flex items-center gap-1"><Percent className="w-3 h-3" />{contract.commission_rate}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">النوع</p>
              <p className="font-bold">{contract.contract_type === 'standard' ? 'قياسي' : contract.contract_type === 'premium' ? 'مميز' : 'مؤسسي'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> تاريخ البداية</p>
              <p>{contract.start_date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> تاريخ الانتهاء</p>
              <p>{contract.end_date}</p>
            </div>
          </div>
          {contract.notes && (
            <div>
              <p className="text-xs text-muted-foreground">ملاحظات</p>
              <p className="text-sm bg-muted p-2 rounded">{contract.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-8 space-y-4">
        <div className="text-center space-y-2">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
          <h3 className="text-lg font-bold">لا يوجد عقد فعال مع المنصة</h3>
          <p className="text-muted-foreground text-sm">للبدء في تأجير مركباتك عبر المنصة، يجب تقديم طلب عقد أولاً</p>
        </div>
        <div>
          <Label>ملاحظات إضافية (اختياري)</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي تفاصيل إضافية عن مكتب النقل..." rows={3} />
        </div>
        <Button onClick={handleRequestContract} disabled={requesting} className="w-full gap-2">
          {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
          تقديم طلب عقد مع المنصة
        </Button>
      </CardContent>
    </Card>
  );
};

export default TransportOfficeContract;
