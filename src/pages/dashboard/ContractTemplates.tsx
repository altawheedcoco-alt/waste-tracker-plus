import { useState, useRef } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Building2, 
  Recycle,
  Search,
  Loader2,
  Download,
  Sparkles,
  LayoutGrid,
  Layers,
  ToggleLeft,
  ToggleRight,
  Wand2,
  Database
} from 'lucide-react';
import { allEgyptianGeneratorTemplates, allEgyptianRecyclerTemplates } from '@/data/egyptianLegalContractTemplates';
import { 
  useContractTemplates, 
  ContractTemplate, 
  CreateContractTemplateInput,
  partnerTypeLabels,
  contractCategoryLabels 
} from '@/hooks/useContractTemplates';
import TemplateCard from '@/components/contracts/TemplateCard';
import TemplatePreviewDialog from '@/components/contracts/TemplatePreviewDialog';
import WasteTypeCategoryView from '@/components/contracts/WasteTypeCategoryView';
import ContractTemplateFormDialog from '@/components/contracts/ContractTemplateFormDialog';
import { usePDFExport } from '@/hooks/usePDFExport';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generateSystemTemplates, getTemplatesSummary } from '@/data/systemContractTemplates';

const ContractTemplates = () => {
  const { organization } = useAuth();
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
  const [generatingSystemTemplates, setGeneratingSystemTemplates] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'category'>('category');

  // Form data is now managed inside ContractTemplateFormDialog

  const resetForm = () => {
    setSelectedTemplate(null);
    setIsEditing(false);
  };

  const handleEdit = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
    setShowCreateDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return;
    await deleteTemplate(id);
  };

  const handleDuplicate = (template: ContractTemplate) => {
    // Set the template as selected but with modified name
    setSelectedTemplate({
      ...template,
      name: template.name + ' (نسخة)',
    });
    setIsEditing(false);
    setShowCreateDialog(true);
  };

  // Import pre-built templates
  const handleImportTemplates = async (type: 'generator' | 'recycler' | 'all') => {
    setImporting(true);
    setImportProgress(0);
    
    try {
      const templatesToImport = type === 'generator' 
        ? allEgyptianGeneratorTemplates 
        : type === 'recycler' 
          ? allEgyptianRecyclerTemplates 
          : [...allEgyptianGeneratorTemplates, ...allEgyptianRecyclerTemplates];
      
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

  // Generate system templates for all waste categories
  const handleGenerateSystemTemplates = async () => {
    if (!organization?.id) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setGeneratingSystemTemplates(true);
    setImportProgress(0);

    try {
      const systemTemplates = generateSystemTemplates();
      const total = systemTemplates.length;
      let created = 0;

      // Process in batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < systemTemplates.length; i += batchSize) {
        const batch = systemTemplates.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (template) => {
          try {
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
            created++;
          } catch (err) {
            console.error('Error creating template:', err);
          }
        }));
        
        setImportProgress(Math.round(((i + batch.length) / total) * 100));
      }

      toast.success(`تم إنشاء ${created} قالب عقد بنجاح من أصل ${total}`);
      setShowImportDialog(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error generating system templates:', error);
      toast.error('حدث خطأ أثناء إنشاء القوالب');
    } finally {
      setGeneratingSystemTemplates(false);
      setImportProgress(0);
    }
  };

  // Get templates summary
  const templatesSummary = getTemplatesSummary();

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(template => (
          <TemplateCard 
            key={template.id} 
            template={template}
            onView={(t) => {
              setSelectedTemplate(t);
              setShowViewDialog(true);
            }}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
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
            <p className="text-muted-foreground">إنشاء وإدارة صيغ عقود الجمع والنقل ({allEgyptianGeneratorTemplates.length + allEgyptianRecyclerTemplates.length} قالب قانوني مصري)</p>
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

        {/* Search and View Toggle */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث في القوالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'category' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('category')}
              className="gap-2"
            >
              <Layers className="w-4 h-4" />
              تصنيف بالمخلفات
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              عرض شبكي
            </Button>
          </div>
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
            ) : viewMode === 'category' ? (
              <WasteTypeCategoryView
                templates={generatorTemplates}
                onView={(t) => {
                  setSelectedTemplate(t);
                  setShowViewDialog(true);
                }}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                searchQuery={searchQuery}
              />
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
            ) : viewMode === 'category' ? (
              <WasteTypeCategoryView
                templates={recyclerTemplates}
                onView={(t) => {
                  setSelectedTemplate(t);
                  setShowViewDialog(true);
                }}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                searchQuery={searchQuery}
              />
            ) : (
              <TemplatesList 
                templates={recyclerTemplates} 
                emptyMessage="لا توجد قوالب لعقود جهات التدوير" 
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog - Using New Component */}
        <ContractTemplateFormDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          template={selectedTemplate}
          isEditing={isEditing}
          onSubmit={async (data) => {
            setSaving(true);
            try {
              if (isEditing && selectedTemplate) {
                await updateTemplate(selectedTemplate.id, data);
              } else {
                await createTemplate(data);
              }
              setShowCreateDialog(false);
              resetForm();
            } finally {
              setSaving(false);
            }
          }}
          saving={saving}
        />

        {/* Template Preview Dialog */}
        <TemplatePreviewDialog
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
          template={selectedTemplate}
          onEdit={handleEdit}
        />

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
              {(importing || generatingSystemTemplates) ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{generatingSystemTemplates ? 'جاري إنشاء القوالب...' : 'جاري الاستيراد...'}</span>
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
                  {/* System Templates - Main Feature */}
                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200"
                    onClick={handleGenerateSystemTemplates}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Wand2 className="w-6 h-6 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-purple-700">إنشاء قوالب لجميع تصنيفات المخلفات</h4>
                          <p className="text-sm text-muted-foreground">
                            {templatesSummary.totalTemplates} قالب • 20 لكل تصنيف + قالب لكل نوع فرعي
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {templatesSummary.mainCategories} تصنيف رئيسي
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {templatesSummary.subcategories} نوع فرعي
                            </Badge>
                          </div>
                        </div>
                        <Badge className="bg-purple-500">جديد</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Separator className="my-2" />
                  <p className="text-sm text-muted-foreground text-center">أو استورد من القوالب المعدة مسبقاً</p>

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
                            {allEgyptianGeneratorTemplates.length} قالب - عقود جمع ونقل
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
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Recycle className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">قوالب جهات التدوير</h4>
                          <p className="text-sm text-muted-foreground">
                            {allEgyptianRecyclerTemplates.length} قالب - عقود توريد وتدوير
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleImportTemplates('all')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">استيراد جميع القوالب الجاهزة</h4>
                          <p className="text-sm text-muted-foreground">
                            {allEgyptianGeneratorTemplates.length + allEgyptianRecyclerTemplates.length} قالب شامل
                          </p>
                        </div>
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
