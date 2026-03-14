import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Printer, Calendar, Building2, Filter, 
  Loader2, FileStack, ClipboardList, Award, Receipt, Package,
  Eye, Download, CheckSquare, Square, CheckCircle, ArrowRight,
  PenTool, Stamp, FileArchive, FolderOpen, FileBadge, ExternalLink,
  FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { usePrintTracking } from '@/hooks/usePrintTracking';
// jsPDF & html2canvas loaded dynamically

type DocType = 'declarations' | 'certificates' | 'manifests' | 'invoices' | 'receipts' | 'signing' | 'signatures' | 'contracts' | 'org_documents' | 'stored_pdfs' | 'entity_docs' | 'print_log' | 'all';

const DOC_TYPES: { id: DocType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'جميع المستندات', icon: <FileStack className="h-4 w-4" /> },
  { id: 'entity_docs', label: 'أرشيف المستندات', icon: <FileArchive className="h-4 w-4" /> },
  { id: 'print_log', label: 'سجل الطباعة', icon: <Printer className="h-4 w-4" /> },
  { id: 'declarations', label: 'إقرارات التسليم', icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'certificates', label: 'شهادات إعادة التدوير', icon: <Award className="h-4 w-4" /> },
  { id: 'manifests', label: 'المانيفست الموحد', icon: <FileText className="h-4 w-4" /> },
  { id: 'invoices', label: 'الفواتير', icon: <Receipt className="h-4 w-4" /> },
  { id: 'receipts', label: 'إيصالات الاستلام', icon: <Package className="h-4 w-4" /> },
  { id: 'signing', label: 'طلبات التوقيع', icon: <PenTool className="h-4 w-4" /> },
  { id: 'signatures', label: 'التوقيعات الرقمية', icon: <Stamp className="h-4 w-4" /> },
  { id: 'contracts', label: 'العقود', icon: <FileBadge className="h-4 w-4" /> },
  { id: 'org_documents', label: 'مستندات المنظمة', icon: <FolderOpen className="h-4 w-4" /> },
  { id: 'stored_pdfs', label: 'ملفات PDF المخزنة', icon: <FileArchive className="h-4 w-4" /> },
];

interface DocumentItem {
  id: string;
  type: DocType;
  typeLabel: string;
  title: string;
  subtitle: string;
  date: string;
  status: string;
  rawData: any;
}

