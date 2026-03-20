import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Truck, Receipt, FileText, FileSignature, X, Loader2, 
  ArrowUpFromLine, ArrowDownToLine, Eye, Send, Calendar, 
  MapPin, Weight, Building2, FileCheck, Download, Pen,
  CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp,
  ScrollText, Award, Briefcase, Shield, Stamp, CheckSquare,
  ArrowRight, Info, Layers
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

type Direction = 'outgoing' | 'incoming';
type ResourceType = 'shipment' | 'invoice' | 'contract' | 'award_letter' | 'work_order' | 'document' | 'signing_request';

interface ResourceItem {
  id: string;
  resourceType: ResourceType;
  label: string;
  subtitle: string;
  analysis?: string; // content analysis summary
  status?: string;
  date?: string;
  extra?: Record<string, string | number | null>;
  raw: any;
}

interface PickedResource {
  type: string;
  data: any;
}

interface ChatResourcePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (resource: PickedResource) => void;
  initialTab?: Direction;
}

const DIRECTION_TABS: { key: Direction; label: string; icon: any }[] = [
  { key: 'outgoing', label: 'صادر', icon: ArrowUpFromLine },
  { key: 'incoming', label: 'وارد', icon: ArrowDownToLine },
];

const RESOURCE_SECTIONS: { key: ResourceType; label: string; icon: any }[] = [
  { key: 'shipment', label: 'الشحنات', icon: Truck },
  { key: 'invoice', label: 'الفواتير', icon: Receipt },
  { key: 'contract', label: 'العقود', icon: ScrollText },
  { key: 'award_letter', label: 'خطابات الترسية', icon: Award },
  { key: 'work_order', label: 'أوامر العمل', icon: Briefcase },
  { key: 'document', label: 'المستندات والأرشيف', icon: FileText },
  { key: 'signing_request', label: 'التوقيعات', icon: FileSignature },
];

const TYPE_COLORS: Record<string, string> = {
  shipment: 'text-emerald-600 bg-emerald-500/10',
  invoice: 'text-blue-600 bg-blue-500/10',
  contract: 'text-indigo-600 bg-indigo-500/10',
  award_letter: 'text-orange-600 bg-orange-500/10',
  work_order: 'text-cyan-600 bg-cyan-500/10',
  document: 'text-violet-600 bg-violet-500/10',
  signing_request: 'text-amber-600 bg-amber-500/10',
};

const TYPE_LABELS: Record<string, string> = {
  shipment: 'شحنة',
  invoice: 'فاتورة',
  contract: 'عقد',
  award_letter: 'خطاب ترسية',
  work_order: 'أمر عمل',
  document: 'مستند',
  signing_request: 'توقيع',
};

