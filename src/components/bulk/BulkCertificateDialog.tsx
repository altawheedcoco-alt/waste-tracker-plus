import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateDocumentIdentity } from '@/utils/documentIdentityGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrganizationSignatures } from '@/hooks/useOrganizationSignatures';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  FileStack,
  Package,
  CheckCircle2,
  Loader2,
  Printer,
  Stamp,
  PenTool,
  Recycle,
  Truck,
  FileText,
  ArrowLeft,
  ArrowRight,
  Scale,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import AggregateCertificatesPrint from '@/components/reports/AggregateCertificatesPrint';
import AggregateReceiptsPrint from './AggregateReceiptsPrint';

interface Shipment {
  id: string;
  shipment_number: string;
  status: string;
  created_at: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  delivered_at?: string | null;
  confirmed_at?: string | null;
  pickup_address?: string;
  delivery_address?: string;
  generator?: { name: string; city?: string } | null;
  transporter?: { name: string; city?: string } | null;
  recycler?: { name: string; city?: string; stamp_url?: string | null; signature_url?: string | null } | null;
}

interface BulkCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipments: Shipment[];
  type: 'receipt' | 'certificate' | 'delivery';
  onSuccess?: () => void;
}

const getWasteTypeLabels = (t: (key: string) => string): Record<string, string> => ({
  plastic: t('wasteTypes.plastic'),
  paper: t('wasteTypes.paper'),
  metal: t('wasteTypes.metal'),
  glass: t('wasteTypes.glass'),
  electronic: t('wasteTypes.electronic'),
  organic: t('wasteTypes.organic'),
  chemical: t('wasteTypes.chemical'),
  medical: t('wasteTypes.medical'),
  construction: t('wasteTypes.construction'),
  other: t('wasteTypes.other'),
});

