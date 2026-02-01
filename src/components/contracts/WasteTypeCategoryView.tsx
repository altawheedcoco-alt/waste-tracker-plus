import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ContractTemplate } from '@/hooks/useContractTemplates';
import TemplateCard from './TemplateCard';
import { 
  ChevronDown, 
  ChevronUp,
  Factory,
  Recycle,
  Leaf,
  Pill,
  Cpu,
  TreePine,
  Droplets,
  Package,
  FlaskConical,
  Building,
  FileText,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { 
  hazardousWasteCategories, 
  nonHazardousWasteCategories,
  type WasteCategoryInfo 
} from '@/lib/wasteClassification';

// ربط تصنيفات المخلفات الرسمية بالأيقونات
const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  chemical: FlaskConical,
  electronic: Cpu,
  medical: Pill,
  industrial: Factory,
  plastic: Package,
  paper: FileText,
  metal: Building,
  glass: Layers,
  organic: Leaf,
  construction: Building,
};

const categoryColorMap: Record<string, string> = {
  // Hazardous categories - red/orange tones
  chemical: 'bg-yellow-500',
  electronic: 'bg-purple-500',
  medical: 'bg-red-500',
  industrial: 'bg-orange-600',
  // Non-hazardous categories - green/blue tones
  plastic: 'bg-blue-500',
  paper: 'bg-amber-600',
  metal: 'bg-slate-500',
  glass: 'bg-cyan-500',
  organic: 'bg-green-500',
  construction: 'bg-stone-500',
};

// دمج كل التصنيفات من wasteClassification.ts
const allWasteCategories: WasteCategoryInfo[] = [
  ...hazardousWasteCategories,
  ...nonHazardousWasteCategories,
];

// تصنيف القالب حسب نوع المخلف - استخدام الكلمات المفتاحية من التصنيف الرسمي
const categorizeTemplate = (template: ContractTemplate): string => {
  const searchText = `${template.name} ${template.description || ''} ${template.terms_template || ''}`.toLowerCase();
  
  // البحث في كل تصنيف وأنواعه الفرعية
  for (const category of allWasteCategories) {
    // البحث في اسم التصنيف
    if (searchText.includes(category.name.toLowerCase()) || 
        searchText.includes(category.id.toLowerCase())) {
      return category.id;
    }
    
    // البحث في الأنواع الفرعية
    for (const subcategory of category.subcategories) {
      if (searchText.includes(subcategory.name.toLowerCase()) ||
          searchText.includes(subcategory.code.toLowerCase())) {
        return category.id;
      }
    }
  }
  
  // كلمات مفتاحية إضافية للتصنيف
  const keywordMap: Record<string, string[]> = {
    chemical: ['كيميائي', 'مذيب', 'حمض', 'قلوي', 'سامة', 'زيت', 'شحم', 'طلاء'],
    electronic: ['إلكتروني', 'بطارية', 'كهربائي', 'حاسوب', 'موبايل', 'شاشة'],
    medical: ['طبي', 'صحي', 'مستشفى', 'صيدلي', 'إبر', 'أدوية'],
    industrial: ['صناعي', 'مصنع', 'إنتاج', 'حمأة', 'رماد'],
    plastic: ['بلاستيك', 'بوليمر', 'PET', 'PVC', 'أكياس'],
    paper: ['ورق', 'كرتون', 'مستندات', 'صحف'],
    metal: ['معدن', 'حديد', 'نحاس', 'ألومنيوم', 'خردة'],
    glass: ['زجاج', 'عبوات زجاجية'],
    organic: ['عضوي', 'غذائي', 'زراعي', 'حدائق', 'خشب', 'نسيج'],
    construction: ['بناء', 'هدم', 'خرسانة', 'طوب', 'سيراميك'],
  };
  
  for (const [categoryId, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
      return categoryId;
    }
  }
  
  return 'other';
};

interface WasteTypeCategoryViewProps {
  templates: ContractTemplate[];
  onView: (template: ContractTemplate) => void;
  onEdit: (template: ContractTemplate) => void;
  onDuplicate: (template: ContractTemplate) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
}

