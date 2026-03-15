import { memo, useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Award, FileText, FileSignature, ClipboardList, Database as DbIcon, Scale,
  Search, Printer, PenTool, Loader2, Download, Eye, Filter,
  AlertTriangle, CheckCircle2, ChevronDown, Zap, Shield, Clock,
  FileWarning, Paperclip, Link2, RefreshCw, ArrowLeft,
} from 'lucide-react';
import {
  regulatoryTemplates, getTemplatesForOrgType, getTemplatesByCategory,
  categoryLabels, type RegulatoryTemplate, type DocumentCategory, type TemplateField, type TemplateSection,
} from './regulatoryTemplates';

const categoryIcons: Record<DocumentCategory, typeof Award> = {
  certificates: Award,
  reports: FileText,
  contracts: FileSignature,
  tracking_forms: ClipboardList,
  registers: DbIcon,
  regulatory: Scale,
};

const importanceColors: Record<string, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
  high: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/30',
  medium: 'bg-primary/10 text-primary border-primary/30',
  low: 'bg-muted text-muted-foreground border-border',
};

const importanceLabels: Record<string, string> = {
  critical: 'حرج',
  high: 'مهم',
  medium: 'متوسط',
  low: 'منخفض',
};

interface Props {
  targetOrgType?: string;
}

