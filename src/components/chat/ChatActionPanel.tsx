import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Loader2, Weight, Package, SearchCheck, Trash2, Activity, Gauge, UserCheck, Calendar, ClipboardList, Award, Droplets, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { soundEngine } from '@/lib/soundEngine';
import { useAuth } from '@/contexts/AuthContext';
import UniversalSignatureDialog from '@/components/signatures/UniversalSignatureDialog';
import { saveDocumentSignature } from '@/components/signatures/signatureService';
import type { SignatureData } from '@/components/signatures/UniversalSignatureDialog';
import ShipmentInlineTrackingMap from '@/components/shipments/ShipmentInlineTrackingMap';

export type ActionType = 
  | 'sign' | 'stamp' | 'track' | 'status' | 'approve'
  | 'receive' | 'weigh' | 'quality' | 'dispose' | 'monitor'
  | 'assign_driver' | 'schedule_collect' | 'reject_shipment'
  | 'classify_waste' | 'request_cert' | 'recycle_cert' | 'dispose_cert'
  | 'handover' | 'update_capacity' | 'leachate_report'
  | 'fleet_check' | 'optimize_route' | 'log_fuel'
  | 'schedule' | 'work_order' | 'report'
  | null;

interface ChatActionPanelProps {
  action: ActionType;
  resourceId: string;
  resourceType: string;
  resourceData?: any;
  onClose: () => void;
  onComplete?: (action: string, id: string, result?: any) => void;
}

const STATUS_OPTIONS: { value: 'approved' | 'collecting' | 'in_transit' | 'delivered'; label: string; color: string }[] = [
  { value: 'approved', label: 'معتمدة', color: 'bg-blue-500' },
  { value: 'collecting', label: 'جاري التجميع', color: 'bg-amber-500' },
  { value: 'in_transit', label: 'قيد النقل', color: 'bg-indigo-500' },
  { value: 'delivered', label: 'تم التسليم', color: 'bg-emerald-500' },
];

// Panel title & icon mapping
const ACTION_META: Record<string, { title: string; emoji: string }> = {
  track: { title: 'تتبع مباشر', emoji: '📍' },
  status: { title: 'تغيير الحالة', emoji: '🔄' },
  approve: { title: 'اعتماد', emoji: '✅' },
  receive: { title: 'تأكيد الاستلام', emoji: '📦' },
  weigh: { title: 'تسجيل الوزن', emoji: '⚖️' },
  quality: { title: 'فحص الجودة', emoji: '🔍' },
  dispose: { title: 'تأكيد التخلص الآمن', emoji: '🗑️' },
  monitor: { title: 'رصد بيئي', emoji: '🌿' },
  assign_driver: { title: 'تعيين سائق', emoji: '🚛' },
  schedule_collect: { title: 'جدولة جمع', emoji: '📅' },
  reject_shipment: { title: 'رفض الشحنة', emoji: '❌' },
  classify_waste: { title: 'تصنيف النفايات', emoji: '🏷️' },
  request_cert: { title: 'طلب شهادة', emoji: '📜' },
  recycle_cert: { title: 'إصدار شهادة تدوير', emoji: '♻️' },
  dispose_cert: { title: 'إصدار شهادة تخلص', emoji: '📋' },
  handover: { title: 'تسليم الشحنة', emoji: '🤝' },
  update_capacity: { title: 'تحديث السعة', emoji: '📊' },
  leachate_report: { title: 'تقرير الرشيح', emoji: '💧' },
  fleet_check: { title: 'فحص مركبة', emoji: '🔧' },
  optimize_route: { title: 'تحسين المسار', emoji: '🗺️' },
  log_fuel: { title: 'تسجيل وقود', emoji: '⛽' },
  schedule: { title: 'جدولة', emoji: '📅' },
  work_order: { title: 'أمر شغل', emoji: '📋' },
  report: { title: 'تقرير', emoji: '📊' },
};

