import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  title: string;
  description: string;
  icon: any;
  prompt: string;
}

interface Category {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  templates: Template[];
}

interface TemplateSelectorProps {
  categories: Category[];
  selectedTemplateId: string;
  onSelectTemplate: (template: Template) => void;
  type: 'post' | 'image' | 'video';
}

const TemplateSelector = ({ 
  categories, 
  selectedTemplateId, 
  onSelectTemplate,
  type 
}: TemplateSelectorProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  // Filter templates based on search
  const filteredCategories = searchQuery.trim() 
    ? categories.map(category => ({
        ...category,
        templates: category.templates.filter(t => 
          t.title.includes(searchQuery) || 
          t.description.includes(searchQuery)
        )
      })).filter(c => c.templates.length > 0)
    : categories;

  const allTemplatesFlat = filteredCategories.flatMap(c => 
    c.templates.map(t => ({ ...t, categoryColor: c.color, categoryTitle: c.title }))
  );

  const totalTemplates = categories.reduce((acc, c) => acc + c.templates.length, 0);

  const typeLabels = {
    post: 'نموذج منشور',
    image: 'نموذج صورة',
    video: 'نموذج فيديو'
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`ابحث في ${totalTemplates} ${typeLabels[type]}...`}
          className="pr-10"
          dir="rtl"
        />
      </div>

      <AnimatePresence mode="wait">
        {!selectedCategory && !searchQuery ? (
          // Category Grid
          <motion.div
            key="categories"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">اختر فئة</p>
              <Badge variant="secondary">{categories.length} فئة</Badge>
            </div>
            <ScrollArea className="h-[320px]">
              <div className="grid grid-cols-2 gap-3 p-1">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-right transition-all",
                      "hover:border-primary/50 border-border",
                      "bg-gradient-to-br",
                      category.color,
                      "bg-opacity-10"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {category.templates.length}
                      </Badge>
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-medium text-sm mt-2 text-white">{category.title}</h4>
                    <p className="text-xs text-white/70 mt-1 line-clamp-2">{category.description}</p>
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        ) : searchQuery ? (
          // Search Results
          <motion.div
            key="search"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">نتائج البحث</p>
              <Badge variant="secondary">{allTemplatesFlat.length} نتيجة</Badge>
            </div>
            <ScrollArea className="h-[320px]">
              <div className="grid gap-2 p-1">
                {allTemplatesFlat.length > 0 ? (
                  allTemplatesFlat.map((template) => (
                    <motion.button
                      key={template.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => onSelectTemplate(template)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-right transition-all flex items-center gap-3",
                        selectedTemplateId === template.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0",
                        template.categoryColor
                      )}>
                        <template.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{template.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {template.categoryTitle}
                      </Badge>
                    </motion.button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد نتائج للبحث
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        ) : (
          // Templates Grid
          <motion.div
            key="templates"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setSelectedCategoryId(null)}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ChevronRight className="w-4 h-4" />
                العودة للفئات
              </button>
              <Badge className={cn("bg-gradient-to-r text-white", selectedCategory?.color)}>
                {selectedCategory?.title}
              </Badge>
            </div>
            <ScrollArea className="h-[320px]">
              <div className="grid gap-2 p-1">
                {selectedCategory?.templates.map((template) => (
                  <motion.button
                    key={template.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectTemplate(template)}
                    className={cn(
                      "p-3 rounded-lg border-2 text-right transition-all flex items-center gap-3",
                      selectedTemplateId === template.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0",
                      selectedCategory.color
                    )}>
                      <template.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{template.title}</h4>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TemplateSelector;
