import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccounting } from '@/hooks/useAccounting';
import { usePartners } from '@/hooks/usePartners';
import { Loader2, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface CreatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreatePaymentDialog({ open, onOpenChange }: CreatePaymentDialogProps) {
  const { invoices, createPayment } = useAccounting();
  const { partners } = usePartners();
  
  const [formData, setFormData] = useState({
    payment_type: 'incoming' as 'incoming' | 'outgoing',
    partner_organization_id: '',
    partner_name: '',
    invoice_id: '',
    amount: 0,
    payment_method: 'cash' as 'cash' | 'bank_transfer' | 'check' | 'card' | 'other',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    bank_name: '',
    check_number: '',
    notes: '',
  });

  // Filter invoices based on payment type
  const availableInvoices = invoices.filter(inv => {
    if (formData.payment_type === 'incoming') {
      return inv.status !== 'paid' && inv.status !== 'cancelled' && inv.invoice_type === 'sales';
    }
    return inv.status !== 'paid' && inv.status !== 'cancelled' && inv.invoice_type === 'purchase';
  });

  const handleSubmit = async () => {
    const selectedPartner = partners.find(p => p.id === formData.partner_organization_id);
    
    await createPayment.mutateAsync({
      ...formData,
      partner_name: selectedPartner?.name || formData.partner_name,
      invoice_id: formData.invoice_id || undefined,
      partner_organization_id: formData.partner_organization_id || undefined,
    });
    
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      payment_type: 'incoming',
      partner_organization_id: '',
      partner_name: '',
      invoice_id: '',
      amount: 0,
      payment_method: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      bank_name: '',
      check_number: '',
      notes: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Type */}
          <div className="space-y-3">
            <Label>نوع الدفعة</Label>
            <RadioGroup
              value={formData.payment_type}
              onValueChange={(value: 'incoming' | 'outgoing') => 
                setFormData({ ...formData, payment_type: value, invoice_id: '' })
              }
              className="flex gap-4"
            >
              <Card 
                className={`flex-1 cursor-pointer transition-all ${
                  formData.payment_type === 'incoming' 
                    ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/30' 
                    : ''
                }`}
                onClick={() => setFormData({ ...formData, payment_type: 'incoming', invoice_id: '' })}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <RadioGroupItem value="incoming" id="incoming" />
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="h-5 w-5 text-green-600" />
                    <Label htmlFor="incoming" className="cursor-pointer">
                      دفعة واردة
                    </Label>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className={`flex-1 cursor-pointer transition-all ${
                  formData.payment_type === 'outgoing' 
                    ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-950/30' 
                    : ''
                }`}
                onClick={() => setFormData({ ...formData, payment_type: 'outgoing', invoice_id: '' })}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <RadioGroupItem value="outgoing" id="outgoing" />
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-red-600" />
                    <Label htmlFor="outgoing" className="cursor-pointer">
                      دفعة صادرة
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          {/* Partner Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الشريك</Label>
              <Select
                value={formData.partner_organization_id}
                onValueChange={(value) => setFormData({ ...formData, partner_organization_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشريك" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>أو اسم يدوي</Label>
              <Input
                value={formData.partner_name}
                onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                placeholder="اسم الشريك"
              />
            </div>
          </div>

          {/* Link to Invoice */}
          {availableInvoices.length > 0 && (
            <div className="space-y-2">
              <Label>ربط بفاتورة (اختياري)</Label>
              <Select
                value={formData.invoice_id}
                onValueChange={(value) => {
                  const invoice = invoices.find(i => i.id === value);
                  setFormData({ 
                    ...formData, 
                    invoice_id: value,
                    amount: invoice?.remaining_amount || formData.amount 
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر فاتورة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون ربط</SelectItem>
                  {availableInvoices.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_number} - المتبقي: {formatCurrency(inv.remaining_amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount and Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المبلغ</Label>
              <Input
                type="number"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label>تاريخ الدفع</Label>
              <Input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value: any) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                  <SelectItem value="check">شيك</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>رقم المرجع</Label>
              <Input
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="رقم الإيصال / التحويل"
              />
            </div>
          </div>

          {/* Bank/Check Details */}
          {(formData.payment_method === 'bank_transfer' || formData.payment_method === 'check') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم البنك</Label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="اسم البنك"
                />
              </div>
              {formData.payment_method === 'check' && (
                <div className="space-y-2">
                  <Label>رقم الشيك</Label>
                  <Input
                    value={formData.check_number}
                    onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
                    placeholder="رقم الشيك"
                  />
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ملاحظات إضافية..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createPayment.isPending || formData.amount <= 0}
              className={formData.payment_type === 'incoming' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {createPayment.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              تسجيل الدفعة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