// Generic form for simple data entry actions
const SimpleFormPanel = memo(({ 
  title, 
  fields, 
  onSubmit, 
  loading, 
  submitLabel = 'تأكيد'
}: { 
  title: string; 
  fields: { key: string; label: string; type?: string; placeholder?: string }[];
  onSubmit: (data: Record<string, string>) => void;
  loading: boolean;
  submitLabel?: string;
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center mb-4">{title}</p>
      {fields.map(f => (
        <div key={f.key} className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
          {f.type === 'textarea' ? (
            <Textarea
              placeholder={f.placeholder || f.label}
              value={formData[f.key] || ''}
              onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="text-sm"
              rows={3}
            />
          ) : (
            <Input
              type={f.type || 'text'}
              placeholder={f.placeholder || f.label}
              value={formData[f.key] || ''}
              onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="text-sm"
            />
          )}
        </div>
      ))}
      <Button className="w-full gap-2" disabled={loading} onClick={() => onSubmit(formData)}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
});
SimpleFormPanel.displayName = 'SimpleFormPanel';

const ChatActionPanel = memo(({
  action,
  resourceId,
  resourceType,
  resourceData,
  onClose,
  onComplete,
}: ChatActionPanelProps) => {
  const { user, profile, organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(action === 'sign' || action === 'stamp');

  if (!action) return null;

  const meta = ACTION_META[action] || { title: action, emoji: '⚡' };
  const isOverlayAction = action !== 'sign' && action !== 'stamp';

  const handleStatusChange = async (newStatus: 'approved' | 'collecting' | 'in_transit' | 'delivered') => {
    setLoading(true);
    try {
      const { error } = await supabase.from('shipments').update({ status: newStatus }).eq('id', resourceId);
      if (error) throw error;
      soundEngine.play('success');
      toast.success('تم تحديث حالة الشحنة');
      onComplete?.('status_changed', resourceId, { status: newStatus });
      onClose();
    } catch { toast.error('فشل تحديث الحالة'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (approved: boolean) => {
    setLoading(true);
    try {
      const table = resourceType === 'invoice' ? 'invoices' : 'signing_requests';
      const newStatus = approved ? (resourceType === 'invoice' ? 'paid' : 'signed') : 'rejected';
      const { error } = await supabase.from(table).update({ status: newStatus } as any).eq('id', resourceId);
      if (error) throw error;
      soundEngine.play(approved ? 'success' : 'warning');
      toast.success(approved ? 'تم الاعتماد بنجاح' : 'تم الرفض');
      onComplete?.(approved ? 'approved' : 'rejected', resourceId);
      onClose();
    } catch { toast.error('فشلت العملية'); }
    finally { setLoading(false); }
  };

  const handleSign = async (data: SignatureData) => {
    if (!user?.id || !organization?.id) return;
    setLoading(true);
    try {
      const docType = (['shipment', 'contract', 'invoice', 'certificate', 'award_letter'].includes(resourceType)
        ? resourceType : 'other') as any;
      await saveDocumentSignature({
        signatureData: data, documentType: docType, documentId: resourceId,
        organizationId: organization.id, userId: user.id,
      });
      if (resourceType === 'signing_request') {
        await supabase.from('signing_requests').update({ status: 'signed' }).eq('id', resourceId);
      }
      soundEngine.play('success');
      toast.success(action === 'stamp' ? 'تم الختم بنجاح ✓' : 'تم التوقيع بنجاح ✓');
      onComplete?.(action === 'stamp' ? 'stamped' : 'signed', resourceId, data);
      setSignDialogOpen(false);
      onClose();
    } catch { toast.error('فشل حفظ التوقيع'); }
    finally { setLoading(false); }
  };

  // Generic form submit handler for operational actions
  const handleFormSubmit = async (formAction: string, formData: Record<string, string>) => {
    setLoading(true);
    try {
      // Send as event message back to the chat
      soundEngine.play('success');
      toast.success(`تم تنفيذ: ${meta.title}`);
      onComplete?.(formAction, resourceId, formData);
      onClose();
    } catch { toast.error('فشلت العملية'); }
    finally { setLoading(false); }
  };

  // Render form content based on action type
  const renderActionContent = () => {
    switch (action) {
      case 'track':
        return (
          <div className="rounded-xl overflow-hidden h-[300px]">
            <ShipmentInlineTrackingMap shipmentId={resourceId} />
          </div>
        );
      case 'status':
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center mb-4">اختر الحالة الجديدة للشحنة</p>
            {STATUS_OPTIONS.map(opt => (
              <Button key={opt.value} variant="outline" className="w-full h-12 justify-start gap-3 text-sm"
                disabled={loading} onClick={() => handleStatusChange(opt.value)}>
                <div className={cn('w-3 h-3 rounded-full', opt.color)} />
                {opt.label}
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-auto" />}
              </Button>
            ))}
          </div>
        );
      case 'approve':
        return (
          <div className="space-y-4 text-center">
            <p className="text-sm font-medium">{resourceType === 'invoice' ? 'اعتماد الفاتورة' : 'اعتماد المستند'}</p>
            {resourceData?.total_amount != null && (
              <p className="text-2xl font-bold text-primary">{resourceData.total_amount.toLocaleString()} {resourceData.currency || 'EGP'}</p>
            )}
            <div className="flex gap-3 justify-center pt-4">
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]" onClick={() => handleApprove(true)} disabled={loading}>
                <CheckCircle className="w-4 h-4" /> اعتماد
              </Button>
              <Button variant="destructive" className="gap-2 min-w-[120px]" onClick={() => handleApprove(false)} disabled={loading}>
                <XCircle className="w-4 h-4" /> رفض
              </Button>
            </div>
          </div>
        );

      // ─── Recycler / Disposal: Receive ───
      case 'receive':
        return (
          <SimpleFormPanel title="تأكيد استلام الشحنة" loading={loading} submitLabel="تأكيد الاستلام"
            fields={[
              { key: 'notes', label: 'ملاحظات الاستلام', type: 'textarea', placeholder: 'حالة الشحنة عند الوصول...' },
            ]}
            onSubmit={(data) => handleFormSubmit('received', data)}
          />
        );

      // ─── Recycler: Weigh ───
      case 'weigh':
        return (
          <SimpleFormPanel title="تسجيل الوزن الفعلي" loading={loading} submitLabel="حفظ الوزن"
            fields={[
              { key: 'actual_weight', label: 'الوزن الفعلي (كجم)', type: 'number', placeholder: '0' },
              { key: 'notes', label: 'ملاحظات', placeholder: 'فارق الوزن...' },
            ]}
            onSubmit={(data) => handleFormSubmit('weighed', data)}
          />
        );

      // ─── Recycler: Quality ───
      case 'quality':
        return (
          <SimpleFormPanel title="فحص جودة المواد" loading={loading} submitLabel="حفظ الفحص"
            fields={[
              { key: 'grade', label: 'درجة الجودة (A/B/C/D)', placeholder: 'A' },
              { key: 'contamination', label: 'نسبة التلوث %', type: 'number', placeholder: '0' },
              { key: 'notes', label: 'ملاحظات', type: 'textarea', placeholder: 'تفاصيل الفحص...' },
            ]}
            onSubmit={(data) => handleFormSubmit('quality_checked', data)}
          />
        );

      // ─── Disposal: Dispose ───
      case 'dispose':
        return (
          <SimpleFormPanel title="تأكيد التخلص الآمن" loading={loading} submitLabel="تأكيد التخلص"
            fields={[
              { key: 'method', label: 'طريقة التخلص', placeholder: 'طمر / حرق / معالجة...' },
              { key: 'cell_number', label: 'رقم الخلية', placeholder: 'A-12' },
              { key: 'notes', label: 'ملاحظات', type: 'textarea' },
            ]}
            onSubmit={(data) => handleFormSubmit('disposed', data)}
          />
        );

      // ─── Disposal: Monitor ───
      case 'monitor':
        return (
          <SimpleFormPanel title="تسجيل قراءات الرصد البيئي" loading={loading} submitLabel="حفظ القراءات"
            fields={[
              { key: 'temperature', label: 'الحرارة °C', type: 'number' },
              { key: 'gas_reading', label: 'قراءة الغاز ppm', type: 'number' },
              { key: 'notes', label: 'ملاحظات', type: 'textarea' },
            ]}
            onSubmit={(data) => handleFormSubmit('monitored', data)}
          />
        );

      // ─── Transporter: Assign Driver ───
      case 'assign_driver':
        return (
          <SimpleFormPanel title="تعيين سائق للشحنة" loading={loading} submitLabel="تعيين"
            fields={[
              { key: 'driver_name', label: 'اسم السائق', placeholder: 'ابحث أو أدخل الاسم...' },
              { key: 'vehicle_plate', label: 'رقم لوحة المركبة', placeholder: 'أ ب ج 1234' },
            ]}
            onSubmit={(data) => handleFormSubmit('driver_assigned', data)}
          />
        );

      // ─── Generator: Schedule Collect ───
      case 'schedule_collect':
        return (
          <SimpleFormPanel title="جدولة موعد جمع المخلفات" loading={loading} submitLabel="تأكيد الجدولة"
            fields={[
              { key: 'date', label: 'التاريخ', type: 'date' },
              { key: 'time', label: 'الوقت', type: 'time' },
              { key: 'waste_type', label: 'نوع النفايات', placeholder: 'بلاستيك / ورق / معادن...' },
              { key: 'estimated_weight', label: 'الوزن التقديري (كجم)', type: 'number' },
            ]}
            onSubmit={(data) => handleFormSubmit('collection_scheduled', data)}
          />
        );

      // ─── Reject Shipment ───
      case 'reject_shipment':
        return (
          <SimpleFormPanel title="رفض الشحنة" loading={loading} submitLabel="تأكيد الرفض"
            fields={[
              { key: 'reason', label: 'سبب الرفض', type: 'textarea', placeholder: 'تلوث / عدم مطابقة / وزن مختلف...' },
            ]}
            onSubmit={(data) => handleFormSubmit('shipment_rejected', data)}
          />
        );

      // ─── Classify Waste ───
      case 'classify_waste':
        return (
          <SimpleFormPanel title="تصنيف نوع النفايات" loading={loading} submitLabel="حفظ التصنيف"
            fields={[
              { key: 'waste_type', label: 'نوع النفايات', placeholder: 'خطرة / غير خطرة / طبية...' },
              { key: 'sub_type', label: 'التصنيف الفرعي', placeholder: 'مذيبات / حمضيات...' },
              { key: 'hazard_class', label: 'فئة الخطورة', placeholder: '1-9' },
            ]}
            onSubmit={(data) => handleFormSubmit('waste_classified', data)}
          />
        );

      // ─── Request / Issue Certificates ───
      case 'request_cert':
      case 'recycle_cert':
      case 'dispose_cert':
        return (
          <SimpleFormPanel
            title={action === 'request_cert' ? 'طلب شهادة تدوير' : action === 'recycle_cert' ? 'إصدار شهادة تدوير' : 'إصدار شهادة تخلص آمن'}
            loading={loading} submitLabel={action === 'request_cert' ? 'إرسال الطلب' : 'إصدار الشهادة'}
            fields={[
              { key: 'shipment_ref', label: 'مرجع الشحنة', placeholder: '#' },
              { key: 'notes', label: 'ملاحظات', type: 'textarea' },
            ]}
            onSubmit={(data) => handleFormSubmit(action === 'request_cert' ? 'cert_requested' : 'cert_issued', data)}
          />
        );

      // ─── Handover ───
      case 'handover':
        return (
          <SimpleFormPanel title="تسليم الشحنة" loading={loading} submitLabel="تأكيد التسليم"
            fields={[
              { key: 'receiver_name', label: 'اسم المستلم', placeholder: 'الاسم الكامل' },
              { key: 'notes', label: 'ملاحظات', type: 'textarea' },
            ]}
            onSubmit={(data) => handleFormSubmit('handed_over', data)}
          />
        );

      // ─── Update Capacity ───
      case 'update_capacity':
        return (
          <SimpleFormPanel title="تحديث سعة المدفن" loading={loading} submitLabel="تحديث"
            fields={[
              { key: 'remaining_capacity', label: 'السعة المتبقية (طن)', type: 'number' },
              { key: 'total_capacity', label: 'السعة الإجمالية (طن)', type: 'number' },
            ]}
            onSubmit={(data) => handleFormSubmit('capacity_updated', data)}
          />
        );

      // ─── Leachate Report ───
      case 'leachate_report':
        return (
          <SimpleFormPanel title="تقرير الرشيح" loading={loading} submitLabel="حفظ التقرير"
            fields={[
              { key: 'ph', label: 'درجة الحموضة pH', type: 'number' },
              { key: 'volume', label: 'حجم الرشيح (لتر)', type: 'number' },
              { key: 'notes', label: 'ملاحظات', type: 'textarea' },
            ]}
            onSubmit={(data) => handleFormSubmit('leachate_reported', data)}
          />
        );

      // ─── Fleet Check ───
      case 'fleet_check':
        return (
          <SimpleFormPanel title="فحص سلامة المركبة" loading={loading} submitLabel="حفظ الفحص"
            fields={[
              { key: 'vehicle_plate', label: 'رقم اللوحة' },
              { key: 'status', label: 'الحالة (سليمة / تحتاج صيانة)' },
              { key: 'notes', label: 'ملاحظات', type: 'textarea' },
            ]}
            onSubmit={(data) => handleFormSubmit('fleet_checked', data)}
          />
        );

      // ─── Log Fuel ───
      case 'log_fuel':
        return (
          <SimpleFormPanel title="تسجيل استهلاك الوقود" loading={loading} submitLabel="حفظ"
            fields={[
              { key: 'liters', label: 'عدد اللترات', type: 'number' },
              { key: 'cost', label: 'التكلفة', type: 'number' },
              { key: 'vehicle_plate', label: 'رقم اللوحة' },
            ]}
            onSubmit={(data) => handleFormSubmit('fuel_logged', data)}
          />
        );

      default:
        return (
          <div className="text-center text-sm text-muted-foreground py-8">
            هذا الإجراء قيد التطوير
          </div>
        );
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOverlayAction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
          >
            <div className="flex items-center justify-between p-3 border-b">
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
              <span className="text-sm font-bold">{meta.emoji} {meta.title}</span>
              <div className="w-8" />
            </div>
            <div className="flex-1 overflow-auto p-4">
              {renderActionContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(action === 'sign' || action === 'stamp') && (
        <UniversalSignatureDialog
          open={signDialogOpen}
          onOpenChange={(open) => { setSignDialogOpen(open); if (!open) onClose(); }}
          onSign={handleSign}
          documentType={(['shipment', 'contract', 'invoice', 'certificate', 'award_letter'].includes(resourceType) ? resourceType : 'other') as any}
          documentId={resourceId}
          organizationId={organization?.id || ''}
          loading={loading}
          signerDefaults={{ name: profile?.full_name || '', title: '' }}
        />
      )}
    </>
  );
});

ChatActionPanel.displayName = 'ChatActionPanel';
export default ChatActionPanel;
