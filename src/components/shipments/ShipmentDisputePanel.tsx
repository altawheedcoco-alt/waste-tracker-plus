import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AlertTriangle, Plus, CheckCircle2, Clock, Loader2, Scale } from 'lucide-react';

interface Props {
  shipmentId: string;
  organizationId: string;
  partnerOrgs: { id: string; name: string; type: string }[];
}

const disputeTypes: Record<string, string> = {
  weight_difference: 'فرق وزن',
  delay: 'تأخير',
  damage: 'تلف',
  quality: 'جودة',
  documentation: 'وثائق',
  pricing: 'تسعير',
  other: 'أخرى',
};

const severityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: 'bg-blue-100 text-blue-800' },
  medium: { label: 'متوسطة', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'عالية', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'حرجة', color: 'bg-red-100 text-red-800' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'مفتوح', color: 'bg-red-100 text-red-800' },
  under_review: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-800' },
  resolved: { label: 'تم الحل', color: 'bg-green-100 text-green-800' },
  escalated: { label: 'تم التصعيد', color: 'bg-purple-100 text-purple-800' },
  closed: { label: 'مغلق', color: 'bg-muted text-muted-foreground' },
};

export default function ShipmentDisputePanel({ shipmentId, organizationId, partnerOrgs }: Props) {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    against_organization_id: '',
    dispute_type: 'weight_difference',
    severity: 'medium',
    title: '',
    description: '',
    expected_value: '',
    actual_value: '',
  });

  useEffect(() => { fetchDisputes(); }, [shipmentId]);

  const fetchDisputes = async () => {
    const { data } = await supabase
      .from('shipment_disputes')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: false });
    if (data) setDisputes(data);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.against_organization_id) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('shipment_disputes').insert({
        shipment_id: shipmentId,
        raised_by_organization_id: organizationId,
        against_organization_id: form.against_organization_id,
        dispute_type: form.dispute_type,
        severity: form.severity,
        title: form.title,
        description: form.description,
        expected_value: form.expected_value ? parseFloat(form.expected_value) : null,
        actual_value: form.actual_value ? parseFloat(form.actual_value) : null,
      });
      if (error) throw error;
      toast.success('تم تسجيل النزاع بنجاح');
      setOpen(false);
      setForm({ against_organization_id: '', dispute_type: 'weight_difference', severity: 'medium', title: '', description: '', expected_value: '', actual_value: '' });
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (disputeId: string, resolution: string) => {
    const { error } = await supabase.from('shipment_disputes').update({
      status: 'resolved',
      resolution,
      resolved_at: new Date().toISOString(),
    }).eq('id', disputeId);
    if (error) toast.error(error.message);
    else { toast.success('تم حل النزاع'); fetchDisputes(); }
  };

  return (
    <Card>
      <CardHeader className="text-right pb-3">
        <div className="flex items-center justify-between">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 ml-1" /> تسجيل نزاع
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-right">تسجيل نزاع جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Select value={form.against_organization_id} onValueChange={v => setForm(p => ({ ...p, against_organization_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="الطرف المعني..." /></SelectTrigger>
                  <SelectContent>
                    {partnerOrgs.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.name} ({o.type === 'generator' ? 'مولد' : o.type === 'transporter' ? 'ناقل' : 'مدوّر'})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={form.dispute_type} onValueChange={v => setForm(p => ({ ...p, dispute_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(disputeTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(severityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="عنوان النزاع *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="text-right" />
                <Textarea placeholder="وصف تفصيلي *" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="text-right" />
                {form.dispute_type === 'weight_difference' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="الوزن المتوقع" value={form.expected_value} onChange={e => setForm(p => ({ ...p, expected_value: e.target.value }))} />
                    <Input type="number" placeholder="الوزن الفعلي" value={form.actual_value} onChange={e => setForm(p => ({ ...p, actual_value: e.target.value }))} />
                  </div>
                )}
                <Button onClick={handleSubmit} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تسجيل النزاع'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            سجل النزاعات
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {disputes.length > 0 ? (
          <div className="space-y-3">
            {disputes.map(d => (
              <div key={d.id} className="p-3 rounded-lg border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge className={statusConfig[d.status]?.color}>{statusConfig[d.status]?.label}</Badge>
                    <Badge className={severityConfig[d.severity]?.color}>{severityConfig[d.severity]?.label}</Badge>
                  </div>
                  <p className="text-sm font-medium text-right">{d.title}</p>
                </div>
                <p className="text-xs text-muted-foreground text-right">{d.description}</p>
                {d.expected_value && d.actual_value && (
                  <div className="flex items-center gap-2 text-xs">
                    <Scale className="w-3 h-3" />
                    <span>متوقع: {d.expected_value} | فعلي: {d.actual_value} | فرق: {Math.abs(d.expected_value - d.actual_value).toFixed(1)}</span>
                  </div>
                )}
                {d.auto_created && <Badge variant="outline" className="text-xs">تلقائي</Badge>}
                {d.status === 'open' && d.raised_by_organization_id === organizationId && (
                  <Button size="sm" variant="outline" onClick={() => resolveDispute(d.id, 'تم الحل بالاتفاق')}>
                    <CheckCircle2 className="w-3 h-3 ml-1" /> إغلاق
                  </Button>
                )}
                {d.resolution && (
                  <p className="text-xs text-green-600 bg-green-50 dark:bg-green-950/20 p-2 rounded text-right">الحل: {d.resolution}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد نزاعات مسجلة</p>
        )}
      </CardContent>
    </Card>
  );
}
