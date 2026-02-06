import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar as CalendarIcon, 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  Building2,
  User,
  Phone,
  Mail,
  CreditCard,
  Landmark,
  Banknote,
  Receipt,
  Wand2,
  AlertCircle,
  Send,
  Camera,
  Image as ImageIcon,
  ArrowLeft,
  Recycle,
  Package,
  Lock,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { numberToArabicWords, formatEgyptianNumber } from '@/lib/arabicNumberWords';
import logo from '@/assets/logo.png';

const depositSchema = z.object({
  amount: z.string().min(1, 'يرجى إدخال المبلغ'),
  depositDate: z.date(),
  submitterName: z.string().min(1, 'يرجى إدخال اسم المودع'),
  recipientName: z.string().optional(),
  submitterPhone: z.string().optional(),
  submitterEmail: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  transferMethod: z.string().min(1, 'يرجى اختيار طريقة التحويل'),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  accountNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
  checkNumber: z.string().optional(),
  notes: z.string().optional(),
});

type DepositFormData = z.infer<typeof depositSchema>;

interface DepositLink {
  id: string;
  organization_id: string;
  token: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
  preset_partner_id: string | null;
  preset_external_partner_id: string | null;
  preset_waste_type: string | null;
  preset_category: string | null;
  preset_notes: string | null;
  allow_amount_edit: boolean;
  allow_date_edit: boolean;
  allow_partner_edit: boolean;
  require_receipt: boolean;
  usage_count: number;
  last_used_at: string | null;
  organization_name?: string;
  organization_logo?: string | null;
  partner_name?: string | null;
  // Receipt preset fields
  preset_amount: number | null;
  preset_bank_name: string | null;
  preset_account_number: string | null;
  preset_depositor_name: string | null;
  preset_recipient_name: string | null;
  preset_branch: string | null;
  preset_reference_number: string | null;
  preset_payment_method: string | null;
}

const transferMethods = [
  { value: 'bank_transfer', label: 'تحويل بنكي', icon: Landmark },
  { value: 'instapay', label: 'انستا باي', icon: Banknote },
  { value: 'wallet', label: 'محفظة إلكترونية', icon: CreditCard },
  { value: 'cash', label: 'نقدي', icon: Banknote },
  { value: 'check', label: 'شيك', icon: Receipt },
  { value: 'other', label: 'أخرى', icon: CreditCard },
];

const wasteTypes = [
  { value: 'wood', label: 'أخشاب' },
  { value: 'plastic', label: 'بلاستيك' },
  { value: 'paper', label: 'ورق' },
  { value: 'metal', label: 'معادن' },
  { value: 'glass', label: 'زجاج' },
  { value: 'organic', label: 'عضوي' },
  { value: 'electronic', label: 'إلكتروني' },
  { value: 'hazardous', label: 'خطر' },
  { value: 'mixed', label: 'مختلط' },
  { value: 'other', label: 'أخرى' },
];

