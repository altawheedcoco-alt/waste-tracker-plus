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
import logo from '@/assets/logo.png';

const depositSchema = z.object({
  amount: z.string().min(1, 'يرجى إدخال المبلغ'),
  depositDate: z.date(),
  submitterName: z.string().min(1, 'يرجى إدخال اسمك'),
  submitterPhone: z.string().optional(),
  submitterEmail: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  transferMethod: z.string().min(1, 'يرجى اختيار طريقة التحويل'),
  bankName: z.string().optional(),
  referenceNumber: z.string().optional(),
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
      submitterPhone: '',
      submitterEmail: '',
      transferMethod: 'bank_transfer',
      bankName: '',
      referenceNumber: '',
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
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(receiptFile);
      });

      const { data, error } = await supabase.functions.invoke('extract-receipt-data', {
        body: { imageBase64: base64 },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const extracted = data.data;
        
        if (extracted.amount && linkData?.allow_amount_edit) {
          form.setValue('amount', String(extracted.amount));
        }
        if (extracted.depositor_name) form.setValue('submitterName', extracted.depositor_name);
        if (extracted.bank_name) form.setValue('bankName', extracted.bank_name);
        if (extracted.reference_number) form.setValue('referenceNumber', extracted.reference_number);
        if (extracted.payment_date && linkData?.allow_date_edit) {
          form.setValue('depositDate', new Date(extracted.payment_date));
        }
        if (extracted.payment_method) {
          form.setValue('transferMethod', extracted.payment_method);
        }

        setAiExtracted(true);
        toast.success('✨ تم استخراج البيانات بنجاح!');
      }
    } catch (error) {
      console.error('AI extraction error:', error);
      toast.error('حدث خطأ أثناء استخراج البيانات');
    } finally {
      setExtracting(false);
    }
  };

  const onSubmit = async (data: DepositFormData) => {
    if (!linkData) return;

    // Validate receipt requirement
    if (linkData.require_receipt && !receiptFile) {
      toast.error('يرجى رفع صورة الإيصال');
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

      // Build deposit record with preset data
      const depositRecord: any = {
        organization_id: linkData.organization_id,
        amount: parseFloat(data.amount),
        deposit_date: format(data.depositDate, 'yyyy-MM-dd'),
        depositor_name: data.submitterName,
        depositor_phone: data.submitterPhone || null,
        transfer_method: data.transferMethod,
        bank_name: data.bankName || null,
        reference_number: data.referenceNumber || null,
        receipt_url: receiptUrl,
        notes: data.notes || null,
        deposit_link_id: linkData.id,
        submitter_name: data.submitterName,
        submitter_phone: data.submitterPhone || null,
        submitter_email: data.submitterEmail || null,
        is_public_submission: true,
        waste_type: linkData.preset_waste_type,
        category: linkData.preset_category,
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

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-500/10 via-background to-primary/10 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <Card className="text-center border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-background">
            <CardContent className="pt-8 pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2 text-emerald-700">تم الإرسال بنجاح!</h1>
              <p className="text-muted-foreground mb-4">
                شكراً لك، تم استلام إيداعك وسيتم مراجعته من قبل{' '}
                <span className="font-semibold text-foreground">
                  {linkData?.organization_name}
                </span>
              </p>
              
              {/* Show preset info in success */}
              {(linkData?.partner_name || linkData?.preset_waste_type) && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
                  <p className="text-muted-foreground mb-2">تم تسجيل الإيداع لحساب:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
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
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => {
                    setSubmitted(false);
                    form.reset();
                    if (linkData?.preset_notes) {
                      form.setValue('notes', linkData.preset_notes);
                    }
                    setReceiptFile(null);
                    setReceiptPreview(null);
                    setAiExtracted(false);
                  }} 
                  variant="outline"
                >
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
                  {/* Receipt Upload Section */}
                  <div className={cn(
                    "p-4 rounded-xl border-2 border-dashed",
                    linkData?.require_receipt 
                      ? "border-amber-400 bg-amber-50/50" 
                      : "border-primary/30 bg-primary/5"
                  )}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm">
                        صورة الإيصال {linkData?.require_receipt ? '*' : '(اختياري)'}
                      </span>
                      {linkData?.require_receipt && (
                        <Badge variant="outline" className="text-xs text-amber-700 border-amber-400 gap-1">
                          <Lock className="h-3 w-3" />
                          مطلوب
                        </Badge>
                      )}
                    </div>
                    
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
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-2 left-2"
                          >
                            تغيير
                          </Button>
                        </div>
                        
                        <Button
                          type="button"
                          onClick={extractDataWithAI}
                          disabled={extracting}
                          size="sm"
                          className="w-full gap-2"
                        >
                          {extracting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          )}
                          استخراج البيانات تلقائياً
                        </Button>

                        {aiExtracted && (
                          <Badge variant="secondary" className="w-full justify-center gap-1 bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            تم استخراج البيانات
                          </Badge>
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

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">بيانات المودع</p>
                    
                    {/* Submitter Name */}
                    <FormField
                      control={form.control}
                      name="submitterName"
                      render={({ field }) => (
                        <FormItem className="mb-3">
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            الاسم *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="اسمك الكامل" {...field} />
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
