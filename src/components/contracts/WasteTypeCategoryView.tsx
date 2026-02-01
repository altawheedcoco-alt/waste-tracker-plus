import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ContractTemplate } from '@/hooks/useContractTemplates';
import TemplateCard from './TemplateCard';
import { 
  ChevronDown, 
  ChevronUp,
  Factory,
  Recycle,
  Leaf,
  Zap,
  Pill,
  Cpu,
  TreePine,
  Droplets,
  Fuel,
  Package,
  Trash2,
  FlaskConical,
  Building,
  Car,
  Shirt,
  UtensilsCrossed,
  Construction,
  Atom,
  FileText,
  Layers
} from 'lucide-react';

// تصنيفات أنواع المخلفات مع الأيقونات
const wasteTypeCategories = [
  { 
    id: 'industrial', 
    label: 'مخلفات صناعية', 
    icon: Factory, 
    color: 'bg-orange-500',
    keywords: ['صناعي', 'صناعية', 'مصنع', 'industrial']
  },
  { 
    id: 'plastic', 
    label: 'مخلفات بلاستيكية', 
    icon: Package, 
    color: 'bg-blue-500',
    keywords: ['بلاستيك', 'plastic', 'بوليمر', 'polymer']
  },
  { 
    id: 'electronic', 
    label: 'مخلفات إلكترونية', 
    icon: Cpu, 
    color: 'bg-purple-500',
    keywords: ['إلكتروني', 'electronic', 'كهربائي', 'electrical', 'أجهزة']
  },
  { 
    id: 'medical', 
    label: 'مخلفات طبية', 
    icon: Pill, 
    color: 'bg-red-500',
    keywords: ['طبي', 'medical', 'صحي', 'healthcare', 'مستشف', 'صيدل']
  },
  { 
    id: 'wood', 
    label: 'مخلفات خشبية', 
    icon: TreePine, 
    color: 'bg-amber-600',
    keywords: ['خشب', 'wood', 'أخشاب', 'timber', 'أثاث']
  },
  { 
    id: 'organic', 
    label: 'مخلفات عضوية', 
    icon: Leaf, 
    color: 'bg-green-500',
    keywords: ['عضوي', 'organic', 'زراعي', 'agricultural', 'حيوي', 'غذائي', 'طعام']
  },
  { 
    id: 'chemical', 
    label: 'مخلفات كيميائية', 
    icon: FlaskConical, 
    color: 'bg-yellow-500',
    keywords: ['كيميائي', 'chemical', 'مذيب', 'solvent', 'حمض', 'قلوي']
  },
  { 
    id: 'oil', 
    label: 'زيوت ومشتقات بترولية', 
    icon: Droplets, 
    color: 'bg-gray-700',
    keywords: ['زيت', 'oil', 'بترول', 'petroleum', 'شحم', 'وقود']
  },
  { 
    id: 'metal', 
    label: 'مخلفات معدنية', 
    icon: Construction, 
    color: 'bg-slate-500',
    keywords: ['معدن', 'metal', 'حديد', 'iron', 'نحاس', 'ألومنيوم', 'خردة']
  },
  { 
    id: 'textile', 
    label: 'مخلفات نسيجية', 
    icon: Shirt, 
    color: 'bg-pink-500',
    keywords: ['نسيج', 'textile', 'قماش', 'ملابس', 'fabric']
  },
  { 
    id: 'construction', 
    label: 'مخلفات البناء والهدم', 
    icon: Building, 
    color: 'bg-stone-500',
    keywords: ['بناء', 'construction', 'هدم', 'demolition', 'إنشاء', 'خرسان']
  },
  { 
    id: 'automotive', 
    label: 'مخلفات السيارات', 
    icon: Car, 
    color: 'bg-indigo-500',
    keywords: ['سيارات', 'automotive', 'مركبات', 'vehicle', 'إطارات', 'بطاريات']
  },
  { 
    id: 'food', 
    label: 'مخلفات غذائية', 
    icon: UtensilsCrossed, 
    color: 'bg-lime-500',
    keywords: ['غذاء', 'food', 'مطاعم', 'restaurant', 'أغذية']
  },
  { 
    id: 'hazardous', 
    label: 'مخلفات خطرة', 
    icon: Atom, 
    color: 'bg-red-600',
    keywords: ['خطر', 'hazardous', 'سام', 'toxic', 'مشع', 'radioactive']
  },
  { 
    id: 'recycling', 
    label: 'مخلفات قابلة للتدوير', 
    icon: Recycle, 
    color: 'bg-emerald-500',
    keywords: ['تدوير', 'recycl', 'إعادة', 'استرداد']
  },
  { 
    id: 'other', 
    label: 'مخلفات أخرى', 
    icon: Layers, 
    color: 'bg-gray-500',
    keywords: []
  },
];

// تصنيف القالب حسب نوع المخلف
const categorizeTemplate = (template: ContractTemplate): string => {
  const searchText = `${template.name} ${template.description || ''} ${template.terms_template || ''}`.toLowerCase();
  
  for (const category of wasteTypeCategories) {
    if (category.id === 'other') continue;
    if (category.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
      return category.id;
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['industrial', 'plastic', 'electronic']));

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

  // عرض الفئات التي تحتوي على قوالب فقط
  const activeCategories = wasteTypeCategories.filter(
    cat => categorizedTemplates[cat.id]?.length > 0
  );

  if (activeCategories.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">لا توجد قوالب</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* نظرة عامة على الفئات */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {activeCategories.map(category => {
          const Icon = category.icon;
          const count = categorizedTemplates[category.id]?.length || 0;
          const isExpanded = expandedCategories.has(category.id);
          
          return (
            <motion.div
              key={category.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`cursor-pointer transition-all ${isExpanded ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}
                onClick={() => toggleCategory(category.id)}
              >
                <CardContent className="p-3 text-center">
                  <div className={`w-10 h-10 mx-auto rounded-lg ${category.color} flex items-center justify-center mb-2`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium line-clamp-2">{category.label}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {count} قالب
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* عرض القوالب المصنفة */}
      <div className="space-y-4">
        {activeCategories.map(category => {
          const Icon = category.icon;
          const categoryTemplates = filterBySearch(categorizedTemplates[category.id] || []);
          const isExpanded = expandedCategories.has(category.id);
          
          if (categoryTemplates.length === 0) return null;
          
          return (
            <Collapsible 
              key={category.id} 
              open={isExpanded}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{category.label}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {categoryTemplates.length} قالب عقد
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </Button>
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
                        </CardContent>
                      </motion.div>
                    </CollapsibleContent>
                  )}
                </AnimatePresence>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

export default WasteTypeCategoryView;
