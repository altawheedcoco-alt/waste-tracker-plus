import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateDocumentIdentity } from '@/utils/documentIdentityGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationSignatures } from '@/hooks/useOrganizationSignatures';
import { useDocumentEndorsement, EndorsementResult } from '@/hooks/useDocumentEndorsement';
import SecureEndorsementDialog from '@/components/endorsement/SecureEndorsementDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import SystemEndorsementBadge from '@/components/endorsement/SystemEndorsementBadge';
import {
  FileCheck,
  Package,
  Scale,
  MapPin,
  Loader2,
  CheckCircle2,
  FileText,
  ClipboardList,
  Truck,
  Building2,
  Stamp,
  Sparkles,
  PenTool,
  Shield,
  Fingerprint,
  ArrowLeft,
  ArrowRight,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  delivery_address?: string;
  generator_id: string;
  generator: { name: string; id?: string } | null;
  recycler?: { name: string; id?: string } | null;
  driver_id: string | null;
  driver?: { profile: { full_name: string } | null } | null;
  created_at: string;
}

interface ReceiptTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const receiptTemplates: ReceiptTemplate[] = [
  {
    id: 'standard',
    name: 'شهادة استلام قياسية',
    description: 'نموذج استلام أساسي مع البيانات الرئيسية',
    icon: <FileCheck className="w-5 h-5" />,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'detailed',
    name: 'شهادة استلام تفصيلية',
    description: 'يتضمن جميع التفاصيل مع توقيعات وأختام',
    icon: <ClipboardList className="w-5 h-5" />,
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 'express',
    name: 'استلام سريع',
    description: 'نموذج مختصر للاستلام السريع في الميدان',
    icon: <Truck className="w-5 h-5" />,
    color: 'from-orange-500 to-amber-600',
  },
  {
    id: 'official',
    name: 'شهادة رسمية معتمدة',
    description: 'نموذج رسمي مع رقم تسلسلي وباركود',
    icon: <Stamp className="w-5 h-5" />,
    color: 'from-purple-500 to-violet-600',
  },
];

interface ReceiptFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment;
  onSuccess?: () => void;
}

type Step = 'template' | 'form' | 'signature' | 'complete';

