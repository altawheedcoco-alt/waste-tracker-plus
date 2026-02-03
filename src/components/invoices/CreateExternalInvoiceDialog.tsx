import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Plus, 
  CalendarIcon, 
  Loader2,
  Trash2,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface CreateExternalInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  externalPartnerId: string;
  partnerName: string;
  onSuccess?: () => void;
}

const invoiceSchema = z.object({
  invoice_type: z.enum(['sales', 'purchase', 'service']),
  invoice_category: z.enum(['shipment', 'service', 'expense', 'other']),
  issue_date: z.date(),
  due_date: z.date().optional(),
  tax_rate: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function CreateExternalInvoiceDialog({
  open,
  onOpenChange,
  externalPartnerId,
  partnerName,
  onSuccess,
}: CreateExternalInvoiceDialogProps) {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [manualItem, setManualItem] = useState({
    description: '',
    quantity: 1,
    unit: 'كجم',
    unitPrice: 0,
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_type: 'sales',
      invoice_category: 'service',
      issue_date: new Date(),
      due_date: addDays(new Date(), 30),
      tax_rate: 0,
      discount_amount: 0,
      notes: '',
      terms: 'الدفع خلال 30 يوم من تاريخ الفاتورة',
    },
  });

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = form.watch('tax_rate') || 0;
    const discountAmount = form.watch('discount_amount') || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discountAmount;
    
    return {
      subtotal,
      taxAmount,
      discountAmount,
      total,
    };
  }, [items, form.watch('tax_rate'), form.watch('discount_amount')]);

  // Add manual item
  const addManualItem = () => {
    if (!manualItem.description || manualItem.quantity <= 0 || manualItem.unitPrice <= 0) {
      toast.error('يرجى ملء جميع بيانات البند');
      return;
    }

    setItems(prev => [
      ...prev,
      {
        description: manualItem.description,
        quantity: manualItem.quantity,
        unit: manualItem.unit,
        unitPrice: manualItem.unitPrice,
        total: manualItem.quantity * manualItem.unitPrice,
      },
    ]);

    setManualItem({ description: '', quantity: 1, unit: 'كجم', unitPrice: 0 });
  };

  // Remove item
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      if (!organization?.id) throw new Error('لا توجد مؤسسة');
      if (items.length === 0) throw new Error('يجب إضافة بند واحد على الأقل');

      // Generate invoice number
      const invoiceNumber = `INV-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Create invoice (external partner - no partner_organization_id)
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          organization_id: organization.id,
          partner_name: partnerName,
          invoice_type: data.invoice_type,
          invoice_category: data.invoice_category,
          status: 'pending',
          issue_date: format(data.issue_date, 'yyyy-MM-dd'),
          due_date: data.due_date ? format(data.due_date, 'yyyy-MM-dd') : null,
          subtotal: calculations.subtotal,
          tax_rate: data.tax_rate,
          tax_amount: calculations.taxAmount,
          discount_amount: data.discount_amount,
          total_amount: calculations.total,
          remaining_amount: calculations.total,
          notes: data.notes,
          terms: data.terms,
          created_by: user?.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice,
        total_price: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      return invoice;
    },
    onSuccess: (invoice) => {
      toast.success(`تم إنشاء الفاتورة ${invoice.invoice_number} بنجاح`);
      queryClient.invalidateQueries({ queryKey: ['external-partner-invoices'] });
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'حدث خطأ أثناء إنشاء الفاتورة');
    },
  });

  const resetForm = () => {
    form.reset();
    setItems([]);
    setManualItem({ description: '', quantity: 1, unit: 'كجم', unitPrice: 0 });
  };

  const onSubmit = (data: InvoiceFormData) => {
    createInvoice.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            إنشاء فاتورة - {partnerName}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 px-1">
              <div className="space-y-6 pb-4">
                {/* Invoice Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="invoice_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع الفاتورة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر النوع" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sales">مبيعات</SelectItem>
                            <SelectItem value="purchase">مشتريات</SelectItem>
                            <SelectItem value="service">خدمات</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="invoice_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تصنيف الفاتورة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر التصنيف" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="shipment">شحنات</SelectItem>
                            <SelectItem value="service">خدمات</SelectItem>
                            <SelectItem value="expense">مصروفات</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issue_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ الإصدار</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-right font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="ml-2 h-4 w-4" />
                                {field.value ? format(field.value, 'dd/MM/yyyy', { locale: ar }) : 'اختر التاريخ'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ الاستحقاق</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-right font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="ml-2 h-4 w-4" />
                                {field.value ? format(field.value, 'dd/MM/yyyy', { locale: ar }) : 'اختر التاريخ'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Manual Item Entry */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة بند
                  </h4>
                  <div className="grid grid-cols-5 gap-2 items-end">
                    <div className="col-span-2">
                      <label className="text-sm text-muted-foreground">الوصف</label>
                      <Input
                        value={manualItem.description}
                        onChange={(e) => setManualItem(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="وصف البند"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">الكمية</label>
                      <Input
                        type="number"
                        value={manualItem.quantity}
                        onChange={(e) => setManualItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">السعر</label>
                      <Input
                        type="number"
                        value={manualItem.unitPrice}
                        onChange={(e) => setManualItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                        min={0}
                      />
                    </div>
                    <Button type="button" onClick={addManualItem} variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Invoice Items */}
                {items.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">بنود الفاتورة ({items.length})</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-right p-2 font-medium">الوصف</th>
                            <th className="text-center p-2 font-medium">الكمية</th>
                            <th className="text-center p-2 font-medium">السعر</th>
                            <th className="text-center p-2 font-medium">الإجمالي</th>
                            <th className="p-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{item.description}</td>
                              <td className="text-center p-2">{item.quantity} {item.unit}</td>
                              <td className="text-center p-2">{formatCurrency(item.unitPrice)}</td>
                              <td className="text-center p-2 font-medium">{formatCurrency(item.total)} ج.م</td>
                              <td className="p-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => removeItem(index)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tax & Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tax_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نسبة الضريبة (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            min={0}
                            max={100}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discount_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الخصم (ج.م)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            min={0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Totals Summary */}
                <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المجموع الفرعي:</span>
                    <span>{formatCurrency(calculations.subtotal)} ج.م</span>
                  </div>
                  {calculations.taxAmount > 0 && (
                    <div className="flex justify-between text-warning">
                      <span>الضريبة ({form.watch('tax_rate')}%):</span>
                      <span>+ {formatCurrency(calculations.taxAmount)} ج.م</span>
                    </div>
                  )}
                  {calculations.discountAmount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>الخصم:</span>
                      <span>- {formatCurrency(calculations.discountAmount)} ج.م</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>الإجمالي:</span>
                    <span className="text-primary">{formatCurrency(calculations.total)} ج.م</span>
                  </div>
                </div>

                {/* Notes & Terms */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ملاحظات</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="ملاحظات الفاتورة..." rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شروط الدفع</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="شروط وأحكام الدفع..." rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calculator className="h-4 w-4" />
                <span>{items.length} بند • {formatCurrency(calculations.total)} ج.م</span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={items.length === 0 || createInvoice.isPending}
                  className="gap-2"
                >
                  {createInvoice.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  إنشاء الفاتورة
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