const BulkCertificateDialog = ({
  open,
  onOpenChange,
  shipments,
  type,
  onSuccess,
}: BulkCertificateDialogProps) => {
  const { organization } = useAuth();
  const { t } = useLanguage();
  const wasteTypeLabels = getWasteTypeLabels(t);
  const { signatures, stamps, loading: loadingSignatures } = useOrganizationSignatures();
  const printRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<'select' | 'options' | 'preview'>('select');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(shipments.map(s => s.id)));
  const [includeStamp, setIncludeStamp] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);
  const [selectedSignature, setSelectedSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportNumber, setReportNumber] = useState('');

  const isReceipt = type === 'receipt';
  const isDelivery = type === 'delivery';
  const title = isDelivery ? 'إصدار شهادات تسليم مجمعة' : isReceipt ? 'إصدار شهادات استلام مجمعة' : 'إصدار شهادات تدوير مجمعة';

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(shipments.map(s => s.id)));
      setStep('select');
      // Generate report number
      const prefix = isDelivery ? 'DLV-AGG' : isReceipt ? 'RCP-AGG' : 'CRT-AGG';
      const dateStr = format(new Date(), 'yyyyMMdd');
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      setReportNumber(`${prefix}-${dateStr}-${random}`);
    }
  }, [open, shipments, isReceipt]);

  useEffect(() => {
    if (stamps.length > 0 && !selectedStamp) {
      setSelectedStamp(stamps[0].stamp_image_url);
    }
    if (signatures.length > 0 && !selectedSignature) {
      setSelectedSignature(signatures[0].signature_image_url);
    }
  }, [stamps, signatures]);

  const selectedShipments = shipments.filter(s => selectedIds.has(s.id));
  const totalQuantity = selectedShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === shipments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(shipments.map(s => s.id)));
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: reportNumber,
  });

  const handleSubmit = async () => {
    if (selectedShipments.length === 0) {
      toast.error('يرجى اختيار شحنة واحدة على الأقل');
      return;
    }

    setIsSubmitting(true);
    try {
      const shipmentIds = selectedShipments.map(s => s.id);

      if (isDelivery) {
        // Create bulk delivery certificates for generator handover
        // Sets transporter approval to 'pending' with 6-hour auto-approval deadline
        const approvalDeadline = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
        const generatorStampUrl = includeStamp ? selectedStamp : null;
        const generatorSignatureUrl = includeSignature ? selectedSignature : null;

        const receipts = selectedShipments.map(shipment => {
          const receiptNum = `DLV-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          const identity = generateDocumentIdentity('shipment_receipt', receiptNum, {
            shipmentNumber: shipment.shipment_number,
          });
          return {
            shipment_id: shipment.id,
            receipt_number: receiptNum,
            status: 'pending_approval',
            actual_weight: shipment.quantity,
            declared_weight: shipment.quantity,
            waste_type: shipment.waste_type,
            notes: `شهادة تسليم مجمعة من المولد - ${reportNumber}`,
            pickup_date: new Date().toISOString(),
            generator_id: organization?.id || null,
            generator_signature: generatorSignatureUrl,
            transporter_approval_status: 'pending',
            transporter_approval_deadline: approvalDeadline,
            ...identity,
          };
        });

        const { error } = await supabase
          .from('shipment_receipts')
          .insert(receipts as any);

        if (error) throw error;
      } else if (isReceipt) {
        // Create bulk receipt certificates
        const receipts = selectedShipments.map(shipment => ({
          shipment_id: shipment.id,
          receipt_number: `RCP-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          status: 'confirmed',
          actual_weight: shipment.quantity,
          declared_weight: shipment.quantity,
          waste_type: shipment.waste_type,
          notes: `شهادة استلام مجمعة - ${reportNumber}`,
          pickup_date: new Date().toISOString(),
          transporter_id: organization?.id || null,
        }));

        const { error } = await supabase
          .from('shipment_receipts')
          .insert(receipts as any);

        if (error) throw error;
      } else {
        // Create bulk recycling reports
        const reports = selectedShipments.map(shipment => ({
          shipment_id: shipment.id,
          report_number: `CRT-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          recycler_organization_id: organization?.id || '',
          custom_notes: `شهادة مجمعة - ${reportNumber}`,
        }));

        const { error } = await supabase
          .from('recycling_reports')
          .insert(reports);

        if (error) throw error;
      }

      const successMsg = isDelivery 
        ? `تم إصدار ${selectedShipments.length} شهادة تسليم - بانتظار موافقة الناقل (مهلة 6 ساعات للموافقة التلقائية)`
        : `تم إصدار ${selectedShipments.length} شهادة بنجاح`;
      toast.success(successMsg);
      
      // Print the aggregate certificate
      handlePrint();
      
      onSuccess?.();
    } catch (error) {
      console.error('Error issuing bulk certificates:', error);
      toast.error('حدث خطأ أثناء إصدار الشهادات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'select':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === shipments.length}
                  onCheckedChange={handleSelectAll}
                />
                تحديد الكل ({shipments.length})
              </Label>
              <Badge variant="secondary" className="gap-1">
                <Scale className="w-3 h-3" />
                إجمالي: {totalQuantity.toLocaleString()} كجم
              </Badge>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg p-2">
              <div className="space-y-2">
                {shipments.map(shipment => (
                  <Card 
                    key={shipment.id}
                    className={`cursor-pointer transition-all ${
                      selectedIds.has(shipment.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleToggle(shipment.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedIds.has(shipment.id)}
                          onCheckedChange={() => handleToggle(shipment.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">
                              {shipment.shipment_number}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {wasteTypeLabels[shipment.waste_type] || shipment.waste_type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{shipment.generator?.name || '-'}</span>
                            <span>→</span>
                            <span>{shipment.quantity} كجم</span>
                          </div>
                        </div>
                        {selectedIds.has(shipment.id) && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        );

      case 'options':
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stamp className="w-5 h-5 text-muted-foreground" />
                    <Label>تضمين الختم</Label>
                  </div>
                  <Switch
                    checked={includeStamp}
                    onCheckedChange={setIncludeStamp}
                  />
                </div>

                {includeStamp && stamps.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {stamps.map(stamp => (
                      <div
                        key={stamp.id}
                        onClick={() => setSelectedStamp(stamp.stamp_image_url)}
                        className={`flex-shrink-0 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedStamp === stamp.stamp_image_url 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                      >
                        <img
                          src={stamp.stamp_image_url}
                          alt="ختم"
                          className="w-16 h-16 object-contain"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-muted-foreground" />
                    <Label>تضمين التوقيع</Label>
                  </div>
                  <Switch
                    checked={includeSignature}
                    onCheckedChange={setIncludeSignature}
                  />
                </div>

                {includeSignature && signatures.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {signatures.map(sig => (
                      <div
                        key={sig.id}
                        onClick={() => setSelectedSignature(sig.signature_image_url)}
                        className={`flex-shrink-0 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedSignature === sig.signature_image_url 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                      >
                        <img
                          src={sig.signature_image_url}
                          alt="توقيع"
                          className="w-20 h-10 object-contain"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>عدد الشحنات المختارة:</span>
                  <Badge>{selectedShipments.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span>الإجمالي:</span>
                  <span className="font-bold">{totalQuantity.toLocaleString()} كجم</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span>رقم الشهادة المجمعة:</span>
                  <span className="font-mono text-xs">{reportNumber}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'preview':
        return (
          <ScrollArea className="h-[400px]">
            <div ref={printRef}>
              {isReceipt ? (
                <AggregateReceiptsPrint
                  shipments={selectedShipments}
                  transporterOrg={{
                    name: organization?.name || '',
                    stamp_url: includeStamp ? selectedStamp : null,
                    signature_url: includeSignature ? selectedSignature : null,
                    commercial_register: organization?.commercial_register || undefined,
                    environmental_license: organization?.environmental_license || undefined,
                  }}
                  reportNumber={reportNumber}
                  includeStamp={includeStamp}
                  includeSignature={includeSignature}
                />
              ) : (
                <AggregateCertificatesPrint
                  shipments={selectedShipments}
                  recyclerOrg={{
                    name: organization?.name || '',
                    stamp_url: includeStamp ? selectedStamp : null,
                    signature_url: includeSignature ? selectedSignature : null,
                    commercial_register: organization?.commercial_register || undefined,
                    environmental_license: organization?.environmental_license || undefined,
                  }}
                  reportNumber={reportNumber}
                  includeStamp={includeStamp}
                  includeSignature={includeSignature}
                />
              )}
            </div>
          </ScrollArea>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDelivery ? <Send className="w-5 h-5" /> : isReceipt ? <Truck className="w-5 h-5" /> : <Recycle className="w-5 h-5" />}
            {title}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'اختر الشحنات المراد إصدار شهادات لها'}
            {step === 'options' && 'خيارات التوقيع والختم'}
            {step === 'preview' && 'معاينة الشهادة المجمعة'}
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {['select', 'options', 'preview'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : i < ['select', 'options', 'preview'].indexOf(step)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="w-8 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>

        <div className="py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter className="gap-2">
          {step !== 'select' && (
            <Button
              variant="outline"
              onClick={() => setStep(step === 'preview' ? 'options' : 'select')}
              disabled={isSubmitting}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              السابق
            </Button>
          )}

          {step === 'select' && (
            <Button
              onClick={() => setStep('options')}
              disabled={selectedIds.size === 0}
            >
              التالي
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          )}

          {step === 'options' && (
            <Button onClick={() => setStep('preview')}>
              معاينة
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          )}

          {step === 'preview' && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإصدار...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 ml-2" />
                  إصدار وطباعة ({selectedShipments.length})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkCertificateDialog;
