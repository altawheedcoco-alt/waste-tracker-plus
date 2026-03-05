import { memo, useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Award, FileText, FileSignature, ClipboardList, Database, Scale,
  Search, Printer, PenTool, Loader2, Download, Eye, Filter,
  AlertTriangle, CheckCircle2, ExternalLink,
} from 'lucide-react';
import {
  regulatoryTemplates, getTemplatesForOrgType, getTemplatesByCategory,
  categoryLabels, type RegulatoryTemplate, type DocumentCategory, type TemplateField,
} from './regulatoryTemplates';

const categoryIcons: Record<DocumentCategory, typeof Award> = {
  certificates: Award,
  reports: FileText,
  contracts: FileSignature,
  tracking_forms: ClipboardList,
  registers: Database,
  regulatory: Scale,
};

interface Props {
  /** Override org type for consultant viewing client data */
  targetOrgType?: string;
}

const RegulatoryDocumentsCenter = memo(({ targetOrgType }: Props) => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'all' | DocumentCategory>('all');
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<RegulatoryTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const orgType = targetOrgType || (organization?.organization_type as string) || 'generator';

  const applicableTemplates = useMemo(() => {
    let templates = getTemplatesForOrgType(orgType);
    // Consultants and consulting offices see ALL templates
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

  const categorized = useMemo(() => getTemplatesByCategory(applicableTemplates), [applicableTemplates]);

  const handleOpenTemplate = (template: RegulatoryTemplate) => {
    setSelectedTemplate(template);
    // Pre-fill reference number and date
    const now = new Date();
    setFormData({
      reference_number: `REG-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      issue_date: now.toISOString().split('T')[0],
    });
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    // Validate required fields
    const missing = selectedTemplate.fields.filter(f => f.required && !formData[f.id]?.trim());
    if (missing.length > 0) {
      toast.error(`يرجى ملء الحقول المطلوبة: ${missing.map(f => f.label).join('، ')}`);
      return;
    }
    setGenerating(true);

    // Generate printable document
    setTimeout(() => {
      setGenerating(false);
      // Print the document
      if (printRef.current) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
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
              <div class="section">
                <h3>بيانات المستند</h3>
                ${selectedTemplate.fields
                  .filter(f => f.id !== 'reference_number' && f.id !== 'issue_date' && f.id !== 'notes')
                  .map(f => `
                    <div class="field-row">
                      <div class="field">
                        <label>${f.label}</label>
                        <div class="value">${formData[f.id] || '-'}</div>
                      </div>
                    </div>
                  `).join('')}
              </div>
              ${formData.notes ? `
                <div class="section">
                  <h3>ملاحظات</h3>
                  <div class="field"><div class="value">${formData.notes}</div></div>
                </div>
              ` : ''}
              <div class="signatures">
                ${selectedTemplate.required_signatories.map(s => {
                  const sigLabels: Record<string, string> = {
                    issuer: 'جهة الإصدار', generator: 'المولد', disposer: 'جهة التخلص',
                    transporter: 'الناقل', recycler: 'المدور', receiver: 'المستلم',
                    consultant: 'الاستشاري', organization: 'المنظمة', classifier: 'المصنف',
                    treater: 'جهة المعالجة', sender: 'المُرسل', client: 'العميل', applicant: 'مقدم الطلب',
                  };
                  return `
                    <div class="sig-box">
                      <div class="sig-label">${sigLabels[s] || s}</div>
                      <div class="sig-line">التوقيع والختم</div>
                    </div>
                  `;
                }).join('')}
              </div>
              ${selectedTemplate.legal_reference ? `
                <div class="legal-ref">
                  صادر وفقاً لأحكام ${selectedTemplate.legal_reference} — جمهورية مصر العربية<br/>
                  تم إنشاء هذا المستند عبر منصة iRecycle لإدارة المخلفات
                </div>
              ` : ''}
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 500);
        }
      }
      toast.success('تم إنشاء المستند بنجاح');

      // Navigate to signing inbox if multi-sign
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
        return (
          <Input
            type="date"
            value={value}
            onChange={e => handleFieldChange(field.id, e.target.value)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const totalByCategory = useMemo(() => {
    const all = orgType === 'consultant' || orgType === 'consulting_office'
      ? regulatoryTemplates
      : getTemplatesForOrgType(orgType);
    return getTemplatesByCategory(all);
  }, [orgType]);

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

      {/* Templates Grid */}
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
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handleOpenTemplate(template)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <CatIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm leading-tight">{template.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
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
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Document Generation Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {selectedTemplate && <categoryIcons.certificates className="w-5 h-5 text-primary" />}
              {selectedTemplate?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
              {selectedTemplate?.legal_reference && (
                <span className="block text-xs mt-1 text-primary">
                  📜 {selectedTemplate.legal_reference}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-2">
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

              {selectedTemplate?.fields.map(field => (
                <div key={field.id} className="space-y-1.5">
                  <Label className="text-sm">
                    {field.label}
                    {field.required && <span className="text-destructive mr-1">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Button onClick={handleGenerate} disabled={generating} className="flex-1 gap-2">
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              إنشاء وطباعة المستند
            </Button>
            {selectedTemplate?.requires_multi_sign && (
              <Button variant="outline" size="sm" onClick={() => {
                handleGenerate();
                navigate('/dashboard/signing-inbox');
              }} className="gap-1.5">
                <PenTool className="w-4 h-4" />إرسال للتوقيع
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden print container */}
      <div ref={printRef} className="hidden" />
    </div>
  );
});

RegulatoryDocumentsCenter.displayName = 'RegulatoryDocumentsCenter';
export default RegulatoryDocumentsCenter;
