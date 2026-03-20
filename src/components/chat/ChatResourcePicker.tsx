import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Truck, Receipt, FileText, FileSignature, X, Loader2, 
  ArrowUpFromLine, ArrowDownToLine, Eye, Send, Calendar, 
  MapPin, Weight, Building2, FileCheck, Download, Pen,
  CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp
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

type Direction = 'outgoing' | 'incoming';
type ResourceType = 'shipment' | 'invoice' | 'document' | 'signing_request';

interface ResourceItem {
  id: string;
  resourceType: ResourceType;
  label: string;
  subtitle: string;
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
  { key: 'document', label: 'المستندات', icon: FileText },
  { key: 'signing_request', label: 'التوقيعات', icon: FileSignature },
];

const TYPE_COLORS: Record<string, string> = {
  shipment: 'text-emerald-600 bg-emerald-500/10',
  invoice: 'text-blue-600 bg-blue-500/10',
  document: 'text-violet-600 bg-violet-500/10',
  signing_request: 'text-amber-600 bg-amber-500/10',
};

const TYPE_LABELS: Record<string, string> = {
  shipment: 'شحنة',
  invoice: 'فاتورة',
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
};

const DOC_TYPE_LABELS: Record<string, string> = {
  award_letter: 'خطاب ترسية',
  contract: 'عقد',
  correspondence: 'مراسلة',
  invoice: 'فاتورة',
  receipt: 'سند قبض',
  deposit_proof: 'إثبات إيداع',
  weight_slip: 'صورة وزنة',
  certificate: 'شهادة',
  license: 'رخصة',
  registration: 'سجل تجاري',
  generator_declaration: 'إقرار مولد',
  transporter_declaration: 'إقرار ناقل',
  recycler_declaration: 'إقرار مدور',
  disposal_certificate: 'شهادة تخلص',
  recycling_certificate: 'شهادة تدوير',
  driver_confirmation: 'تأكيد سائق',
  other: 'أخرى',
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  try {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: ar });
  } catch {
    return null;
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

  useEffect(() => {
    if (!isOpen || !organization?.id) return;
    setLoading(true);
    setSelectedItem(null);
    fetchAllByDirection(direction).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, [isOpen, direction, organization?.id]);

  const toggleSection = (type: ResourceType) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const fetchAllByDirection = async (dir: Direction): Promise<ResourceItem[]> => {
    if (!organization?.id) return [];
    const orgId = organization.id;
    const results: ResourceItem[] = [];

    try {
      // ── SHIPMENTS ──
      // Outgoing: shipments where my org is generator OR transporter (I'm sending)
      // Incoming: shipments where my org is recycler/disposal (I'm receiving)
      // For transporter: outgoing = I'm transporting, incoming = assigned to me
      const orgType = organization.organization_type;
      
      let shipmentQuery = supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, waste_description, generator_id, transporter_id, recycler_id, disposal_facility_id, pickup_city, delivery_city, pickup_address, delivery_address, quantity, unit, actual_weight, created_at, pickup_date, total_value, price_per_unit, shipment_type, notes, payment_status')
        .order('created_at', { ascending: false })
        .limit(50);

      if (dir === 'outgoing') {
        // Resources where I'm the originator/sender
        if (orgType === 'generator') {
          shipmentQuery = shipmentQuery.eq('generator_id', orgId);
        } else if (orgType === 'transporter') {
          shipmentQuery = shipmentQuery.eq('transporter_id', orgId);
        } else {
          // recycler/disposal - outgoing means I processed and sending back
          shipmentQuery = shipmentQuery.eq('recycler_id', orgId);
        }
      } else {
        // Resources where I'm the recipient
        if (orgType === 'generator') {
          // Generator receiving back processed waste
          shipmentQuery = shipmentQuery.eq('generator_id', orgId);
        } else if (orgType === 'transporter') {
          shipmentQuery = shipmentQuery.eq('transporter_id', orgId);
        } else {
          // recycler/disposal receiving waste
          shipmentQuery = shipmentQuery.or(`recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`);
        }
      }

      const { data: shipments, error: shipErr } = await shipmentQuery;
      if (shipErr) console.warn('Shipments fetch error:', shipErr.message);
      
      shipments?.forEach(s => {
        const wasteLabel = s.waste_description || s.waste_type || '';
        const locationInfo = [s.pickup_city, s.delivery_city].filter(Boolean).join(' → ');
        results.push({
          id: s.id,
          resourceType: 'shipment',
          label: `شحنة #${s.shipment_number}`,
          subtitle: wasteLabel || locationInfo || 'شحنة',
          status: s.status || undefined,
          date: s.pickup_date || s.created_at || undefined,
          extra: {
            pickupCity: s.pickup_city,
            deliveryCity: s.delivery_city,
            pickupAddress: s.pickup_address,
            deliveryAddress: s.delivery_address,
            quantity: s.quantity,
            actualWeight: s.actual_weight,
            unit: s.unit,
            totalValue: s.total_value,
            pricePerUnit: s.price_per_unit,
            currency: 'EGP',
            shipmentType: s.shipment_type,
            paymentStatus: s.payment_status,
            notes: s.notes,
          },
          raw: s,
        });
      });

      // ── INVOICES ──
      // Outgoing: invoices I created (organization_id = me)
      // Incoming: invoices sent to me (partner_organization_id = me)
      let invoiceQuery = supabase
        .from('invoices')
        .select('id, invoice_number, status, subtotal, tax_amount, total_amount, currency, organization_id, partner_organization_id, due_date, created_at, invoice_type, notes, paid_amount, remaining_amount, partner_name, invoice_category')
        .order('created_at', { ascending: false })
        .limit(50);

      if (dir === 'outgoing') {
        invoiceQuery = invoiceQuery.eq('organization_id', orgId);
      } else {
        invoiceQuery = invoiceQuery.eq('partner_organization_id', orgId);
      }

      const { data: invoices, error: invErr } = await invoiceQuery;
      if (invErr) console.warn('Invoices fetch error:', invErr.message);

      invoices?.forEach(inv => {
        const amount = inv.total_amount || inv.amount || 0;
        const currency = inv.currency || 'EGP';
        results.push({
          id: inv.id,
          resourceType: 'invoice',
          label: `فاتورة #${inv.invoice_number || inv.id.slice(0, 8)}`,
          subtitle: `${amount.toLocaleString()} ${currency}`,
          status: inv.status || undefined,
          date: inv.due_date || inv.created_at,
          extra: {
            invoiceType: inv.invoice_type,
            amount: inv.amount,
            taxAmount: inv.tax_amount,
            totalAmount: inv.total_amount,
            currency,
            dueDate: inv.due_date,
            paidDate: inv.paid_date,
            notes: inv.notes,
            shipmentId: inv.shipment_id,
          },
          raw: inv,
        });
      });

      // ── DOCUMENTS ──
      // Outgoing: docs owned by my org
      // Incoming: docs shared with my org (partner_organization_id = me)
      let docQuery = supabase
        .from('entity_documents')
        .select('id, title, file_name, document_type, document_category, file_url, file_type, file_size, description, created_at, reference_number, document_date, shipment_id, invoice_id, tags, partner_organization_id, organization_id')
        .order('created_at', { ascending: false })
        .limit(50);

      if (dir === 'outgoing') {
        docQuery = docQuery.eq('organization_id', orgId);
      } else {
        docQuery = docQuery.eq('partner_organization_id', orgId);
      }

      const { data: docs, error: docErr } = await docQuery;
      if (docErr) console.warn('Documents fetch error:', docErr.message);

      docs?.forEach(d => {
        const typeLabel = DOC_TYPE_LABELS[d.document_type] || d.document_type || d.document_category || '';
        results.push({
          id: d.id,
          resourceType: 'document',
          label: d.title || d.file_name || 'مستند',
          subtitle: typeLabel,
          date: d.document_date || d.created_at,
          extra: {
            fileUrl: d.file_url,
            fileType: d.file_type,
            fileSize: d.file_size,
            fileName: d.file_name,
            description: d.description,
            refNumber: d.reference_number,
            category: d.document_category,
            docType: d.document_type,
            shipmentId: d.shipment_id,
            invoiceId: d.invoice_id,
            tags: d.tags?.join(', ') || null,
          },
          raw: d,
        });
      });

      // ── SIGNING REQUESTS ──
      // Outgoing: signatures by my org
      // Incoming: signatures on docs where I need to act
      let signQuery = supabase
        .from('document_signatures')
        .select('id, signer_name, signer_role, signer_title, document_type, document_id, status, created_at, timestamp_signed, signature_method, stamp_applied, organization_id, signed_by')
        .order('created_at', { ascending: false })
        .limit(50);

      if (dir === 'outgoing') {
        signQuery = signQuery.eq('organization_id', orgId);
      } else {
        // For incoming, show signatures where signed_by is someone from partner orgs
        // But since we can't easily filter that, show all where org matches
        signQuery = signQuery.eq('organization_id', orgId);
      }

      const { data: signs, error: signErr } = await signQuery;
      if (signErr) console.warn('Signatures fetch error:', signErr.message);

      signs?.forEach(s => {
        const typeLabel = DOC_TYPE_LABELS[s.document_type] || s.document_type || '';
        results.push({
          id: s.id,
          resourceType: 'signing_request',
          label: s.signer_name || 'طلب توقيع',
          subtitle: `${typeLabel}${s.signer_role ? ` • ${s.signer_role}` : ''}`,
          status: s.status || undefined,
          date: s.timestamp_signed || s.created_at,
          extra: {
            signerTitle: s.signer_title,
            signatureMethod: s.signature_method,
            stampApplied: s.stamp_applied ? 1 : 0,
            documentId: s.document_id,
            docType: s.document_type,
          },
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
      (item.status || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  // Group items by resource type
  const groupedItems = useMemo(() => {
    const groups: Record<ResourceType, ResourceItem[]> = {
      shipment: [],
      invoice: [],
      document: [],
      signing_request: [],
    };
    filteredItems.forEach(item => {
      groups[item.resourceType].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleSelect = (item: ResourceItem) => {
    onSelect({ type: item.resourceType, data: item.raw });
    onClose();
  };

  const handlePreview = useCallback((item: ResourceItem) => {
    switch (item.resourceType) {
      case 'shipment':
        navigate(`/dashboard/shipments/${item.id}`);
        break;
      case 'invoice':
        navigate(`/dashboard/invoices`);
        break;
      case 'document':
        if (item.extra?.fileUrl) {
          window.open(item.extra.fileUrl as string, '_blank');
        } else {
          navigate(`/dashboard/documents`);
        }
        break;
      case 'signing_request':
        navigate(`/dashboard/signing-inbox`);
        break;
    }
    onClose();
  }, [navigate, onClose]);

  const formatFileSize = (bytes?: number | string | null) => {
    const num = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (!num) return null;
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderItemDetail = (item: ResourceItem) => {
    const section = RESOURCE_SECTIONS.find(s => s.key === item.resourceType);
    const Icon = section?.icon || FileText;
    const colorClass = TYPE_COLORS[item.resourceType] || 'text-muted-foreground bg-muted';
    const statusInfo = STATUS_MAP[item.status || ''];
    const dateStr = formatDate(item.date);

    return (
      <div className="space-y-3 p-3" dir="rtl">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
          </div>
        </div>

        {/* Status + Type badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {TYPE_LABELS[item.resourceType]}
          </Badge>
          {statusInfo && (
            <Badge variant="outline" className={cn('text-[10px]', statusInfo.color)}>
              {statusInfo.label}
            </Badge>
          )}
          {!statusInfo && item.status && (
            <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
          )}
        </div>

        {/* Details grid */}
        <div className="space-y-1.5 text-xs">
          {dateStr && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{dateStr}</span>
            </div>
          )}

          {/* Shipment-specific */}
          {item.resourceType === 'shipment' && (
            <>
              {(item.extra?.pickupCity || item.extra?.deliveryCity) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{item.extra.pickupCity || '—'} → {item.extra.deliveryCity || '—'}</span>
                </div>
              )}
              {(item.extra?.pickupAddress || item.extra?.deliveryAddress) && (
                <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span>{item.extra.pickupAddress || ''} → {item.extra.deliveryAddress || ''}</span>
                </div>
              )}
              {(item.extra?.quantity || item.extra?.actualWeight) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Weight className="w-3 h-3 shrink-0" />
                  <span>
                    {item.extra.actualWeight 
                      ? `${Number(item.extra.actualWeight).toLocaleString()} ${item.extra.unit || 'كجم'} (فعلي)` 
                      : `${Number(item.extra.quantity).toLocaleString()} ${item.extra.unit || 'كجم'}`}
                  </span>
                </div>
              )}
              {item.extra?.totalValue && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Receipt className="w-3 h-3 shrink-0" />
                  <span>{Number(item.extra.totalValue).toLocaleString()} {item.extra.currency || 'EGP'}</span>
                </div>
              )}
              {item.extra?.paymentStatus && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-3 h-3 shrink-0" />
                  <span>الدفع: {item.extra.paymentStatus}</span>
                </div>
              )}
              {item.extra?.notes && (
                <p className="text-muted-foreground text-[11px] bg-muted/50 rounded-lg p-2 mt-1">
                  {String(item.extra.notes).slice(0, 150)}
                </p>
              )}
            </>
          )}

          {/* Invoice-specific */}
          {item.resourceType === 'invoice' && (
            <>
              {item.extra?.invoiceType && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Receipt className="w-3 h-3 shrink-0" />
                  <span>النوع: {item.extra.invoiceType}</span>
                </div>
              )}
              {item.extra?.amount && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span>المبلغ: {Number(item.extra.amount).toLocaleString()} {item.extra.currency}</span>
                </div>
              )}
              {item.extra?.taxAmount && Number(item.extra.taxAmount) > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span>الضريبة: {Number(item.extra.taxAmount).toLocaleString()} {item.extra.currency}</span>
                </div>
              )}
              {item.extra?.dueDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>استحقاق: {formatDate(item.extra.dueDate as string)}</span>
                </div>
              )}
              {item.extra?.paidDate && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-3 h-3 shrink-0" />
                  <span>تم الدفع: {formatDate(item.extra.paidDate as string)}</span>
                </div>
              )}
              {item.extra?.notes && (
                <p className="text-muted-foreground text-[11px] bg-muted/50 rounded-lg p-2 mt-1">
                  {String(item.extra.notes).slice(0, 120)}
                </p>
              )}
            </>
          )}

          {/* Document-specific */}
          {item.resourceType === 'document' && (
            <>
              {item.extra?.fileName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate">{item.extra.fileName}</span>
                </div>
              )}
              {item.extra?.refNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileCheck className="w-3 h-3 shrink-0" />
                  <span>مرجع: {item.extra.refNumber}</span>
                </div>
              )}
              {item.extra?.category && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span>التصنيف: {item.extra.category}</span>
                </div>
              )}
              {item.extra?.tags && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span>وسوم: {item.extra.tags}</span>
                </div>
              )}
              {item.extra?.fileSize && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span>{formatFileSize(item.extra.fileSize)} • {item.extra.fileType || ''}</span>
                </div>
              )}
              {item.extra?.description && (
                <p className="text-muted-foreground text-[11px] bg-muted/50 rounded-lg p-2 mt-1">
                  {String(item.extra.description).slice(0, 150)}
                </p>
              )}
            </>
          )}

          {/* Signing-specific */}
          {item.resourceType === 'signing_request' && (
            <>
              {item.extra?.signerTitle && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span>المنصب: {item.extra.signerTitle}</span>
                </div>
              )}
              {item.extra?.signatureMethod && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Pen className="w-3 h-3 shrink-0" />
                  <span>طريقة التوقيع: {item.extra.signatureMethod}</span>
                </div>
              )}
              {item.extra?.stampApplied === 1 && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-3 h-3 shrink-0" />
                  <span>تم تطبيق الختم ✓</span>
                </div>
              )}
            </>
          )}
        </div>

        <Separator />

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => handlePreview(item)}
          >
            <Eye className="w-3.5 h-3.5" />
            معاينة
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => handleSelect(item)}
          >
            <Send className="w-3.5 h-3.5" />
            إرسال في الدردشة
          </Button>
        </div>

        {/* Extra action for documents */}
        {item.resourceType === 'document' && item.extra?.fileUrl && (
          <Button
            size="sm"
            variant="ghost"
            className="w-full h-7 text-[11px] gap-1.5 text-muted-foreground"
            asChild
          >
            <a href={item.extra.fileUrl as string} download target="_blank" rel="noopener">
              <Download className="w-3 h-3" />
              تحميل الملف
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

    return (
      <button
        key={`${item.resourceType}-${item.id}`}
        className={cn(
          'w-full px-3 py-2 rounded-lg transition-colors text-right',
          isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted/80'
        )}
        onClick={() => setSelectedItem(isSelected ? null : item)}
      >
        <div className="flex items-center gap-2.5">
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold truncate flex-1">{item.label}</p>
              {statusInfo && (
                <Badge variant="outline" className={cn('text-[9px] py-0 shrink-0', statusInfo.color)}>
                  {statusInfo.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-muted-foreground truncate flex-1">{item.subtitle}</p>
              {dateStr && (
                <span className="text-[9px] text-muted-foreground shrink-0">{dateStr}</span>
              )}
            </div>
            {/* Quick info per type */}
            {item.resourceType === 'shipment' && item.extra?.pickupCity && (
              <p className="text-[9px] text-muted-foreground/70 mt-0.5 truncate">
                📍 {item.extra.pickupCity} → {item.extra.deliveryCity || '—'}
                {item.extra.quantity ? ` • ${Number(item.extra.quantity).toLocaleString()} ${item.extra.unit || 'كجم'}` : ''}
              </p>
            )}
            {item.resourceType === 'invoice' && item.extra?.dueDate && (
              <p className="text-[9px] text-muted-foreground/70 mt-0.5 truncate">
                ⏰ استحقاق: {formatDate(item.extra.dueDate as string)}
              </p>
            )}
            {item.resourceType === 'document' && item.extra?.refNumber && (
              <p className="text-[9px] text-muted-foreground/70 mt-0.5 truncate">
                📋 مرجع: {item.extra.refNumber}
                {item.extra.fileSize ? ` • ${formatFileSize(item.extra.fileSize)}` : ''}
              </p>
            )}
            {item.resourceType === 'signing_request' && item.extra?.stampApplied === 1 && (
              <p className="text-[9px] text-emerald-600/70 mt-0.5 truncate">
                ✅ مختوم
              </p>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderGroupedList = () => {
    const totalCount = filteredItems.length;
    
    return (
      <div className="p-1 space-y-0.5">
        <div className="px-3 py-1 text-[10px] text-muted-foreground">
          {totalCount} نتيجة — {direction === 'outgoing' ? 'صادر' : 'وارد'}
        </div>
        
        {RESOURCE_SECTIONS.map(section => {
          const sectionItems = groupedItems[section.key];
          if (sectionItems.length === 0) return null;
          
          const isCollapsed = collapsedSections.has(section.key);
          const SectionIcon = section.icon;
          const colorClass = TYPE_COLORS[section.key];
          
          return (
            <div key={section.key} className="border border-border/50 rounded-lg overflow-hidden">
              {/* Section header */}
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                onClick={() => toggleSection(section.key)}
              >
                <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', colorClass)}>
                  <SectionIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold flex-1 text-right">{section.label}</span>
                <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center">
                  {sectionItems.length}
                </Badge>
                {isCollapsed ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
              
              {/* Section items */}
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
          style={{ maxHeight: '34rem' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              {selectedItem && (
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedItem(null)}>
                  <ArrowDownToLine className="w-3.5 h-3.5 rotate-90" />
                </Button>
              )}
              <span className="text-xs font-semibold text-muted-foreground">
                {selectedItem ? `📄 ${selectedItem.label}` : '📎 إرفاق مورد'}
              </span>
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {selectedItem ? (
            /* Detail View */
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {renderItemDetail(selectedItem)}
            </div>
          ) : (
            <>
              {/* Direction Tabs */}
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

              {/* Search */}
              <div className="p-2 border-b border-border/50">
                <div className="relative">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="بحث في الشحنات والفواتير والمستندات..."
                    className="h-8 text-xs pr-8"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Items List - grouped by type */}
              <div className="max-h-72 overflow-y-auto scrollbar-thin">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    لا توجد نتائج {direction === 'outgoing' ? 'صادرة' : 'واردة'}
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