const RegulatoryDocumentsCenter = memo(({ targetOrgType }: Props) => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'all' | DocumentCategory>('all');
  const [search, setSearch] = useState('');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<RegulatoryTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [loadingSystemData, setLoadingSystemData] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const orgType = targetOrgType || (organization?.organization_type as string) || 'generator';

  const applicableTemplates = useMemo(() => {
    let templates = getTemplatesForOrgType(orgType);
    if (orgType === 'consultant' || orgType === 'consulting_office') {
      templates = regulatoryTemplates;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      templates = templates.filter(t =>
        t.title.includes(q) || t.title_en.toLowerCase().includes(q) || t.description.includes(q)
      );
    }
    if (activeCategory !== 'all') {
      templates = templates.filter(t => t.category === activeCategory);
    }
    return templates;
  }, [orgType, search, activeCategory]);

  const totalByCategory = useMemo(() => {
    const all = orgType === 'consultant' || orgType === 'consulting_office'
      ? regulatoryTemplates
      : getTemplatesForOrgType(orgType);
    return getTemplatesByCategory(all);
  }, [orgType]);

  const handleOpenTemplate = (template: RegulatoryTemplate) => {
    setSelectedTemplate(template);
    const now = new Date();
    setFormData({
      reference_number: `REG-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      issue_date: now.toISOString().split('T')[0],
    });
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  // Auto-fill from system data
  const handleAutoFill = useCallback(async (template: RegulatoryTemplate) => {
    if (!organization?.id) {
      toast.error('يرجى تسجيل الدخول أولاً');
      return;
    }
    setLoadingSystemData(true);
    try {
      const autoData: Record<string, string> = {};

      // Get organization data
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name, email, phone, address, city, representative_name, commercial_register, environmental_license')
        .eq('id', organization.id)
        .maybeSingle();

      if (orgData) {
        const allFields = template.sections
          ? template.sections.flatMap(s => s.fields)
          : template.fields;

        allFields.forEach(field => {
          if (field.systemSource === 'organization' && field.systemField && orgData) {
            const val = (orgData as any)[field.systemField];
            if (val) autoData[field.id] = String(val);
          }
        });
      }

      // Get latest shipment data if relevant
      const shipmentFields = (template.sections
        ? template.sections.flatMap(s => s.fields)
        : template.fields
      ).filter(f => f.systemSource === 'shipment');

      if (shipmentFields.length > 0) {
        const { data: shipments } = await supabase
          .from('shipments')
          .select('shipment_number, waste_type, waste_description, quantity, unit, pickup_address, delivery_address, driver_id')
          .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (shipments?.[0]) {
          const s = shipments[0];
          shipmentFields.forEach(field => {
            if (field.systemField === 'shipment_number' && s.shipment_number) autoData[field.id] = s.shipment_number;
            if (field.systemField === 'pickup_address' && s.pickup_address) autoData[field.id] = s.pickup_address;
            if (field.systemField === 'delivery_address' && s.delivery_address) autoData[field.id] = s.delivery_address;
            if (field.systemField === 'quantity' && s.quantity) autoData[field.id] = String(s.quantity);
            if (field.systemField === 'total_quantity' && s.quantity) autoData[field.id] = String(s.quantity);
          });

          // Get driver data if needed
          if (s.driver_id) {
            const driverFields = (template.sections
              ? template.sections.flatMap(sec => sec.fields)
              : template.fields
            ).filter(f => f.systemSource === 'driver');

            if (driverFields.length > 0) {
              const { data: driverData } = await supabase
                .from('drivers')
                .select('license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone)')
                .eq('id', s.driver_id)
                .maybeSingle();

              if (driverData) {
                const profile = Array.isArray(driverData.profile) ? driverData.profile[0] : driverData.profile;
                driverFields.forEach(field => {
                  if (field.systemField === 'vehicle_plate' && driverData.vehicle_plate) autoData[field.id] = driverData.vehicle_plate;
                  if (field.systemField === 'license_number' && driverData.license_number) autoData[field.id] = driverData.license_number;
                  if (field.systemField === 'profile.full_name' && profile?.full_name) autoData[field.id] = profile.full_name;
                });
              }
            }
          }
        }
      }

      // Get partner data
      const partnerFields = (template.sections
        ? template.sections.flatMap(s => s.fields)
        : template.fields
      ).filter(f => f.systemSource === 'partner');

      if (partnerFields.length > 0) {
        const { data: contracts } = await supabase
          .from('contracts')
          .select('partner_organization_id')
          .eq('organization_id', organization.id)
          .eq('status', 'active')
          .limit(1);

        if (contracts?.[0]?.partner_organization_id) {
          const { data: partnerOrg } = await supabase
            .from('organizations')
            .select('name, address, phone, email, representative_name')
            .eq('id', contracts[0].partner_organization_id)
            .maybeSingle();

          if (partnerOrg) {
            // Fill first partner field found per systemField
            const filled = new Set<string>();
            partnerFields.forEach(field => {
              if (field.systemField && !filled.has(field.systemField)) {
                const val = (partnerOrg as any)[field.systemField];
                if (val) {
                  autoData[field.id] = String(val);
                  filled.add(field.systemField);
                }
              }
            });
          }
        }
      }

      const filledCount = Object.keys(autoData).length;
      if (filledCount > 0) {
        setFormData(prev => ({ ...prev, ...autoData }));
        toast.success(`تم ملء ${filledCount} حقل تلقائياً من بيانات النظام`);
      } else {
        toast.info('لا توجد بيانات متاحة للملء التلقائي');
      }
    } catch (err) {
      console.error('Auto-fill error:', err);
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoadingSystemData(false);
    }
  }, [organization?.id]);

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    const allFields = selectedTemplate.sections
      ? selectedTemplate.sections.flatMap(s => s.fields)
      : selectedTemplate.fields;
    const missing = allFields.filter(f => f.required && !formData[f.id]?.trim());
    if (missing.length > 0) {
      toast.error(`يرجى ملء الحقول المطلوبة: ${missing.map(f => f.label).join('، ')}`);
      return;
    }
    setGenerating(true);

    setTimeout(() => {
      setGenerating(false);
      if (printRef.current) {
          const fieldsToRender = selectedTemplate.sections
            ? selectedTemplate.sections.flatMap(s => s.fields)
            : selectedTemplate.fields;

          const sectionsHtml = selectedTemplate.sections
            ? selectedTemplate.sections.map(section => `
              <div class="section">
                <h3>${section.icon || ''} ${section.title}</h3>
                ${section.fields
                  .filter(f => f.id !== 'reference_number' && f.id !== 'issue_date')
                  .map(f => `
                    <div class="field-row">
                      <div class="field">
                        <label>${f.label}</label>
                        <div class="value">${formData[f.id] || '-'}</div>
                      </div>
                    </div>
                  `).join('')}
              </div>
            `).join('')
            : `<div class="section"><h3>بيانات المستند</h3>
                ${fieldsToRender
                  .filter(f => f.id !== 'reference_number' && f.id !== 'issue_date' && f.id !== 'notes')
                  .map(f => `
                    <div class="field-row">
                      <div class="field">
                        <label>${f.label}</label>
                        <div class="value">${formData[f.id] || '-'}</div>
                      </div>
                    </div>
                  `).join('')}
              </div>`;

          const sigLabels: Record<string, string> = {
            issuer: 'جهة الإصدار', generator: 'المولد', disposer: 'جهة التخلص',
            transporter: 'الناقل', recycler: 'المدور', receiver: 'المستلم',
            consultant: 'الاستشاري', organization: 'المنظمة', classifier: 'المصنف',
            treater: 'جهة المعالجة', sender: 'المُرسل', client: 'العميل', applicant: 'مقدم الطلب',
          };

          const htmlContent = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
              <meta charset="utf-8">
              <title>${selectedTemplate.title}</title>
              <style>
                @page { size: A4; margin: 20mm; }
                body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; padding: 0; margin: 0; color: #1a1a1a; font-size: 13px; line-height: 1.7; }
                .header { text-align: center; border-bottom: 3px double #1a5632; padding-bottom: 20px; margin-bottom: 24px; }
                .header h1 { font-size: 22px; color: #1a5632; margin: 0 0 4px; }
                .header h2 { font-size: 15px; color: #555; margin: 0; font-weight: normal; }
                .meta { display: flex; justify-content: space-between; background: #f8f9fa; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; }
                .meta span { display: block; }
                .section { margin-bottom: 18px; }
                .section h3 { font-size: 14px; color: #1a5632; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; margin-bottom: 10px; }
                .field-row { display: flex; gap: 12px; margin-bottom: 8px; }
                .field { flex: 1; }
                .field label { font-size: 11px; color: #777; display: block; margin-bottom: 2px; }
                .field .value { padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; min-height: 28px; background: #fff; font-size: 13px; }
                .signatures { display: flex; gap: 30px; margin-top: 40px; padding-top: 20px; border-top: 2px solid #1a5632; }
                .sig-box { flex: 1; text-align: center; }
                .sig-box .sig-label { font-size: 12px; font-weight: bold; color: #1a5632; margin-bottom: 40px; }
                .sig-box .sig-line { border-top: 1px solid #333; padding-top: 4px; font-size: 11px; color: #777; }
                .legal-ref { font-size: 10px; color: #999; text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px dotted #ddd; }
                .org-info { text-align: center; font-size: 11px; color: #666; margin-bottom: 8px; }
                .badge { display: inline-block; background: #1a5632; color: white; padding: 2px 10px; border-radius: 12px; font-size: 10px; margin-top: 4px; }
                .multi-sign-notice { background: #fff3cd; border: 1px solid #ffc107; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #856404; margin-bottom: 16px; text-align: center; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="org-info">${organization?.name || ''}</div>
                <h1>${selectedTemplate.title}</h1>
                <h2>${selectedTemplate.title_en}</h2>
                <span class="badge">${categoryLabels[selectedTemplate.category].ar}</span>
              </div>
              <div class="meta">
                <span><strong>رقم المرجع:</strong> ${formData.reference_number || '-'}</span>
                <span><strong>تاريخ الإصدار:</strong> ${formData.issue_date || '-'}</span>
                ${selectedTemplate.legal_reference ? `<span><strong>المرجع القانوني:</strong> ${selectedTemplate.legal_reference}</span>` : ''}
              </div>
              ${selectedTemplate.requires_multi_sign ? '<div class="multi-sign-notice">⚠️ هذا المستند يتطلب توقيع جميع الأطراف المعنية ليصبح ساري المفعول</div>' : ''}
              ${sectionsHtml}
              ${formData.notes ? `<div class="section"><h3>ملاحظات</h3><div class="field"><div class="value">${formData.notes}</div></div></div>` : ''}
              <div class="signatures">
                ${selectedTemplate.required_signatories.map(s => `
                  <div class="sig-box">
                    <div class="sig-label">${sigLabels[s] || s}</div>
                    <div class="sig-line">التوقيع والختم</div>
                  </div>
                `).join('')}
              </div>
              ${selectedTemplate.legal_reference ? `
                <div class="legal-ref">
                  صادر وفقاً لأحكام ${selectedTemplate.legal_reference} — جمهورية مصر العربية<br/>
                  تم إنشاء هذا المستند عبر منصة iRecycle لإدارة المخلفات
                </div>
              ` : ''}
            </body>
            </html>
          `;
          import('@/services/documentService').then(({ PrintService }) => {
            PrintService.printHTML(htmlContent, { title: selectedTemplate.title });
          });
      }
      toast.success('تم إنشاء المستند بنجاح');
      if (selectedTemplate.requires_multi_sign) {
        toast.info('يمكنك إرسال المستند للتوقيع من صندوق التوقيعات', {
          action: {
            label: 'صندوق التوقيع',
            onClick: () => navigate('/dashboard/signing-inbox'),
          },
        });
      }
    }, 800);
  };

  const renderField = (field: TemplateField) => {
    const value = formData[field.id] || '';
    const hasSystemSource = !!field.systemSource;

    const fieldInput = (() => {
      switch (field.type) {
        case 'select':
          return (
            <Select value={value} onValueChange={v => handleFieldChange(field.id, v)}>
              <SelectTrigger><SelectValue placeholder={`اختر ${field.label}`} /></SelectTrigger>
              <SelectContent>
                {field.options?.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case 'textarea':
          return (
            <Textarea
              value={value}
              onChange={e => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="min-h-[80px] resize-none"
            />
          );
        case 'date':
          return <Input type="date" value={value} onChange={e => handleFieldChange(field.id, e.target.value)} />;
        case 'number':
          return <Input type="number" value={value} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} />;
        default:
          return <Input value={value} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} />;
      }
    })();

    return (
      <div className="relative">
        {fieldInput}
        {hasSystemSource && value && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="absolute top-1/2 -translate-y-1/2 left-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
            </TooltipTrigger>
            <TooltipContent>تم ملء هذا الحقل من النظام</TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" />
            مركز المستندات التنظيمية والبيئية
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            إصدار الشهادات والتقارير والعقود والسجلات وفقاً للقوانين البيئية المصرية
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/signing-inbox')} className="gap-1.5">
            <PenTool className="w-4 h-4" />صندوق التوقيعات
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/document-center')} className="gap-1.5">
            <FileText className="w-4 h-4" />مركز المستندات
          </Button>
        </div>
      </div>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(categoryLabels) as DocumentCategory[]).map(cat => {
          const Icon = categoryIcons[cat];
          const count = totalByCategory[cat]?.length || 0;
          if (count === 0) return null;
          return (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveCategory(activeCategory === cat ? 'all' : cat)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                activeCategory === cat 
                  ? 'border-primary bg-primary/10 shadow-sm' 
                  : 'border-border hover:border-primary/30 bg-card'
              }`}
            >
              <Icon className={`w-6 h-6 ${activeCategory === cat ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-xs font-medium">{categoryLabels[cat].ar}</span>
              <Badge variant="secondary" className="text-[10px]">{count} نموذج</Badge>
            </motion.button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث عن مستند... (شهادة، تقرير، عقد، مانيفيست، سجل...)"
          className="pr-10"
        />
      </div>

      {/* Templates Grid — Expandable Cards */}
      {applicableTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">لا توجد نماذج مطابقة للبحث</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applicableTemplates.map(template => {
            const CatIcon = categoryIcons[template.category];
            const isExpanded = expandedTemplate === template.id;

            return (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={isExpanded ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''}
              >
                <Card className={`h-full transition-shadow ${isExpanded ? 'shadow-lg border-primary/30' : 'hover:shadow-md'}`}>
                  <CardContent className="p-0">
                    {/* Card Header - Always visible */}
                    <div
                      className="p-4 cursor-pointer group"
                      onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <CatIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm leading-tight">{template.title}</h4>
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                        </motion.div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-3">
                        <Badge variant="outline" className="text-[9px]">
                          {categoryLabels[template.category].ar}
                        </Badge>
                        {template.requires_multi_sign && (
                          <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 dark:text-amber-300">
                            <PenTool className="w-2.5 h-2.5 ml-0.5" />متعدد التوقيع
                          </Badge>
                        )}
                        {template.legal_reference && (
                          <Badge variant="secondary" className="text-[9px]">
                            {template.legal_reference.split(' - ')[0]}
                          </Badge>
                        )}
                        {template.importance && (
                          <Badge className={`text-[9px] border ${importanceColors[template.importance]}`} variant="outline">
                            {importanceLabels[template.importance]}
                          </Badge>
                        )}
                        {template.renewal_period && (
                          <Badge variant="outline" className="text-[9px] gap-0.5">
                            <Clock className="w-2.5 h-2.5" />{template.renewal_period}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-4">
                            {/* Detailed Description */}
                            {template.detailed_description && (
                              <div className="rounded-xl bg-muted/30 p-3 text-sm text-muted-foreground leading-relaxed">
                                {template.detailed_description}
                              </div>
                            )}

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {/* Legal Articles */}
                              {template.legal_articles && template.legal_articles.length > 0 && (
                                <div className="rounded-xl border border-border/50 p-3 space-y-2">
                                  <h5 className="text-xs font-bold flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-primary" />المواد القانونية
                                  </h5>
                                  {template.legal_articles.map((art, i) => (
                                    <div key={i} className="text-[11px] text-muted-foreground">
                                      <span className="font-semibold text-foreground">{art.article}:</span>{' '}
                                      {art.summary}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Penalty Note */}
                              {template.penalty_note && (
                                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 space-y-1">
                                  <h5 className="text-xs font-bold flex items-center gap-1.5 text-destructive">
                                    <AlertTriangle className="w-3.5 h-3.5" />عقوبة المخالفة
                                  </h5>
                                  <p className="text-[11px] text-muted-foreground">{template.penalty_note}</p>
                                </div>
                              )}

                              {/* Required Attachments */}
                              {template.required_attachments && template.required_attachments.length > 0 && (
                                <div className="rounded-xl border border-border/50 p-3 space-y-2">
                                  <h5 className="text-xs font-bold flex items-center gap-1.5">
                                    <Paperclip className="w-3.5 h-3.5 text-primary" />المرفقات المطلوبة
                                  </h5>
                                  {template.required_attachments.map((att, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                      {att}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Related Templates */}
                              {template.related_templates && template.related_templates.length > 0 && (
                                <div className="rounded-xl border border-border/50 p-3 space-y-2">
                                  <h5 className="text-xs font-bold flex items-center gap-1.5">
                                    <Link2 className="w-3.5 h-3.5 text-primary" />مستندات ذات صلة
                                  </h5>
                                  {template.related_templates.map((relId) => {
                                    const rel = regulatoryTemplates.find(t => t.id === relId);
                                    return rel ? (
                                      <button
                                        key={relId}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedTemplate(relId);
                                        }}
                                        className="flex items-center gap-1.5 text-[11px] text-primary hover:underline"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                        {rel.title}
                                      </button>
                                    ) : null;
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Sections Preview */}
                            {template.sections && template.sections.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-foreground">أقسام المستند ({template.sections.length} أقسام — {template.sections.reduce((sum, s) => sum + s.fields.length, 0)} حقل)</h5>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {template.sections.map(section => (
                                    <div key={section.id} className="rounded-lg bg-muted/30 border border-border/30 p-2.5 space-y-1">
                                      <div className="text-xs font-semibold flex items-center gap-1.5">
                                        {section.icon && <span>{section.icon}</span>}
                                        {section.title}
                                      </div>
                                      <div className="text-[10px] text-muted-foreground">
                                        {section.fields.length} حقل
                                        {section.fields.some(f => f.systemSource) && (
                                          <span className="text-primary mr-1">• ملء تلقائي</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Signatories */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold">التوقيعات المطلوبة:</span>
                              {template.required_signatories.map(s => {
                                const labels: Record<string, string> = {
                                  issuer: 'جهة الإصدار', generator: 'المولد', disposer: 'جهة التخلص',
                                  transporter: 'الناقل', recycler: 'المدور', receiver: 'المستلم',
                                  consultant: 'الاستشاري', organization: 'المنظمة', classifier: 'المصنف',
                                  treater: 'جهة المعالجة', sender: 'المُرسل', client: 'العميل', applicant: 'مقدم الطلب',
                                };
                                return (
                                  <Badge key={s} variant="outline" className="text-[10px] gap-1">
                                    <PenTool className="w-2.5 h-2.5" />{labels[s] || s}
                                  </Badge>
                                );
                              })}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-2">
                              <Button size="sm" className="gap-1.5" onClick={(e) => { e.stopPropagation(); handleOpenTemplate(template); }}>
                                <FileText className="w-4 h-4" />فتح النموذج وتعبئته
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1.5" onClick={(e) => { e.stopPropagation(); handleOpenTemplate(template); setTimeout(() => handleAutoFill(template), 300); }}>
                                <Zap className="w-4 h-4" />ملء تلقائي من النظام
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Document Generation Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {selectedTemplate && (() => { const Icon = categoryIcons[selectedTemplate.category]; return <Icon className="w-5 h-5 text-primary" />; })()}
              {selectedTemplate?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
              {selectedTemplate?.legal_reference && (
                <span className="block text-xs mt-1 text-primary">📜 {selectedTemplate.legal_reference}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Auto-fill button */}
          {selectedTemplate && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleAutoFill(selectedTemplate)}
                disabled={loadingSystemData}
              >
                {loadingSystemData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                ملء تلقائي من النظام
              </Button>
              <span className="text-[10px] text-muted-foreground">سيتم جلب بيانات المنشأة والشحنات والشركاء تلقائياً</span>
            </div>
          )}

          <ScrollArea className="max-h-[55vh] pr-2">
            <div className="space-y-4 py-2">
              {selectedTemplate?.requires_multi_sign && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">مستند متعدد التوقيع</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      يتطلب توقيع: {selectedTemplate.required_signatories.map(s => {
                        const labels: Record<string, string> = {
                          issuer: 'جهة الإصدار', generator: 'المولد', disposer: 'جهة التخلص',
                          transporter: 'الناقل', recycler: 'المدور', receiver: 'المستلم',
                          consultant: 'الاستشاري', organization: 'المنظمة', classifier: 'المصنف',
                          treater: 'جهة المعالجة', sender: 'المُرسل', client: 'العميل', applicant: 'مقدم الطلب',
                        };
                        return labels[s] || s;
                      }).join(' ← ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Render by sections if available, otherwise flat */}
              {selectedTemplate?.sections ? (
                <Accordion type="multiple" defaultValue={selectedTemplate.sections.map(s => s.id)} className="space-y-2">
                  {selectedTemplate.sections.map(section => (
                    <AccordionItem key={section.id} value={section.id} className="border rounded-xl px-4 bg-card">
                      <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
                        <span className="flex items-center gap-2">
                          {section.icon && <span>{section.icon}</span>}
                          {section.title}
                          <Badge variant="secondary" className="text-[9px] mr-2">{section.fields.length} حقل</Badge>
                          {section.fields.some(f => f.systemSource) && (
                            <Badge variant="outline" className="text-[9px] text-primary border-primary/30 gap-0.5">
                              <Zap className="w-2.5 h-2.5" />ملء تلقائي
                            </Badge>
                          )}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 space-y-3">
                        {section.fields.map(field => (
                          <div key={field.id} className="space-y-1.5">
                            <Label className="text-sm flex items-center gap-1.5">
                              {field.label}
                              {field.required && <span className="text-destructive">*</span>}
                              {field.systemSource && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Zap className="w-3 h-3 text-primary" />
                                  </TooltipTrigger>
                                  <TooltipContent>يمكن ملء هذا الحقل تلقائياً من بيانات النظام</TooltipContent>
                                </Tooltip>
                              )}
                            </Label>
                            {renderField(field)}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                selectedTemplate?.fields.map(field => (
                  <div key={field.id} className="space-y-1.5">
                    <Label className="text-sm flex items-center gap-1.5">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                      {field.systemSource && <Zap className="w-3 h-3 text-primary" />}
                    </Label>
                    {renderField(field)}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Button onClick={handleGenerate} disabled={generating} className="flex-1 gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              إنشاء وطباعة المستند
            </Button>
            {selectedTemplate?.requires_multi_sign && (
              <Button variant="outline" size="sm" onClick={() => { handleGenerate(); navigate('/dashboard/signing-inbox'); }} className="gap-1.5">
                <PenTool className="w-4 h-4" />إرسال للتوقيع
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div ref={printRef} className="hidden" />
    </div>
  );
});

RegulatoryDocumentsCenter.displayName = 'RegulatoryDocumentsCenter';
export default RegulatoryDocumentsCenter;
