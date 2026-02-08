import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Recycle,
  FileText,
  Package,
  AlertTriangle,
  Leaf,
  Biohazard,
  Zap,
  FlaskConical,
  Stethoscope,
  Building,
  MoreHorizontal,
  Utensils,
  Sparkles,
} from 'lucide-react';
import {
  allRecyclingTemplates,
  getTemplatesByWasteType,
  searchTemplates,
  type RecyclingReportTemplate,
  templateStats,
} from '@/lib/recyclingReportTemplates';

interface RecyclingTemplatesLibraryProps {
  wasteType: string;
  onSelectTemplate: (template: RecyclingReportTemplate) => void;
  onClose?: () => void;
}

const wasteTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  plastic: { label: 'بلاستيك', icon: Package, color: 'bg-blue-100 text-blue-700' },
  paper: { label: 'ورق', icon: FileText, color: 'bg-amber-100 text-amber-700' },
  metal: { label: 'معادن', icon: Zap, color: 'bg-slate-100 text-slate-700' },
  glass: { label: 'زجاج', icon: Sparkles, color: 'bg-cyan-100 text-cyan-700' },
  electronic: { label: 'إلكترونيات', icon: AlertTriangle, color: 'bg-orange-100 text-orange-700' },
  organic: { label: 'عضوية', icon: Leaf, color: 'bg-green-100 text-green-700' },
  chemical: { label: 'كيميائية', icon: FlaskConical, color: 'bg-red-100 text-red-700' },
  medical: { label: 'طبية', icon: Stethoscope, color: 'bg-purple-100 text-purple-700' },
  construction: { label: 'بناء', icon: Building, color: 'bg-stone-100 text-stone-700' },
  other: { label: 'أخرى', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700' },
  food_industry: { label: 'مصانع غذائية', icon: Utensils, color: 'bg-yellow-100 text-yellow-700' },
};

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  hazardous: { label: 'مخلفات خطرة', icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-300' },
  non_hazardous: { label: 'غير خطرة', icon: Leaf, color: 'bg-green-100 text-green-700 border-green-300' },
  medical_hazardous: { label: 'طبية خطرة', icon: Biohazard, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  all: { label: 'عام', icon: Recycle, color: 'bg-blue-100 text-blue-700 border-blue-300' },
};

const RecyclingTemplatesLibrary: React.FC<RecyclingTemplatesLibraryProps> = ({
  wasteType,
  onSelectTemplate,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('recommended');

  // Get recommended templates for the current waste type
  const recommendedTemplates = useMemo(() => {
    return getTemplatesByWasteType(wasteType);
  }, [wasteType]);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    let templates: RecyclingReportTemplate[];

    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    } else if (selectedCategory === 'recommended') {
      templates = recommendedTemplates;
    } else if (selectedCategory === 'all') {
      templates = allRecyclingTemplates;
    } else {
      templates = allRecyclingTemplates.filter(t => 
        t.waste_types.includes(selectedCategory)
      );
    }

    return templates;
  }, [searchQuery, selectedCategory, recommendedTemplates]);

  const wasteConfig = wasteTypeConfig[wasteType] || wasteTypeConfig.other;
  const WasteIcon = wasteConfig.icon;

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Badge className={wasteConfig.color}>
            <WasteIcon className="w-4 h-4 ml-1" />
            {wasteConfig.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {recommendedTemplates.length} قالب متاح
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="gap-1">
            <FileText className="w-3 h-3" />
            إجمالي {templateStats.total} قالب
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="ابحث في القوالب (مثال: PET، طبي، سماد...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="recommended" className="text-xs gap-1">
            <Sparkles className="w-3 h-3" />
            موصى بها
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs gap-1">
            <Recycle className="w-3 h-3" />
            الكل
          </TabsTrigger>
          <TabsTrigger value="plastic" className="text-xs">بلاستيك</TabsTrigger>
          <TabsTrigger value="paper" className="text-xs">ورق</TabsTrigger>
          <TabsTrigger value="metal" className="text-xs">معادن</TabsTrigger>
          <TabsTrigger value="organic" className="text-xs">عضوية</TabsTrigger>
          <TabsTrigger value="electronic" className="text-xs">إلكترونيات</TabsTrigger>
          <TabsTrigger value="chemical" className="text-xs">كيميائية</TabsTrigger>
          <TabsTrigger value="medical" className="text-xs">طبية</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          <ScrollArea className="h-[400px] pr-3">
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">لا توجد قوالب مطابقة</p>
                {searchQuery && (
                  <Button 
                    variant="link" 
                    onClick={() => setSearchQuery('')}
                    className="mt-2"
                  >
                    مسح البحث
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTemplates.map((template) => {
                  const catConfig = categoryConfig[template.waste_category];
                  const CatIcon = catConfig?.icon || Recycle;

                  return (
                    <Card
                      key={template.id}
                      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
                      onClick={() => onSelectTemplate(template)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">
                            {template.name}
                          </CardTitle>
                          <Badge variant="outline" className={`text-xs shrink-0 ${catConfig?.color || ''}`}>
                            <CatIcon className="w-3 h-3 ml-1" />
                            {catConfig?.label || 'عام'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Quick Stats Footer */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <span className="flex items-center gap-1">
          <Leaf className="w-3 h-3 text-green-600" />
          غير خطرة: {templateStats.byCategory.non_hazardous}
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          خطرة: {templateStats.byCategory.hazardous}
        </span>
        <span className="flex items-center gap-1">
          <Biohazard className="w-3 h-3 text-purple-600" />
          طبية: {templateStats.byCategory.medical_hazardous}
        </span>
      </div>
    </div>
  );
};

export default RecyclingTemplatesLibrary;
