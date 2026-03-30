import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { generateManualShipmentPDF, generateManualShipmentPDFBlob } from '@/utils/manualShipmentPdf';

export interface WasteItem {
  id: string;
  waste_type: string;
  waste_description: string;
  waste_state: string;
  hazard_level: string;
  quantity: string;
  unit: string;
  packaging_method: string;
  disposal_method: string;
  price_per_unit: string;
  price: string;
  vat_enabled: string;
  vat_amount: string;
  labor_tax_enabled: string;
  labor_tax_percent: string;
  labor_tax_amount: string;
  extra_costs: string;
}

export function createEmptyWasteItem(): WasteItem {
  return {
    id: crypto.randomUUID(),
    waste_type: '', waste_description: '', waste_state: 'solid', hazard_level: 'non_hazardous',
    quantity: '', unit: 'ton', packaging_method: '', disposal_method: '',
    price_per_unit: '', price: '', vat_enabled: 'false', vat_amount: '',
    labor_tax_enabled: 'false', labor_tax_percent: '', labor_tax_amount: '', extra_costs: '',
  };
}

export interface ManualShipmentData {
  id?: string;
  share_code?: string;
  shipment_number: string;
  generator_name: string;
  generator_address: string;
  generator_phone: string;
  generator_license: string;
  generator_commercial_register: string;
  generator_tax_id: string;
  generator_representative: string;
  generator_email: string;
  transporter_name: string;
  transporter_address: string;
  transporter_phone: string;
  transporter_license: string;
  transporter_commercial_register: string;
  transporter_tax_id: string;
  transporter_representative: string;
  transporter_email: string;
  destination_name: string;
  destination_address: string;
  destination_phone: string;
  destination_license: string;
  destination_commercial_register: string;
  destination_tax_id: string;
  destination_representative: string;
  destination_email: string;
  destination_type: string;
  // Legacy single-waste fields (kept for backward compat)
  waste_type: string;
  waste_description: string;
  waste_state: string;
  hazard_level: string;
  quantity: string;
  unit: string;
  packaging_method: string;
  disposal_method: string;
  // Multi-waste items
  waste_items: WasteItem[];
  driver_name: string;
  driver_phone: string;
  driver_license: string;
  vehicle_plate: string;
  vehicle_type: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string;
  delivery_date: string;
  shipment_type: string;
  price: string;
  price_per_unit: string;
  vat_enabled: string;
  vat_amount: string;
  labor_tax_enabled: string;
  labor_tax_percent: string;
  labor_tax_amount: string;
  extra_costs: string;
  amount_paid: string;
  price_notes: string;
  finance_visibility: string;
  finance_visible_to_generator: string;
  finance_visible_to_transporter: string;
  finance_visible_to_destination: string;
  finance_visible_to_driver: string;
  notes: string;
  special_instructions: string;
}

const emptyForm: ManualShipmentData = {
  shipment_number: '',
  generator_name: '', generator_address: '', generator_phone: '', generator_license: '',
  generator_commercial_register: '', generator_tax_id: '', generator_representative: '', generator_email: '',
  transporter_name: '', transporter_address: '', transporter_phone: '', transporter_license: '',
  transporter_commercial_register: '', transporter_tax_id: '', transporter_representative: '', transporter_email: '',
  destination_name: '', destination_address: '', destination_phone: '', destination_license: '',
  destination_commercial_register: '', destination_tax_id: '', destination_representative: '', destination_email: '',
  destination_type: 'recycling',
  waste_type: '', waste_description: '', waste_state: 'solid', hazard_level: 'non_hazardous',
  quantity: '', unit: 'ton', packaging_method: '', disposal_method: '',
  waste_items: [createEmptyWasteItem()],
  driver_name: '', driver_phone: '', driver_license: '', vehicle_plate: '', vehicle_type: '',
  pickup_address: '', delivery_address: '', pickup_date: '', delivery_date: '',
  shipment_type: 'regular', price: '', price_per_unit: '',
  vat_enabled: 'false', vat_amount: '', labor_tax_enabled: 'false', labor_tax_percent: '', labor_tax_amount: '',
  extra_costs: '', amount_paid: '',
  price_notes: '', finance_visibility: 'all', finance_visible_to_generator: 'true', finance_visible_to_transporter: 'true', finance_visible_to_destination: 'true', finance_visible_to_driver: 'true',
  notes: '', special_instructions: '',
};

