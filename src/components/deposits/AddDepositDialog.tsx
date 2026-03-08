import { useState, useEffect, useRef } from 'react';
import { preprocessForOCR } from '@/utils/imagePreprocess';
import BankBranchSelector from './BankBranchSelector';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useImpactRecorder } from '@/hooks/useImpactRecorder';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  AlertCircle,
  UserCircle,
  Save,
  Download,
  Trash2,
  PenTool
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { numberToArabicWords, formatEgyptianNumber } from '@/lib/arabicNumberWords';
import SignaturePad, { SignaturePadRef } from '@/components/signature/SignaturePad';

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
  const { recordDepositCreated } = useImpactRecorder();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [aiExtracted, setAiExtracted] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signaturePadRef = useRef<SignaturePadRef>(null);

  // Storage key for saved depositor data
  const SAVED_DATA_KEY = `deposit_saved_data_${profile?.organization_id}`;

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

  // Check for saved data on mount
  useEffect(() => {
    if (profile?.organization_id) {
      const savedData = sessionStorage.getItem(SAVED_DATA_KEY);
      if (savedData) {
        setHasSavedData(true);
      }
    }
  }, [profile?.organization_id, SAVED_DATA_KEY]);

  // Fill depositor data from logged-in user's profile
  const fillFromProfile = () => {
    if (profile) {
      form.setValue('depositorName', profile.full_name || '');
      form.setValue('depositorPhone', profile.phone || '');
      toast.success('تم تعبئة بيانات المودع من حسابك');
    }
  };

  // Load saved depositor data
  const loadSavedData = () => {
    try {
      const savedData = sessionStorage.getItem(SAVED_DATA_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.depositorName) form.setValue('depositorName', parsed.depositorName);
        if (parsed.depositorTitle) form.setValue('depositorTitle', parsed.depositorTitle);
        if (parsed.depositorPosition) form.setValue('depositorPosition', parsed.depositorPosition);
        if (parsed.depositorPhone) form.setValue('depositorPhone', parsed.depositorPhone);
        if (parsed.bankName) form.setValue('bankName', parsed.bankName);
        if (parsed.accountNumber) form.setValue('accountNumber', parsed.accountNumber);
        if (parsed.branchName) form.setValue('branchName', parsed.branchName);
        if (parsed.transferMethod) form.setValue('transferMethod', parsed.transferMethod);
        toast.success('تم تحميل البيانات المحفوظة');
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  // Save depositor data for future use
  const saveDepositorData = (data: DepositFormData) => {
    try {
      const dataToSave = {
        depositorName: data.depositorName,
        depositorTitle: data.depositorTitle,
        depositorPosition: data.depositorPosition,
        depositorPhone: data.depositorPhone,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        branchName: data.branchName,
        transferMethod: data.transferMethod,
      };
      sessionStorage.setItem(SAVED_DATA_KEY, JSON.stringify(dataToSave));
      setHasSavedData(true);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Clear saved data
  const clearSavedData = () => {
    sessionStorage.removeItem(SAVED_DATA_KEY);
    setHasSavedData(false);
    toast.success('تم حذف البيانات المحفوظة');
  };

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

      // Preprocess image for HD OCR (CamScanner quality)
      const processedImage = await preprocessForOCR(base64, {
        grayscale: true, contrast: 60, sharpness: 2, brightness: 10, binarize: 0, maxDimension: 2400, quality: 0.95,
      });

      // Call AI extraction edge function
      const { data, error } = await supabase.functions.invoke('extract-receipt-data', {
        body: { imageBase64: processedImage },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const extracted = data.data;
        
        // Apply extracted data to form
        if (extracted.amount) form.setValue('amount', String(extracted.amount));
        if (extracted.depositor_name) form.setValue('depositorName', extracted.depositor_name);
        if (extracted.bank_name) form.setValue('bankName', extracted.bank_name);
        if (extracted.account_number) form.setValue('accountNumber', extracted.account_number);
        if (extracted.bank_branch) form.setValue('branchName', extracted.bank_branch);
        if (extracted.reference_number) form.setValue('referenceNumber', extracted.reference_number);
        if (extracted.payment_date) {
          form.setValue('depositDate', new Date(extracted.payment_date));
        }
        
        // Detect transfer method
        if (extracted.payment_method) {
          form.setValue('transferMethod', extracted.payment_method);
        }

        setAiExtracted(true);
        setAiConfidence(extracted.confidence || 0.85);
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

    // صورة الإيصال إلزامية للإيداعات البنكية
    const isCashPayment = data.transferMethod === 'cash';
    
    if (!isCashPayment && !receiptFile) {
      toast.error('يجب رفع صورة الإيصال البنكي للمتابعة');
      return;
    }

    // التوقيع إلزامي للإيداعات النقدية
    if (isCashPayment && (!signatureDataUrl || signaturePadRef.current?.isEmpty())) {
      toast.error('يجب التوقيع في خانة التوقيع للإيداعات النقدية');
      return;
    }

    setLoading(true);
    try {
      let receiptUrl = null;
      let signatureUrl = null;

      // Upload receipt if provided
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

      // Upload signature for cash payments
      if (isCashPayment && signatureDataUrl) {
        const signatureBlob = await fetch(signatureDataUrl).then(r => r.blob());
        const signatureFileName = `${profile.organization_id}/signatures/${Date.now()}.png`;

        const { error: sigUploadError } = await supabase.storage
          .from('deposit-receipts')
          .upload(signatureFileName, signatureBlob, { contentType: 'image/png' });

        if (sigUploadError) throw sigUploadError;

        const { data: sigUrlData } = supabase.storage
          .from('deposit-receipts')
          .getPublicUrl(signatureFileName);

        signatureUrl = sigUrlData.publicUrl;
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
        depositor_signature_url: signatureUrl,
        notes: data.notes || null,
        created_by: profile.id,
        ai_extracted_data: aiExtracted ? JSON.stringify(form.getValues()) : null,
        ai_confidence_score: aiConfidence,
        partner_organization_id: selectedPartner?.type === 'organization' ? data.partnerId : null,
        external_partner_id: selectedPartner?.type === 'external' ? data.partnerId : null,
      };
      const { data: depositRow, error } = await supabase
        .from('deposits')
        .insert(insertData)
        .select('id')
        .single();

      if (error) throw error;

      // Record impact event
      if (depositRow) {
        recordDepositCreated(depositRow.id, parseFloat(data.amount), {
          transferMethod: data.transferMethod,
          partnerType: selectedPartner?.type,
        });
      }

      // Save data for future if checkbox is checked
      if (saveForFuture) {
        saveDepositorData(data);
      }

      toast.success('تم تسجيل الإيداع بنجاح!');
      form.reset();
      setReceiptFile(null);
      setReceiptPreview(null);
      setAiExtracted(false);
      setAiConfidence(null);
      setSignatureDataUrl(null);
      signaturePadRef.current?.clear();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving deposit:', error);
      // Check for duplicate entry error
      if (error?.code === '23505' || error?.message?.includes('duplicate') || error?.message?.includes('unique')) {
        toast.error('هذا الإيداع مسجل مسبقاً! (نفس المبلغ والتاريخ ورقم المرجع)');
      } else {
        toast.error('حدث خطأ أثناء حفظ الإيداع');
      }
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
              {/* AI Receipt Scanner - صورة الإيصال إلزامية */}
              <div className={cn(
                "p-4 rounded-xl border-2 border-dashed",
                !receiptFile 
                  ? "border-destructive/50 bg-destructive/5" 
                  : "border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/20"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      صورة الإيصال
                      <Badge variant="destructive" className="text-[10px]">مطلوب</Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      يجب رفع صورة الإيصال الفعلي - سيتم معالجتها واستخراج البيانات تلقائياً
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
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    بيانات المودع
                  </h4>
                  
                  {/* Quick Fill Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fillFromProfile}
                      className="gap-1.5 h-8 text-xs"
                    >
                      <UserCircle className="h-3.5 w-3.5" />
                      من حسابي
                    </Button>
                    
                    {hasSavedData && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={loadSavedData}
                          className="gap-1.5 h-8 text-xs"
                        >
                          <Download className="h-3.5 w-3.5" />
                          المحفوظة
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearSavedData}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
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

                {/* Cash Signature Section - Only for cash payments */}
                {form.watch('transferMethod') === 'cash' && (
                  <div className="space-y-4 p-4 rounded-xl border-2 border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <PenTool className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold flex items-center gap-2">
                          توقيع المودع
                          <Badge variant="destructive" className="text-[10px]">مطلوب للنقدي</Badge>
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          يرجى التوقيع أدناه لتأكيد استلام المبلغ النقدي
                        </p>
                      </div>
                    </div>

                    <div className="bg-background rounded-lg p-3 border">
                      <SignaturePad
                        ref={signaturePadRef}
                        onSignatureChange={setSignatureDataUrl}
                        width={450}
                        height={150}
                        className="mx-auto"
                      />
                    </div>

                    {!signatureDataUrl && (
                      <div className="flex items-center gap-2 text-amber-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>يجب التوقيع للمتابعة مع الإيداع النقدي</span>
                      </div>
                    )}
                  </div>
                )}
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

              {/* Save for future checkbox */}
              <div className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg bg-muted/50 border">
                <Checkbox
                  id="saveForFuture"
                  checked={saveForFuture}
                  onCheckedChange={(checked) => setSaveForFuture(checked as boolean)}
                />
                <label
                  htmlFor="saveForFuture"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="h-4 w-4 text-muted-foreground" />
                  حفظ بيانات المودع للاستخدام المستقبلي
                </label>
              </div>

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