const ReceiptFlowDialog = ({
  open,
  onOpenChange,
  shipment,
  onSuccess,
}: ReceiptFlowDialogProps) => {
  const { profile, organization } = useAuth();
  const { getActiveSignatures, getActiveStamps } = useOrganizationSignatures();
  const { createEndorsement, loading: endorsementLoading } = useDocumentEndorsement();

  const [step, setStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState<any>(null);
  const [endorsementResult, setEndorsementResult] = useState<EndorsementResult | null>(null);
  const [showSecureEndorsement, setShowSecureEndorsement] = useState(false);

  // Form data
  const [actualWeight, setActualWeight] = useState(shipment.quantity?.toString() || '');
  const [notes, setNotes] = useState('');

  // Signature/Stamp data
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>('');
  const [selectedStampId, setSelectedStampId] = useState<string>('');
  const [endorsementType, setEndorsementType] = useState<'signed' | 'stamped' | 'signed_and_stamped'>('signed_and_stamped');
  const [useBiometric, setUseBiometric] = useState(false);
  const [autoEndorse, setAutoEndorse] = useState(true);

  const activeSignatures = getActiveSignatures();
  const activeStamps = getActiveStamps();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('template');
      setSelectedTemplate(null);
      setActualWeight(shipment.quantity?.toString() || '');
      setNotes('');
      setSelectedSignatureId('');
      setSelectedStampId('');
      setCreatedReceipt(null);
      setEndorsementResult(null);
      
      // Auto-select primary signature and stamp
      const primarySig = activeSignatures.find(s => s.is_primary);
      const primaryStamp = activeStamps.find(s => s.is_primary);
      if (primarySig) setSelectedSignatureId(primarySig.id);
      if (primaryStamp) setSelectedStampId(primaryStamp.id);
    }
  }, [open, shipment]);

  const handleSelectTemplate = (template: ReceiptTemplate) => {
    setSelectedTemplate(template);
    setStep('form');
  };

  const handleCreateReceipt = async () => {
    if (!organization?.id || !profile?.id) {
      toast.error('خطأ في البيانات');
      return;
    }

    setLoading(true);
    try {
      const receiptNum = `RCP-${Date.now().toString(36).toUpperCase()}`;
      const identity = generateDocumentIdentity('shipment_receipt', receiptNum, {
        shipmentNumber: shipment.shipment_number,
      });
      const insertData = {
        shipment_id: shipment.id,
        transporter_id: organization.id,
        generator_id: shipment.generator_id,
        driver_id: shipment.driver_id,
        waste_type: shipment.waste_type,
        declared_weight: shipment.quantity || null,
        actual_weight: parseFloat(actualWeight) || null,
        unit: shipment.unit || 'kg',
        pickup_location: shipment.pickup_address,
        notes: notes || null,
        created_by: profile.id,
        receipt_number: receiptNum,
        ...identity,
      };

      const { data, error } = await supabase
        .from('shipment_receipts')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setCreatedReceipt(data);

      // If auto-endorse is enabled, open secure endorsement dialog
      if (autoEndorse) {
        setShowSecureEndorsement(true);
      } else {
        // Just save without endorsement
        toast.success('تم إنشاء شهادة الاستلام بنجاح');
        setStep('complete');
      }
    } catch (error: any) {
      console.error('Error creating receipt:', error);
      toast.error(error.message || 'فشل في إنشاء الشهادة');
    } finally {
      setLoading(false);
    }
  };

  const handleEndorse = async () => {
    if (!createdReceipt) return;

    // Validate selections
    if (endorsementType !== 'stamped' && !selectedSignatureId) {
      toast.error('يرجى اختيار توقيع');
      return;
    }
    if (endorsementType !== 'signed' && !selectedStampId) {
      toast.error('يرجى اختيار ختم');
      return;
    }

    const result = await createEndorsement({
      document_type: 'receipt',
      document_id: createdReceipt.id,
      document_number: createdReceipt.receipt_number,
      signature_id: endorsementType !== 'stamped' ? selectedSignatureId : undefined,
      stamp_id: endorsementType !== 'signed' ? selectedStampId : undefined,
      endorsement_type: endorsementType,
      biometric_verified: useBiometric,
    });

    if (result) {
      setEndorsementResult(result);
      
      // Update receipt status to confirmed
      await supabase
        .from('shipment_receipts')
        .update({ status: 'confirmed' })
        .eq('id', createdReceipt.id);

      toast.success('تم اعتماد الشهادة وإرسالها للمولد');
      setStep('complete');
      onSuccess?.();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {['template', 'form', 'signature', 'complete'].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            step === s 
              ? 'bg-primary text-primary-foreground' 
              : ['form', 'signature', 'complete'].indexOf(step) > i 
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
          }`}>
            {i + 1}
          </div>
          {i < 3 && (
            <div className={`w-8 h-1 rounded ${
              ['form', 'signature', 'complete'].indexOf(step) > i
                ? 'bg-primary'
                : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            استلام الشحنة - {shipment.shipment_number}
          </DialogTitle>
          <DialogDescription>
            إنشاء شهادة استلام رسمية مع التوقيع والختم الإلكتروني
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <AnimatePresence mode="wait">
          {/* Step 1: Template Selection */}
          {step === 'template' && (
            <motion.div
              key="template"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <Sparkles className="w-8 h-8 mx-auto text-primary mb-2" />
                <h3 className="font-semibold">اختر قالب الشهادة</h3>
                <p className="text-sm text-muted-foreground">
                  اختر النموذج المناسب لنوع الاستلام
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {receiptTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id
                        ? 'ring-2 ring-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center text-white shrink-0`}>
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Form */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Shipment Info */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Package className="w-3 h-3" />
                    {shipment.shipment_number}
                  </Badge>
                  <Badge className={`bg-gradient-to-r ${selectedTemplate?.color} text-white border-0`}>
                    {selectedTemplate?.name}
                  </Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      الجهة المولدة
                    </p>
                    <p className="font-medium">{shipment.generator?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">نوع المخلفات</p>
                    <p className="font-medium">{shipment.waste_type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">الكمية المصرحة</p>
                    <p className="font-medium">{shipment.quantity} {shipment.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">تاريخ الإنشاء</p>
                    <p className="font-medium">
                      {shipment.created_at ? format(new Date(shipment.created_at), 'dd/MM/yyyy', { locale: ar }) : '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {shipment.pickup_address && (
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        موقع الاستلام
                      </p>
                      <p className="font-medium text-xs truncate">{shipment.pickup_address}</p>
                    </div>
                  )}
                  {shipment.delivery_address && (
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        موقع التسليم
                      </p>
                      <p className="font-medium text-xs truncate">{shipment.delivery_address}</p>
                    </div>
                  )}
                </div>

                {shipment.driver?.profile?.full_name && (
                  <div className="text-sm">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      السائق
                    </p>
                    <p className="font-medium">{shipment.driver.profile.full_name}</p>
                  </div>
                )}

                {shipment.recycler?.name && (
                  <div className="text-sm">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      جهة التدوير
                    </p>
                    <p className="font-medium">{shipment.recycler.name}</p>
                  </div>
                )}
              </div>

              {/* Actual Weight */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  الوزن الفعلي عند الاستلام
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={actualWeight}
                    onChange={(e) => setActualWeight(e.target.value)}
                    placeholder="أدخل الوزن الفعلي"
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="px-4">
                    {shipment.unit || 'kg'}
                  </Badge>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات على حالة الشحنة عند الاستلام..."
                  rows={2}
                />
              </div>

              {/* Endorsement Option */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Shield className="w-5 h-5 text-primary" />
                  خيارات الاعتماد
                </Label>
                
                <div className="grid grid-cols-1 gap-2">
                  {/* With Signature & Stamp */}
                  <div 
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      autoEndorse 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setAutoEndorse(true)}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      autoEndorse ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {autoEndorse && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-primary" />
                        <Stamp className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">مع التوقيع والختم الإلكتروني</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        شهادة رسمية معتمدة بالتوقيع والختم (موصى به)
                      </p>
                    </div>
                    <Badge variant="default" className="text-xs">موصى به</Badge>
                  </div>

                  {/* Without Signature & Stamp */}
                  <div 
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      !autoEndorse 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setAutoEndorse(false)}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      !autoEndorse ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {!autoEndorse && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">بدون توقيع وختم</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        شهادة استلام بسيطة بدون اعتماد رسمي
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Signature & Stamp */}
          {step === 'signature' && (
            <motion.div
              key="signature"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <Shield className="w-8 h-8 mx-auto text-primary mb-2" />
                <h3 className="font-semibold">اعتماد الشهادة</h3>
                <p className="text-sm text-muted-foreground">
                  اختر التوقيع والختم للاعتماد الرسمي
                </p>
              </div>

              {/* Receipt Info */}
              {createdReceipt && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    تم إنشاء الشهادة رقم: <strong className="font-mono">{createdReceipt.receipt_number}</strong>
                  </p>
                </div>
              )}

              {/* Endorsement Type */}
              <div className="space-y-2">
                <Label>نوع الاعتماد</Label>
                <Select value={endorsementType} onValueChange={(val: any) => setEndorsementType(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signed_and_stamped">توقيع وختم</SelectItem>
                    <SelectItem value="signed">توقيع فقط</SelectItem>
                    <SelectItem value="stamped">ختم فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Signature Selection */}
              {endorsementType !== 'stamped' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <PenTool className="w-4 h-4" />
                    اختر التوقيع
                  </Label>
                  {activeSignatures.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg text-center">
                      لا توجد توقيعات. يرجى إضافة توقيع من الإعدادات.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {activeSignatures.map((sig) => (
                        <div
                          key={sig.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedSignatureId === sig.id 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedSignatureId(sig.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-8 border rounded bg-white flex items-center justify-center overflow-hidden">
                              {sig.signature_image_url ? (
                                <img src={sig.signature_image_url} alt="" className="max-w-full max-h-full object-contain" />
                              ) : (
                                <PenTool className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{sig.signer_name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{sig.signer_position}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Stamp Selection */}
              {endorsementType !== 'signed' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Stamp className="w-4 h-4" />
                    اختر الختم
                  </Label>
                  {activeStamps.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg text-center">
                      لا توجد أختام. يرجى إضافة ختم من الإعدادات.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {activeStamps.map((stamp) => (
                        <div
                          key={stamp.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedStampId === stamp.id 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedStampId(stamp.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 border rounded-full bg-white flex items-center justify-center overflow-hidden">
                              {stamp.stamp_image_url ? (
                                <img src={stamp.stamp_image_url} alt="" className="max-w-full max-h-full object-contain" />
                              ) : (
                                <Stamp className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{stamp.stamp_name}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Biometric Option */}
              <div className="flex items-center space-x-2 space-x-reverse p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  id="biometric"
                  checked={useBiometric}
                  onCheckedChange={(checked) => setUseBiometric(checked as boolean)}
                />
                <Label htmlFor="biometric" className="flex items-center gap-2 cursor-pointer text-sm">
                  <Fingerprint className="w-4 h-4 text-primary" />
                  استخدام التحقق البيومتري (بصمة/وجه)
                </Label>
              </div>
            </motion.div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">تم بنجاح!</h3>
                <p className="text-muted-foreground text-sm">
                  {endorsementResult 
                    ? 'تم إنشاء واعتماد الشهادة وإرسالها للمولد'
                    : 'تم إنشاء شهادة الاستلام بنجاح'
                  }
                </p>
              </div>

              {createdReceipt && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">رقم الشهادة:</span>
                    <span className="font-mono font-bold">{createdReceipt.receipt_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">رقم الشحنة:</span>
                    <span>{shipment.shipment_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الجهة المولدة:</span>
                    <span>{shipment.generator?.name}</span>
                  </div>
                </div>
              )}

              {endorsementResult && (
                <SystemEndorsementBadge
                  systemSealNumber={endorsementResult.system_seal_number}
                  verificationCode={endorsementResult.verification_code}
                  endorsedAt={new Date()}
                  verificationUrl={endorsementResult.verification_url}
                  isValid={true}
                  showDisclaimer={true}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="gap-2 mt-4">
          {step === 'template' && (
            <Button variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
          )}

          {step === 'form' && (
            <>
              <Button variant="outline" onClick={() => setStep('template')}>
                <ArrowRight className="w-4 h-4 ml-2" />
                رجوع
              </Button>
              <Button onClick={handleCreateReceipt} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : autoEndorse ? (
                  <ArrowLeft className="w-4 h-4 ml-2" />
                ) : (
                  <FileCheck className="w-4 h-4 ml-2" />
                )}
                {autoEndorse ? 'التالي: التوقيع والختم' : 'إنشاء الشهادة'}
              </Button>
            </>
          )}

          {step === 'signature' && (
            <>
              <Button variant="outline" onClick={() => {
                // Skip endorsement
                toast.success('تم إنشاء الشهادة بدون اعتماد');
                setStep('complete');
                onSuccess?.();
              }}>
                تخطي الاعتماد
              </Button>
              <Button onClick={handleEndorse} disabled={endorsementLoading} className="gap-2">
                {endorsementLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                اعتماد وإرسال للمولد
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose}>
              إغلاق
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Secure Endorsement Dialog */}
    {createdReceipt && (
      <SecureEndorsementDialog
        open={showSecureEndorsement}
        onOpenChange={setShowSecureEndorsement}
        documentType="receipt"
        documentId={createdReceipt.id}
        documentNumber={createdReceipt.receipt_number || ''}
        documentTitle={`شهادة استلام الشحنة ${shipment.shipment_number}`}
        requirePassword={true}
        allowSkipAuth={false}
        onSuccess={(result) => {
          setEndorsementResult(result);
          setShowSecureEndorsement(false);
          
          // Update receipt status to confirmed
          supabase
            .from('shipment_receipts')
            .update({ status: 'confirmed' })
            .eq('id', createdReceipt.id)
            .then(() => {
              toast.success('تم اعتماد الشهادة وإرسالها للمولد');
              setStep('complete');
              onSuccess?.();
            });
        }}
        onCancel={() => {
          setShowSecureEndorsement(false);
          // Go back to form or signature step
          setStep('form');
        }}
      />
    )}
  </>
  );
};

export default ReceiptFlowDialog;