const PrintCenter = () => {
  const { organization, profile } = useAuth();
  const navigate = useNavigate();
  const orgId = organization?.id;
  const { logPrint } = usePrintTracking();

  const [dateMode, setDateMode] = useState<'today' | 'range'>('range');
  const [dateFrom, setDateFrom] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [selectedDocTypes, setSelectedDocTypes] = useState<DocType[]>(['all']);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fromDate = dateMode === 'today' ? format(new Date(), 'yyyy-MM-dd') : dateFrom;
  const toDate = dateMode === 'today' ? format(new Date(), 'yyyy-MM-dd') : dateTo;
  const fromISO = `${fromDate}T00:00:00.000Z`;
  const toISO = `${toDate}T23:59:59.999Z`;
  const isAll = selectedDocTypes.includes('all');

  const { data: partners } = useQuery({
    queryKey: ['print-center-partners', orgId],
    enabled: !!orgId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: shipments } = await supabase
        .from('shipments')
        .select('generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
        .limit(500);

      const ids = new Set<string>();
      (shipments || []).forEach((s: any) => {
        if (s.generator_id && s.generator_id !== orgId) ids.add(s.generator_id);
        if (s.transporter_id && s.transporter_id !== orgId) ids.add(s.transporter_id);
        if (s.recycler_id && s.recycler_id !== orgId) ids.add(s.recycler_id);
      });

      if (ids.size === 0) return [];
      const { data } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .in('id', Array.from(ids));
      return data || [];
    },
  });

  // Fetch actual documents
  const { data: documents, isLoading: docsLoading, refetch } = useQuery({
    queryKey: ['print-center-docs', orgId, fromISO, toISO, selectedPartner, selectedDocTypes],
    enabled: !!orgId,
    staleTime: 30_000,
    queryFn: async () => {
      const items: DocumentItem[] = [];

      // Shipments (declarations + manifests)
      if (isAll || selectedDocTypes.includes('declarations') || selectedDocTypes.includes('manifests')) {
        let q = supabase
          .from('shipments')
          .select('id, shipment_number, status, waste_type, quantity, unit, weighbridge_net_weight, created_at, manual_vehicle_plate, manual_driver_name, generator_id, transporter_id, recycler_id, manifest_pdf_url, weighbridge_photo_url, disposal_certificate_url, payment_proof_url')
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at', { ascending: false });

        if (selectedPartner !== 'all') {
          q = q.or(`generator_id.eq.${selectedPartner},transporter_id.eq.${selectedPartner},recycler_id.eq.${selectedPartner}`);
        }

        const { data } = await q;
        (data || []).forEach((s: any) => {
          if (isAll || selectedDocTypes.includes('declarations')) {
            items.push({
              id: `decl-${s.id}`,
              type: 'declarations',
              typeLabel: 'إقرار تسليم',
              title: `إقرار - ${s.shipment_number || s.id.substring(0, 8)}`,
              subtitle: `${s.waste_type || 'غير محدد'} • ${s.weighbridge_net_weight || s.quantity || 0} كجم`,
              date: s.created_at,
              status: s.status || 'new',
              rawData: s,
            });
          }
          if (isAll || selectedDocTypes.includes('manifests')) {
            items.push({
              id: `manf-${s.id}`,
              type: 'manifests',
              typeLabel: 'مانيفست',
              title: `مانيفست - ${s.shipment_number || s.id.substring(0, 8)}`,
              subtitle: `سائق: ${s.manual_driver_name || '-'} • مركبة: ${s.manual_vehicle_plate || '-'}`,
              date: s.created_at,
              status: s.status || 'new',
              rawData: s,
            });
          }
        });
      }

      // Invoices
      if (isAll || selectedDocTypes.includes('invoices')) {
        const { data } = await supabase
          .from('invoices')
          .select('id, invoice_number, status, total_amount, created_at, partner_name, attachment_url')
          .eq('organization_id', orgId!)
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at', { ascending: false });

        (data || []).forEach((inv: any) => {
          items.push({
            id: `inv-${inv.id}`,
            type: 'invoices',
            typeLabel: 'فاتورة',
            title: `فاتورة - ${inv.invoice_number || inv.id.substring(0, 8)}`,
            subtitle: `${inv.partner_name || '-'} • ${(inv.total_amount || 0).toLocaleString('ar-EG')} ج.م`,
            date: inv.created_at,
            status: inv.status || 'draft',
            rawData: inv,
          });
        });
      }

      // Receipts - fetch via shipment IDs linked to org
      if (isAll || selectedDocTypes.includes('receipts')) {
        // First get shipment IDs for this org
        const { data: orgShipments } = await supabase
          .from('shipments')
          .select('id')
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', fromISO)
          .lte('created_at', toISO);

        const shipmentIds = (orgShipments || []).map((s: any) => s.id);
        if (shipmentIds.length > 0) {
          const { data } = await supabase
            .from('shipment_receipts')
            .select('id, receipt_number, status, receipt_type, actual_weight, unit, created_at, shipment_id')
            .in('shipment_id', shipmentIds)
            .order('created_at', { ascending: false });

          (data || []).forEach((r: any) => {
            items.push({
              id: `rcpt-${r.id}`,
              type: 'receipts',
              typeLabel: 'إيصال استلام',
              title: `إيصال - ${r.receipt_number || r.id.substring(0, 8)}`,
              subtitle: `${r.receipt_type || '-'} • ${r.actual_weight || '-'} ${r.unit || ''}`,
              date: r.created_at,
              status: r.status || 'pending',
              rawData: r,
            });
          });
        }
      }

      // Certificates - fetch via shipment IDs linked to org
      if (isAll || selectedDocTypes.includes('certificates')) {
        // Reuse shipment IDs if already fetched, otherwise fetch
        let certShipmentIds: string[] = [];
        if (isAll || selectedDocTypes.includes('receipts')) {
          // Already fetched above, but we need to refetch if not
        }
        const { data: certShipments } = await supabase
          .from('shipments')
          .select('id')
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', fromISO)
          .lte('created_at', toISO);

        certShipmentIds = (certShipments || []).map((s: any) => s.id);
        if (certShipmentIds.length > 0) {
          const { data } = await supabase
            .from('recycling_reports')
            .select('id, report_number, created_at, shipment_id')
            .in('shipment_id', certShipmentIds)
            .order('created_at', { ascending: false });

          (data || []).forEach((r: any) => {
            items.push({
              id: `cert-${r.id}`,
              type: 'certificates',
              typeLabel: 'شهادة تدوير',
              title: `شهادة - ${r.report_number || r.id.substring(0, 8)}`,
              subtitle: `شحنة: ${r.shipment_id ? r.shipment_id.substring(0, 8) : '-'}`,
              date: r.created_at,
              status: 'completed',
              rawData: r,
            });
          });
        }
      }

      // Signing Requests
      if (isAll || selectedDocTypes.includes('signing')) {
        const { data: outgoing } = await supabase
          .from('signing_requests')
          .select('id, document_title, document_type, status, signed_at, created_at, requires_stamp, document_file_url, recipient_organization_id, sender_organization_id, recipient_org:organizations!signing_requests_recipient_organization_id_fkey(name), sender_org:organizations!signing_requests_sender_organization_id_fkey(name)')
          .or(`sender_organization_id.eq.${orgId},recipient_organization_id.eq.${orgId}`)
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at', { ascending: false });

        (outgoing || []).forEach((s: any) => {
          const isSender = s.sender_organization_id === orgId;
          const partnerName = isSender ? (s.recipient_org as any)?.name : (s.sender_org as any)?.name;
          
          if (selectedPartner !== 'all') {
            const partnerId = isSender ? s.recipient_organization_id : s.sender_organization_id;
            if (partnerId !== selectedPartner) return;
          }

          items.push({
            id: `sign-${s.id}`,
            type: 'signing',
            typeLabel: isSender ? 'طلب توقيع مرسل' : 'طلب توقيع وارد',
            title: `${s.document_title || 'طلب توقيع'}`,
            subtitle: `${isSender ? '← ' : '→ '}${partnerName || '-'} • ${s.requires_stamp ? '🔏 ختم مطلوب' : ''} • ${s.document_type || ''}`,
            date: s.created_at,
            status: s.status || 'pending',
            rawData: { ...s, isSender },
          });
        });
      }

      // Digital Signatures
      if (isAll || selectedDocTypes.includes('signatures')) {
        const { data: sigs } = await supabase
          .from('document_signatures')
          .select('id, document_type, document_id, signer_name, signer_role, signature_method, stamp_applied, platform_seal_number, document_hash, status, created_at')
          .eq('organization_id', orgId!)
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at', { ascending: false });

        (sigs || []).forEach((s: any) => {
          items.push({
            id: `dsig-${s.id}`,
            type: 'signatures',
            typeLabel: 'توقيع رقمي',
            title: `توقيع - ${s.signer_name || '-'} (${s.signer_role || '-'})`,
            subtitle: `${s.document_type || '-'} • ${s.signature_method || '-'} • ${s.stamp_applied ? '✅ مختوم' : ''} ${s.platform_seal_number ? `QR: ${s.platform_seal_number}` : ''}`,
            date: s.created_at,
            status: s.status || 'signed',
            rawData: s,
          });
        });
      }

      // Contracts
      if (isAll || selectedDocTypes.includes('contracts')) {
        let cq = supabase
          .from('contracts')
          .select('id, contract_number, title, status, value, start_date, end_date, attachment_url, created_at, organization_id, partner_organization_id, partner_org:organizations!contracts_partner_organization_id_fkey(name)')
          .or(`organization_id.eq.${orgId},partner_organization_id.eq.${orgId}`)
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at', { ascending: false });

        if (selectedPartner !== 'all') {
          cq = cq.or(`organization_id.eq.${selectedPartner},partner_organization_id.eq.${selectedPartner}`);
        }

        const { data } = await cq;
        (data || []).forEach((c: any) => {
          items.push({
            id: `cont-${c.id}`,
            type: 'contracts',
            typeLabel: 'عقد',
            title: `عقد - ${c.contract_number || c.title || c.id.substring(0, 8)}`,
            subtitle: `${(c.partner_org as any)?.name || '-'} • ${c.value ? `${Number(c.value).toLocaleString('ar-EG')} ج.م` : '-'} • ${c.status || '-'}`,
            date: c.created_at,
            status: c.status || 'draft',
            rawData: c,
          });
        });
      }

      // Organization Documents
      if (isAll || selectedDocTypes.includes('org_documents')) {
        const { data } = await supabase
          .from('organization_documents')
          .select('id, document_type, file_name, file_path, file_url, verification_status, notes, created_at, organization_id')
          .eq('organization_id', orgId!)
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at', { ascending: false });

        (data || []).forEach((d: any) => {
          items.push({
            id: `orgdoc-${d.id}`,
            type: 'org_documents',
            typeLabel: 'مستند منظمة',
            title: `${d.document_type || 'مستند'} - ${d.id.substring(0, 8)}`,
            subtitle: `${d.notes || '-'} • حالة التحقق: ${d.verification_status || '-'}`,
            date: d.created_at,
            status: d.verification_status || 'pending',
            rawData: d,
          });
        });
      }

      // Stored PDFs from storage bucket
      if (isAll || selectedDocTypes.includes('stored_pdfs')) {
        try {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (userId) {
            const folderPath = orgId ? `${userId}/${orgId}` : userId;
            const { data: files } = await supabase.storage
              .from('pdf-documents')
              .list(folderPath, { sortBy: { column: 'created_at', order: 'desc' } });

            (files || []).filter(f => f.name.endsWith('.pdf')).forEach((f: any) => {
              items.push({
                id: `pdf-${f.id || f.name}`,
                type: 'stored_pdfs',
                typeLabel: 'ملف PDF',
                title: f.name.replace(/^\d+-/, '').replace(/_/g, ' '),
                subtitle: `${(f.metadata?.size ? (f.metadata.size / 1024).toFixed(1) : '?')} كيلوبايت`,
                date: f.created_at || new Date().toISOString(),
                status: 'stored',
                rawData: { ...f, storagePath: `${folderPath}/${f.name}` },
              });
            });
          }
        } catch (e) {
          console.warn('Could not list stored PDFs:', e);
        }
      }

      // Entity Documents (Archive)
      if (isAll || selectedDocTypes.includes('entity_docs')) {
        const { data } = await supabase
          .from('entity_documents')
          .select('id, title, file_name, file_url, document_type, document_category, description, tags, reference_number, file_size, file_type, created_at, uploaded_by_role, shipment_id, contract_id, invoice_id, deposit_id')
          .eq('organization_id', orgId!)
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at', { ascending: false })
          .limit(500);

        (data || []).forEach((d: any) => {
          const sizeKB = d.file_size ? (d.file_size / 1024).toFixed(1) : '?';
          items.push({
            id: `edoc-${d.id}`,
            type: 'entity_docs',
            typeLabel: 'أرشيف',
            title: d.title || d.file_name || 'مستند',
            subtitle: `${d.document_type || '-'} • ${d.document_category || '-'} • ${sizeKB} كيلوبايت • ${d.uploaded_by_role || '-'}`,
            date: d.created_at,
            status: 'stored',
            rawData: d,
          });
        });
      }

      // Document Print Log
      if (isAll || selectedDocTypes.includes('print_log')) {
        const { data } = await supabase
          .from('document_print_log')
          .select('id, document_type, document_number, document_id, print_tracking_code, printed_by_name, action_type, description, ai_summary, file_url, created_at')
          .eq('organization_id', orgId!)
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at', { ascending: false })
          .limit(500);

        (data || []).forEach((d: any) => {
          items.push({
            id: `plog-${d.id}`,
            type: 'print_log',
            typeLabel: 'سجل طباعة',
            title: `${d.document_type || 'مستند'} - ${d.document_number || d.print_tracking_code || d.id.substring(0, 8)}`,
            subtitle: `${d.printed_by_name || '-'} • ${d.action_type || '-'} • كود: ${d.print_tracking_code || '-'}`,
            date: d.created_at,
            status: d.action_type === 'auto_created' ? 'stored' : 'completed',
            rawData: d,
          });
        });
      }

      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });

  const orgTypeLabel = (t: string) => {
    const map: Record<string, string> = { generator: 'مولّد', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص' };
    return map[t] || t;
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      new: 'جديدة', pending: 'معلقة', approved: 'معتمدة', collecting: 'قيد الجمع',
      in_transit: 'في الطريق', delivered: 'تم التسليم', draft: 'مسودة',
      confirmed: 'مؤكدة', cancelled: 'ملغاة', completed: 'مكتملة', paid: 'مدفوعة',
      signed: 'موقّع', rejected: 'مرفوض', active: 'ساري', expired: 'منتهي',
      verified: 'موثّق', stored: 'مخزّن',
    };
    return map[s] || s;
  };

  const statusColor = (s: string) => {
    if (['delivered', 'confirmed', 'completed', 'paid', 'signed', 'active', 'verified', 'stored'].includes(s)) return 'default';
    if (['cancelled', 'rejected', 'expired'].includes(s)) return 'destructive';
    return 'secondary';
  };

  const typeIcon = (type: DocType) => {
    const dt = DOC_TYPES.find(d => d.id === type);
    return dt?.icon || <FileText className="h-4 w-4" />;
  };

  const toggleDocType = (docType: DocType) => {
    if (docType === 'all') {
      setSelectedDocTypes(['all']);
      return;
    }
    let updated: DocType[] = selectedDocTypes.filter(d => d !== 'all');
    if (updated.includes(docType)) {
      updated = updated.filter(d => d !== docType);
    } else {
      updated.push(docType);
    }
    if (updated.length === 0) updated = ['all'];
    setSelectedDocTypes(updated);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!documents) return;
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map(d => d.id)));
    }
  };

  // Print single document
  const printSingle = useCallback(async (doc: DocumentItem) => {
    const html = generateDocHtml([doc]);
    openPrintWindow(html);
    // Log print tracking
    await logPrint({
      documentType: doc.type,
      documentId: doc.id.replace(/^[a-z]+-/, ''),
      documentNumber: doc.title,
      actionType: 'print',
      description: `طباعة ${doc.typeLabel}: ${doc.title}`,
    });
    toast.success(`تم تجهيز "${doc.title}" للطباعة`);
  }, [organization, profile, logPrint]);

  // Print selected/all
  const printBulk = useCallback(async () => {
    if (!documents || documents.length === 0) return;
    setIsPrinting(true);
    try {
      const toPrint = selectedIds.size > 0
        ? documents.filter(d => selectedIds.has(d.id))
        : documents;
      const html = generateDocHtml(toPrint);
      openPrintWindow(html);
      // Log bulk print tracking
      await logPrint({
        documentType: 'bulk_print',
        documentNumber: `${toPrint.length} مستند`,
        actionType: 'print',
        description: `طباعة مجمعة: ${toPrint.length} مستند`,
        metadata: { count: toPrint.length, types: [...new Set(toPrint.map(d => d.type))] },
      });
      toast.success(`تم تجهيز ${toPrint.length} مستند للطباعة`);
    } finally {
      setIsPrinting(false);
    }
  }, [documents, selectedIds, organization, profile, logPrint]);

  // Export to PDF
  const exportBulkPDF = useCallback(async () => {
    if (!documents || documents.length === 0) return;
    setIsPrinting(true);
    const toastId = toast.loading('جاري إنشاء ملف PDF...');
    try {
      const toPrint = selectedIds.size > 0
        ? documents.filter(d => selectedIds.has(d.id))
        : documents;
      const html = generateDocHtml(toPrint);

      // Create offscreen iframe
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;width:794px;height:1123px;border:none;';
      document.body.appendChild(iframe);
      const iDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iDoc) throw new Error('Cannot access iframe');
      iDoc.open();
      iDoc.write(html);
      iDoc.close();

      await new Promise(r => setTimeout(r, 800));

      const canvas = await html2canvas(iDoc.body, { scale: 2, useCORS: true, logging: false, width: 794, windowWidth: 794 });
      document.body.removeChild(iframe);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = -(imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const dateStr = format(new Date(), 'yyyy-MM-dd');
      pdf.save(`مركز-الطباعة-${dateStr}.pdf`);

      // Log PDF export
      await logPrint({
        documentType: 'bulk_export',
        documentNumber: `${toPrint.length} مستند`,
        actionType: 'pdf_export',
        description: `تصدير PDF مجمع: ${toPrint.length} مستند`,
        metadata: { count: toPrint.length },
      });

      toast.dismiss(toastId);
      toast.success('تم تحميل ملف PDF بنجاح');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.dismiss(toastId);
      toast.error('فشل في تصدير PDF');
    } finally {
      setIsPrinting(false);
    }
  }, [documents, selectedIds, organization, profile, logPrint]);

  const openPrintWindow = (html: string) => {
    const w = window.open('', '_blank', 'width=900,height=700');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
  };

  const generateDocHtml = (docs: DocumentItem[]) => {
    const now = new Date();
    const dateStr = format(now, 'yyyy/MM/dd', { locale: ar });
    const timeStr = format(now, 'HH:mm:ss');

    // Group by type
    const grouped: Record<string, DocumentItem[]> = {};
    docs.forEach(d => {
      if (!grouped[d.type]) grouped[d.type] = [];
      grouped[d.type].push(d);
    });

    let tablesHtml = '';
    
    for (const [type, items] of Object.entries(grouped)) {
      const label = DOC_TYPES.find(d => d.id === type)?.label || type;
      
      if (type === 'declarations' || type === 'manifests') {
        tablesHtml += `<h2>${type === 'declarations' ? '📋' : '🚛'} ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>الرقم</th><th>نوع المخلفات</th><th>الوزن</th><th>المركبة</th><th>السائق</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => `<tr><td>${i+1}</td><td>${d.rawData.shipment_number || '-'}</td><td>${d.rawData.waste_type || '-'}</td><td>${d.rawData.weighbridge_net_weight || d.rawData.quantity || 0} كجم</td><td>${d.rawData.manual_vehicle_plate || '-'}</td><td>${d.rawData.manual_driver_name || '-'}</td><td><span class="badge badge-s">${statusLabel(d.status)}</span></td><td>${d.date ? format(new Date(d.date), 'MM/dd HH:mm') : '-'}</td></tr>`).join('')}
        </tbody></table>`;
      } else if (type === 'invoices') {
        tablesHtml += `<h2>🧾 ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>رقم الفاتورة</th><th>الجهة</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => `<tr><td>${i+1}</td><td>${d.rawData.invoice_number || '-'}</td><td>${d.rawData.partner_name || '-'}</td><td>${(d.rawData.total_amount || 0).toLocaleString('ar-EG')} ج.م</td><td><span class="badge badge-s">${statusLabel(d.status)}</span></td><td>${d.date ? format(new Date(d.date), 'yyyy/MM/dd') : '-'}</td></tr>`).join('')}
        </tbody></table>`;
      } else if (type === 'receipts') {
        tablesHtml += `<h2>📦 ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>رقم الإيصال</th><th>النوع</th><th>الوزن</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => `<tr><td>${i+1}</td><td>${d.rawData.receipt_number || '-'}</td><td>${d.rawData.receipt_type || '-'}</td><td>${d.rawData.actual_weight || '-'} ${d.rawData.unit || ''}</td><td><span class="badge badge-s">${statusLabel(d.status)}</span></td><td>${d.date ? format(new Date(d.date), 'yyyy/MM/dd HH:mm') : '-'}</td></tr>`).join('')}
        </tbody></table>`;
      } else if (type === 'certificates') {
        tablesHtml += `<h2>🏅 ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>رقم الشهادة</th><th>رقم الشحنة</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => `<tr><td>${i+1}</td><td>${d.rawData.report_number || '-'}</td><td>${d.rawData.shipment_id ? d.rawData.shipment_id.substring(0, 8) : '-'}</td><td>${d.date ? format(new Date(d.date), 'yyyy/MM/dd HH:mm') : '-'}</td></tr>`).join('')}
        </tbody></table>`;
      } else if (type === 'signing') {
        tablesHtml += `<h2>✍️ ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>عنوان المستند</th><th>النوع</th><th>الاتجاه</th><th>الجهة</th><th>ختم</th><th>الحالة</th><th>تاريخ التوقيع</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => {
          const r = d.rawData;
          const direction = r.isSender ? '📤 مرسل' : '📥 وارد';
          const partner = r.isSender ? (r.recipient_org?.name || '-') : (r.sender_org?.name || '-');
          const sigStatus = r.status === 'signed' ? '<span class="badge badge-s">✅ موقّع</span>' : r.status === 'rejected' ? '<span class="badge" style="background:#fee2e2;color:#991b1b;">❌ مرفوض</span>' : '<span class="badge" style="background:#fef3c7;color:#92400e;">⏳ انتظار</span>';
          return `<tr><td>${i+1}</td><td>${r.document_title || '-'}</td><td>${r.document_type || '-'}</td><td>${direction}</td><td>${partner}</td><td>${r.requires_stamp ? '🔏 نعم' : '—'}</td><td>${sigStatus}</td><td>${r.signed_at ? format(new Date(r.signed_at), 'yyyy/MM/dd HH:mm') : '—'}</td><td>${d.date ? format(new Date(d.date), 'yyyy/MM/dd') : '-'}</td></tr>`;
        }).join('')}
        </tbody></table>`;
      } else if (type === 'signatures') {
        tablesHtml += `<h2>🔐 ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>نوع المستند</th><th>الموقّع</th><th>الدور</th><th>الطريقة</th><th>ختم</th><th>QR/كود</th><th>هاش SHA</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => {
          const r = d.rawData;
          return `<tr><td>${i+1}</td><td>${r.document_type || '-'}</td><td>${r.signer_name || '-'}</td><td>${r.signer_role || '-'}</td><td>${r.signature_method || '-'}</td><td>${r.stamp_applied ? '✅ مختوم' : '—'}</td><td>${r.platform_seal_number || '—'}</td><td style="font-size:8px;font-family:monospace;">${r.document_hash ? r.document_hash.substring(0, 16) + '...' : '—'}</td><td>${d.date ? format(new Date(d.date), 'yyyy/MM/dd HH:mm') : '-'}</td></tr>`;
        }).join('')}
        </tbody></table>`;
      } else if (type === 'contracts') {
        tablesHtml += `<h2>📑 ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>رقم العقد</th><th>العنوان</th><th>الجهة</th><th>القيمة</th><th>بداية</th><th>نهاية</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => {
          const r = d.rawData;
          return `<tr><td>${i+1}</td><td>${r.contract_number || '-'}</td><td>${r.title || '-'}</td><td>${r.partner_org?.name || '-'}</td><td>${r.value ? Number(r.value).toLocaleString('ar-EG') + ' ج.م' : '-'}</td><td>${r.start_date ? format(new Date(r.start_date), 'yyyy/MM/dd') : '-'}</td><td>${r.end_date ? format(new Date(r.end_date), 'yyyy/MM/dd') : '-'}</td><td><span class="badge badge-s">${statusLabel(d.status)}</span></td><td>${d.date ? format(new Date(d.date), 'yyyy/MM/dd') : '-'}</td></tr>`;
        }).join('')}
        </tbody></table>`;
      } else if (type === 'org_documents') {
        tablesHtml += `<h2>📁 ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>نوع المستند</th><th>ملاحظات</th><th>حالة التحقق</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => `<tr><td>${i+1}</td><td>${d.rawData.document_type || '-'}</td><td>${d.rawData.notes || '-'}</td><td><span class="badge badge-s">${statusLabel(d.status)}</span></td><td>${d.date ? format(new Date(d.date), 'yyyy/MM/dd') : '-'}</td></tr>`).join('')}
        </tbody></table>`;
      } else if (type === 'stored_pdfs') {
        tablesHtml += `<h2>💾 ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>اسم الملف</th><th>الحجم</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => `<tr><td>${i+1}</td><td>${d.title}</td><td>${d.subtitle}</td><td>${d.date ? format(new Date(d.date), 'yyyy/MM/dd HH:mm') : '-'}</td></tr>`).join('')}
        </tbody></table>`;
      } else if (type === 'entity_docs') {
        tablesHtml += `<h2>📂 ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>العنوان</th><th>النوع</th><th>التصنيف</th><th>اسم الملف</th><th>الحجم</th><th>الرافع</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => {
          const r = d.rawData;
          return `<tr><td>${i+1}</td><td>${r.title || '-'}</td><td>${r.document_type || '-'}</td><td>${r.document_category || '-'}</td><td>${r.file_name || '-'}</td><td>${r.file_size ? (r.file_size/1024).toFixed(1) + ' KB' : '-'}</td><td>${r.uploaded_by_role || '-'}</td><td>${d.date ? format(new Date(d.date), 'yyyy/MM/dd') : '-'}</td></tr>`;
        }).join('')}
        </tbody></table>`;
      } else if (type === 'print_log') {
        tablesHtml += `<h2>🖨️ ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>النوع</th><th>رقم المستند</th><th>كود التتبع</th><th>طُبع بواسطة</th><th>نوع الإجراء</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => {
          const r = d.rawData;
          return `<tr><td>${i+1}</td><td>${r.document_type || '-'}</td><td>${r.document_number || '-'}</td><td>${r.print_tracking_code || '-'}</td><td>${r.printed_by_name || '-'}</td><td>${r.action_type || '-'}</td><td>${d.date ? format(new Date(d.date), 'yyyy/MM/dd HH:mm') : '-'}</td></tr>`;
        }).join('')}
        </tbody></table>`;
      }
    }

    return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>طباعة مستندات</title>
    <style>
      @page { size: A4; margin: 12mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; color: #1a1a1a; direction: rtl; }
      .header { border-bottom: 3px solid #059669; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
      .header-right h1 { font-size: 20px; color: #059669; }
      .header-right .sub { font-size: 12px; color: #666; }
      .header-left { text-align: left; font-size: 10px; color: #666; }
      h2 { font-size: 14px; color: #059669; margin: 16px 0 6px; border-bottom: 1px solid #d1d5db; padding-bottom: 3px; }
      table { width: 100%; border-collapse: collapse; margin: 6px 0 14px; font-size: 10px; }
      th { background: #059669; color: white; padding: 6px 4px; text-align: right; }
      td { padding: 5px 4px; border-bottom: 1px solid #e5e7eb; text-align: right; }
      tr:nth-child(even) { background: #f9fafb; }
      .badge { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 9px; font-weight: bold; }
      .badge-s { background: #dcfce7; color: #166534; }
      .footer { margin-top: 20px; border-top: 2px solid #059669; padding-top: 8px; font-size: 9px; color: #999; text-align: center; }
      .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 70px; color: rgba(5,150,105,0.04); font-weight: bold; z-index: -1; }
    </style></head><body>
    <div class="watermark">iRecycle</div>
    <div class="header">
      <div class="header-right"><h1>📋 ${docs.length === 1 ? docs[0].title : `تقرير مستندات (${docs.length})`}</h1><div class="sub">${organization?.name || ''}</div></div>
      <div class="header-left"><div><strong>التاريخ:</strong> ${dateStr}</div><div><strong>الوقت:</strong> ${timeStr}</div><div><strong>أعده:</strong> ${profile?.full_name || ''}</div></div>
    </div>
    ${tablesHtml}
    <div class="footer"><p>تقرير صادر من منصة iRecycle | ${dateStr} - ${timeStr}</p></div>
    </body></html>`;
  };

  const docCounts = useMemo(() => {
    if (!documents) return {};
    const counts: Record<string, number> = {};
    documents.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1; });
    return counts;
  }, [documents]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="shrink-0">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileStack className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">مركز الطباعة</h1>
            <p className="text-muted-foreground text-sm">عرض وطباعة المستندات - مفردة أو مجمعة</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              {selectedIds.size} محدد
            </Badge>
          )}
          <Button onClick={exportBulkPDF} variant="outline" disabled={isPrinting || !documents?.length} className="gap-2">
            {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            تصدير PDF
          </Button>
          <Button onClick={printBulk} disabled={isPrinting || !documents?.length} className="gap-2">
            {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            {selectedIds.size > 0 ? `طباعة المحدد (${selectedIds.size})` : 'طباعة الكل'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {DOC_TYPES.filter(d => d.id !== 'all').map(dt => (
          <Card key={dt.id} className={`cursor-pointer transition-all ${
            selectedDocTypes.includes(dt.id) || selectedDocTypes.includes('all') ? 'ring-2 ring-primary/30' : 'opacity-60'
          }`} onClick={() => toggleDocType(dt.id)}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {dt.icon}
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{docCounts[dt.id] || 0}</p>
                <p className="text-xs text-muted-foreground">{dt.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              الفلاتر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                الفترة
              </Label>
              <Select value={dateMode} onValueChange={(v: 'today' | 'range') => setDateMode(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="range">فترة محددة</SelectItem>
                </SelectContent>
              </Select>
              {dateMode === 'range' && (
                <div className="space-y-1.5">
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs" />
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs">
                <Building2 className="h-3.5 w-3.5" />
                الجهة
              </Label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="اختر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الجهات</SelectItem>
                  {(partners || []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({orgTypeLabel(p.organization_type)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" />
                نوع المستند
              </Label>
              <div className="space-y-1">
                {DOC_TYPES.map(dt => (
                  <label
                    key={dt.id}
                    className={`flex items-center gap-2 p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                      selectedDocTypes.includes(dt.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <Checkbox
                      checked={selectedDocTypes.includes(dt.id)}
                      onCheckedChange={() => toggleDocType(dt.id)}
                      className="h-3.5 w-3.5"
                    />
                    {dt.icon}
                    <span>{dt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={() => refetch()} variant="outline" size="sm" className="w-full gap-2 text-xs">
              <Filter className="h-3.5 w-3.5" />
              تحديث النتائج
            </Button>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileStack className="h-4 w-4" />
                المستندات ({documents?.length || 0})
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={toggleSelectAll}>
                {documents && selectedIds.size === documents.length ? (
                  <><CheckSquare className="h-3.5 w-3.5" /> إلغاء تحديد الكل</>
                ) : (
                  <><Square className="h-3.5 w-3.5" /> تحديد الكل</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {docsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !documents || documents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileStack className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">لا توجد مستندات</p>
                <p className="text-xs mt-1">جرب تغيير الفلاتر أو الفترة الزمنية</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${
                      selectedIds.has(doc.id) ? 'bg-primary/5 border-primary/30' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedIds.has(doc.id)}
                      onCheckedChange={() => toggleSelect(doc.id)}
                    />
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {typeIcon(doc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">{doc.typeLabel}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{doc.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusColor(doc.status) as any} className="text-[10px]">
                        {statusLabel(doc.status)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {doc.date ? format(new Date(doc.date), 'MM/dd HH:mm') : '-'}
                      </span>

                      {/* View button - opens original file first, falls back to page */}
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض"
                        onClick={async () => {
                          const rawId = doc.id.replace(/^[a-z]+-/, '');
                          try {
                            // Helper: try to open a file from a storage bucket
                            const openFromBucket = async (bucket: string, path: string) => {
                              const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
                              if (data?.signedUrl) { window.open(data.signedUrl, '_blank'); return true; }
                              return false;
                            };
                            // Helper: open a direct URL
                            const openUrl = (url: string) => { window.open(url, '_blank'); return true; };

                            switch (doc.type) {
                              case 'declarations':
                              case 'manifests': {
                                // Try manifest PDF first, then weighbridge photo, then navigate
                                const manifestUrl = doc.rawData.manifest_pdf_url;
                                const weighbridgeUrl = doc.rawData.weighbridge_photo_url;
                                const disposalUrl = doc.rawData.disposal_certificate_url;
                                
                                if (manifestUrl && doc.type === 'manifests') {
                                  if (manifestUrl.startsWith('http')) { openUrl(manifestUrl); }
                                  else { 
                                    const opened = await openFromBucket('pdf-documents', manifestUrl) || await openFromBucket('shipment-photos', manifestUrl);
                                    if (!opened) navigate(`/dashboard/shipments/${rawId}`);
                                  }
                                } else if (weighbridgeUrl && doc.type === 'declarations') {
                                  if (weighbridgeUrl.startsWith('http')) { openUrl(weighbridgeUrl); }
                                  else {
                                    const opened = await openFromBucket('weighbridge-photos', weighbridgeUrl) || await openFromBucket('shipment-photos', weighbridgeUrl);
                                    if (!opened) navigate(`/dashboard/shipments/${rawId}`);
                                  }
                                } else if (disposalUrl) {
                                  if (disposalUrl.startsWith('http')) { openUrl(disposalUrl); }
                                  else {
                                    const opened = await openFromBucket('entity-documents', disposalUrl);
                                    if (!opened) navigate(`/dashboard/shipments/${rawId}`);
                                  }
                                } else {
                                  navigate(`/dashboard/shipments/${rawId}`);
                                }
                                break;
                              }
                              case 'invoices':
                                // Try invoice attachment
                                if (doc.rawData.attachment_url) {
                                  if (doc.rawData.attachment_url.startsWith('http')) {
                                    openUrl(doc.rawData.attachment_url);
                                  } else {
                                    const opened = await openFromBucket('pdf-documents', doc.rawData.attachment_url) 
                                      || await openFromBucket('entity-documents', doc.rawData.attachment_url);
                                    if (!opened) navigate('/dashboard/invoices');
                                  }
                                } else {
                                  navigate('/dashboard/invoices');
                                }
                                break;
                              case 'receipts':
                                navigate(`/dashboard/shipments/${doc.rawData.shipment_id}`);
                                break;
                              case 'certificates':
                                navigate(`/dashboard/shipments/${doc.rawData.shipment_id}`);
                                break;
                              case 'signing':
                                // Open attached file first
                                if (doc.rawData.document_file_url) {
                                  if (doc.rawData.document_file_url.startsWith('http')) {
                                    openUrl(doc.rawData.document_file_url);
                                  } else {
                                    const opened = await openFromBucket('entity-documents', doc.rawData.document_file_url);
                                    if (!opened) navigate('/dashboard/signing-status');
                                  }
                                } else {
                                  navigate('/dashboard/signing-status');
                                }
                                break;
                              case 'signatures':
                                navigate('/dashboard/signing-status');
                                break;
                              case 'contracts':
                                if (doc.rawData.attachment_url) {
                                  if (doc.rawData.attachment_url.startsWith('http')) {
                                    openUrl(doc.rawData.attachment_url);
                                  } else {
                                    const opened = await openFromBucket('entity-documents', doc.rawData.attachment_url);
                                    if (!opened) navigate('/dashboard/contracts');
                                  }
                                } else {
                                  navigate('/dashboard/contracts');
                                }
                                break;
                              case 'org_documents':
                                if (doc.rawData.file_url && doc.rawData.file_url.startsWith('http')) {
                                  openUrl(doc.rawData.file_url);
                                } else if (doc.rawData.file_path) {
                                  const opened = await openFromBucket('organization-documents', doc.rawData.file_path);
                                  if (!opened) toast.error('فشل في الحصول على رابط المستند');
                                } else if (doc.rawData.file_url) {
                                  const opened = await openFromBucket('organization-documents', doc.rawData.file_url);
                                  if (!opened) toast.error('فشل في الحصول على رابط المستند');
                                }
                                break;
                              case 'stored_pdfs':
                                if (doc.rawData.storagePath) {
                                  const opened = await openFromBucket('pdf-documents', doc.rawData.storagePath);
                                  if (!opened) toast.error('فشل في الحصول على رابط الملف');
                                }
                                break;
                              case 'entity_docs':
                                if (doc.rawData.file_url) {
                                  if (doc.rawData.file_url.startsWith('http')) {
                                    openUrl(doc.rawData.file_url);
                                  } else {
                                    const opened = await openFromBucket('entity-documents', doc.rawData.file_url);
                                    if (!opened) toast.error('فشل في الحصول على رابط الملف');
                                  }
                                }
                                break;
                              case 'print_log':
                                if (doc.rawData.file_url) {
                                  if (doc.rawData.file_url.startsWith('http')) {
                                    openUrl(doc.rawData.file_url);
                                  } else {
                                    const opened = await openFromBucket('pdf-documents', doc.rawData.file_url);
                                    if (!opened) toast.info('لا يوجد ملف مرتبط');
                                  }
                                } else if (doc.rawData.document_id) {
                                  // Try to navigate based on document_type
                                  const dt = doc.rawData.document_type?.toLowerCase();
                                  if (dt?.includes('shipment') || dt?.includes('شحن') || dt?.includes('manifest') || dt?.includes('مانيفست')) {
                                    navigate(`/dashboard/shipments/${doc.rawData.document_id}`);
                                  } else if (dt?.includes('invoice') || dt?.includes('فاتور')) {
                                    navigate('/dashboard/invoices');
                                  } else if (dt?.includes('contract') || dt?.includes('عقد')) {
                                    navigate('/dashboard/contracts');
                                  } else {
                                    toast.info('لا يوجد ملف مرتبط بهذا السجل');
                                  }
                                } else {
                                  toast.info('لا يوجد ملف مرتبط');
                                }
                                break;
                              default:
                                toast.info('لا يمكن عرض هذا المستند مباشرة');
                            }
                          } catch (err) {
                            console.error('View error:', err);
                            toast.error('حدث خطأ أثناء فتح المستند');
                          }
                        }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {/* Download button - generates signed URL or direct download */}
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="تحميل"
                        onClick={async () => {
                          try {
                            // Helper to try multiple buckets
                            const tryBuckets = async (path: string, buckets: string[]) => {
                              for (const bucket of buckets) {
                                const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
                                if (data?.signedUrl) { window.open(data.signedUrl, '_blank'); return true; }
                              }
                              return false;
                            };

                            // Direct file URLs
                            const directUrl = doc.rawData.attachment_url || doc.rawData.file_url || doc.rawData.manifest_pdf_url || doc.rawData.weighbridge_photo_url || doc.rawData.disposal_certificate_url;
                            if (directUrl && directUrl.startsWith('http')) {
                              window.open(directUrl, '_blank');
                              return;
                            }

                            // Shipment-related files
                            if (doc.type === 'manifests' && doc.rawData.manifest_pdf_url) {
                              const opened = await tryBuckets(doc.rawData.manifest_pdf_url, ['pdf-documents', 'shipment-photos', 'entity-documents']);
                              if (opened) return;
                            }
                            if (doc.type === 'declarations' && doc.rawData.weighbridge_photo_url) {
                              const opened = await tryBuckets(doc.rawData.weighbridge_photo_url, ['weighbridge-photos', 'shipment-photos']);
                              if (opened) return;
                            }
                            if (doc.rawData.disposal_certificate_url) {
                              const opened = await tryBuckets(doc.rawData.disposal_certificate_url, ['entity-documents', 'pdf-documents']);
                              if (opened) return;
                            }

                            // Storage bucket files
                            if (doc.rawData.storagePath) {
                              const opened = await tryBuckets(doc.rawData.storagePath, ['pdf-documents']);
                              if (opened) return;
                            }
                            // Entity documents bucket
                            if (doc.type === 'entity_docs' && doc.rawData.file_url) {
                              const opened = await tryBuckets(doc.rawData.file_url, ['entity-documents']);
                              if (opened) return;
                            }
                            // Org documents bucket
                            if (doc.type === 'org_documents' && (doc.rawData.file_path || doc.rawData.file_url)) {
                              const path = doc.rawData.file_path || doc.rawData.file_url;
                              const opened = await tryBuckets(path, ['organization-documents']);
                              if (opened) return;
                            }
                            // Signing request files
                            if (doc.type === 'signing' && doc.rawData.document_file_url) {
                              if (doc.rawData.document_file_url.startsWith('http')) {
                                window.open(doc.rawData.document_file_url, '_blank');
                                return;
                              }
                              const opened = await tryBuckets(doc.rawData.document_file_url, ['entity-documents']);
                              if (opened) return;
                            }
                            // Contracts
                            if (doc.type === 'contracts' && doc.rawData.attachment_url) {
                              const opened = await tryBuckets(doc.rawData.attachment_url, ['entity-documents', 'pdf-documents']);
                              if (opened) return;
                            }
                            // Invoices
                            if (doc.type === 'invoices' && doc.rawData.attachment_url) {
                              const opened = await tryBuckets(doc.rawData.attachment_url, ['pdf-documents', 'entity-documents']);
                              if (opened) return;
                            }
                            // Fallback: print as report
                            printSingle(doc);
                            toast.info('لا يوجد ملف مرفق - تم تجهيز تقرير للطباعة');
                          } catch (err) {
                            console.error('Download error:', err);
                            toast.error('فشل في تحميل المستند');
                          }
                        }}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>

                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printSingle(doc)} title="طباعة">
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrintCenter;
