import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
  waste_type: string;
  waste_description: string;
  waste_state: string;
  hazard_level: string;
  quantity: string;
  unit: string;
  packaging_method: string;
  disposal_method: string;
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
  price_notes: string;
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
  driver_name: '', driver_phone: '', driver_license: '', vehicle_plate: '', vehicle_type: '',
  pickup_address: '', delivery_address: '', pickup_date: '', delivery_date: '',
  shipment_type: 'regular', price: '', price_notes: '', notes: '', special_instructions: '',
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
      price_notes: data.price_notes || '',
      notes: data.notes || '',
      special_instructions: data.special_instructions || '',
    });
  };

  const updateField = (field: keyof ManualShipmentData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const saveDraft = async (): Promise<string | null> => {
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
      price_notes: form.price_notes || null,
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
    toast.success('تم حفظ المسودة بنجاح');
    return { shareCode: result.data.share_code, draftId: result.data.id };
  };

  // Core: generate PDF server-side, archive it, return URL
  const generateAndArchivePDF = async (draftId: string): Promise<{ pdfUrl?: string; filename?: string }> => {
    const { data: pdfResult, error: pdfError } = await supabase.functions.invoke('generate-manual-shipment-pdf', {
      body: { draft_id: draftId },
    });

    if (pdfError || !pdfResult?.pdf_url) {
      console.error('[ManualShipment] PDF edge function error:', pdfError);
      return {};
    }

    const pdfUrl = pdfResult.pdf_url;
    const filename = pdfResult.filename || `shipment-${form.shipment_number || draftId}.pdf`;

    // Archive in entity_documents
    if (organization?.id) {
      try {
        await supabase.from('entity_documents').insert({
          organization_id: organization.id,
          uploaded_by: user?.id,
          title: `بيان شحنة يدوي - ${form.shipment_number || draftId}`,
          file_name: filename,
          file_url: pdfUrl,
          file_type: 'application/pdf',
          document_type: 'shipment',
          document_category: 'shipment',
          reference_number: form.shipment_number || null,
          description: `بيان شحنة يدوي - ${form.waste_type || 'مخلفات'} - ${form.generator_name || 'غير محدد'}`,
          tags: ['manual-shipment', 'pdf', form.waste_type].filter(Boolean) as string[],
          document_date: new Date().toISOString().split('T')[0],
        });
      } catch (archiveErr) {
        console.warn('[ManualShipment] Archive failed:', archiveErr);
      }
    }

    return { pdfUrl, filename };
  };

  // Send PDF to all parties via WhatsApp
  const sendPDFToWhatsApp = async (pdfUrl: string) => {
    const phones = new Set<string>();
    [form.generator_phone, form.transporter_phone, form.destination_phone, form.driver_phone]
      .filter(Boolean)
      .forEach(p => phones.add(p.replace(/\s/g, '')));

    if (phones.size === 0) return;

    const phoneArr = Array.from(phones);
    const firstPhone = phoneArr[0];

    // Send to first phone with full generation
    await supabase.functions.invoke('generate-manual-shipment-pdf', {
      body: {
        send_existing_file: true,
        file_url: pdfUrl,
        to_phone: firstPhone,
        caption: `📄 بيان شحنة رقم ${form.shipment_number || ''}`,
      },
    });

    // Send to remaining phones
    if (phoneArr.length > 1) {
      const remaining = phoneArr.slice(1).map(phone =>
        supabase.functions.invoke('generate-manual-shipment-pdf', {
          body: {
            send_existing_file: true,
            file_url: pdfUrl,
            to_phone: phone,
            caption: `📄 بيان شحنة رقم ${form.shipment_number || ''}`,
          },
        })
      );
      await Promise.allSettled(remaining);
    }

    toast.success(`تم إرسال بيان الشحنة PDF إلى ${phones.size} جهة عبر واتساب`);
  };

  // حفظ + توليد PDF + تنزيل + أرشفة
  const saveAndDownloadPDF = async () => {
    const code = await saveDraft();
    if (!code || !savedDraftId) {
      toast.error('يجب حفظ المسودة أولاً');
      return;
    }

    toast.info('جارٍ تجهيز بيان الشحنة PDF...');
    const { pdfUrl, filename } = await generateAndArchivePDF(savedDraftId);
    
    if (pdfUrl) {
      // Auto-download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = filename || 'shipment-manifest.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('تم حفظ وتنزيل بيان الشحنة PDF');
    } else {
      toast.error('فشل في توليد ملف PDF');
    }
  };

  // حفظ + توليد PDF + إرسال واتساب
  const saveAndSendWhatsApp = async () => {
    const code = await saveDraft();
    if (!code || !savedDraftId) {
      toast.error('يجب حفظ المسودة أولاً');
      return;
    }

    toast.info('جارٍ تجهيز وإرسال بيان الشحنة...');
    const { pdfUrl } = await generateAndArchivePDF(savedDraftId);
    
    if (pdfUrl) {
      await sendPDFToWhatsApp(pdfUrl);
    } else {
      toast.error('فشل في توليد ملف PDF');
    }
  };

  // حفظ + توليد PDF + طباعة
  const saveAndPrintPDF = async () => {
    const code = await saveDraft();
    if (!code || !savedDraftId) {
      toast.error('يجب حفظ المسودة أولاً');
      return;
    }

    toast.info('جارٍ تجهيز بيان الشحنة للطباعة...');
    const { pdfUrl } = await generateAndArchivePDF(savedDraftId);
    
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      toast.success('تم فتح بيان الشحنة — اطبعه من المتصفح');
    } else {
      toast.error('فشل في توليد ملف PDF');
    }
  };

  // إرسال كامل (حفظ + PDF + أرشفة + واتساب)
  const submitDraft = async () => {
    const code = await saveDraft();
    if (!code || !savedDraftId) return;
    
    await supabase
      .from('manual_shipment_drafts')
      .update({ is_submitted: true, submitted_at: new Date().toISOString(), status: 'submitted' })
      .eq('id', savedDraftId);
    
    toast.success('تم إرسال النموذج بنجاح');

    try {
      toast.info('جارٍ تجهيز بيان الشحنة PDF...');
      const { pdfUrl } = await generateAndArchivePDF(savedDraftId);
      
      if (pdfUrl) {
        await sendPDFToWhatsApp(pdfUrl);
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