const WasteTypeCategoryView = ({
  templates,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  searchQuery
}: WasteTypeCategoryViewProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // تجميع القوالب حسب نوع المخلف
  const categorizedTemplates = templates.reduce((acc, template) => {
    const category = categorizeTemplate(template);
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, ContractTemplate[]>);

  // تصفية حسب البحث
  const filterBySearch = (templates: ContractTemplate[]) => {
    if (!searchQuery) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };


  // Separate hazardous and non-hazardous with templates
  const hazardousCategoriesWithTemplates = hazardousWasteCategories.filter(
    cat => (categorizedTemplates[cat.id]?.length || 0) > 0 || true // Show all categories
  );
  
  const nonHazardousCategoriesWithTemplates = nonHazardousWasteCategories.filter(
    cat => (categorizedTemplates[cat.id]?.length || 0) > 0 || true // Show all categories
  );

  const renderCategoryCard = (category: WasteCategoryInfo) => {
    const Icon = categoryIconMap[category.id] || Layers;
    const color = categoryColorMap[category.id] || 'bg-gray-500';
    const count = categorizedTemplates[category.id]?.length || 0;
    const isExpanded = expandedCategories.has(category.id);
    const categoryTemplates = filterBySearch(categorizedTemplates[category.id] || []);
    const isHazardous = category.category === 'hazardous';
    
    return (
      <Collapsible 
        key={category.id} 
        open={isExpanded}
        onOpenChange={() => toggleCategory(category.id)}
      >
        <Card className={isHazardous ? 'border-red-200 dark:border-red-800' : ''}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <CardTitle className="text-base flex items-center gap-2">
                      {category.name}
                      {isHazardous && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {count} قالب عقد • {category.subcategories.length} نوع فرعي
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isHazardous ? "destructive" : "secondary"}>
                    {isHazardous ? 'خطرة' : 'غير خطرة'}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <AnimatePresence>
            {isExpanded && (
              <CollapsibleContent forceMount>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0">
                    {/* Subcategories Preview */}
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium mb-2">الأنواع الفرعية المشمولة:</p>
                      <div className="flex flex-wrap gap-1">
                        {category.subcategories.slice(0, 8).map(sub => (
                          <Badge key={sub.code} variant="outline" className="text-xs">
                            {sub.code}: {sub.name}
                          </Badge>
                        ))}
                        {category.subcategories.length > 8 && (
                          <Badge variant="outline" className="text-xs">
                            +{category.subcategories.length - 8} المزيد
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Templates */}
                    {categoryTemplates.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {categoryTemplates.map(template => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            onView={onView}
                            onEdit={onEdit}
                            onDuplicate={onDuplicate}
                            onDelete={onDelete}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">لا توجد قوالب لهذا التصنيف</p>
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Card>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto text-red-500 mb-1" />
            <p className="text-xs text-muted-foreground">مخلفات خطرة</p>
            <p className="text-lg font-bold text-red-600">{hazardousWasteCategories.length} تصنيف</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200">
          <CardContent className="p-3 text-center">
            <Recycle className="w-6 h-6 mx-auto text-green-500 mb-1" />
            <p className="text-xs text-muted-foreground">مخلفات غير خطرة</p>
            <p className="text-lg font-bold text-green-600">{nonHazardousWasteCategories.length} تصنيف</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <FileText className="w-6 h-6 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">إجمالي القوالب</p>
            <p className="text-lg font-bold">{templates.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Layers className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">أنواع المخلفات</p>
            <p className="text-lg font-bold">{allWasteCategories.reduce((acc, cat) => acc + cat.subcategories.length, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Hazardous Waste Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-lg font-semibold text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span>المخلفات الخطرة</span>
          <Badge variant="destructive" className="text-xs">
            {hazardousCategoriesWithTemplates.length} تصنيف
          </Badge>
        </div>
        <div className="space-y-2">
          {hazardousCategoriesWithTemplates.map(renderCategoryCard)}
        </div>
      </div>

      {/* Non-Hazardous Waste Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-lg font-semibold text-green-600">
          <Recycle className="w-5 h-5" />
          <span>المخلفات غير الخطرة</span>
          <Badge className="bg-green-100 text-green-700 text-xs">
            {nonHazardousCategoriesWithTemplates.length} تصنيف
          </Badge>
        </div>
        <div className="space-y-2">
          {nonHazardousCategoriesWithTemplates.map(renderCategoryCard)}
        </div>
      </div>

    </div>
  );
};

export default WasteTypeCategoryView;