export function useManualShipmentDraft(draftId?: string, shareCode?: string) {
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);
  const [form, setForm] = useState<ManualShipmentData>(() => {
    // Initialize from localStorage immediately to avoid race condition
    if (!draftId && !shareCode) {
      try {
        const saved = localStorage.getItem('manual_shipment_draft');
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...emptyForm, ...parsed };
        }
      } catch { /* ignore */ }
    }
    return { ...emptyForm };
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(draftId || null);
  const [savedShareCode, setSavedShareCode] = useState<string | null>(null);

  // Load existing draft from DB
  useEffect(() => {
    if (draftId) loadById(draftId);
    else if (shareCode) loadByShareCode(shareCode);
    else setInitialized(true);
  }, [draftId, shareCode]);

  // Auto-save to localStorage on change (only after initialization)
  useEffect(() => {
    if (initialized) {
      localStorage.setItem('manual_shipment_draft', JSON.stringify(form));
    }
  }, [form, initialized]);


  const loadById = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('manual_shipment_drafts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    setLoading(false);
    if (data) {
      mapDbToForm(data);
      setSavedDraftId(data.id);
      setSavedShareCode(data.share_code);
    }
    setInitialized(true);
  };

  const loadByShareCode = async (code: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('manual_shipment_drafts')
      .select('*')
      .eq('share_code', code)
      .maybeSingle();
    setLoading(false);
    if (data) {
      mapDbToForm(data);
      setSavedDraftId(data.id);
      setSavedShareCode(data.share_code);
    } else {
      toast.error('لم يتم العثور على النموذج المطلوب');
    }
    setInitialized(true);
  };

  const mapDbToForm = (data: any) => {
    setForm({
      id: data.id,
      share_code: data.share_code,
      shipment_number: data.shipment_number || '',
      generator_name: data.generator_name || '',
      generator_address: data.generator_address || '',
      generator_phone: data.generator_phone || '',
      generator_license: data.generator_license || '',
      generator_commercial_register: data.generator_commercial_register || '',
      generator_tax_id: data.generator_tax_id || '',
      generator_representative: data.generator_representative || '',
      generator_email: data.generator_email || '',
      transporter_name: data.transporter_name || '',
      transporter_address: data.transporter_address || '',
      transporter_phone: data.transporter_phone || '',
      transporter_license: data.transporter_license || '',
      transporter_commercial_register: data.transporter_commercial_register || '',
      transporter_tax_id: data.transporter_tax_id || '',
      transporter_representative: data.transporter_representative || '',
      transporter_email: data.transporter_email || '',
      destination_name: data.destination_name || '',
      destination_address: data.destination_address || '',
      destination_phone: data.destination_phone || '',
      destination_license: data.destination_license || '',
      destination_commercial_register: data.destination_commercial_register || '',
      destination_tax_id: data.destination_tax_id || '',
      destination_representative: data.destination_representative || '',
      destination_email: data.destination_email || '',
      destination_type: data.destination_type || 'recycling',
      waste_type: data.waste_type || '',
      waste_description: data.waste_description || '',
      waste_state: data.waste_state || 'solid',
      hazard_level: data.hazard_level || 'non_hazardous',
      quantity: data.quantity?.toString() || '',
      unit: data.unit || 'ton',
      packaging_method: data.packaging_method || '',
      disposal_method: data.disposal_method || '',
      waste_items: Array.isArray(data.waste_items) && data.waste_items.length > 0 
        ? data.waste_items.map((w: any) => ({ ...createEmptyWasteItem(), ...w }))
        : [createEmptyWasteItem()],
      driver_name: data.driver_name || '',
      driver_phone: data.driver_phone || '',
      driver_license: data.driver_license || '',
      vehicle_plate: data.vehicle_plate || '',
      vehicle_type: data.vehicle_type || '',
      pickup_address: data.pickup_address || '',
      delivery_address: data.delivery_address || '',
      pickup_date: data.pickup_date || '',
      delivery_date: data.delivery_date || '',
      shipment_type: data.shipment_type || 'regular',
      price: data.price?.toString() || '',
      price_per_unit: data.price_per_unit?.toString() || '',
      vat_enabled: data.vat_enabled?.toString() || 'false',
      vat_amount: data.vat_amount?.toString() || '',
      labor_tax_enabled: data.labor_tax_enabled?.toString() || 'false',
      labor_tax_percent: data.labor_tax_percent?.toString() || '',
      labor_tax_amount: data.labor_tax_amount?.toString() || '',
      extra_costs: data.extra_costs?.toString() || '',
      amount_paid: data.amount_paid?.toString() || '',
      price_notes: data.price_notes || '',
      finance_visibility: data.finance_visibility || 'all',
      finance_visible_to_generator: data.finance_visible_to_generator?.toString() ?? 'true',
      finance_visible_to_transporter: data.finance_visible_to_transporter?.toString() ?? 'true',
      finance_visible_to_destination: data.finance_visible_to_destination?.toString() ?? 'true',
      finance_visible_to_driver: data.finance_visible_to_driver?.toString() ?? 'true',
      notes: data.notes || '',
      special_instructions: data.special_instructions || '',
    });
  };

  const updateField = (field: keyof ManualShipmentData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Create ledger entries per waste item
  const createLedgerEntriesForDraft = async (
    draftId: string, formData: ManualShipmentData, orgId: string, userId: string
  ) => {
    try {
      // Delete previous ledger entries for this draft (in case of re-save)
      await (supabase
        .from('accounting_ledger')
        .delete() as any)
        .eq('manual_draft_id', draftId);

      const items = formData.waste_items || [];
      if (items.length === 0) return;

      const entries = items.map((item, idx) => {
        const base = parseFloat(item.price) || 0;
        const extra = parseFloat(item.extra_costs) || 0;
        const vatAmt = item.vat_enabled === 'true' ? (base + extra) * 0.14 : 0;
        const laborPct = parseFloat(item.labor_tax_percent) || 0;
        const laborAmt = item.labor_tax_enabled === 'true' ? (base + extra) * laborPct / 100 : 0;
        const totalAmount = base + extra + vatAmt + laborAmt;
        if (totalAmount <= 0) return null;

        const wasteLabel = item.waste_type || `مخلف ${idx + 1}`;
        const desc = `بيان يدوي #${formData.shipment_number || '—'} | ${wasteLabel} | ${item.quantity || 0} ${item.unit || ''} × ${item.price_per_unit || 0} ج.م`;

        return {
          organization_id: orgId,
          entry_type: 'credit',
          entry_category: 'manual_shipment',
          amount: totalAmount,
          description: desc,
          entry_date: formData.pickup_date || new Date().toISOString().split('T')[0],
          created_by: userId,
          reference_number: `MS-${draftId.substring(0, 8).toUpperCase()}-${idx + 1}`,
          manual_draft_id: draftId,
          waste_item_id: item.id,
          ledger_merged: true,
        };
      }).filter(Boolean);

      if (entries.length > 0) {
        const { error } = await supabase
          .from('accounting_ledger')
          .insert(entries as any[]);
        if (error) {
          console.error('Failed to create ledger entries:', error);
        }
      }
    } catch (err) {
      console.error('Ledger creation error:', err);
    }
  };

  const saveDraft = async (): Promise<{ shareCode: string; draftId: string } | null> => {
    if (!organization?.id || !user?.id) {
      toast.error('يجب تسجيل الدخول أولاً');
      return null;
    }
    setSaving(true);

    const payload: any = {
      organization_id: organization.id,
      created_by: user.id,
      shipment_number: form.shipment_number || null,
      generator_name: form.generator_name || null,
      generator_address: form.generator_address || null,
      generator_phone: form.generator_phone || null,
      generator_license: form.generator_license || null,
      generator_commercial_register: form.generator_commercial_register || null,
      generator_tax_id: form.generator_tax_id || null,
      generator_representative: form.generator_representative || null,
      generator_email: form.generator_email || null,
      transporter_name: form.transporter_name || null,
      transporter_address: form.transporter_address || null,
      transporter_phone: form.transporter_phone || null,
      transporter_license: form.transporter_license || null,
      transporter_commercial_register: form.transporter_commercial_register || null,
      transporter_tax_id: form.transporter_tax_id || null,
      transporter_representative: form.transporter_representative || null,
      transporter_email: form.transporter_email || null,
      destination_name: form.destination_name || null,
      destination_address: form.destination_address || null,
      destination_phone: form.destination_phone || null,
      destination_license: form.destination_license || null,
      destination_commercial_register: form.destination_commercial_register || null,
      destination_tax_id: form.destination_tax_id || null,
      destination_representative: form.destination_representative || null,
      destination_email: form.destination_email || null,
      destination_type: form.destination_type || 'recycling',
      waste_type: form.waste_type || null,
      waste_description: form.waste_description || null,
      waste_state: form.waste_state || 'solid',
      hazard_level: form.hazard_level || 'non_hazardous',
      quantity: form.quantity ? parseFloat(form.quantity) : null,
      unit: form.unit || 'ton',
      packaging_method: form.packaging_method || null,
      disposal_method: form.disposal_method || null,
      waste_items: form.waste_items || [],
      driver_name: form.driver_name || null,
      driver_phone: form.driver_phone || null,
      driver_license: form.driver_license || null,
      vehicle_plate: form.vehicle_plate || null,
      vehicle_type: form.vehicle_type || null,
      pickup_address: form.pickup_address || null,
      delivery_address: form.delivery_address || null,
      pickup_date: form.pickup_date || null,
      delivery_date: form.delivery_date || null,
      shipment_type: form.shipment_type || 'regular',
      price: form.price ? parseFloat(form.price) : null,
      price_per_unit: form.price_per_unit ? parseFloat(form.price_per_unit) : null,
      vat_enabled: form.vat_enabled === 'true',
      vat_amount: form.vat_amount ? parseFloat(form.vat_amount) : null,
      labor_tax_enabled: form.labor_tax_enabled === 'true',
      labor_tax_percent: form.labor_tax_percent ? parseFloat(form.labor_tax_percent) : null,
      labor_tax_amount: form.labor_tax_amount ? parseFloat(form.labor_tax_amount) : null,
      extra_costs: form.extra_costs ? parseFloat(form.extra_costs) : null,
      amount_paid: form.amount_paid ? parseFloat(form.amount_paid) : null,
      price_notes: form.price_notes || null,
      finance_visibility: form.finance_visibility || 'all',
      finance_visible_to_generator: form.finance_visible_to_generator === 'true',
      finance_visible_to_transporter: form.finance_visible_to_transporter === 'true',
      finance_visible_to_destination: form.finance_visible_to_destination === 'true',
      finance_visible_to_driver: form.finance_visible_to_driver === 'true',
      notes: form.notes || null,
      special_instructions: form.special_instructions || null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (savedDraftId) {
      result = await supabase
        .from('manual_shipment_drafts')
        .update(payload)
        .eq('id', savedDraftId)
        .select('id, share_code')
        .single();
    } else {
      result = await supabase
        .from('manual_shipment_drafts')
        .insert(payload)
        .select('id, share_code')
        .single();
    }

    setSaving(false);
    if (result.error) {
      toast.error('فشل في حفظ المسودة');
      console.error(result.error);
      return null;
    }
    
    setSavedDraftId(result.data.id);
    setSavedShareCode(result.data.share_code);

    // Auto-create ledger entries per waste item
    await createLedgerEntriesForDraft(result.data.id, form, organization.id, user.id);

    toast.success('تم حفظ المسودة وتسجيل القيود المالية');
    return { shareCode: result.data.share_code, draftId: result.data.id };
  };

  // حفظ + تنزيل PDF (النظام القديم — توليد محلي)
  const saveAndDownloadPDF = async () => {
    const result = await saveDraft();
    if (!result) {
      toast.error('يجب حفظ المسودة أولاً');
      return;
    }

    toast.info('جارٍ تجهيز بيان الشحنة PDF...');
    try {
      const blob = await generateManualShipmentPDFBlob(form);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shipment-${form.shipment_number || result.draftId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('تم حفظ وتنزيل بيان الشحنة PDF');
      } else {
        toast.error('فشل في توليد ملف PDF');
      }
    } catch (err) {
      console.error('[ManualShipment] PDF download error:', err);
      toast.error('فشل في توليد ملف PDF');
    }
  };

  // Helper: determine if finance page should be included for a given recipient
  const shouldShowFinance = (recipientType: 'generator' | 'transporter' | 'destination' | 'driver'): boolean => {
    if (form.finance_visibility === 'all') return true;
    if (form.finance_visibility === 'none') return false;
    // custom
    const key = `finance_visible_to_${recipientType}` as keyof ManualShipmentData;
    return form[key] === 'true';
  };

  // Helper: get recipient type from phone
  const getRecipientType = (phone: string): 'generator' | 'transporter' | 'destination' | 'driver' => {
    const clean = phone.replace(/\s/g, '');
    if (form.generator_phone?.replace(/\s/g, '') === clean) return 'generator';
    if (form.transporter_phone?.replace(/\s/g, '') === clean) return 'transporter';
    if (form.destination_phone?.replace(/\s/g, '') === clean) return 'destination';
    return 'driver';
  };

  // حفظ + إرسال واتساب عبر WaPilot مع تحكم رؤية البيانات المالية
  const saveAndSendWhatsApp = async () => {
    const result = await saveDraft();
    if (!result) {
      toast.error('يجب حفظ المسودة أولاً');
      return;
    }

    const recipientPhones: Array<{ phone: string; type: 'generator' | 'transporter' | 'destination' | 'driver' }> = [];
    if (form.generator_phone) recipientPhones.push({ phone: form.generator_phone.replace(/\s/g, ''), type: 'generator' });
    if (form.transporter_phone) recipientPhones.push({ phone: form.transporter_phone.replace(/\s/g, ''), type: 'transporter' });
    if (form.destination_phone) recipientPhones.push({ phone: form.destination_phone.replace(/\s/g, ''), type: 'destination' });
    if (form.driver_phone) recipientPhones.push({ phone: form.driver_phone.replace(/\s/g, ''), type: 'driver' });

    // Deduplicate by phone
    const seen = new Set<string>();
    const uniqueRecipients = recipientPhones.filter(r => {
      if (seen.has(r.phone)) return false;
      seen.add(r.phone);
      return true;
    });

    if (uniqueRecipients.length === 0) {
      toast.error('لا توجد أرقام هاتف لإرسال الواتساب');
      return;
    }

    toast.info('جارٍ تجهيز وإرسال بيان الشحنة عبر واتساب...');
    try {
      // Group recipients by finance visibility to minimize PDF generation
      const withFinance = uniqueRecipients.filter(r => shouldShowFinance(r.type));
      const withoutFinance = uniqueRecipients.filter(r => !shouldShowFinance(r.type));

      let sentCount = 0;

      const sendToGroup = async (recipients: typeof uniqueRecipients, includeFinance: boolean) => {
        if (recipients.length === 0) return;
        const blob = await generateManualShipmentPDFBlob(form, { includeFinance });
        if (!blob) return;

        const suffix = includeFinance ? 'full' : 'no-finance';
        const filename = `manual-shipments/${result.draftId}/${Date.now()}-${suffix}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('shipment-documents')
          .upload(filename, blob, { contentType: 'application/pdf', upsert: true });

        if (uploadError) {
          console.error('[ManualShipment] Upload error:', uploadError);
          return;
        }

        const { data: urlData } = await supabase.storage.from('shipment-documents').createSignedUrl(filename, 24 * 3600);
        const pdfUrl = urlData?.signedUrl;
        const pdfFilename = `بيان-شحنة-${form.shipment_number || result.draftId}.pdf`;

        for (const { phone } of recipients) {
          const rawPhone = phone.replace(/[\s+\-()]/g, '').replace(/^0+/, '');
          // Send PDF as document attachment directly
          const { error: sendError } = await supabase.functions.invoke('wapilot-proxy', {
            body: {
              action: 'send-media',
              chat_id: rawPhone,
              media_url: pdfUrl,
              media_type: 'document',
              caption: `📄 بيان شحنة رقم ${form.shipment_number || ''}`,
              filename: pdfFilename,
            },
          });
          if (!sendError) sentCount++;
          else console.error(`[WhatsApp] Failed to send to ${phone}:`, sendError);
        }
      };

      await Promise.all([
        sendToGroup(withFinance, true),
        sendToGroup(withoutFinance, false),
      ]);

      if (sentCount > 0) {
        toast.success(`تم إرسال بيان الشحنة عبر واتساب إلى ${sentCount} جهة`);
      } else {
        toast.error('فشل في إرسال الرسائل عبر واتساب');
      }
    } catch (err) {
      console.error('[ManualShipment] WhatsApp error:', err);
      toast.error('فشل في إرسال بيان الشحنة');
    }
  };

  // حفظ + طباعة PDF (النظام القديم — فتح نافذة طباعة مباشرة)
  const saveAndPrintPDF = async () => {
    const result = await saveDraft();
    if (!result) {
      toast.error('يجب حفظ المسودة أولاً');
      return;
    }

    toast.info('جارٍ تجهيز بيان الشحنة للطباعة...');
    await generateManualShipmentPDF(form);
    toast.success('تم فتح نافذة الطباعة');
  };

  // إرسال كامل (حفظ + تحديث الحالة + توليد PDF + إرسال واتساب)
  const submitDraft = async () => {
    const result = await saveDraft();
    if (!result) return;
    
    const { error } = await supabase
      .from('manual_shipment_drafts')
      .update({ is_submitted: true, submitted_at: new Date().toISOString(), status: 'submitted' })
      .eq('id', result.draftId);

    if (error) {
      console.error('[ManualShipment] Submit error:', error);
      toast.error('فشل في إرسال النموذج');
      return;
    }
    
    toast.success('تم إرسال النموذج بنجاح');

    // توليد PDF وإرسال واتساب تلقائياً عبر WaPilot مع تحكم رؤية البيانات المالية
    try {
      const recipientPhones: Array<{ phone: string; type: 'generator' | 'transporter' | 'destination' | 'driver' }> = [];
      if (form.generator_phone?.length > 3) recipientPhones.push({ phone: form.generator_phone.replace(/\s/g, ''), type: 'generator' });
      if (form.transporter_phone?.length > 3) recipientPhones.push({ phone: form.transporter_phone.replace(/\s/g, ''), type: 'transporter' });
      if (form.destination_phone?.length > 3) recipientPhones.push({ phone: form.destination_phone.replace(/\s/g, ''), type: 'destination' });
      if (form.driver_phone?.length > 3) recipientPhones.push({ phone: form.driver_phone.replace(/\s/g, ''), type: 'driver' });

      const seen = new Set<string>();
      const unique = recipientPhones.filter(r => { if (seen.has(r.phone)) return false; seen.add(r.phone); return true; });

      if (unique.length > 0) {
        toast.info('جارٍ تجهيز وإرسال بيان الشحنة عبر واتساب...');
        const withFinance = unique.filter(r => shouldShowFinance(r.type));
        const withoutFinance = unique.filter(r => !shouldShowFinance(r.type));

        let sentCount = 0;
        const sendGroup = async (recipients: typeof unique, includeFinance: boolean) => {
          if (recipients.length === 0) return;
          const blob = await generateManualShipmentPDFBlob(form, { includeFinance });
          if (!blob) return;
          const suffix = includeFinance ? 'full' : 'no-finance';
          const filename = `manual-shipments/${result.draftId}/${Date.now()}-${suffix}.pdf`;
          const { error: uploadError } = await supabase.storage
            .from('shipment-documents')
            .upload(filename, blob, { contentType: 'application/pdf', upsert: true });
          if (uploadError) return;
          const { data: urlData } = await supabase.storage.from('shipment-documents').createSignedUrl(filename, 24 * 3600);
          const pdfUrl = urlData?.signedUrl;
          const pdfFilename = `بيان-شحنة-${form.shipment_number || result.draftId}.pdf`;
          for (const { phone } of recipients) {
            const rawPhone = phone.replace(/[\s+\-()]/g, '').replace(/^0+/, '');
            const { error: sendError } = await supabase.functions.invoke('wapilot-proxy', {
              body: {
                action: 'send-media',
                chat_id: rawPhone,
                media_url: pdfUrl,
                media_type: 'document',
                caption: `📄 بيان شحنة رقم ${form.shipment_number || ''}`,
                filename: pdfFilename,
              },
            });
            if (!sendError) sentCount++;
          }
        };
        await Promise.all([sendGroup(withFinance, true), sendGroup(withoutFinance, false)]);
        if (sentCount > 0) toast.success(`تم إرسال بيان الشحنة عبر واتساب إلى ${sentCount} جهة`);
      }
    } catch (err) {
      console.error('[ManualShipment] WhatsApp notification error:', err);
    }
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setSavedDraftId(null);
    setSavedShareCode(null);
    localStorage.removeItem('manual_shipment_draft');
  };

  return {
    form, setForm, updateField,
    loading, saving,
    savedDraftId, savedShareCode,
    saveDraft, submitDraft, resetForm,
    saveAndDownloadPDF, saveAndSendWhatsApp, saveAndPrintPDF,
    loadByShareCode,
  };
}