const QuickDeposit = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [linkData, setLinkData] = useState<DepositLink | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [expired, setExpired] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<DepositFormData | null>(null);
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [aiExtracted, setAiExtracted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: '',
      depositDate: new Date(),
      submitterName: '',
      recipientName: '',
      submitterPhone: '',
      submitterEmail: '',
      transferMethod: 'bank_transfer',
      bankName: '',
      bankBranch: '',
      accountNumber: '',
      referenceNumber: '',
      checkNumber: '',
      notes: '',
    },
  });

  // Load deposit link data
  useEffect(() => {
    const loadLinkData = async () => {
      if (!token) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // First get the link data
        const { data: linkResult, error: linkError } = await supabase
          .from('organization_deposit_links')
          .select('*')
          .eq('token', token)
          .eq('is_active', true)
          .single();

        if (linkError || !linkResult) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Check if expired
        if (linkResult.expires_at && new Date(linkResult.expires_at) < new Date()) {
          setExpired(true);
          setLoading(false);
          return;
        }

        // Get organization data
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name, logo_url')
          .eq('id', linkResult.organization_id)
          .single();

        // Get partner name if preset
        let partnerName = null;
        if (linkResult.preset_partner_id) {
          const { data: partnerOrg } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', linkResult.preset_partner_id)
            .single();
          partnerName = partnerOrg?.name;
        } else if (linkResult.preset_external_partner_id) {
          const { data: externalPartner } = await supabase
            .from('external_partners')
            .select('name')
            .eq('id', linkResult.preset_external_partner_id)
            .single();
          partnerName = externalPartner?.name;
        }

        const fullLinkData: DepositLink = {
          ...linkResult,
          organization_name: orgData?.name,
          organization_logo: orgData?.logo_url,
          partner_name: partnerName,
        };

        setLinkData(fullLinkData);

        // Set preset values if available
        if (linkResult.preset_notes) {
          form.setValue('notes', linkResult.preset_notes);
        }
        if (linkResult.preset_amount) {
          form.setValue('amount', String(linkResult.preset_amount));
        }
        if (linkResult.preset_bank_name) {
          form.setValue('bankName', linkResult.preset_bank_name);
        }
        if (linkResult.preset_depositor_name) {
          form.setValue('submitterName', linkResult.preset_depositor_name);
        }
        if (linkResult.preset_recipient_name) {
          form.setValue('recipientName', linkResult.preset_recipient_name);
        }
        if (linkResult.preset_reference_number) {
          form.setValue('referenceNumber', linkResult.preset_reference_number);
        }
        if (linkResult.preset_payment_method) {
          form.setValue('transferMethod', linkResult.preset_payment_method);
        }
      } catch (error) {
        console.error('Error loading deposit link:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadLinkData();
  }, [token]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Result = e.target?.result as string;
      setReceiptPreview(base64Result);
      
      // Auto-extract data with AI when image is uploaded
      await extractDataFromImage(base64Result, file);
    };
    reader.readAsDataURL(file);
  };

  const extractDataFromImage = async (base64: string, file: File) => {
    setExtracting(true);
    try {
      // First, upload to storage immediately for document archiving
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `temp/${Date.now()}_receipt.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('deposit-receipts')
        .upload(fileName, file);

      if (uploadError) {
        console.warn('Pre-upload warning:', uploadError);
      }

      // Then extract data with AI
      const { data, error } = await supabase.functions.invoke('extract-receipt-data', {
        body: { imageBase64: base64 },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const extracted = data.data;
        
        // Fill all available fields
        if (extracted.amount && linkData?.allow_amount_edit) {
          form.setValue('amount', String(extracted.amount));
        }
        if (extracted.depositor_name) {
          form.setValue('submitterName', extracted.depositor_name);
        }
        if (extracted.bank_name) {
          form.setValue('bankName', extracted.bank_name);
        }
        if (extracted.bank_branch) {
          form.setValue('bankBranch', extracted.bank_branch);
        }
        if (extracted.account_number) {
          form.setValue('accountNumber', extracted.account_number);
        }
        if (extracted.reference_number) {
          form.setValue('referenceNumber', extracted.reference_number);
        }
        if (extracted.check_number) {
          form.setValue('checkNumber', extracted.check_number);
        }
        if (extracted.payment_date && linkData?.allow_date_edit) {
          try {
            form.setValue('depositDate', new Date(extracted.payment_date));
          } catch (e) {
            console.warn('Invalid date:', extracted.payment_date);
          }
        }
        if (extracted.payment_method) {
          form.setValue('transferMethod', extracted.payment_method);
        }
        if (extracted.notes) {
          const currentNotes = form.getValues('notes') || '';
          form.setValue('notes', currentNotes ? `${currentNotes}\n${extracted.notes}` : extracted.notes);
        }

        setAiExtracted(true);
        
        const confidencePercent = Math.round((extracted.confidence || 0) * 100);
        toast.success(`✨ تم استخراج البيانات تلقائياً (دقة ${confidencePercent}%)`);
      }
    } catch (error) {
      console.error('AI extraction error:', error);
      toast.error('تعذر استخراج البيانات تلقائياً، يمكنك إدخالها يدوياً');
    } finally {
      setExtracting(false);
    }
  };

  const extractDataWithAI = async () => {
    if (!receiptFile || !receiptPreview) {
      toast.error('يرجى رفع صورة الإيصال أولاً');
      return;
    }
    // Use the already extracted function
    await extractDataFromImage(receiptPreview, receiptFile);
  };

  const onSubmit = async (data: DepositFormData) => {
    if (!linkData) return;

    // صورة الإيصال إلزامية دائماً - قاعدة أساسية
    if (!receiptFile) {
      toast.error('يجب رفع صورة الإيصال الفعلي للمتابعة');
      return;
    }

    setSubmitting(true);
    try {
      let receiptUrl = null;

      // Upload receipt if exists
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `public/${linkData.organization_id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('deposit-receipts')
          .upload(fileName, receiptFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('deposit-receipts')
            .getPublicUrl(fileName);
          receiptUrl = urlData.publicUrl;
        }
      }

      // Build deposit record with preset data and all extracted fields
      const depositRecord: any = {
        organization_id: linkData.organization_id,
        amount: parseFloat(data.amount),
        deposit_date: format(data.depositDate, 'yyyy-MM-dd'),
        depositor_name: data.submitterName,
        depositor_phone: data.submitterPhone || null,
        transfer_method: data.transferMethod,
        bank_name: data.bankName || null,
        bank_branch: data.bankBranch || null,
        account_number: data.accountNumber || null,
        reference_number: data.referenceNumber || null,
        check_number: data.checkNumber || null,
        receipt_url: receiptUrl,
        notes: data.notes || null,
        deposit_link_id: linkData.id,
        submitter_name: data.submitterName,
        submitter_phone: data.submitterPhone || null,
        submitter_email: data.submitterEmail || null,
        is_public_submission: true,
        waste_type: linkData.preset_waste_type,
        category: linkData.preset_category,
        ai_extracted: aiExtracted, // Track if data was AI-extracted
      };

      // Add partner reference based on preset
      if (linkData.preset_partner_id) {
        depositRecord.partner_organization_id = linkData.preset_partner_id;
      }
      if (linkData.preset_external_partner_id) {
        depositRecord.partner_external_id = linkData.preset_external_partner_id;
      }

      const { error } = await supabase
        .from('deposits')
        .insert(depositRecord);

      if (error) throw error;

      // Update link usage statistics
      await supabase
        .from('organization_deposit_links')
        .update({ 
          usage_count: (linkData.usage_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', linkData.id);

      setSubmittedData(data);
      setSubmitted(true);
      toast.success('🎉 تم إرسال الإيداع بنجاح!');
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast.error('حدث خطأ أثناء إرسال الإيداع');
    } finally {
      setSubmitting(false);
    }
  };

  const getWasteTypeLabel = (value: string | null) => {
    if (!value) return null;
    return wasteTypes.find(w => w.value === value)?.label || value;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-destructive/5 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold mb-2">الرابط غير موجود</h1>
            <p className="text-muted-foreground mb-6">
              عذراً، هذا الرابط غير صالح أو تم حذفه
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired state
  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-500/5 via-background to-amber-500/5 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">انتهت صلاحية الرابط</h1>
            <p className="text-muted-foreground mb-6">
              عذراً، انتهت صلاحية هذا الرابط. يرجى التواصل مع الجهة للحصول على رابط جديد.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state with detailed confirmation
  if (submitted && submittedData) {
    const depositAmount = parseFloat(submittedData.amount) || 0;
    const amountInWords = numberToArabicWords(depositAmount);
    const transferMethodLabel = transferMethods.find(m => m.value === submittedData.transferMethod)?.label || submittedData.transferMethod;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-500/10 via-background to-primary/10 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg w-full"
        >
          <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/30 dark:to-background">
            <CardContent className="pt-8 pb-6">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>

              <h1 className="text-2xl font-bold mb-2 text-emerald-700 dark:text-emerald-400 text-center">
                تم الإيداع بنجاح!
              </h1>
              
              {/* Deposit Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 p-4 rounded-xl bg-white dark:bg-background border space-y-4"
              >
                {/* Amount Display */}
                <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">المبلغ المودع</p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatEgyptianNumber(depositAmount)} ج.م
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    {amountInWords}
                  </p>
                </div>

                {/* Deposit Details */}
                <div className="space-y-3 text-sm">
                  {/* To Company */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <Building2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">تم الإيداع في حساب</p>
                      <p className="font-bold text-blue-800 dark:text-blue-200">
                        {linkData?.organization_name}
                      </p>
                    </div>
                  </div>

                  {/* From Company/Partner */}
                  {linkData?.partner_name && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                      <Building2 className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-purple-600 dark:text-purple-400">من شركة</p>
                        <p className="font-bold text-purple-800 dark:text-purple-200">
                          {linkData.partner_name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Depositor Name */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">المودع</p>
                      <p className="font-semibold">{submittedData.submitterName}</p>
                    </div>
                  </div>

                  {/* Transfer Method */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">طريقة الإيداع</p>
                      <p className="font-semibold">{transferMethodLabel}</p>
                    </div>
                  </div>

                  {/* Bank Details */}
                  {submittedData.bankName && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Landmark className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">البنك</p>
                        <p className="font-semibold">
                          {submittedData.bankName}
                          {submittedData.bankBranch && ` - فرع ${submittedData.bankBranch}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reference Number */}
                  {submittedData.referenceNumber && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Receipt className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">رقم المرجع</p>
                        <p className="font-semibold font-mono" dir="ltr">{submittedData.referenceNumber}</p>
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاريخ الإيداع</p>
                      <p className="font-semibold">
                        {format(submittedData.depositDate, 'EEEE، dd MMMM yyyy', { locale: ar })}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {submittedData.notes && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">ملاحظات</p>
                        <p className="text-sm">{submittedData.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Thank You & Branding */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/10 via-emerald-500/5 to-accent/10 border border-primary/20"
              >
                <div className="flex justify-center mb-3">
                  <img src={logo} alt="iRecycle" className="h-12 w-auto" />
                </div>
                <p className="text-base font-bold text-foreground mb-1 text-center">
                  شكراً لثقتكم بنا
                </p>
                <p className="text-sm text-muted-foreground mb-2 text-center">
                  نقدر تعاملكم معنا ونتطلع لخدمتكم دائماً
                </p>
                <p className="text-xs font-medium text-primary text-center">
                  iRecycle Waste Management System
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Recycle className="h-4 w-4 text-emerald-500" />
                  <span>معاً نحو بيئة أنظف</span>
                </div>
              </motion.div>

              <div className="flex gap-3 justify-center mt-6">
                <Button 
                  onClick={() => {
                    setSubmitted(false);
                    setSubmittedData(null);
                    form.reset();
                    if (linkData?.preset_notes) {
                      form.setValue('notes', linkData.preset_notes);
                    }
                    if (linkData?.preset_amount) {
                      form.setValue('amount', String(linkData.preset_amount));
                    }
                    if (linkData?.preset_bank_name) {
                      form.setValue('bankName', linkData.preset_bank_name);
                    }
                    if (linkData?.preset_depositor_name) {
                      form.setValue('submitterName', linkData.preset_depositor_name);
                    }
                    if (linkData?.preset_payment_method) {
                      form.setValue('transferMethod', linkData.preset_payment_method);
                    }
                    setReceiptFile(null);
                    setReceiptPreview(null);
                    setAiExtracted(false);
                  }} 
                  variant="outline"
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  إرسال إيداع آخر
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            {linkData?.organization_logo ? (
              <img 
                src={linkData.organization_logo} 
                alt={linkData.organization_name}
                className="h-14 w-14 rounded-xl object-contain border shadow-sm"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
            )}
            <img src={logo} alt="iRecycle" className="h-10 w-10" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {linkData?.title || 'إيداع سريع'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {linkData?.organization_name}
          </p>
          {linkData?.description && (
            <p className="text-sm text-muted-foreground mt-2 bg-muted/50 rounded-lg p-3">
              {linkData.description}
            </p>
          )}
        </motion.div>

        {/* Preset Info Banner */}
        {(linkData?.partner_name || linkData?.preset_waste_type || linkData?.preset_category) && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="mb-4"
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">بيانات محددة مسبقاً</p>
                    <div className="flex flex-wrap gap-2">
                      {linkData?.partner_name && (
                        <Badge variant="secondary" className="gap-1">
                          <Building2 className="h-3 w-3" />
                          {linkData.partner_name}
                        </Badge>
                      )}
                      {linkData?.preset_waste_type && (
                        <Badge variant="secondary" className="gap-1">
                          <Package className="h-3 w-3" />
                          {getWasteTypeLabel(linkData.preset_waste_type)}
                        </Badge>
                      )}
                      {linkData?.preset_category && (
                        <Badge variant="outline" className="text-xs">
                          {linkData.preset_category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Form Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl border-2">
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Receipt Upload Section - صورة الإيصال إلزامية دائماً */}
                  <div className={cn(
                    "p-4 rounded-xl border-2 border-dashed",
                    !receiptFile 
                      ? "border-destructive/50 bg-destructive/5" 
                      : "border-emerald-400 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20"
                  )}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm">
                        صورة الإيصال *
                      </span>
                      <Badge variant="destructive" className="text-xs gap-1">
                        <Lock className="h-3 w-3" />
                        مطلوب
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      يجب رفع صورة واضحة للإيصال الفعلي - سيتم معالجتها تلقائياً لتحسين القراءة
                    </p>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {!receiptPreview ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex-1 gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          الكاميرا
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 gap-2"
                        >
                          <ImageIcon className="h-4 w-4" />
                          اختيار صورة
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative rounded-lg overflow-hidden">
                          <img
                            src={receiptPreview}
                            alt="معاينة الإيصال"
                            className="w-full h-40 object-cover"
                          />
                          {extracting && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="text-center text-white">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                <p className="text-sm">جاري تحليل الإيصال...</p>
                              </div>
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-2 left-2"
                            disabled={extracting}
                          >
                            تغيير
                          </Button>
                        </div>
                        
                        {aiExtracted ? (
                          <Badge variant="secondary" className="w-full justify-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            تم استخراج البيانات تلقائياً
                          </Badge>
                        ) : !extracting && (
                          <Button
                            type="button"
                            onClick={extractDataWithAI}
                            disabled={extracting}
                            size="sm"
                            className="w-full gap-2"
                            variant="outline"
                          >
                            <Wand2 className="h-4 w-4" />
                            إعادة استخراج البيانات
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
                          المبلغ (ج.م) *
                          {!linkData?.allow_amount_edit && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Lock className="h-3 w-3" />
                              ثابت
                            </Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            className="text-lg font-semibold"
                            dir="ltr"
                            disabled={!linkData?.allow_amount_edit}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date */}
                  <FormField
                    control={form.control}
                    name="depositDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          تاريخ الإيداع *
                          {!linkData?.allow_date_edit && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Lock className="h-3 w-3" />
                              ثابت
                            </Badge>
                          )}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                disabled={!linkData?.allow_date_edit}
                                className={cn(
                                  "w-full justify-start text-right font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ar })
                                ) : (
                                  "اختر التاريخ"
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Transfer Method */}
                  <FormField
                    control={form.control}
                    name="transferMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          طريقة الدفع *
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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

                  {/* Bank Name */}
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Landmark className="h-4 w-4" />
                          اسم البنك
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: البنك الأهلي" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Bank Branch */}
                  <FormField
                    control={form.control}
                    name="bankBranch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          فرع البنك
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="اسم الفرع" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Account Number */}
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          رقم الحساب
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="رقم الحساب البنكي" {...field} dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Reference Number */}
                  <FormField
                    control={form.control}
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          رقم المرجع / الإيصال
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="رقم العملية أو الإيصال" {...field} dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Check Number */}
                  <FormField
                    control={form.control}
                    name="checkNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          رقم الشيك (إن وجد)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="رقم الشيك" {...field} dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">بيانات المودع والمستلم</p>
                    
                    {/* Submitter Name */}
                    <FormField
                      control={form.control}
                      name="submitterName"
                      render={({ field }) => (
                        <FormItem className="mb-3">
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            اسم المودع *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="اسم الشخص الذي يقوم بالإيداع" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Recipient Name */}
                    <FormField
                      control={form.control}
                      name="recipientName"
                      render={({ field }) => (
                        <FormItem className="mb-3">
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            اسم المودع إليه (المستفيد)
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="اسم المستلم أو المستفيد" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submitter Phone */}
                    <FormField
                      control={form.control}
                      name="submitterPhone"
                      render={({ field }) => (
                        <FormItem className="mb-3">
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            رقم الهاتف
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="01xxxxxxxxx" {...field} dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submitter Email */}
                    <FormField
                      control={form.control}
                      name="submitterEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            البريد الإلكتروني
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="example@email.com" {...field} dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                            placeholder="أي ملاحظات تريد إضافتها..."
                            {...field}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 text-lg gap-2"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        إرسال الإيداع
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6"
        >
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Recycle className="h-4 w-4 text-primary" />
            <span>مدعوم بواسطة iRecycle</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuickDeposit;
