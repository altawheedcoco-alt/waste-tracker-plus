import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Building2, 
  Recycle,
  Search,
  Trash2,
  Edit,
  Eye,
  Loader2,
  Copy,
  FileSignature,
  Stamp,
  Image as ImageIcon,
  Users,
  Download,
  Sparkles
} from 'lucide-react';
import { allGeneratorTemplates, allRecyclerTemplates } from '@/data/contractTemplatesData';
import { 
  useContractTemplates, 
  ContractTemplate, 
  CreateContractTemplateInput,
  partnerTypeLabels,
  contractCategoryLabels 
} from '@/hooks/useContractTemplates';

const ContractTemplates = () => {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate, fetchTemplates } = useContractTemplates();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const [formData, setFormData] = useState<CreateContractTemplateInput>({
    name: '',
    description: '',
    partner_type: 'generator',
    contract_category: 'collection_transport',
    header_text: '',
    introduction_text: '',
    terms_template: '',
    obligations_party_one: '',
    obligations_party_two: '',
    payment_terms_template: '',
    duration_clause: '',
    termination_clause: '',
    dispute_resolution: '',
    closing_text: '',
    include_stamp: true,
    include_signature: true,
    include_header_logo: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      partner_type: 'generator',
      contract_category: 'collection_transport',
      header_text: '',
      introduction_text: '',
      terms_template: '',
      obligations_party_one: '',
      obligations_party_two: '',
      payment_terms_template: '',
      duration_clause: '',
      termination_clause: '',
      dispute_resolution: '',
      closing_text: '',
      include_stamp: true,
      include_signature: true,
      include_header_logo: true,
    });
    setSelectedTemplate(null);
    setIsEditing(false);
  };

  const handleEdit = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      partner_type: template.partner_type,
      contract_category: template.contract_category,
      header_text: template.header_text || '',
      introduction_text: template.introduction_text || '',
      terms_template: template.terms_template || '',
      obligations_party_one: template.obligations_party_one || '',
      obligations_party_two: template.obligations_party_two || '',
      payment_terms_template: template.payment_terms_template || '',
      duration_clause: template.duration_clause || '',
      termination_clause: template.termination_clause || '',
      dispute_resolution: template.dispute_resolution || '',
      closing_text: template.closing_text || '',
      include_stamp: template.include_stamp,
      include_signature: template.include_signature,
      include_header_logo: template.include_header_logo,
    });
    setIsEditing(true);
    setShowCreateDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم القالب');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && selectedTemplate) {
        await updateTemplate(selectedTemplate.id, formData);
      } else {
        await createTemplate(formData);
      }
      setShowCreateDialog(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return;
    await deleteTemplate(id);
  };

  const handleDuplicate = (template: ContractTemplate) => {
    setFormData({
      name: template.name + ' (نسخة)',
      description: template.description || '',
      partner_type: template.partner_type,
      contract_category: template.contract_category,
      header_text: template.header_text || '',
      introduction_text: template.introduction_text || '',
      terms_template: template.terms_template || '',
      obligations_party_one: template.obligations_party_one || '',
      obligations_party_two: template.obligations_party_two || '',
      payment_terms_template: template.payment_terms_template || '',
      duration_clause: template.duration_clause || '',
      termination_clause: template.termination_clause || '',
      dispute_resolution: template.dispute_resolution || '',
      closing_text: template.closing_text || '',
      include_stamp: template.include_stamp,
      include_signature: template.include_signature,
      include_header_logo: template.include_header_logo,
    });
    setIsEditing(false);
    setSelectedTemplate(null);
    setShowCreateDialog(true);
  };

  // Import pre-built templates
  const handleImportTemplates = async (type: 'generator' | 'recycler' | 'all') => {
    setImporting(true);
    setImportProgress(0);
    
    try {
      const templatesToImport = type === 'generator' 
        ? allGeneratorTemplates 
        : type === 'recycler' 
          ? allRecyclerTemplates 
          : [...allGeneratorTemplates, ...allRecyclerTemplates];
      
      const total = templatesToImport.length;
      let imported = 0;
      
      for (const template of templatesToImport) {
        await createTemplate({
          name: template.name,
          description: template.description,
          partner_type: template.partner_type,
          contract_category: template.contract_category,
          header_text: template.header_text,
          introduction_text: template.introduction_text,
          terms_template: template.terms_template,
          obligations_party_one: template.obligations_party_one,
          obligations_party_two: template.obligations_party_two,
          payment_terms_template: template.payment_terms_template,
          duration_clause: template.duration_clause,
          termination_clause: template.termination_clause,
          dispute_resolution: template.dispute_resolution,
          closing_text: template.closing_text,
          include_stamp: true,
          include_signature: true,
          include_header_logo: true,
        });
        imported++;
        setImportProgress(Math.round((imported / total) * 100));
      }
      
      toast.success(`تم استيراد ${imported} قالب بنجاح`);
      setShowImportDialog(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error importing templates:', error);
      toast.error('حدث خطأ أثناء استيراد القوالب');
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  // Filter templates by partner type
  const generatorTemplates = templates.filter(t => t.partner_type === 'generator' || t.partner_type === 'both');
  const recyclerTemplates = templates.filter(t => t.partner_type === 'recycler' || t.partner_type === 'both');

  const filterTemplates = (list: ContractTemplate[]) => {
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  };

  const TemplateCard = ({ template }: { template: ContractTemplate }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant={template.template_type === 'system' ? 'secondary' : 'default'}>
                  {template.template_type === 'system' ? 'نظام' : 'مخصص'}
                </Badge>
                <Badge variant="outline">
                  {contractCategoryLabels[template.contract_category]}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  {template.partner_type === 'generator' ? (
                    <Building2 className="w-3 h-3" />
                  ) : template.partner_type === 'recycler' ? (
                    <Recycle className="w-3 h-3" />
                  ) : (
                    <Users className="w-3 h-3" />
                  )}
                  {partnerTypeLabels[template.partner_type]}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg truncate">{template.name}</h3>
              {template.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{template.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {template.include_stamp && (
                  <span className="flex items-center gap-1">
                    <Stamp className="w-3 h-3" /> ختم
                  </span>
                )}
                {template.include_signature && (
                  <span className="flex items-center gap-1">
                    <FileSignature className="w-3 h-3" /> توقيع
                  </span>
                )}
                {template.include_header_logo && (
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> شعار
                  </span>
                )}
                <span>استخدام: {template.usage_count}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowViewDialog(true);
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleDuplicate(template)}
              >
                <Copy className="w-4 h-4" />
              </Button>
              {template.template_type === 'custom' && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const TemplatesList = ({ templates: list, emptyMessage }: { templates: ContractTemplate[]; emptyMessage: string }) => {
    const filtered = filterTemplates(list);
    
    if (filtered.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filtered.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-right">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              قوالب العقود
            </h1>
            <p className="text-muted-foreground">إنشاء وإدارة صيغ عقود الجمع والنقل ({allGeneratorTemplates.length + allRecyclerTemplates.length} قالب جاهز)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)} className="gap-2">
              <Download className="w-4 h-4" />
              استيراد قوالب جاهزة
            </Button>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} className="gap-2">
              <Plus className="w-4 h-4" />
              إنشاء قالب جديد
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي القوالب</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">عقود المولدات</p>
                  <p className="text-2xl font-bold text-primary">{generatorTemplates.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">عقود المدورات</p>
                  <p className="text-2xl font-bold text-primary">{recyclerTemplates.length}</p>
                </div>
                <Recycle className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في القوالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="generators" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generators" className="gap-1">
              <Building2 className="w-4 h-4" />
              عقود الجهات المولدة ({generatorTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="recyclers" className="gap-1">
              <Recycle className="w-4 h-4" />
              عقود جهات التدوير ({recyclerTemplates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generators" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <TemplatesList 
                templates={generatorTemplates} 
                emptyMessage="لا توجد قوالب لعقود الجهات المولدة" 
              />
            )}
          </TabsContent>

          <TabsContent value="recyclers" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <TemplatesList 
                templates={recyclerTemplates} 
                emptyMessage="لا توجد قوالب لعقود جهات التدوير" 
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                {isEditing ? 'تعديل قالب العقد' : 'إنشاء قالب عقد جديد'}
              </DialogTitle>
              <DialogDescription>
                أنشئ صيغة عقد جديدة لاستخدامها مع الشركاء
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[60vh] px-1">
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-medium border-b pb-2">المعلومات الأساسية</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم القالب *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="مثال: عقد جمع النفايات الصناعية"
                        dir="rtl"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>نوع الشريك</Label>
                      <Select
                        value={formData.partner_type}
                        onValueChange={(value: any) => setFormData({ ...formData, partner_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="generator">جهات مولدة</SelectItem>
                          <SelectItem value="recycler">جهات تدوير</SelectItem>
                          <SelectItem value="both">جميع الجهات</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>تصنيف العقد</Label>
                      <Select
                        value={formData.contract_category}
                        onValueChange={(value: any) => setFormData({ ...formData, contract_category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="collection">عقد جمع</SelectItem>
                          <SelectItem value="transport">عقد نقل</SelectItem>
                          <SelectItem value="collection_transport">عقد جمع ونقل</SelectItem>
                          <SelectItem value="recycling">عقد تدوير</SelectItem>
                          <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>وصف القالب</Label>
                      <Input
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="وصف مختصر للقالب..."
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contract Content */}
                <div className="space-y-4">
                  <h4 className="font-medium border-b pb-2">محتوى العقد</h4>

                  <div className="space-y-2">
                    <Label>ترويسة العقد</Label>
                    <Textarea
                      value={formData.header_text || ''}
                      onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
                      placeholder="عنوان وترويسة العقد الرسمية..."
                      className="min-h-[60px]"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>المقدمة والتمهيد</Label>
                    <Textarea
                      value={formData.introduction_text || ''}
                      onChange={(e) => setFormData({ ...formData, introduction_text: e.target.value })}
                      placeholder="تمهيد العقد وبيان أطرافه..."
                      className="min-h-[80px]"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>البنود والشروط العامة</Label>
                    <Textarea
                      value={formData.terms_template || ''}
                      onChange={(e) => setFormData({ ...formData, terms_template: e.target.value })}
                      placeholder="البنود والشروط العامة للعقد..."
                      className="min-h-[100px]"
                      dir="rtl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>التزامات الطرف الأول (الناقل)</Label>
                      <Textarea
                        value={formData.obligations_party_one || ''}
                        onChange={(e) => setFormData({ ...formData, obligations_party_one: e.target.value })}
                        placeholder="التزامات شركة النقل..."
                        className="min-h-[100px]"
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>التزامات الطرف الثاني (الشريك)</Label>
                      <Textarea
                        value={formData.obligations_party_two || ''}
                        onChange={(e) => setFormData({ ...formData, obligations_party_two: e.target.value })}
                        placeholder="التزامات الطرف الآخر..."
                        className="min-h-[100px]"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>شروط الدفع والمقابل المادي</Label>
                    <Textarea
                      value={formData.payment_terms_template || ''}
                      onChange={(e) => setFormData({ ...formData, payment_terms_template: e.target.value })}
                      placeholder="شروط وطريقة الدفع..."
                      className="min-h-[80px]"
                      dir="rtl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>مدة العقد</Label>
                      <Textarea
                        value={formData.duration_clause || ''}
                        onChange={(e) => setFormData({ ...formData, duration_clause: e.target.value })}
                        placeholder="مدة سريان العقد وشروط التجديد..."
                        className="min-h-[80px]"
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>شروط الإنهاء</Label>
                      <Textarea
                        value={formData.termination_clause || ''}
                        onChange={(e) => setFormData({ ...formData, termination_clause: e.target.value })}
                        placeholder="شروط وإجراءات إنهاء العقد..."
                        className="min-h-[80px]"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>حل النزاعات</Label>
                    <Textarea
                      value={formData.dispute_resolution || ''}
                      onChange={(e) => setFormData({ ...formData, dispute_resolution: e.target.value })}
                      placeholder="آلية حل النزاعات والاختصاص القضائي..."
                      className="min-h-[60px]"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>الختام والتوقيعات</Label>
                    <Textarea
                      value={formData.closing_text || ''}
                      onChange={(e) => setFormData({ ...formData, closing_text: e.target.value })}
                      placeholder="نص الختام قبل التوقيعات..."
                      className="min-h-[60px]"
                      dir="rtl"
                    />
                  </div>
                </div>

                <Separator />

                {/* Settings */}
                <div className="space-y-4 bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium">إعدادات العرض</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center justify-between">
                      <Label>شعار الشركة</Label>
                      <Switch
                        checked={formData.include_header_logo}
                        onCheckedChange={(checked) => setFormData({ ...formData, include_header_logo: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>الختم</Label>
                      <Switch
                        checked={formData.include_stamp}
                        onCheckedChange={(checked) => setFormData({ ...formData, include_stamp: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>التوقيع</Label>
                      <Switch
                        checked={formData.include_signature}
                        onCheckedChange={(checked) => setFormData({ ...formData, include_signature: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }} disabled={saving}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {isEditing ? 'تحديث القالب' : 'إنشاء القالب'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                عرض قالب العقد
              </DialogTitle>
            </DialogHeader>

            {selectedTemplate && (
              <ScrollArea className="h-[60vh] px-1">
                <div className="space-y-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={selectedTemplate.template_type === 'system' ? 'secondary' : 'default'}>
                      {selectedTemplate.template_type === 'system' ? 'قالب نظام' : 'قالب مخصص'}
                    </Badge>
                    <Badge variant="outline">
                      {contractCategoryLabels[selectedTemplate.contract_category]}
                    </Badge>
                    <Badge variant="outline">
                      {partnerTypeLabels[selectedTemplate.partner_type]}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold">{selectedTemplate.name}</h3>
                    {selectedTemplate.description && (
                      <p className="text-muted-foreground mt-1">{selectedTemplate.description}</p>
                    )}
                  </div>

                  <Separator />

                  {selectedTemplate.header_text && (
                    <div>
                      <Label className="text-muted-foreground">ترويسة العقد</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedTemplate.header_text}</p>
                    </div>
                  )}

                  {selectedTemplate.introduction_text && (
                    <div>
                      <Label className="text-muted-foreground">المقدمة</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedTemplate.introduction_text}</p>
                    </div>
                  )}

                  {selectedTemplate.terms_template && (
                    <div>
                      <Label className="text-muted-foreground">البنود والشروط</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedTemplate.terms_template}</p>
                    </div>
                  )}

                  {selectedTemplate.obligations_party_one && (
                    <div>
                      <Label className="text-muted-foreground">التزامات الطرف الأول</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedTemplate.obligations_party_one}</p>
                    </div>
                  )}

                  {selectedTemplate.obligations_party_two && (
                    <div>
                      <Label className="text-muted-foreground">التزامات الطرف الثاني</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedTemplate.obligations_party_two}</p>
                    </div>
                  )}

                  {selectedTemplate.payment_terms_template && (
                    <div>
                      <Label className="text-muted-foreground">شروط الدفع</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedTemplate.payment_terms_template}</p>
                    </div>
                  )}

                  {selectedTemplate.duration_clause && (
                    <div>
                      <Label className="text-muted-foreground">مدة العقد</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedTemplate.duration_clause}</p>
                    </div>
                  )}

                  {selectedTemplate.termination_clause && (
                    <div>
                      <Label className="text-muted-foreground">شروط الإنهاء</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedTemplate.termination_clause}</p>
                    </div>
                  )}

                  {selectedTemplate.dispute_resolution && (
                    <div>
                      <Label className="text-muted-foreground">حل النزاعات</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedTemplate.dispute_resolution}</p>
                    </div>
                  )}

                  {selectedTemplate.closing_text && (
                    <div>
                      <Label className="text-muted-foreground">الختام</Label>
                      <p className="mt-1 whitespace-pre-wrap">{selectedTemplate.closing_text}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {selectedTemplate.include_header_logo && <span className="flex items-center gap-1"><ImageIcon className="w-4 h-4" /> شعار</span>}
                    {selectedTemplate.include_stamp && <span className="flex items-center gap-1"><Stamp className="w-4 h-4" /> ختم</span>}
                    {selectedTemplate.include_signature && <span className="flex items-center gap-1"><FileSignature className="w-4 h-4" /> توقيع</span>}
                  </div>
                </div>
              </ScrollArea>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                إغلاق
              </Button>
              {selectedTemplate && selectedTemplate.template_type === 'custom' && (
                <Button onClick={() => { setShowViewDialog(false); handleEdit(selectedTemplate); }} className="gap-2">
                  <Edit className="w-4 h-4" />
                  تعديل
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Templates Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                استيراد قوالب العقود الجاهزة
              </DialogTitle>
              <DialogDescription>
                اختر نوع القوالب التي تريد استيرادها - جميع القوالب تحتوي على 30+ بند قانوني
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {importing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>جاري الاستيراد...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleImportTemplates('generator')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">قوالب الجهات المولدة</h4>
                          <p className="text-sm text-muted-foreground">
                            {allGeneratorTemplates.length} قالب - عقود جمع ونقل
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleImportTemplates('recycler')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <Recycle className="w-6 h-6 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">قوالب جهات التدوير</h4>
                          <p className="text-sm text-muted-foreground">
                            {allRecyclerTemplates.length} قالب - عقود توريد وتدوير
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Separator />

                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors bg-gradient-to-r from-primary/5 to-green-500/5"
                    onClick={() => handleImportTemplates('all')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-primary/20 to-green-500/20 rounded-lg">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">استيراد جميع القوالب</h4>
                          <p className="text-sm text-muted-foreground">
                            {allGeneratorTemplates.length + allRecyclerTemplates.length} قالب شامل
                          </p>
                        </div>
                        <Badge variant="secondary">موصى به</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImportDialog(false)} disabled={importing}>
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ContractTemplates;
