import { useState, useEffect, useRef } from 'react';
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
  Upload, 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  Building2,
  User,
  Phone,
  CreditCard,
  Landmark,
  Banknote,
  Receipt,
  FileImage,
  Wand2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface AddDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPartnerId?: string;
  preselectedPartnerType?: 'organization' | 'external';
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

export default function AddDepositDialog({
  open,
  onOpenChange,
  preselectedPartnerId,
  preselectedPartnerType,
  onSuccess,
}: AddDepositDialogProps) {
  const { profile } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [aiExtracted, setAiExtracted] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      partnerId: preselectedPartnerId || '',
      partnerType: preselectedPartnerType || 'organization',
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

  // Set preselected partner
  useEffect(() => {
    if (preselectedPartnerId && preselectedPartnerType) {
      form.setValue('partnerId', preselectedPartnerId);
      form.setValue('partnerType', preselectedPartnerType);
    }
  }, [preselectedPartnerId, preselectedPartnerType, form]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setReceiptPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const extractDataWithAI = async () => {
    if (!receiptFile) {
      toast.error('يرجى رفع صورة الإيصال أولاً');
      return;
    }

    setExtracting(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(receiptFile);
      });

      // Call AI extraction edge function
      const { data, error } = await supabase.functions.invoke('extract-receipt-data', {
        body: { image: base64 },
      });

      if (error) throw error;

      if (data?.extracted) {
        const extracted = data.extracted;
        
        // Apply extracted data to form
        if (extracted.amount) form.setValue('amount', String(extracted.amount));
        if (extracted.depositorName) form.setValue('depositorName', extracted.depositorName);
        if (extracted.bankName) form.setValue('bankName', extracted.bankName);
        if (extracted.accountNumber) form.setValue('accountNumber', extracted.accountNumber);
        if (extracted.branchName) form.setValue('branchName', extracted.branchName);
        if (extracted.referenceNumber) form.setValue('referenceNumber', extracted.referenceNumber);
        if (extracted.depositDate) {
          form.setValue('depositDate', new Date(extracted.depositDate));
        }
        
        // Detect transfer method
        if (extracted.transferMethod) {
          const methodMap: Record<string, string> = {
            'bank': 'bank_transfer',
            'instapay': 'instapay',
            'wallet': 'wallet',
            'vodafone cash': 'wallet',
            'cash': 'cash',
            'check': 'check',
          };
          const method = Object.entries(methodMap).find(([key]) => 
            extracted.transferMethod.toLowerCase().includes(key)
          );
          if (method) form.setValue('transferMethod', method[1]);
        }

        setAiExtracted(true);
        setAiConfidence(data.confidence || 0.85);
        toast.success('تم استخراج البيانات بنجاح!');
      }
    } catch (error) {
      console.error('AI extraction error:', error);
      toast.error('حدث خطأ أثناء استخراج البيانات');
    } finally {
      setExtracting(false);
    }
  };

  const onSubmit = async (data: DepositFormData) => {
    if (!profile?.organization_id) return;

    setLoading(true);
    try {
      let receiptUrl = null;

      // Upload receipt if exists
      if (receiptFile) {
        setUploading(true);
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${profile.organization_id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('deposit-receipts')
          .upload(fileName, receiptFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('deposit-receipts')
          .getPublicUrl(fileName);

        receiptUrl = urlData.publicUrl;
        setUploading(false);
      }

      // Find selected partner
      const selectedPartner = partners.find(p => p.id === data.partnerId);

      // Insert deposit
      const insertData = {
        organization_id: profile.organization_id,
        amount: parseFloat(data.amount),
        deposit_date: format(data.depositDate, 'yyyy-MM-dd'),
        depositor_name: data.depositorName,
        depositor_title: data.depositorTitle || null,
        depositor_position: data.depositorPosition || null,
        depositor_phone: data.depositorPhone || null,
        transfer_method: data.transferMethod,
        bank_name: data.bankName || null,
        account_number: data.accountNumber || null,
        branch_name: data.branchName || null,
        reference_number: data.referenceNumber || null,
        receipt_url: receiptUrl,
        notes: data.notes || null,
        created_by: profile.id,
        ai_extracted_data: aiExtracted ? JSON.stringify(form.getValues()) : null,
        ai_confidence_score: aiConfidence,
        partner_organization_id: selectedPartner?.type === 'organization' ? data.partnerId : null,
        external_partner_id: selectedPartner?.type === 'external' ? data.partnerId : null,
      };
      const { error } = await supabase
        .from('deposits')
        .insert(insertData);

      if (error) throw error;

      toast.success('تم تسجيل الإيداع بنجاح!');
      form.reset();
      setReceiptFile(null);
      setReceiptPreview(null);
      setAiExtracted(false);
      setAiConfidence(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving deposit:', error);
      toast.error('حدث خطأ أثناء حفظ الإيداع');
    } finally {
      setLoading(false);
      setUploading(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Banknote className="h-5 w-5" />
            </div>
            تسجيل إيداع جديد
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
              {/* AI Receipt Scanner */}
              <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">استخراج ذكي من الإيصال</h4>
                    <p className="text-xs text-muted-foreground">
                      ارفع صورة الإيصال وسيقوم الذكاء الاصطناعي باستخراج البيانات تلقائياً
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {receiptFile ? 'تغيير الصورة' : 'رفع صورة الإيصال'}
                  </Button>

                  {receiptFile && (
                    <Button
                      type="button"
                      onClick={extractDataWithAI}
                      disabled={extracting}
                      className="gap-2"
                    >
                      {extracting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      استخراج البيانات
                    </Button>
                  )}

                  {aiExtracted && (
                    <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      تم الاستخراج ({Math.round((aiConfidence || 0) * 100)}%)
                    </Badge>
                  )}
                </div>

                {receiptPreview && (
                  <div className="mt-3 relative">
                    <img
                      src={receiptPreview}
                      alt="معاينة الإيصال"
                      className="max-h-32 rounded-lg border object-cover"
                    />
                    <Badge className="absolute top-2 right-2 gap-1">
                      <FileImage className="h-3 w-3" />
                      صورة مرفقة
                    </Badge>
                  </div>
                )}
              </div>

              <Separator />

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
                  render={({ field }) => (
                    <FormItem>
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
                      <FormMessage />
                    </FormItem>
                  )}
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم البنك</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="مثال: البنك الأهلي" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="branchName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الفرع</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="مثال: فرع مدينة نصر" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1 gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {uploading ? 'جاري رفع الإيصال...' : loading ? 'جاري الحفظ...' : 'تسجيل الإيداع'}
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
  );
}
