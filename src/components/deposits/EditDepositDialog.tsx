import { useState, useEffect, useRef } from 'react';
import BankBranchSelector from './BankBranchSelector';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar as CalendarIcon, 
  Loader2, 
  Building2,
  User,
  Phone,
  CreditCard,
  Landmark,
  Banknote,
  Receipt,
  Pencil,
  Save,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { numberToArabicWords, formatEgyptianNumber } from '@/lib/arabicNumberWords';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const depositSchema = z.object({
  partnerId: z.string().min(1, 'يرجى اختيار الجهة'),
  partnerType: z.enum(['organization', 'external']),
  amount: z.string().min(1, 'يرجى إدخال المبلغ'),
  depositDate: z.date(),
  depositorName: z.string().min(1, 'يرجى إدخال اسم المودع'),
  depositorTitle: z.string().optional(),
  depositorPosition: z.string().optional(),
  depositorPhone: z.string().optional(),
  transferMethod: z.string().min(1, 'يرجى اختيار طريقة التحويل'),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  branchName: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type DepositFormData = z.infer<typeof depositSchema>;

interface Partner {
  id: string;
  name: string;
  type: 'organization' | 'external';
  organizationType?: string;
}

interface Deposit {
  id: string;
  amount: number;
  deposit_date: string;
  depositor_name: string;
  depositor_title?: string;
  depositor_position?: string;
  depositor_phone?: string;
  transfer_method: string;
  bank_name?: string;
  account_number?: string;
  branch_name?: string;
  reference_number?: string;
  notes?: string;
  receipt_url?: string;
  partner_organization_id?: string;
  external_partner_id?: string;
}

interface EditDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deposit: Deposit | null;
  onSuccess?: () => void;
}

const transferMethods = [
  { value: 'bank_transfer', label: 'تحويل بنكي', icon: Landmark },
  { value: 'instapay', label: 'انستا باي', icon: Banknote },
  { value: 'wallet', label: 'محفظة إلكترونية', icon: CreditCard },
  { value: 'cash', label: 'نقدي', icon: Banknote },
  { value: 'check', label: 'شيك', icon: Receipt },
  { value: 'other', label: 'أخرى', icon: CreditCard },
];

export default function EditDepositDialog({
  open,
  onOpenChange,
  deposit,
  onSuccess,
}: EditDepositDialogProps) {
  const { profile } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<DepositFormData | null>(null);

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      partnerId: '',
      partnerType: 'organization',
      amount: '',
      depositDate: new Date(),
      depositorName: '',
      depositorTitle: '',
      depositorPosition: '',
      depositorPhone: '',
      transferMethod: 'bank_transfer',
      bankName: '',
      accountNumber: '',
      branchName: '',
      referenceNumber: '',
      notes: '',
    },
  });

  // Load deposit data when opened
  useEffect(() => {
    if (open && deposit) {
      const partnerId = deposit.partner_organization_id || deposit.external_partner_id || '';
      const partnerType = deposit.partner_organization_id ? 'organization' : 'external';
      
      form.reset({
        partnerId,
        partnerType,
        amount: String(deposit.amount),
        depositDate: new Date(deposit.deposit_date),
        depositorName: deposit.depositor_name || '',
        depositorTitle: deposit.depositor_title || '',
        depositorPosition: deposit.depositor_position || '',
        depositorPhone: deposit.depositor_phone || '',
        transferMethod: deposit.transfer_method || 'bank_transfer',
        bankName: deposit.bank_name || '',
        accountNumber: deposit.account_number || '',
        branchName: deposit.branch_name || '',
        referenceNumber: deposit.reference_number || '',
        notes: deposit.notes || '',
      });
    }
  }, [open, deposit, form]);

  // Load partners
  useEffect(() => {
    if (!open || !profile?.organization_id) return;

    const loadPartners = async () => {
      try {
        // Load registered organizations (partners)
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, organization_type')
          .neq('id', profile.organization_id);

        // Load external partners
        const { data: externals } = await supabase
          .from('external_partners')
          .select('id, name, partner_type')
          .eq('organization_id', profile.organization_id)
          .eq('is_active', true);

        const allPartners: Partner[] = [
          ...(orgs?.map(o => ({
            id: o.id,
            name: o.name,
            type: 'organization' as const,
            organizationType: o.organization_type,
          })) || []),
          ...(externals?.map(e => ({
            id: e.id,
            name: e.name,
            type: 'external' as const,
            organizationType: e.partner_type,
          })) || []),
        ];

        setPartners(allPartners);
      } catch (error) {
        console.error('Error loading partners:', error);
      }
    };

    loadPartners();
  }, [open, profile?.organization_id]);

  const handleSubmitClick = (data: DepositFormData) => {
    setPendingData(data);
    setShowConfirmDialog(true);
  };

  const confirmUpdate = async () => {
    if (!pendingData || !deposit?.id || !profile?.organization_id) return;

    setLoading(true);
    setShowConfirmDialog(false);

    try {
      const selectedPartner = partners.find(p => p.id === pendingData.partnerId);

      const updateData = {
        amount: parseFloat(pendingData.amount),
        deposit_date: format(pendingData.depositDate, 'yyyy-MM-dd'),
        depositor_name: pendingData.depositorName,
        depositor_title: pendingData.depositorTitle || null,
        depositor_position: pendingData.depositorPosition || null,
        depositor_phone: pendingData.depositorPhone || null,
        transfer_method: pendingData.transferMethod,
        bank_name: pendingData.bankName || null,
        account_number: pendingData.accountNumber || null,
        branch_name: pendingData.branchName || null,
        reference_number: pendingData.referenceNumber || null,
        notes: pendingData.notes || null,
        partner_organization_id: selectedPartner?.type === 'organization' ? pendingData.partnerId : null,
        external_partner_id: selectedPartner?.type === 'external' ? pendingData.partnerId : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('deposits')
        .update(updateData)
        .eq('id', deposit.id);

      if (error) throw error;

      toast.success('تم تحديث الإيداع بنجاح!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating deposit:', error);
      toast.error('حدث خطأ أثناء تحديث الإيداع');
    } finally {
      setLoading(false);
      setPendingData(null);
    }
  };

  const getPartnerTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      generator: 'مولد',
      recycler: 'مدور',
      transporter: 'ناقل',
      guest: 'ضيف',
    };
    return labels[type || ''] || type;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Pencil className="h-5 w-5" />
              </div>
              تعديل الإيداع
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)] px-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmitClick)} className="space-y-6 p-1">
                {/* Warning Banner */}
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-300">تنبيه</p>
                    <p className="text-amber-700 dark:text-amber-400">
                      تعديل الإيداع سيؤثر على كشف حساب الشريك. تأكد من صحة البيانات قبل الحفظ.
                    </p>
                  </div>
                </div>

                {/* Partner Selection */}
                <FormField
                  control={form.control}
                  name="partnerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        الجهة المستلمة
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          const partner = partners.find(p => p.id === value);
                          if (partner) {
                            form.setValue('partnerType', partner.type);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الجهة..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {partners.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              <div className="flex items-center gap-2">
                                <span>{partner.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {getPartnerTypeLabel(partner.organizationType)}
                                </Badge>
                                {partner.type === 'external' && (
                                  <Badge variant="secondary" className="text-xs">
                                    خارجي
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount and Date */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => {
                      const amountValue = parseFloat(field.value) || 0;
                      const amountInWords = amountValue > 0 ? numberToArabicWords(amountValue) : '';
                      
                      return (
                        <FormItem className="col-span-2 md:col-span-1">
                          <FormLabel className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                            المبلغ (ج.م)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="0.00"
                              className="text-lg font-semibold"
                            />
                          </FormControl>
                          {amountValue > 0 && (
                            <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                                {formatEgyptianNumber(amountValue)} ج.م
                              </p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {amountInWords}
                              </p>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="depositDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          تاريخ الإيداع
                        </FormLabel>
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
                                {field.value
                                  ? format(field.value, 'dd/MM/yyyy', { locale: ar })
                                  : 'اختر التاريخ'}
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

                {/* Depositor Info */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    بيانات المودع
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="depositorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم المودع</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="الاسم الكامل" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="depositorPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            رقم الهاتف
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="01xxxxxxxxx" dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="depositorTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الصفة / اللقب</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="مثال: أستاذ، مهندس" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="depositorPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المنصب / الوظيفة</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="مثال: مدير مالي" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Transfer Details */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                    <Landmark className="h-4 w-4" />
                    تفاصيل التحويل
                  </h4>

                  <FormField
                    control={form.control}
                    name="transferMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>طريقة التحويل</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر طريقة التحويل" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {transferMethods.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                <div className="flex items-center gap-2">
                                  <method.icon className="h-4 w-4" />
                                  {method.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <BankBranchSelector
                    bankName={form.watch('bankName') || ''}
                    branchName={form.watch('branchName') || ''}
                    onBankChange={(val) => form.setValue('bankName', val)}
                    onBranchChange={(val) => form.setValue('branchName', val)}
                  />

                  <div className="grid grid-cols-2 gap-4">

                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <CreditCard className="h-3 w-3" />
                            رقم الحساب
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="رقم الحساب البنكي" dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="referenceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم المرجع / العملية</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="رقم إيصال التحويل" dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات إضافية</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="أي ملاحظات إضافية حول الإيداع..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Receipt Preview if exists */}
                {deposit?.receipt_url && (
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-sm text-muted-foreground mb-2">صورة الإيصال المرفقة:</p>
                    <img
                      src={deposit.receipt_url}
                      alt="إيصال الإيداع"
                      className="max-h-32 rounded-lg border object-cover"
                    />
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تعديل الإيداع</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تعديل هذا الإيداع؟ سيؤثر هذا على كشف حساب الشريك.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdate}>
              تأكيد التعديل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
