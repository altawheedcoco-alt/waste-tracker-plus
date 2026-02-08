import { useState, useEffect, useMemo, useRef } from 'react';
import { Check, ChevronsUpDown, Search, Star, AlertTriangle, Leaf, Plus, History, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type WasteType = Database['public']['Enums']['waste_type'];

// ============================================
// الفئات الرئيسية فقط - بدون تصنيفات فرعية معقدة
// ============================================

export interface MainWasteCategory {
  id: WasteType;
  name: string;
  nameShort: string;
  code: string;
  isHazardous: boolean;
  keywords: string[]; // كلمات مفتاحية للتعرف التلقائي
  icon?: 'wood' | 'plastic' | 'paper' | 'metal' | 'glass' | 'organic' | 'chemical' | 'medical' | 'electronic' | 'construction' | 'other';
}

// الفئات الرئيسية للمخلفات غير الخطرة
export const mainNonHazardousCategories: MainWasteCategory[] = [
  {
    id: 'organic',
    name: 'أخشاب',
    nameShort: 'خشب',
    code: 'WD',
    isHazardous: false,
    keywords: ['خشب', 'اخشاب', 'بالت', 'بالتات', 'بالته', 'طبلية', 'طبالي', 'كونتر', 'حبيبي', 'صندوق', 'تبن', 'mdf', 'خشب احمر', 'خشب كسر', 'wood', 'pallet'],
    icon: 'wood',
  },
  {
    id: 'plastic',
    name: 'بلاستيك',
    nameShort: 'بلاستيك',
    code: 'PL',
    isHazardous: false,
    keywords: ['بلاستيك', 'plastic', 'pet', 'hdpe', 'pvc', 'ldpe', 'pp', 'ps', 'نايلون', 'اكياس', 'عبوات', 'زجاجات', 'برميل', 'جراكن', 'بلاستك'],
    icon: 'plastic',
  },
  {
    id: 'paper',
    name: 'ورق وكرتون',
    nameShort: 'ورق',
    code: 'PA',
    isHazardous: false,
    keywords: ['ورق', 'كرتون', 'paper', 'cardboard', 'صحف', 'مجلات', 'كتب', 'مستندات', 'كراتين', 'علب', 'صناديق'],
    icon: 'paper',
  },
  {
    id: 'metal',
    name: 'معادن',
    nameShort: 'معادن',
    code: 'MT',
    isHazardous: false,
    keywords: ['معدن', 'معادن', 'حديد', 'ألومنيوم', 'الومنيوم', 'نحاس', 'ستانلس', 'صلب', 'خردة', 'سكراب', 'براميل', 'انابيب', 'صاج', 'زنك', 'رصاص', 'metal', 'steel', 'iron', 'aluminum', 'copper'],
    icon: 'metal',
  },
  {
    id: 'glass',
    name: 'زجاج',
    nameShort: 'زجاج',
    code: 'GL',
    isHazardous: false,
    keywords: ['زجاج', 'glass', 'قوارير', 'زجاجات', 'نوافذ', 'مرايا'],
    icon: 'glass',
  },
  {
    id: 'construction',
    name: 'مخلفات بناء وهدم',
    nameShort: 'بناء',
    code: 'CN',
    isHazardous: false,
    keywords: ['بناء', 'هدم', 'خرسانة', 'اسمنت', 'طوب', 'بلاط', 'سيراميك', 'رمل', 'زلط', 'جبس', 'اسفلت', 'انقاض', 'ردم'],
    icon: 'construction',
  },
  {
    id: 'other',
    name: 'مخلفات متنوعة',
    nameShort: 'متنوع',
    code: 'OT',
    isHazardous: false,
    keywords: ['متنوع', 'مختلط', 'اخرى', 'قماش', 'منسوجات', 'اثاث', 'مطاط', 'اطارات', 'جلد'],
    icon: 'other',
  },
];

// الفئات الرئيسية للمخلفات الخطرة
export const mainHazardousCategories: MainWasteCategory[] = [
  {
    id: 'chemical',
    name: 'مخلفات كيميائية',
    nameShort: 'كيميائي',
    code: 'CH',
    isHazardous: true,
    keywords: ['كيميائي', 'chemical', 'مذيب', 'حمض', 'قلوي', 'مبيد', 'زيت', 'شحم', 'طلاء', 'دهان', 'سام', 'براميل ملوثة'],
    icon: 'chemical',
  },
  {
    id: 'electronic',
    name: 'مخلفات إلكترونية',
    nameShort: 'إلكتروني',
    code: 'EL',
    isHazardous: true,
    keywords: ['إلكتروني', 'الكتروني', 'electronic', 'بطارية', 'بطاريات', 'شاشة', 'كمبيوتر', 'موبايل', 'طابعة', 'كابلات', 'اسلاك'],
    icon: 'electronic',
  },
  {
    id: 'medical',
    name: 'مخلفات طبية',
    nameShort: 'طبي',
    code: 'MD',
    isHazardous: true,
    keywords: ['طبي', 'medical', 'صيدلي', 'إبر', 'ابر', 'أدوية', 'ادوية', 'مستشفى', 'عيادة', 'ملوث'],
    icon: 'medical',
  },
];

// كل الفئات معاً
export const allMainCategories = [...mainNonHazardousCategories, ...mainHazardousCategories];

// ============================================
// دوال المساعدة
// ============================================

// الكشف التلقائي عن الفئة من الوصف
export const detectCategoryFromDescription = (description: string): MainWasteCategory | null => {
  const desc = description.toLowerCase().trim();
  
  for (const category of allMainCategories) {
    for (const keyword of category.keywords) {
      if (desc.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  return null;
};

// التحقق من خطورة الفئة
export const isHazardousCategory = (categoryId: string): boolean => {
  const category = allMainCategories.find(c => c.id === categoryId);
  return category?.isHazardous ?? false;
};

// الحصول على مستوى الخطورة
export const getHazardLevel = (categoryId: string): 'hazardous' | 'non_hazardous' => {
  return isHazardousCategory(categoryId) ? 'hazardous' : 'non_hazardous';
};

// ============================================
// المكون الرئيسي
// ============================================

const RECENT_DESCRIPTIONS_KEY = 'recent_waste_descriptions';
const MAX_RECENT_ITEMS = 20;

interface RecentDescription {
  description: string;
  categoryId: WasteType;
  usedAt: string;
  count: number;
}

const getRecentDescriptions = (): RecentDescription[] => {
  try {
    const stored = localStorage.getItem(RECENT_DESCRIPTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentDescription = (description: string, categoryId: WasteType) => {
  const recent = getRecentDescriptions();
  const existing = recent.find(r => r.description.toLowerCase() === description.toLowerCase());
  
  if (existing) {
    existing.count++;
    existing.usedAt = new Date().toISOString();
  } else {
    recent.unshift({
      description,
      categoryId,
      usedAt: new Date().toISOString(),
      count: 1,
    });
  }
  
  // Keep only the most recent items
  const sorted = recent.sort((a, b) => b.count - a.count).slice(0, MAX_RECENT_ITEMS);
  localStorage.setItem(RECENT_DESCRIPTIONS_KEY, JSON.stringify(sorted));
};

interface FlexibleWasteTypeSelectorProps {
  value: string;
  onChange: (wasteType: string, hazardLevel: string, wasteDescription: string) => void;
}

const FlexibleWasteTypeSelector = ({ value, onChange }: FlexibleWasteTypeSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MainWasteCategory | null>(null);
  const [customDescription, setCustomDescription] = useState('');
  const [recentDescriptions, setRecentDescriptions] = useState<RecentDescription[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent descriptions
  useEffect(() => {
    setRecentDescriptions(getRecentDescriptions());
  }, []);

  // Parse current value
  useEffect(() => {
    if (value) {
      // Try to parse the value format: "CODE - Description"
      const parts = value.split(' - ');
      if (parts.length >= 2) {
        const code = parts[0];
        const desc = parts.slice(1).join(' - ');
        const category = allMainCategories.find(c => c.code === code);
        if (category) {
          setSelectedCategory(category);
          setCustomDescription(desc);
        }
      }
    }
  }, [value]);

  // Auto-detect category from search query
  useEffect(() => {
    if (searchQuery.length > 2 && !selectedCategory) {
      const detected = detectCategoryFromDescription(searchQuery);
      if (detected) {
        setSelectedCategory(detected);
      }
    }
  }, [searchQuery, selectedCategory]);

  // Filter recent descriptions
  const filteredRecent = useMemo(() => {
    if (!searchQuery.trim()) return recentDescriptions.slice(0, 8);
    const query = searchQuery.toLowerCase();
    return recentDescriptions
      .filter(r => r.description.toLowerCase().includes(query))
      .slice(0, 8);
  }, [recentDescriptions, searchQuery]);

  const handleSelectCategory = (category: MainWasteCategory) => {
    setSelectedCategory(category);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSelectRecent = (recent: RecentDescription) => {
    const category = allMainCategories.find(c => c.id === recent.categoryId);
    if (category) {
      const label = `${category.code} - ${recent.description}`;
      onChange(category.id, getHazardLevel(category.id), label);
      saveRecentDescription(recent.description, category.id);
      setOpen(false);
      setSearchQuery('');
      setCustomDescription('');
      setSelectedCategory(null);
    }
  };

  const handleConfirmSelection = () => {
    if (!selectedCategory) {
      toast.error('يرجى اختيار الفئة الرئيسية');
      return;
    }

    const description = customDescription.trim() || searchQuery.trim();
    if (!description) {
      toast.error('يرجى كتابة وصف المخلف');
      return;
    }

    const label = `${selectedCategory.code} - ${description}`;
    onChange(selectedCategory.id, getHazardLevel(selectedCategory.id), label);
    saveRecentDescription(description, selectedCategory.id);
    setRecentDescriptions(getRecentDescriptions());
    setOpen(false);
    setSearchQuery('');
    setCustomDescription('');
    setSelectedCategory(null);
    toast.success('تم تحديد نوع المخلف');
  };

  const handleQuickAdd = () => {
    const query = searchQuery.trim();
    if (!query) return;

    const detected = detectCategoryFromDescription(query) || mainNonHazardousCategories.find(c => c.id === 'other')!;
    const label = `${detected.code} - ${query}`;
    onChange(detected.id, getHazardLevel(detected.id), label);
    saveRecentDescription(query, detected.id);
    setRecentDescriptions(getRecentDescriptions());
    setOpen(false);
    setSearchQuery('');
  };

  // Display value
  const displayValue = useMemo(() => {
    if (!value) return null;
    const parts = value.split(' - ');
    if (parts.length >= 2) {
      const code = parts[0];
      const desc = parts.slice(1).join(' - ');
      const category = allMainCategories.find(c => c.code === code);
      return { category, description: desc };
    }
    return null;
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10 py-2"
          dir="rtl"
        >
          {displayValue ? (
            <div className="flex items-center gap-2 text-right flex-1 min-w-0">
              {displayValue.category?.isHazardous ? (
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              ) : (
                <Leaf className="w-4 h-4 text-primary shrink-0" />
              )}
              <Badge variant="outline" className="text-xs shrink-0">
                {displayValue.category?.code}
              </Badge>
              <span className="truncate">{displayValue.description}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">اكتب وصف المخلف...</span>
          )}
          <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[450px] p-0" align="start" dir="rtl">
        <div className="p-3 space-y-3">
          {/* Search / Description Input */}
          <div className="flex items-center gap-2 border rounded-md px-3 bg-background">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              placeholder="اكتب وصف المخلف (مثال: خشب كسر بالتات، بلاستيك PET...)"
              value={selectedCategory ? customDescription : searchQuery}
              onChange={(e) => {
                if (selectedCategory) {
                  setCustomDescription(e.target.value);
                } else {
                  setSearchQuery(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (selectedCategory) {
                    handleConfirmSelection();
                  } else {
                    handleQuickAdd();
                  }
                }
              }}
              className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          {/* Selected Category Badge */}
          {selectedCategory && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <span className="text-sm text-muted-foreground">الفئة:</span>
              <Badge 
                variant={selectedCategory.isHazardous ? 'destructive' : 'secondary'}
                className="gap-1"
              >
                {selectedCategory.isHazardous ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <Leaf className="w-3 h-3" />
                )}
                {selectedCategory.name}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs mr-auto"
                onClick={() => setSelectedCategory(null)}
              >
                تغيير
              </Button>
            </div>
          )}

          {/* Quick Add Button */}
          {(searchQuery.trim() || customDescription.trim()) && (
            <Button
              className="w-full gap-2"
              onClick={selectedCategory ? handleConfirmSelection : handleQuickAdd}
            >
              <Plus className="w-4 h-4" />
              {selectedCategory 
                ? `إضافة: ${selectedCategory.code} - ${customDescription || searchQuery}`
                : `إضافة: ${searchQuery}`
              }
            </Button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto border-t">
          {/* Recent Descriptions */}
          {filteredRecent.length > 0 && !selectedCategory && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                <History className="w-3 h-3" />
                أوصاف مستخدمة سابقاً
              </div>
              {filteredRecent.map((recent, index) => {
                const recentCategory = allMainCategories.find(c => c.id === recent.categoryId);
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectRecent(recent)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md text-right"
                  >
                    {recentCategory?.isHazardous ? (
                      <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                    ) : (
                      <Leaf className="w-3 h-3 text-primary shrink-0" />
                    )}
                    <Badge variant="outline" className="text-xs shrink-0">
                      {recentCategory?.code}
                    </Badge>
                    <span className="truncate flex-1">{recent.description}</span>
                    <span className="text-xs text-muted-foreground">({recent.count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Categories - Non-Hazardous */}
          {!selectedCategory && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-primary bg-primary/5 flex items-center gap-2 sticky top-0">
                <Leaf className="w-4 h-4" />
                فئات غير خطرة
              </div>
              <div className="p-2 grid grid-cols-2 gap-1">
                {mainNonHazardousCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleSelectCategory(category)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md text-right"
                  >
                    <Badge variant="outline" className="text-xs shrink-0">
                      {category.code}
                    </Badge>
                    <span className="truncate">{category.name}</span>
                  </button>
                ))}
              </div>

              {/* Main Categories - Hazardous */}
              <div className="px-4 py-2 text-xs font-semibold text-destructive bg-destructive/5 flex items-center gap-2 sticky top-0 border-t">
                <AlertTriangle className="w-4 h-4" />
                فئات خطرة
              </div>
              <div className="p-2 grid grid-cols-2 gap-1">
                {mainHazardousCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleSelectCategory(category)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md text-right"
                  >
                    <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                    <Badge variant="outline" className="text-xs shrink-0 border-destructive/50">
                      {category.code}
                    </Badge>
                    <span className="truncate">{category.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FlexibleWasteTypeSelector;