const STATUS_MAP: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'قيد الانتظار', icon: Clock, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  registered: { label: 'مسجلة', icon: FileCheck, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  approved: { label: 'معتمدة', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  in_transit: { label: 'قيد النقل', icon: Truck, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  delivered: { label: 'تم التسليم', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  completed: { label: 'مكتملة', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  paid: { label: 'مدفوعة', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  overdue: { label: 'متأخرة', icon: AlertCircle, color: 'text-red-600 bg-red-500/10 border-red-500/20' },
  draft: { label: 'مسودة', icon: FileText, color: 'text-muted-foreground bg-muted border-border' },
  signed: { label: 'تم التوقيع', icon: FileCheck, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  requested: { label: 'بانتظار التوقيع', icon: Pen, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  cancelled: { label: 'ملغاة', icon: X, color: 'text-red-600 bg-red-500/10 border-red-500/20' },
  picked_up: { label: 'تم الاستلام', icon: Truck, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  loading: { label: 'جاري التحميل', icon: Truck, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  confirmed: { label: 'مؤكدة', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  active: { label: 'نشط', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  expired: { label: 'منتهي', icon: AlertCircle, color: 'text-red-600 bg-red-500/10 border-red-500/20' },
  sent: { label: 'مرسل', icon: Send, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  accepted: { label: 'مقبول', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  rejected: { label: 'مرفوض', icon: X, color: 'text-red-600 bg-red-500/10 border-red-500/20' },
  in_progress: { label: 'قيد التنفيذ', icon: Clock, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  award_letter: 'خطاب ترسية', contract: 'عقد', correspondence: 'مراسلة',
  invoice: 'فاتورة', receipt: 'سند قبض', deposit_proof: 'إثبات إيداع',
  weight_slip: 'صورة وزنة', certificate: 'شهادة', license: 'رخصة',
  registration: 'سجل تجاري', generator_declaration: 'إقرار مولد',
  transporter_declaration: 'إقرار ناقل', recycler_declaration: 'إقرار مدور',
  disposal_certificate: 'شهادة تخلص', recycling_certificate: 'شهادة تدوير',
  driver_confirmation: 'تأكيد سائق', other: 'أخرى',
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  try { return format(new Date(dateStr), 'dd MMM yyyy', { locale: ar }); } catch { return null; }
};

const formatFileSize = (bytes?: number | string | null) => {
  const num = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (!num) return null;
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
};

/** Generate a brief content analysis string for a resource */
const generateAnalysis = (type: ResourceType, raw: any): string => {
  switch (type) {
    case 'shipment': {
      const parts: string[] = [];
      if (raw.waste_type) parts.push(`نوع المخلف: ${raw.waste_type}`);
      if (raw.quantity && raw.unit) parts.push(`الكمية: ${Number(raw.quantity).toLocaleString()} ${raw.unit}`);
      if (raw.actual_weight) parts.push(`الوزن الفعلي: ${Number(raw.actual_weight).toLocaleString()} كجم`);
      if (raw.pickup_city && raw.delivery_city) parts.push(`المسار: ${raw.pickup_city} ← ${raw.delivery_city}`);
      if (raw.total_value) parts.push(`القيمة: ${Number(raw.total_value).toLocaleString()} ج.م`);
      if (raw.payment_status) parts.push(`حالة الدفع: ${raw.payment_status}`);
      return parts.join(' • ') || 'بيانات شحنة';
    }
    case 'invoice': {
      const parts: string[] = [];
      if (raw.invoice_type) parts.push(`النوع: ${raw.invoice_type}`);
      if (raw.total_amount) parts.push(`الإجمالي: ${Number(raw.total_amount).toLocaleString()} ${raw.currency || 'EGP'}`);
      if (raw.paid_amount && Number(raw.paid_amount) > 0) parts.push(`المدفوع: ${Number(raw.paid_amount).toLocaleString()}`);
      if (raw.remaining_amount && Number(raw.remaining_amount) > 0) parts.push(`المتبقي: ${Number(raw.remaining_amount).toLocaleString()}`);
      if (raw.partner_name) parts.push(`الجهة: ${raw.partner_name}`);
      if (raw.due_date) parts.push(`الاستحقاق: ${formatDate(raw.due_date)}`);
      return parts.join(' • ') || 'بيانات فاتورة';
    }
    case 'contract': {
      const parts: string[] = [];
      if (raw.contract_type) parts.push(`النوع: ${raw.contract_type}`);
      if (raw.partner_name) parts.push(`الطرف: ${raw.partner_name}`);
      if (raw.value) parts.push(`القيمة: ${Number(raw.value).toLocaleString()} ${raw.currency || 'EGP'}`);
      if (raw.start_date && raw.end_date) parts.push(`الفترة: ${formatDate(raw.start_date)} - ${formatDate(raw.end_date)}`);
      if (raw.waste_type) parts.push(`المخلف: ${raw.waste_type}`);
      if (raw.clause_count) parts.push(`${raw.clause_count} بند`);
      return parts.join(' • ') || 'بيانات عقد';
    }
    case 'award_letter': {
      const parts: string[] = [];
      if (raw.total_estimated_quantity) parts.push(`الكمية التقديرية: ${Number(raw.total_estimated_quantity).toLocaleString()}`);
      if (raw.start_date && raw.end_date) parts.push(`الفترة: ${formatDate(raw.start_date)} - ${formatDate(raw.end_date)}`);
      if (raw.description) parts.push(raw.description.slice(0, 60));
      return parts.join(' • ') || 'بيانات خطاب ترسية';
    }
    case 'work_order': {
      const parts: string[] = [];
      if (raw.waste_type) parts.push(`المخلف: ${raw.waste_type}`);
      if (raw.estimated_quantity && raw.unit) parts.push(`الكمية: ${Number(raw.estimated_quantity).toLocaleString()} ${raw.unit}`);
      if (raw.urgency) parts.push(`الأولوية: ${raw.urgency}`);
      if (raw.pickup_location) parts.push(`الموقع: ${raw.pickup_location}`);
      if (raw.is_hazardous) parts.push('⚠️ خطر');
      return parts.join(' • ') || 'بيانات أمر عمل';
    }
    case 'document': {
      const parts: string[] = [];
      const docLabel = DOC_TYPE_LABELS[raw.document_type] || raw.document_type;
      if (docLabel) parts.push(`النوع: ${docLabel}`);
      if (raw.reference_number) parts.push(`المرجع: ${raw.reference_number}`);
      if (raw.file_size) parts.push(`الحجم: ${formatFileSize(raw.file_size)}`);
      if (raw.description) parts.push(raw.description.slice(0, 60));
      if (raw.tags?.length) parts.push(`وسوم: ${raw.tags.join(', ')}`);
      return parts.join(' • ') || 'مستند أرشيفي';
    }
    case 'signing_request': {
      const parts: string[] = [];
      if (raw.signer_name) parts.push(`الموقّع: ${raw.signer_name}`);
      if (raw.signer_role) parts.push(`الصفة: ${raw.signer_role}`);
      if (raw.signature_method) parts.push(`الطريقة: ${raw.signature_method}`);
      if (raw.stamp_applied) parts.push('✓ مختوم');
      const docLabel = DOC_TYPE_LABELS[raw.document_type] || raw.document_type;
      if (docLabel) parts.push(`على: ${docLabel}`);
      return parts.join(' • ') || 'بيانات توقيع';
    }
    default:
      return '';
  }
};

const ChatResourcePicker = ({ isOpen, onClose, onSelect, initialTab = 'outgoing' }: ChatResourcePickerProps) => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [direction, setDirection] = useState<Direction>(initialTab);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ResourceItem | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<ResourceType>>(new Set());
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    if (!isOpen || !organization?.id) return;
    setLoading(true);
    setSelectedItem(null);
    setBulkSelected(new Set());
    setBulkMode(false);
    fetchAllByDirection(direction).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, [isOpen, direction, organization?.id]);

  const toggleSection = (type: ResourceType) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const toggleBulkItem = (id: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const fetchAllByDirection = async (dir: Direction): Promise<ResourceItem[]> => {
    if (!organization?.id) return [];
    const orgId = organization.id;
    const orgType = organization.organization_type;
    const results: ResourceItem[] = [];

    try {
      // ── SHIPMENTS ──
      let shipQ = supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, waste_description, generator_id, transporter_id, recycler_id, disposal_facility_id, pickup_city, delivery_city, pickup_address, delivery_address, quantity, unit, actual_weight, created_at, pickup_date, total_value, price_per_unit, shipment_type, notes, payment_status')
        .order('created_at', { ascending: false }).limit(50);

      if (dir === 'outgoing') {
        if (orgType === 'generator') shipQ = shipQ.eq('generator_id', orgId);
        else if (orgType === 'transporter') shipQ = shipQ.eq('transporter_id', orgId);
        else shipQ = shipQ.eq('recycler_id', orgId);
      } else {
        if (orgType === 'recycler' || orgType === 'disposal') shipQ = shipQ.or(`recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`);
        else if (orgType === 'transporter') shipQ = shipQ.eq('transporter_id', orgId);
        else shipQ = shipQ.eq('generator_id', orgId);
      }

      const { data: shipments } = await shipQ;
      shipments?.forEach(s => {
        results.push({
          id: s.id, resourceType: 'shipment',
          label: `شحنة #${s.shipment_number}`,
          subtitle: s.waste_description || s.waste_type || [s.pickup_city, s.delivery_city].filter(Boolean).join(' → ') || 'شحنة',
          analysis: generateAnalysis('shipment', s),
          status: s.status || undefined, date: s.pickup_date || s.created_at || undefined,
          extra: { pickupCity: s.pickup_city, deliveryCity: s.delivery_city, quantity: s.quantity, actualWeight: s.actual_weight, unit: s.unit, totalValue: s.total_value, paymentStatus: s.payment_status, notes: s.notes, shipmentType: s.shipment_type },
          raw: s,
        });
      });

      // ── INVOICES ──
      let invQ = supabase
        .from('invoices')
        .select('id, invoice_number, status, subtotal, tax_amount, total_amount, currency, organization_id, partner_organization_id, due_date, created_at, invoice_type, notes, paid_amount, remaining_amount, partner_name, invoice_category')
        .order('created_at', { ascending: false }).limit(50);
      invQ = dir === 'outgoing' ? invQ.eq('organization_id', orgId) : invQ.eq('partner_organization_id', orgId);

      const { data: invoices } = await invQ;
      invoices?.forEach(inv => {
        const amt = inv.total_amount || inv.subtotal || 0;
        results.push({
          id: inv.id, resourceType: 'invoice',
          label: `فاتورة #${inv.invoice_number || inv.id.slice(0, 8)}`,
          subtitle: `${amt.toLocaleString()} ${inv.currency || 'EGP'}${inv.partner_name ? ` • ${inv.partner_name}` : ''}`,
          analysis: generateAnalysis('invoice', inv),
          status: inv.status || undefined, date: inv.due_date || inv.created_at,
          extra: { invoiceType: inv.invoice_type, totalAmount: inv.total_amount, currency: inv.currency || 'EGP', dueDate: inv.due_date, paidAmount: inv.paid_amount, remainingAmount: inv.remaining_amount, partnerName: inv.partner_name },
          raw: inv,
        });
      });

      // ── CONTRACTS ──
      let conQ = supabase
        .from('contracts')
        .select('id, contract_number, title, description, organization_id, partner_organization_id, partner_name, contract_type, status, start_date, end_date, value, currency, attachment_url, waste_type, clause_count, created_at')
        .order('created_at', { ascending: false }).limit(50);
      conQ = dir === 'outgoing' ? conQ.eq('organization_id', orgId) : conQ.eq('partner_organization_id', orgId);

      const { data: contracts } = await conQ;
      contracts?.forEach(c => {
        results.push({
          id: c.id, resourceType: 'contract',
          label: `عقد #${c.contract_number || c.id.slice(0, 8)}${c.title ? ` — ${c.title}` : ''}`,
          subtitle: `${c.contract_type || 'عقد'}${c.partner_name ? ` • ${c.partner_name}` : ''}${c.value ? ` • ${Number(c.value).toLocaleString()} ${c.currency || 'EGP'}` : ''}`,
          analysis: generateAnalysis('contract', c),
          status: c.status || undefined, date: c.start_date || c.created_at,
          extra: { contractType: c.contract_type, partnerName: c.partner_name, value: c.value, currency: c.currency || 'EGP', startDate: c.start_date, endDate: c.end_date, wasteType: c.waste_type, clauseCount: c.clause_count, attachmentUrl: c.attachment_url, description: c.description },
          raw: c,
        });
      });

      // ── AWARD LETTERS ──
      let awQ = supabase
        .from('award_letters')
        .select('id, letter_number, title, description, organization_id, partner_organization_id, issue_date, start_date, end_date, status, total_estimated_quantity, currency, notes, attachment_url, created_at')
        .order('created_at', { ascending: false }).limit(50);
      awQ = dir === 'outgoing' ? awQ.eq('organization_id', orgId) : awQ.eq('partner_organization_id', orgId);

      const { data: awards } = await awQ;
      awards?.forEach(a => {
        results.push({
          id: a.id, resourceType: 'award_letter',
          label: `خطاب ترسية #${a.letter_number || a.id.slice(0, 8)}${a.title ? ` — ${a.title}` : ''}`,
          subtitle: a.description?.slice(0, 60) || 'خطاب ترسية',
          analysis: generateAnalysis('award_letter', a),
          status: a.status || undefined, date: a.issue_date || a.created_at,
          extra: { quantity: a.total_estimated_quantity, startDate: a.start_date, endDate: a.end_date, attachmentUrl: a.attachment_url, notes: a.notes },
          raw: a,
        });
      });

      // ── WORK ORDERS ──
      let woQ = supabase
        .from('work_orders')
        .select('id, order_number, organization_id, waste_type, waste_description, estimated_quantity, unit, is_hazardous, pickup_location, urgency, status, special_instructions, preferred_date, created_at')
        .order('created_at', { ascending: false }).limit(50);
      woQ = woQ.eq('organization_id', orgId);

      const { data: workOrders } = await woQ;
      workOrders?.forEach(w => {
        results.push({
          id: w.id, resourceType: 'work_order',
          label: `أمر عمل #${w.order_number || w.id.slice(0, 8)}`,
          subtitle: `${w.waste_type || w.waste_description || ''}${w.urgency ? ` • ${w.urgency}` : ''}`,
          analysis: generateAnalysis('work_order', w),
          status: w.status || undefined, date: w.preferred_date || w.created_at,
          extra: { wasteType: w.waste_type, quantity: w.estimated_quantity, unit: w.unit, urgency: w.urgency, location: w.pickup_location, hazardous: w.is_hazardous ? 1 : 0, instructions: w.special_instructions },
          raw: w,
        });
      });

      // ── DOCUMENTS (entity_documents archive) ──
      let docQ = supabase
        .from('entity_documents')
        .select('id, title, file_name, document_type, document_category, file_url, file_type, file_size, description, created_at, reference_number, document_date, shipment_id, invoice_id, tags, partner_organization_id, organization_id')
        .order('created_at', { ascending: false }).limit(50);
      docQ = dir === 'outgoing' ? docQ.eq('organization_id', orgId) : docQ.eq('partner_organization_id', orgId);

      const { data: docs } = await docQ;
      docs?.forEach(d => {
        results.push({
          id: d.id, resourceType: 'document',
          label: d.title || d.file_name || 'مستند',
          subtitle: DOC_TYPE_LABELS[d.document_type] || d.document_type || d.document_category || '',
          analysis: generateAnalysis('document', d),
          date: d.document_date || d.created_at,
          extra: { fileUrl: d.file_url, fileType: d.file_type, fileSize: d.file_size, fileName: d.file_name, description: d.description, refNumber: d.reference_number, category: d.document_category, docType: d.document_type, shipmentId: d.shipment_id, invoiceId: d.invoice_id, tags: d.tags?.join(', ') || null },
          raw: d,
        });
      });

      // ── SIGNING REQUESTS ──
      let signQ = supabase
        .from('document_signatures')
        .select('id, signer_name, signer_role, signer_title, document_type, document_id, status, created_at, timestamp_signed, signature_method, stamp_applied, organization_id, signed_by, platform_seal_number')
        .order('created_at', { ascending: false }).limit(50);
      signQ = signQ.eq('organization_id', orgId);

      const { data: signs } = await signQ;
      signs?.forEach(s => {
        results.push({
          id: s.id, resourceType: 'signing_request',
          label: s.signer_name || 'طلب توقيع',
          subtitle: `${DOC_TYPE_LABELS[s.document_type] || s.document_type || ''}${s.signer_role ? ` • ${s.signer_role}` : ''}`,
          analysis: generateAnalysis('signing_request', s),
          status: s.status || undefined, date: s.timestamp_signed || s.created_at,
          extra: { signerTitle: s.signer_title, signatureMethod: s.signature_method, stampApplied: s.stamp_applied ? 1 : 0, documentId: s.document_id, docType: s.document_type, sealNumber: s.platform_seal_number },
          raw: s,
        });
      });

    } catch (err) {
      console.error('Resource fetch error:', err);
    }
    return results;
  };

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      (item.analysis || '').toLowerCase().includes(q) ||
      (item.status || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const groupedItems = useMemo(() => {
    const groups: Record<ResourceType, ResourceItem[]> = {
      shipment: [], invoice: [], contract: [], award_letter: [], work_order: [], document: [], signing_request: [],
    };
    filteredItems.forEach(item => groups[item.resourceType].push(item));
    return groups;
  }, [filteredItems]);

  const handleSelect = (item: ResourceItem) => {
    onSelect({ type: item.resourceType, data: item.raw });
    onClose();
  };

  const handleBulkSend = () => {
    const selected = items.filter(i => bulkSelected.has(i.id));
    if (selected.length === 0) return;
    // Send first as primary, rest as metadata
    onSelect({
      type: 'bulk_resources',
      data: {
        items: selected.map(s => ({ type: s.resourceType, data: s.raw })),
        count: selected.length,
        label: `${selected.length} ملفات مجمعة`,
      }
    });
    onClose();
  };

  const handleBulkSign = () => {
    // Navigate to bulk signing page with selected IDs
    const selectedSigning = items.filter(i => bulkSelected.has(i.id));
    if (selectedSigning.length === 0) return;
    navigate('/dashboard/bulk-signing');
    onClose();
    toast.success(`تم تحديد ${selectedSigning.length} مستند للتوقيع الجماعي`);
  };

  const handlePreview = useCallback((item: ResourceItem) => {
    switch (item.resourceType) {
      case 'shipment': navigate(`/dashboard/shipments/${item.id}`); break;
      case 'invoice': navigate(`/dashboard/invoices`); break;
      case 'contract': navigate(`/dashboard/contracts`); break;
      case 'award_letter': navigate(`/dashboard/contracts`); break;
      case 'work_order': navigate(`/dashboard/work-orders`); break;
      case 'document':
        if (item.extra?.fileUrl) window.open(item.extra.fileUrl as string, '_blank');
        else navigate(`/dashboard/documents`);
        break;
      case 'signing_request': navigate(`/dashboard/signing-inbox`); break;
    }
    onClose();
  }, [navigate, onClose]);

  const handleSignAction = useCallback((item: ResourceItem) => {
    navigate(`/dashboard/signing-inbox`);
    onClose();
    toast.info('يمكنك التوقيع من صندوق التوقيعات');
  }, [navigate, onClose]);

  const renderItemDetail = (item: ResourceItem) => {
    const section = RESOURCE_SECTIONS.find(s => s.key === item.resourceType);
    const Icon = section?.icon || FileText;
    const colorClass = TYPE_COLORS[item.resourceType] || 'text-muted-foreground bg-muted';
    const statusInfo = STATUS_MAP[item.status || ''];
    const dateStr = formatDate(item.date);

    return (
      <div className="space-y-3 p-3" dir="rtl">
        <div className="flex items-start gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
          </div>
        </div>

        {/* Content Analysis */}
        {item.analysis && (
          <div className="bg-muted/50 rounded-lg p-2.5 border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Info className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-semibold text-primary">تحليل المحتوى</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{item.analysis}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[item.resourceType]}</Badge>
          {statusInfo && <Badge variant="outline" className={cn('text-[10px]', statusInfo.color)}>{statusInfo.label}</Badge>}
          {!statusInfo && item.status && <Badge variant="outline" className="text-[10px]">{item.status}</Badge>}
        </div>

        <div className="space-y-1.5 text-xs">
          {dateStr && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3 h-3 shrink-0" /><span>{dateStr}</span>
            </div>
          )}

          {/* Type-specific details */}
          {item.resourceType === 'shipment' && (
            <>
              {(item.extra?.pickupCity || item.extra?.deliveryCity) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" /><span>{item.extra.pickupCity || '—'} → {item.extra.deliveryCity || '—'}</span>
                </div>
              )}
              {(item.extra?.quantity || item.extra?.actualWeight) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Weight className="w-3 h-3 shrink-0" />
                  <span>{item.extra.actualWeight ? `${Number(item.extra.actualWeight).toLocaleString()} ${item.extra.unit || 'كجم'} (فعلي)` : `${Number(item.extra.quantity).toLocaleString()} ${item.extra.unit || 'كجم'}`}</span>
                </div>
              )}
              {item.extra?.totalValue && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Receipt className="w-3 h-3 shrink-0" /><span>{Number(item.extra.totalValue).toLocaleString()} EGP</span>
                </div>
              )}
            </>
          )}

          {item.resourceType === 'contract' && (
            <>
              {item.extra?.partnerName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-3 h-3 shrink-0" /><span>{item.extra.partnerName}</span>
                </div>
              )}
              {item.extra?.value && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Receipt className="w-3 h-3 shrink-0" /><span>{Number(item.extra.value).toLocaleString()} {item.extra.currency}</span>
                </div>
              )}
              {(item.extra?.startDate || item.extra?.endDate) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3 h-3 shrink-0" /><span>{formatDate(item.extra.startDate as string)} — {formatDate(item.extra.endDate as string)}</span>
                </div>
              )}
            </>
          )}

          {item.resourceType === 'award_letter' && (
            <>
              {item.extra?.quantity && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Weight className="w-3 h-3 shrink-0" /><span>الكمية التقديرية: {Number(item.extra.quantity).toLocaleString()}</span>
                </div>
              )}
            </>
          )}

          {item.resourceType === 'work_order' && (
            <>
              {item.extra?.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" /><span>{item.extra.location}</span>
                </div>
              )}
              {item.extra?.hazardous === 1 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-3 h-3 shrink-0" /><span>⚠️ مواد خطرة</span>
                </div>
              )}
            </>
          )}

          {item.resourceType === 'invoice' && (
            <>
              {item.extra?.dueDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3 h-3 shrink-0" /><span>استحقاق: {formatDate(item.extra.dueDate as string)}</span>
                </div>
              )}
              {item.extra?.remainingAmount && Number(item.extra.remainingAmount) > 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-3 h-3 shrink-0" /><span>المتبقي: {Number(item.extra.remainingAmount).toLocaleString()} {item.extra.currency}</span>
                </div>
              )}
            </>
          )}

          {item.resourceType === 'document' && (
            <>
              {item.extra?.refNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileCheck className="w-3 h-3 shrink-0" /><span>مرجع: {item.extra.refNumber}</span>
                </div>
              )}
              {item.extra?.fileSize && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-3 h-3 shrink-0" /><span>{formatFileSize(item.extra.fileSize)} • {item.extra.fileType || ''}</span>
                </div>
              )}
            </>
          )}

          {item.resourceType === 'signing_request' && (
            <>
              {item.extra?.signatureMethod && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Pen className="w-3 h-3 shrink-0" /><span>طريقة التوقيع: {item.extra.signatureMethod}</span>
                </div>
              )}
              {item.extra?.sealNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-3 h-3 shrink-0" /><span>ختم: {item.extra.sealNumber}</span>
                </div>
              )}
              {item.extra?.stampApplied === 1 && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <Stamp className="w-3 h-3 shrink-0" /><span>تم تطبيق الختم ✓</span>
                </div>
              )}
            </>
          )}
        </div>

        <Separator />

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5" onClick={() => handlePreview(item)}>
            <Eye className="w-3.5 h-3.5" /> معاينة
          </Button>
          <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => handleSelect(item)}>
            <Send className="w-3.5 h-3.5" /> إرسال
          </Button>
        </div>

        {/* Sign/Stamp action for signable items */}
        {(item.resourceType === 'signing_request' || item.resourceType === 'contract' || item.resourceType === 'invoice' || item.resourceType === 'shipment') && (
          <Button size="sm" variant="outline" className="w-full h-7 text-[11px] gap-1.5 border-amber-500/30 text-amber-700 hover:bg-amber-50" onClick={() => handleSignAction(item)}>
            <FileSignature className="w-3 h-3" /> توقيع وختم هذا المستند
          </Button>
        )}

        {/* Download for documents/contracts with attachments */}
        {(item.extra?.fileUrl || item.extra?.attachmentUrl) && (
          <Button size="sm" variant="ghost" className="w-full h-7 text-[11px] gap-1.5 text-muted-foreground" asChild>
            <a href={(item.extra.fileUrl || item.extra.attachmentUrl) as string} download target="_blank" rel="noopener">
              <Download className="w-3 h-3" /> تحميل الملف
            </a>
          </Button>
        )}
      </div>
    );
  };

  const renderListItem = (item: ResourceItem) => {
    const section = RESOURCE_SECTIONS.find(s => s.key === item.resourceType);
    const Icon = section?.icon || FileText;
    const colorClass = TYPE_COLORS[item.resourceType] || 'text-muted-foreground bg-muted';
    const statusInfo = STATUS_MAP[item.status || ''];
    const dateStr = formatDate(item.date);
    const isSelected = selectedItem?.id === item.id;
    const isBulkChecked = bulkSelected.has(item.id);

    return (
      <button
        key={`${item.resourceType}-${item.id}`}
        className={cn(
          'w-full px-3 py-2 rounded-lg transition-colors text-right',
          isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted/80'
        )}
        onClick={() => bulkMode ? toggleBulkItem(item.id) : setSelectedItem(isSelected ? null : item)}
      >
        <div className="flex items-center gap-2.5">
          {bulkMode && (
            <div className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0', isBulkChecked ? 'bg-primary border-primary' : 'border-border')}>
              {isBulkChecked && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
          )}
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold truncate flex-1">{item.label}</p>
              {statusInfo && <Badge variant="outline" className={cn('text-[9px] py-0 shrink-0', statusInfo.color)}>{statusInfo.label}</Badge>}
            </div>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
            {/* Analysis preview */}
            {item.analysis && (
              <p className="text-[9px] text-muted-foreground/60 mt-0.5 truncate">
                📋 {item.analysis.slice(0, 80)}
              </p>
            )}
            {dateStr && <span className="text-[9px] text-muted-foreground/50">{dateStr}</span>}
          </div>
        </div>
      </button>
    );
  };

  const renderGroupedList = () => {
    const totalCount = filteredItems.length;
    return (
      <div className="p-1 space-y-0.5">
        <div className="px-3 py-1 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{totalCount} نتيجة — {direction === 'outgoing' ? 'صادر' : 'وارد'}</span>
          <Button
            size="sm" variant={bulkMode ? 'default' : 'ghost'}
            className="h-5 text-[9px] px-2 gap-1"
            onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }}
          >
            <Layers className="w-3 h-3" />
            {bulkMode ? 'إلغاء التحديد' : 'تحديد متعدد'}
          </Button>
        </div>
        
        {RESOURCE_SECTIONS.map(section => {
          const sectionItems = groupedItems[section.key];
          if (sectionItems.length === 0) return null;
          const isCollapsed = collapsedSections.has(section.key);
          const SectionIcon = section.icon;
          const colorClass = TYPE_COLORS[section.key];
          
          return (
            <div key={section.key} className="border border-border/50 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                onClick={() => toggleSection(section.key)}
              >
                <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', colorClass)}>
                  <SectionIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold flex-1 text-right">{section.label}</span>
                <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center">{sectionItems.length}</Badge>
                {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              {!isCollapsed && (
                <div className="divide-y divide-border/30">
                  {sectionItems.map(item => renderListItem(item))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="absolute bottom-full mb-1 right-0 left-0 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden"
          style={{ maxHeight: '36rem' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              {selectedItem && (
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedItem(null)}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
              <span className="text-xs font-semibold text-muted-foreground">
                {selectedItem ? `📄 ${selectedItem.label}` : '📎 إرفاق مورد'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {bulkMode && bulkSelected.size > 0 && (
                <>
                  <Button size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={handleBulkSend}>
                    <Send className="w-3 h-3" /> إرسال ({bulkSelected.size})
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1 border-amber-500/30 text-amber-700" onClick={handleBulkSign}>
                    <FileSignature className="w-3 h-3" /> توقيع جماعي
                  </Button>
                </>
              )}
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {selectedItem ? (
            <div className="max-h-[28rem] overflow-y-auto scrollbar-thin">
              {renderItemDetail(selectedItem)}
            </div>
          ) : (
            <>
              <div className="flex border-b border-border">
                {DIRECTION_TABS.map(tab => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setDirection(tab.key)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors border-b-2',
                        direction === tab.key
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <TabIcon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-2 border-b border-border/50">
                <div className="relative">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="بحث في جميع الملفات والمستندات..."
                    className="h-8 text-xs pr-8"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="max-h-[24rem] overflow-y-auto scrollbar-thin">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>لا توجد نتائج</p>
                  </div>
                ) : (
                  renderGroupedList()
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatResourcePicker;
