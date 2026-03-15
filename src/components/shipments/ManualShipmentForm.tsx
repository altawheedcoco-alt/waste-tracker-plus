import { useRef, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Save, Download, Share2, Send, RotateCcw, FileText, Printer, Plus, Trash2,
  User, Truck, Factory, Package, MapPin, Calendar, Scale, DollarSign, 
  FileCheck, AlertTriangle, ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import { ManualShipmentData, WasteItem, createEmptyWasteItem } from '@/hooks/useManualShipmentDraft';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import WeighbridgeReceiptScanner from './WeighbridgeReceiptScanner';

interface ManualShipmentFormProps {
  form: ManualShipmentData;
  updateField: (field: keyof ManualShipmentData, value: string) => void;
  setForm: React.Dispatch<React.SetStateAction<ManualShipmentData>>;
  saving: boolean;
  savedShareCode: string | null;
  onSave: () => Promise<{ shareCode: string; draftId: string } | null>;
  onSubmit: () => Promise<void>;
  onReset: () => void;
  onExportPDF: () => void;
  onSaveAndDownloadPDF?: () => Promise<void>;
  onSaveAndSendWhatsApp?: () => Promise<void>;
  onSaveAndPrintPDF?: () => Promise<void>;
}

const SectionHeader = ({ icon: Icon, title, color = 'text-primary' }: { icon: React.ElementType; title: string; color?: string }) => (
  <div className="flex items-center gap-2 mb-4 justify-end">
    <h3 className="font-bold text-base">{title}</h3>
    <div className={`w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
  </div>
);

const FormField = ({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium flex items-center gap-1 justify-end">
      {required && <span className="text-destructive">*</span>}
      {label}
    </Label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      dir="rtl"
      className="text-sm"
    />
  </div>
);

const ManualShipmentForm = ({
  form, updateField, setForm, saving, savedShareCode,
  onSave, onSubmit, onReset, onExportPDF,
  onSaveAndDownloadPDF, onSaveAndSendWhatsApp, onSaveAndPrintPDF,
}: ManualShipmentFormProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const updateWasteItem = useCallback((index: number, field: keyof WasteItem, value: string) => {
    setForm(prev => {
      const items = [...prev.waste_items];
      items[index] = { ...items[index], [field]: value };
      // Auto-calc price for this item
      if (field === 'price_per_unit' || field === 'quantity') {
        const qty = parseFloat(field === 'quantity' ? value : items[index].quantity) || 0;
        const unitPrice = parseFloat(field === 'price_per_unit' ? value : items[index].price_per_unit) || 0;
        items[index].price = (qty * unitPrice).toFixed(2);
      }
      return { ...prev, waste_items: items };
    });
  }, [setForm]);

  const addWasteItem = useCallback(() => {
    setForm(prev => ({ ...prev, waste_items: [...prev.waste_items, createEmptyWasteItem()] }));
  }, [setForm]);

  const removeWasteItem = useCallback((index: number) => {
    setForm(prev => {
      if (prev.waste_items.length <= 1) return prev;
      return { ...prev, waste_items: prev.waste_items.filter((_, i) => i !== index) };
    });
  }, [setForm]);

  const handleWeighbridgeData = useCallback((index: number, data: {
    net_weight?: string; unit?: string; vehicle_number?: string; driver_name?: string;
    material_type?: string; date?: string; company_name?: string; ticket_number?: string;
  }) => {
    // Auto-fill the waste item quantity from net weight
    if (data.net_weight) {
      const weight = parseFloat(data.net_weight.replace(/[^\d.]/g, ''));
      if (!isNaN(weight)) {
        updateWasteItem(index, 'quantity', weight.toString());
      }
    }
    // Auto-fill unit
    if (data.unit) {
      const unitMap: Record<string, string> = {
        'كجم': 'kg', 'كيلو': 'kg', 'kg': 'kg', 'كيلوجرام': 'kg',
        'طن': 'ton', 'ton': 'ton', 't': 'ton',
        'لتر': 'liter', 'liter': 'liter', 'l': 'liter',
      };
      const mapped = unitMap[data.unit.toLowerCase().trim()];
      if (mapped) updateWasteItem(index, 'unit', mapped);
    }
    // Auto-fill vehicle plate and driver at form level (shared)
    if (data.vehicle_number && !form.vehicle_plate) {
      updateField('vehicle_plate', data.vehicle_number);
    }
    if (data.driver_name && !form.driver_name) {
      updateField('driver_name', data.driver_name);
    }
    // Auto-fill date
    if (data.date && !form.pickup_date) {
      updateField('pickup_date', data.date);
    }
  }, [updateWasteItem, updateField, form.vehicle_plate, form.driver_name, form.pickup_date]);

  const handleShare = async () => {
    const code = savedShareCode || await onSave();
    if (!code) return;
    
    const shareUrl = `${window.location.origin}/shared-shipment/${code}`;
    
    if (navigator.share) {
      navigator.share({ title: 'نموذج شحنة', url: shareUrl }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('تم نسخ رابط المشاركة', {
        description: 'يمكن لأي شخص فتح الرابط وتعديل النموذج وإعادة إرساله',
      });
    }
  };

  const handleWhatsAppShare = async () => {
    const code = savedShareCode || await onSave();
    if (!code) return;

    const shareUrl = `${window.location.origin}/shared-shipment/${code}`;
    const shipmentNo = form.shipment_number ? ` رقم ${form.shipment_number}` : '';
    const generator = form.generator_name ? `\nالمولّد: ${form.generator_name}` : '';
    const transporter = form.transporter_name ? `\nالناقل: ${form.transporter_name}` : '';
    const destination = form.destination_name ? `\nالوجهة: ${form.destination_name}` : '';
    const waste = form.waste_type ? `\nنوع المخلف: ${form.waste_type}` : '';
    const qty = form.quantity ? `\nالكمية: ${form.quantity} ${form.unit === 'ton' ? 'طن' : form.unit === 'kg' ? 'كجم' : form.unit}` : '';

    const message = `📋 *نموذج شحنة${shipmentNo}*${generator}${transporter}${destination}${waste}${qty}\n\n🔗 رابط النموذج (قابل للتعديل):\n${shareUrl}`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handlePrint = () => {
    import('@/services/documentService').then(({ PrintService }) => {
      PrintService.printHTML(document.querySelector('.manual-shipment-form')?.innerHTML || '', { title: 'نموذج شحنة يدوي' });
    });
  };

  const wasteTypes = [
    { value: 'plastic', label: 'بلاستيك' }, { value: 'paper', label: 'ورق' },
    { value: 'metal', label: 'معادن' }, { value: 'glass', label: 'زجاج' },
    { value: 'electronic', label: 'إلكترونيات' }, { value: 'organic', label: 'عضوي' },
    { value: 'chemical', label: 'كيميائي' }, { value: 'medical', label: 'طبي' },
    { value: 'construction', label: 'مخلفات بناء' }, { value: 'other', label: 'أخرى' },
  ];

  const disposalMethods = [
    { value: 'recycling', label: 'إعادة تدوير' }, { value: 'remanufacturing', label: 'إعادة تصنيع' },
    { value: 'landfill', label: 'دفن صحي' }, { value: 'incineration', label: 'حرق' },
    { value: 'treatment', label: 'معالجة' }, { value: 'reuse', label: 'إعادة استخدام' },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Action Bar */}
      <div className="flex items-center gap-2 flex-wrap sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 border-b">
        <Button onClick={onSave} disabled={saving} variant="default" className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ المسودة'}
        </Button>
        <Separator orientation="vertical" className="h-6" />
        {onSaveAndDownloadPDF && (
          <Button onClick={onSaveAndDownloadPDF} disabled={saving} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            حفظ + تنزيل PDF
          </Button>
        )}
        {onSaveAndPrintPDF && (
          <Button onClick={onSaveAndPrintPDF} disabled={saving} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            حفظ + طباعة
          </Button>
        )}
        {onSaveAndSendWhatsApp && (
          <Button onClick={onSaveAndSendWhatsApp} disabled={saving} variant="outline" className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            <MessageCircle className="w-4 h-4" />
            حفظ + إرسال واتساب
          </Button>
        )}
        <Separator orientation="vertical" className="h-6" />
        <Button onClick={handleShare} variant="outline" className="gap-2">
          <Share2 className="w-4 h-4" />
          مشاركة رابط
        </Button>
        <Button onClick={onSubmit} variant="default" className="gap-2 bg-primary">
          <Send className="w-4 h-4" />
          إرسال نهائي
        </Button>
        <div className="flex-1" />
        <Button onClick={onReset} variant="ghost" size="sm" className="gap-1 text-destructive">
          <RotateCcw className="w-3.5 h-3.5" />
          مسح الكل
        </Button>
        {savedShareCode && (
          <Badge variant="secondary" className="text-xs gap-1">
            <FileCheck className="w-3 h-3" />
            محفوظ
          </Badge>
        )}
      </div>

      <div ref={printRef} className="space-y-4 print:space-y-2">
        {/* 1. Shipment Info */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={ClipboardList} title="بيانات الشحنة" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="رقم الشحنة" value={form.shipment_number} onChange={v => updateField('shipment_number', v)} placeholder="SHP-001" />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-right block">نوع النقلة</Label>
              <Select value={form.shipment_type} onValueChange={v => updateField('shipment_type', v)}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">عادية</SelectItem>
                  <SelectItem value="urgent">عاجلة</SelectItem>
                  <SelectItem value="scheduled">مجدولة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-right block">الوجهة</Label>
              <Select value={form.destination_type} onValueChange={v => updateField('destination_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recycling">تدوير</SelectItem>
                  <SelectItem value="disposal">تخلص نهائي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 2. Generator */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={User} title="بيانات المولّد (مصدر المخلفات)" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="اسم الجهة المولدة" value={form.generator_name} onChange={v => updateField('generator_name', v)} placeholder="شركة ..." required />
            <FormField label="العنوان" value={form.generator_address} onChange={v => updateField('generator_address', v)} placeholder="المدينة - الحي" />
            <FormField label="رقم الهاتف" value={form.generator_phone} onChange={v => updateField('generator_phone', v)} placeholder="01xxxxxxxxx" />
            <FormField label="البريد الإلكتروني" value={form.generator_email} onChange={v => updateField('generator_email', v)} placeholder="info@company.com" />
            <FormField label="رقم الترخيص البيئي" value={form.generator_license} onChange={v => updateField('generator_license', v)} placeholder="رقم الموافقة البيئية" />
            <FormField label="السجل التجاري" value={form.generator_commercial_register} onChange={v => updateField('generator_commercial_register', v)} placeholder="رقم السجل التجاري" />
            <FormField label="الرقم الضريبي" value={form.generator_tax_id} onChange={v => updateField('generator_tax_id', v)} placeholder="رقم التسجيل الضريبي" />
            <FormField label="الممثل القانوني" value={form.generator_representative} onChange={v => updateField('generator_representative', v)} placeholder="اسم المفوض بالتوقيع" />
          </CardContent>
        </Card>

        {/* 3. Transporter */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Truck} title="بيانات الناقل" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="اسم الجهة الناقلة" value={form.transporter_name} onChange={v => updateField('transporter_name', v)} placeholder="شركة النقل" required />
            <FormField label="العنوان" value={form.transporter_address} onChange={v => updateField('transporter_address', v)} />
            <FormField label="رقم الهاتف" value={form.transporter_phone} onChange={v => updateField('transporter_phone', v)} />
            <FormField label="البريد الإلكتروني" value={form.transporter_email} onChange={v => updateField('transporter_email', v)} placeholder="info@transport.com" />
            <FormField label="رقم ترخيص النقل" value={form.transporter_license} onChange={v => updateField('transporter_license', v)} placeholder="ترخيص WMRA" />
            <FormField label="السجل التجاري" value={form.transporter_commercial_register} onChange={v => updateField('transporter_commercial_register', v)} placeholder="رقم السجل التجاري" />
            <FormField label="الرقم الضريبي" value={form.transporter_tax_id} onChange={v => updateField('transporter_tax_id', v)} placeholder="رقم التسجيل الضريبي" />
            <FormField label="الممثل القانوني" value={form.transporter_representative} onChange={v => updateField('transporter_representative', v)} placeholder="اسم المفوض بالتوقيع" />
          </CardContent>
        </Card>

        {/* 4. Destination */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Factory} title={form.destination_type === 'disposal' ? 'بيانات جهة التخلص' : 'بيانات جهة التدوير'} />
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="اسم الجهة" value={form.destination_name} onChange={v => updateField('destination_name', v)} required />
            <FormField label="العنوان" value={form.destination_address} onChange={v => updateField('destination_address', v)} />
            <FormField label="رقم الهاتف" value={form.destination_phone} onChange={v => updateField('destination_phone', v)} />
            <FormField label="البريد الإلكتروني" value={form.destination_email} onChange={v => updateField('destination_email', v)} placeholder="info@facility.com" />
            <FormField label="رقم الترخيص" value={form.destination_license} onChange={v => updateField('destination_license', v)} />
            <FormField label="السجل التجاري" value={form.destination_commercial_register} onChange={v => updateField('destination_commercial_register', v)} placeholder="رقم السجل التجاري" />
            <FormField label="الرقم الضريبي" value={form.destination_tax_id} onChange={v => updateField('destination_tax_id', v)} placeholder="رقم التسجيل الضريبي" />
            <FormField label="الممثل القانوني" value={form.destination_representative} onChange={v => updateField('destination_representative', v)} placeholder="اسم المفوض بالتوقيع" />
          </CardContent>
        </Card>

        {/* 5. Waste Items — single vs multi toggle */}
        <Card>
          <CardHeader className="pb-3 space-y-3">
            <SectionHeader icon={Package} title="بيانات المخلفات" />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-muted/40 rounded-lg p-1 border">
                <Button
                  type="button"
                  size="sm"
                  variant={form.waste_items.length <= 1 ? 'default' : 'ghost'}
                  className="text-xs h-8 px-3"
                  onClick={() => {
                    if (form.waste_items.length > 1) {
                      setForm(prev => ({ ...prev, waste_items: [prev.waste_items[0]] }));
                    }
                  }}
                >
                  نوع واحد
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={form.waste_items.length > 1 ? 'default' : 'ghost'}
                  className="text-xs h-8 px-3"
                  onClick={() => {
                    if (form.waste_items.length <= 1) addWasteItem();
                  }}
                >
                  أنواع متعددة
                </Button>
              </div>
              {form.waste_items.length > 1 && (
                <Button type="button" variant="outline" size="sm" onClick={addWasteItem} className="gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" /> إضافة مخلف آخر
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {form.waste_items.map((item, idx) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-4 relative bg-muted/10">
                <div className="flex items-center justify-between">
                  {form.waste_items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeWasteItem(idx)} className="text-destructive hover:bg-destructive/10 h-7 w-7">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Badge variant="outline" className="text-xs">مخلف {idx + 1}</Badge>
                </div>

                {/* Weighbridge Receipt Scanner per waste item */}
                <WeighbridgeReceiptScanner
                  wasteItemIndex={idx}
                  onDataExtracted={handleWeighbridgeData}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-right block">نوع المخلف <span className="text-destructive">*</span></Label>
                    <Select value={item.waste_type} onValueChange={v => updateWasteItem(idx, 'waste_type', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر نوع المخلف" /></SelectTrigger>
                      <SelectContent>
                        {wasteTypes.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-right block">حالة المخلف</Label>
                    <Select value={item.waste_state} onValueChange={v => updateWasteItem(idx, 'waste_state', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">صلب</SelectItem>
                        <SelectItem value="liquid">سائل</SelectItem>
                        <SelectItem value="gas">غازي</SelectItem>
                        <SelectItem value="sludge">حمأة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-right block">مستوى الخطورة</Label>
                    <Select value={item.hazard_level} onValueChange={v => updateWasteItem(idx, 'hazard_level', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non_hazardous">غير خطر</SelectItem>
                        <SelectItem value="hazardous">خطر</SelectItem>
                        <SelectItem value="highly_hazardous">شديد الخطورة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="الكمية" value={item.quantity} onChange={v => updateWasteItem(idx, 'quantity', v)} placeholder="0.00" type="number" required />
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-right block">الوحدة</Label>
                    <Select value={item.unit} onValueChange={v => updateWasteItem(idx, 'unit', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ton">طن</SelectItem>
                        <SelectItem value="kg">كيلوجرام</SelectItem>
                        <SelectItem value="liter">لتر</SelectItem>
                        <SelectItem value="m3">متر مكعب</SelectItem>
                        <SelectItem value="unit">وحدة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-right block">طريقة التعبئة</Label>
                    <Select value={item.packaging_method} onValueChange={v => updateWasteItem(idx, 'packaging_method', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="packaged">معبأ</SelectItem>
                        <SelectItem value="unpackaged">غير معبأ</SelectItem>
                        <SelectItem value="drums">براميل</SelectItem>
                        <SelectItem value="bags">أكياس</SelectItem>
                        <SelectItem value="containers">حاويات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="وصف المخلف" value={item.waste_description} onChange={v => updateWasteItem(idx, 'waste_description', v)} placeholder="وصف تفصيلي للمخلف" />
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-right block">طريقة المعالجة / التخلص</Label>
                    <Select value={item.disposal_method} onValueChange={v => updateWasteItem(idx, 'disposal_method', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        {disposalMethods.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Per-item financials */}
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <FormField label="سعر الوحدة (ج.م)" value={item.price_per_unit} onChange={v => updateWasteItem(idx, 'price_per_unit', v)} type="number" placeholder="0.00" />
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground text-right block">إجمالي الصنف</Label>
                    <Input value={item.price || '0.00'} readOnly className="bg-muted/50 font-bold text-right" dir="rtl" />
                  </div>
                  <FormField label="مصاريف إضافية" value={item.extra_costs} onChange={v => updateWasteItem(idx, 'extra_costs', v)} type="number" placeholder="0.00" />
                  <div className="space-y-1.5 flex items-end gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <Label className="text-xs">ض.ق.م 14%</Label>
                        <Checkbox checked={item.vat_enabled === 'true'} onCheckedChange={c => updateWasteItem(idx, 'vat_enabled', c ? 'true' : 'false')} />
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Label className="text-xs">ض.عمل</Label>
                        <Checkbox checked={item.labor_tax_enabled === 'true'} onCheckedChange={c => updateWasteItem(idx, 'labor_tax_enabled', c ? 'true' : 'false')} />
                      </div>
                      {item.labor_tax_enabled === 'true' && (
                        <FormField label="نسبة %" value={item.labor_tax_percent} onChange={v => updateWasteItem(idx, 'labor_tax_percent', v)} type="number" placeholder="0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 6. Driver & Vehicle */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={Truck} title="بيانات السائق والمركبة" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="اسم السائق" value={form.driver_name} onChange={v => updateField('driver_name', v)} />
            <FormField label="هاتف السائق" value={form.driver_phone} onChange={v => updateField('driver_phone', v)} />
            <FormField label="رقم رخصة القيادة" value={form.driver_license} onChange={v => updateField('driver_license', v)} />
            <FormField label="رقم لوحة المركبة" value={form.vehicle_plate} onChange={v => updateField('vehicle_plate', v)} placeholder="أ ب ج 1234" />
            <FormField label="نوع المركبة" value={form.vehicle_type} onChange={v => updateField('vehicle_type', v)} placeholder="شاحنة مغلقة / صهريج" />
          </CardContent>
        </Card>

        {/* 7. Logistics */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={MapPin} title="بيانات التحميل والتسليم" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="عنوان التحميل" value={form.pickup_address} onChange={v => updateField('pickup_address', v)} placeholder="عنوان موقع التحميل" />
            <FormField label="عنوان التسليم" value={form.delivery_address} onChange={v => updateField('delivery_address', v)} placeholder="عنوان موقع التسليم" />
            <FormField label="تاريخ التحميل" value={form.pickup_date} onChange={v => updateField('pickup_date', v)} type="date" />
            <FormField label="تاريخ التسليم المتوقع" value={form.delivery_date} onChange={v => updateField('delivery_date', v)} type="date" />
          </CardContent>
        </Card>

        {/* 8. Financial Summary — Auto-calculated from waste items */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={DollarSign} title="ملخص البيانات المالية" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Per-item summary table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" dir="rtl">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-2 text-right font-bold">الصنف</th>
                    <th className="p-2 text-right font-bold">الكمية</th>
                    <th className="p-2 text-right font-bold">سعر الوحدة</th>
                    <th className="p-2 text-right font-bold">إجمالي</th>
                    <th className="p-2 text-right font-bold">مصاريف</th>
                    <th className="p-2 text-right font-bold">ض.ق.م</th>
                    <th className="p-2 text-right font-bold">ض.عمل</th>
                    <th className="p-2 text-right font-bold">صافي الصنف</th>
                  </tr>
                </thead>
                <tbody>
                  {form.waste_items.map((item, idx) => {
                    const base = parseFloat(item.price) || 0;
                    const extra = parseFloat(item.extra_costs) || 0;
                    const vat = item.vat_enabled === 'true' ? (base + extra) * 0.14 : 0;
                    const laborPct = parseFloat(item.labor_tax_percent) || 0;
                    const labor = item.labor_tax_enabled === 'true' ? (base + extra) * laborPct / 100 : 0;
                    const itemTotal = base + extra + vat + labor;
                    const wLabel = wasteTypes.find(w => w.value === item.waste_type)?.label || `مخلف ${idx + 1}`;
                    return (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{wLabel}</td>
                        <td className="p-2">{item.quantity || '—'}</td>
                        <td className="p-2">{item.price_per_unit || '—'}</td>
                        <td className="p-2">{base.toFixed(2)}</td>
                        <td className="p-2">{extra ? extra.toFixed(2) : '—'}</td>
                        <td className="p-2">{vat ? vat.toFixed(2) : '—'}</td>
                        <td className="p-2">{labor ? labor.toFixed(2) : '—'}</td>
                        <td className="p-2 font-bold">{itemTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Grand total + Paid + Remaining */}
            {(() => {
              let grandTotal = 0;
              form.waste_items.forEach(item => {
                const base = parseFloat(item.price) || 0;
                const extra = parseFloat(item.extra_costs) || 0;
                const vat = item.vat_enabled === 'true' ? (base + extra) * 0.14 : 0;
                const laborPct = parseFloat(item.labor_tax_percent) || 0;
                const labor = item.labor_tax_enabled === 'true' ? (base + extra) * laborPct / 100 : 0;
                grandTotal += base + extra + vat + labor;
              });
              const paid = parseFloat(form.amount_paid) || 0;
              const remaining = grandTotal - paid;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/30 rounded-lg p-4 border">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-right block">💰 الإجمالي الكلي (ج.م)</Label>
                    <Input value={grandTotal.toFixed(2)} readOnly className="bg-background font-bold text-lg text-right border-primary/30" dir="rtl" />
                  </div>
                  <FormField label="💵 المبلغ المدفوع (ج.م)" value={form.amount_paid} onChange={v => updateField('amount_paid', v)} type="number" placeholder="0.00" />
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-right block">📊 المتبقي (ج.م)</Label>
                    <Input 
                      value={remaining.toFixed(2)} 
                      readOnly 
                      className={`bg-background font-bold text-lg text-right ${remaining > 0 ? 'text-destructive border-destructive/30' : 'text-emerald-600 border-emerald-300'}`} 
                      dir="rtl" 
                    />
                  </div>
                </div>
              );
            })()}

            <FormField label="ملاحظات مالية" value={form.price_notes} onChange={v => updateField('price_notes', v)} placeholder="طريقة الدفع أو ملاحظات" />

            {/* Finance visibility controls */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <div className="flex items-center gap-2 justify-end">
                <Label className="text-xs font-bold">🔒 التحكم في إظهار البيانات المالية في النموذج المرسل</Label>
              </div>
              <Select value={form.finance_visibility} onValueChange={v => updateField('finance_visibility', v)}>
                <SelectTrigger className="text-right" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">إظهار لجميع الأطراف</SelectItem>
                  <SelectItem value="none">إخفاء عن جميع الأطراف</SelectItem>
                  <SelectItem value="custom">تحديد الجهات يدوياً</SelectItem>
                </SelectContent>
              </Select>
              {form.finance_visibility === 'custom' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {[
                    { key: 'finance_visible_to_generator' as const, label: 'المولّد' },
                    { key: 'finance_visible_to_transporter' as const, label: 'الناقل' },
                    { key: 'finance_visible_to_destination' as const, label: 'المستقبل' },
                    { key: 'finance_visible_to_driver' as const, label: 'السائق' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2 justify-end border rounded-md p-2">
                      <Label className="text-xs">{label}</Label>
                      <Checkbox
                        checked={form[key] === 'true'}
                        onCheckedChange={(checked) => updateField(key, checked ? 'true' : 'false')}
                      />
                    </div>
                  ))}
                </div>
              )}
              {form.finance_visibility === 'none' && (
                <p className="text-xs text-muted-foreground text-right">❌ لن تظهر صفحة البيانات المالية في أي نموذج مرسل</p>
              )}
              {form.finance_visibility === 'custom' && (
                <p className="text-xs text-muted-foreground text-right">✅ ستظهر البيانات المالية فقط للجهات المحددة أعلاه</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 9. Notes */}
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader icon={FileText} title="ملاحظات وتعليمات" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-right block">ملاحظات عامة</Label>
              <Textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} placeholder="أي ملاحظات إضافية..." rows={3} dir="rtl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-right block">تعليمات خاصة</Label>
              <Textarea value={form.special_instructions} onChange={e => updateField('special_instructions', e.target.value)} placeholder="تعليمات السلامة أو التعامل الخاص..." rows={3} dir="rtl" />
            </div>
          </CardContent>
        </Card>

        {/* Signature area (print only) */}
        <div className="hidden print:block mt-8">
          <Separator className="my-4" />
          <div className="grid grid-cols-3 gap-8 text-center text-sm">
            <div>
              <p className="font-bold mb-8">توقيع المولّد</p>
              <div className="border-b border-foreground w-full" />
              <p className="text-xs text-muted-foreground mt-1">الاسم والتوقيع والختم</p>
            </div>
            <div>
              <p className="font-bold mb-8">توقيع الناقل</p>
              <div className="border-b border-foreground w-full" />
              <p className="text-xs text-muted-foreground mt-1">الاسم والتوقيع والختم</p>
            </div>
            <div>
              <p className="font-bold mb-8">توقيع المستقبل</p>
              <div className="border-b border-foreground w-full" />
              <p className="text-xs text-muted-foreground mt-1">الاسم والتوقيع والختم</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualShipmentForm;
