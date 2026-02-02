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
import { useAccounting, InvoiceItem } from '@/hooks/useAccounting';
import { usePartners } from '@/hooks/usePartners';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
  const { organization } = useAuth();
  const { createInvoice } = useAccounting();
  const { partners } = usePartners();
  
  const [formData, setFormData] = useState({
    partner_organization_id: '',
    partner_name: '',
    invoice_type: 'sales' as 'sales' | 'purchase' | 'service',
    invoice_category: 'shipment' as 'shipment' | 'service' | 'expense' | 'other',
    due_date: '',
    tax_rate: 0,
    discount_amount: 0,
    notes: '',
    terms: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit: 'unit', unit_price: 0, total_price: 0 }
  ]);

  // Fetch available shipments for linking
  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments-for-invoice', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, status')
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id && open,
  });

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit: 'unit', unit_price: 0, total_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total_price
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = subtotal * (formData.tax_rate / 100);
    const total = subtotal + taxAmount - formData.discount_amount;
    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const handleSubmit = async () => {
    const selectedPartner = partners.find(p => p.id === formData.partner_organization_id);
    
    await createInvoice.mutateAsync({
      ...formData,
      partner_name: selectedPartner?.name || formData.partner_name,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      remaining_amount: total,
      issue_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      items,
    });
    
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      partner_organization_id: '',
      partner_name: '',
      invoice_type: 'sales',
      invoice_category: 'shipment',
      due_date: '',
      tax_rate: 0,
      discount_amount: 0,
      notes: '',
      terms: '',
    });
    setItems([{ description: '', quantity: 1, unit: 'unit', unit_price: 0, total_price: 0 }]);
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
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
              <Label>أو اسم الشريك يدوياً</Label>
              <Input
                value={formData.partner_name}
                onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                placeholder="اسم الشريك (إذا لم يكن في النظام)"
              />
            </div>

            <div className="space-y-2">
              <Label>نوع الفاتورة</Label>
              <Select
                value={formData.invoice_type}
                onValueChange={(value: any) => setFormData({ ...formData, invoice_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">مبيعات</SelectItem>
                  <SelectItem value="purchase">مشتريات</SelectItem>
                  <SelectItem value="service">خدمات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>تصنيف الفاتورة</Label>
              <Select
                value={formData.invoice_category}
                onValueChange={(value: any) => setFormData({ ...formData, invoice_category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipment">شحنات</SelectItem>
                  <SelectItem value="service">خدمات</SelectItem>
                  <SelectItem value="expense">مصروفات</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>تاريخ الاستحقاق</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>نسبة الضريبة (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">بنود الفاتورة</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 ml-1" />
                إضافة بند
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 md:col-span-4 space-y-1">
                      <Label className="text-xs">الوصف</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="وصف البند"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2 space-y-1">
                      <Label className="text-xs">الكمية</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2 space-y-1">
                      <Label className="text-xs">الوحدة</Label>
                      <Select
                        value={item.unit}
                        onValueChange={(value) => handleItemChange(index, 'unit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unit">وحدة</SelectItem>
                          <SelectItem value="kg">كجم</SelectItem>
                          <SelectItem value="ton">طن</SelectItem>
                          <SelectItem value="trip">رحلة</SelectItem>
                          <SelectItem value="hour">ساعة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4 md:col-span-2 space-y-1">
                      <Label className="text-xs">سعر الوحدة</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-10 md:col-span-1 space-y-1">
                      <Label className="text-xs">الإجمالي</Label>
                      <div className="h-10 flex items-center font-semibold text-sm">
                        {formatCurrency(item.total_price)}
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Totals */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>الضريبة ({formData.tax_rate}%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>الخصم:</span>
                  <Input
                    type="number"
                    min="0"
                    className="w-32"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>الإجمالي:</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
              disabled={createInvoice.isPending || items.every(i => !i.description)}
            >
              {createInvoice.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              إنشاء الفاتورة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
