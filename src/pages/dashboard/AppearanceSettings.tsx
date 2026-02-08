import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Type, 
  Moon, 
  Sun, 
  RotateCcw, 
  Monitor, 
  Tablet, 
  Smartphone, 
  MonitorSmartphone,
  Check,
  Sparkles,
  Eye,
  Layers,
  Grid3X3,
  Table2,
  MapPin,
  Paintbrush,
  Contrast,
  SunMedium,
  Droplets,
  Maximize2,
  Minimize2,
  LayoutGrid,
  CircleDot,
  Square,
  RectangleHorizontal,
  Settings2,
  Save,
  Download,
  Upload,
  Share2,
  Copy,
  Wand2,
  Brush
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useThemeSettings, ThemeColor, FontFamily, DisplayMode } from '@/contexts/ThemeSettingsContext';
import { cn } from '@/lib/utils';
import BackButton from '@/components/ui/back-button';
import { toast } from '@/hooks/use-toast';

// Extended color options with HSL values for consistency
const colorOptions: { 
  value: ThemeColor; 
  label: string; 
  color: string; 
  gradient: string;
  hsl: string;
  description: string;
}[] = [
  { 
    value: 'green', 
    label: 'أخضر طبيعي', 
    color: 'bg-green-500', 
    gradient: 'from-green-400 to-emerald-600',
    hsl: '142 71% 45%',
    description: 'مستوحى من الطبيعة والاستدامة'
  },
  { 
    value: 'blue', 
    label: 'أزرق سماوي', 
    color: 'bg-blue-500', 
    gradient: 'from-blue-400 to-indigo-600',
    hsl: '217 91% 60%',
    description: 'احترافي وموثوق'
  },
  { 
    value: 'purple', 
    label: 'بنفسجي ملكي', 
    color: 'bg-purple-500', 
    gradient: 'from-purple-400 to-violet-600',
    hsl: '262 83% 58%',
    description: 'فاخر وإبداعي'
  },
  { 
    value: 'orange', 
    label: 'برتقالي دافئ', 
    color: 'bg-orange-500', 
    gradient: 'from-orange-400 to-amber-600',
    hsl: '25 95% 53%',
    description: 'نشيط ومفعم بالحيوية'
  },
  { 
    value: 'red', 
    label: 'أحمر جريء', 
    color: 'bg-red-500', 
    gradient: 'from-red-400 to-rose-600',
    hsl: '0 72% 51%',
    description: 'قوي ومؤثر'
  },
  { 
    value: 'teal', 
    label: 'فيروزي هادئ', 
    color: 'bg-teal-500', 
    gradient: 'from-teal-400 to-cyan-600',
    hsl: '174 84% 32%',
    description: 'هادئ ومتوازن'
  },
];

const fontOptions: { 
  value: FontFamily; 
  label: string; 
  preview: string; 
  description: string;
  weights: string;
}[] = [
  { value: 'cairo', label: 'Cairo', preview: 'خط القاهرة', description: 'خط عصري ومريح للقراءة', weights: '300-800' },
  { value: 'tajawal', label: 'Tajawal', preview: 'خط تجوال', description: 'خط أنيق وواضح', weights: '300-800' },
  { value: 'almarai', label: 'Almarai', preview: 'خط المراعي', description: 'خط احترافي وبسيط', weights: '300-800' },
  { value: 'ibm-plex', label: 'IBM Plex', preview: 'خط آي بي إم', description: 'خط تقني متطور', weights: '300-700' },
  { value: 'noto-kufi', label: 'Noto Kufi', preview: 'خط نوتو كوفي', description: 'خط كوفي عربي أصيل', weights: '300-700' },
];

const displayModeOptions: { 
  value: DisplayMode; 
  label: string; 
  icon: typeof Monitor; 
  description: string;
  breakpoint: string;
}[] = [
  { value: 'auto', label: 'تلقائي', icon: MonitorSmartphone, description: 'يتكيف مع حجم الشاشة', breakpoint: 'متغير' },
  { value: 'desktop', label: 'سطح المكتب', icon: Monitor, description: 'عرض كامل للشاشات الكبيرة', breakpoint: '≥1024px' },
  { value: 'tablet', label: 'تابلت', icon: Tablet, description: 'عرض متوسط للأجهزة اللوحية', breakpoint: '640-1023px' },
  { value: 'mobile', label: 'هاتف', icon: Smartphone, description: 'عرض مضغوط للهواتف', breakpoint: '<640px' },
];

// Advanced theme presets
const themePresets = [
  { 
    name: 'كلاسيكي أخضر', 
    color: 'green' as ThemeColor, 
    font: 'cairo' as FontFamily, 
    dark: false,
    icon: '🌿',
    category: 'nature'
  },
  { 
    name: 'ليلي أنيق', 
    color: 'blue' as ThemeColor, 
    font: 'tajawal' as FontFamily, 
    dark: true,
    icon: '🌙',
    category: 'professional'
  },
  { 
    name: 'مهني حديث', 
    color: 'teal' as ThemeColor, 
    font: 'ibm-plex' as FontFamily, 
    dark: false,
    icon: '💼',
    category: 'professional'
  },
  { 
    name: 'إبداعي', 
    color: 'purple' as ThemeColor, 
    font: 'noto-kufi' as FontFamily, 
    dark: true,
    icon: '🎨',
    category: 'creative'
  },
  { 
    name: 'دافئ ومريح', 
    color: 'orange' as ThemeColor, 
    font: 'almarai' as FontFamily, 
    dark: false,
    icon: '☀️',
    category: 'warm'
  },
  { 
    name: 'قوي وجريء', 
    color: 'red' as ThemeColor, 
    font: 'cairo' as FontFamily, 
    dark: true,
    icon: '🔥',
    category: 'bold'
  },
  { 
    name: 'طبيعة هادئة', 
    color: 'green' as ThemeColor, 
    font: 'almarai' as FontFamily, 
    dark: false,
    icon: '🍃',
    category: 'nature'
  },
  { 
    name: 'محيط عميق', 
    color: 'blue' as ThemeColor, 
    font: 'ibm-plex' as FontFamily, 
    dark: true,
    icon: '🌊',
    category: 'nature'
  },
  { 
    name: 'غروب الشمس', 
    color: 'orange' as ThemeColor, 
    font: 'tajawal' as FontFamily, 
    dark: true,
    icon: '🌅',
    category: 'warm'
  },
  { 
    name: 'بساطة عصرية', 
    color: 'teal' as ThemeColor, 
    font: 'cairo' as FontFamily, 
    dark: false,
    icon: '✨',
    category: 'minimal'
  },
  { 
    name: 'ملكي فاخر', 
    color: 'purple' as ThemeColor, 
    font: 'almarai' as FontFamily, 
    dark: false,
    icon: '👑',
    category: 'creative'
  },
  { 
    name: 'تقني متقدم', 
    color: 'blue' as ThemeColor, 
    font: 'ibm-plex' as FontFamily, 
    dark: false,
    icon: '🔧',
    category: 'professional'
  },
];

// Component style previews
const buttonStylePreviews = [
  { name: 'أساسي', variant: 'default' as const },
  { name: 'ثانوي', variant: 'secondary' as const },
  { name: 'محدد', variant: 'outline' as const },
  { name: 'شبح', variant: 'ghost' as const },
  { name: 'رابط', variant: 'link' as const },
];

const AppearanceSettings = () => {
  const {
    settings,
    setThemeColor,
    setFontFamily,
    setFontSize,
    setDisplayMode,
    toggleDarkMode,
    resetToDefaults,
    effectiveDisplayMode,
  } = useThemeSettings();

  const [activePresetCategory, setActivePresetCategory] = useState<string>('all');
  const [customCSSEnabled, setCustomCSSEnabled] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filteredPresets = useMemo(() => {
    if (activePresetCategory === 'all') return themePresets;
    return themePresets.filter(p => p.category === activePresetCategory);
  }, [activePresetCategory]);

  const applyPreset = (preset: typeof themePresets[0]) => {
    setThemeColor(preset.color);
    setFontFamily(preset.font);
    if (preset.dark !== settings.isDarkMode) {
      toggleDarkMode();
    }
    toast({
      title: 'تم تطبيق الثيم',
      description: `تم تطبيق ثيم "${preset.name}" بنجاح`,
    });
  };

  const exportSettings = () => {
    const settingsData = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appearance-settings.json';
    a.click();
    toast({
      title: 'تم تصدير الإعدادات',
      description: 'تم حفظ إعدادات المظهر بنجاح',
    });
  };

  const copySettingsToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ الإعدادات إلى الحافظة',
    });
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Paintbrush className="h-6 w-6 text-primary" />
              إعدادات المظهر
            </h1>
            <p className="text-muted-foreground">تخصيص الهوية البصرية ونظام التصميم</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={copySettingsToClipboard}>
            <Copy className="h-4 w-4 ml-2" />
            نسخ
          </Button>
          <Button variant="outline" size="sm" onClick={exportSettings}>
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 ml-2" />
            استعادة
          </Button>
        </div>
      </div>

      {/* Current Theme Summary */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className={cn(
                  'w-16 h-16 rounded-2xl bg-gradient-to-br shadow-lg flex items-center justify-center',
                  colorOptions.find(c => c.value === settings.themeColor)?.gradient
                )}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {settings.isDarkMode ? (
                  <Moon className="h-8 w-8 text-white" />
                ) : (
                  <Sun className="h-8 w-8 text-white" />
                )}
              </motion.div>
              <div>
                <h3 className="font-bold text-lg">الثيم الحالي</h3>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <Badge variant="secondary">
                    {colorOptions.find(c => c.value === settings.themeColor)?.label}
                  </Badge>
                  <Badge variant="outline">
                    {fontOptions.find(f => f.value === settings.fontFamily)?.label}
                  </Badge>
                  <Badge variant="outline">
                    {settings.isDarkMode ? 'ليلي' : 'نهاري'}
                  </Badge>
                  <Badge variant="outline">
                    {settings.fontSize}px
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">وضع العرض الفعلي</p>
              <p className="font-medium flex items-center gap-2">
                {effectiveDisplayMode === 'desktop' && <Monitor className="h-4 w-4" />}
                {effectiveDisplayMode === 'tablet' && <Tablet className="h-4 w-4" />}
                {effectiveDisplayMode === 'mobile' && <Smartphone className="h-4 w-4" />}
                {displayModeOptions.find(d => d.value === effectiveDisplayMode)?.label}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="presets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto gap-1">
          <TabsTrigger value="presets" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Sparkles className="h-4 w-4" />
            <span>ثيمات</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Palette className="h-4 w-4" />
            <span>الألوان</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Type className="h-4 w-4" />
            <span>الخطوط</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Eye className="h-4 w-4" />
            <span>العرض</span>
          </TabsTrigger>
          <TabsTrigger value="components" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Layers className="h-4 w-4" />
            <span>المكونات</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Grid3X3 className="h-4 w-4" />
            <span>معاينة</span>
          </TabsTrigger>
        </TabsList>

        {/* Presets Tab */}
        <TabsContent value="presets" className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={activePresetCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePresetCategory('all')}
            >
              الكل
            </Button>
            <Button
              variant={activePresetCategory === 'nature' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePresetCategory('nature')}
            >
              🌿 طبيعة
            </Button>
            <Button
              variant={activePresetCategory === 'professional' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePresetCategory('professional')}
            >
              💼 مهني
            </Button>
            <Button
              variant={activePresetCategory === 'creative' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePresetCategory('creative')}
            >
              🎨 إبداعي
            </Button>
            <Button
              variant={activePresetCategory === 'warm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePresetCategory('warm')}
            >
              ☀️ دافئ
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredPresets.map((preset, index) => (
                <motion.button
                  key={preset.name}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    'relative p-5 rounded-xl border-2 transition-all text-right overflow-hidden group',
                    settings.themeColor === preset.color && 
                    settings.fontFamily === preset.font && 
                    settings.isDarkMode === preset.dark
                      ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className={cn(
                    'absolute inset-0 opacity-10 bg-gradient-to-br transition-opacity group-hover:opacity-20',
                    colorOptions.find(c => c.value === preset.color)?.gradient
                  )} />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{preset.icon}</span>
                      {settings.themeColor === preset.color && 
                       settings.fontFamily === preset.font && 
                       settings.isDarkMode === preset.dark && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                        >
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </motion.div>
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-1">{preset.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className={cn(
                        'w-4 h-4 rounded-full',
                        colorOptions.find(c => c.value === preset.color)?.color
                      )} />
                      <span>{fontOptions.find(f => f.value === preset.font)?.label}</span>
                      <span>•</span>
                      <span>{preset.dark ? 'ليلي' : 'نهاري'}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          {/* Dark Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Contrast className="h-5 w-5 text-primary" />
                وضع الإضاءة
              </CardTitle>
              <CardDescription>
                اختر بين الوضع النهاري والليلي لراحة عينيك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => settings.isDarkMode && toggleDarkMode()}
                  className={cn(
                    'p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3',
                    !settings.isDarkMode
                      ? 'border-primary bg-primary/10 shadow-lg'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="w-16 h-16 rounded-full gradient-eco-light flex items-center justify-center shadow-lg">
                    <Sun className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold">الوضع النهاري</h4>
                    <p className="text-sm text-muted-foreground">مثالي للإضاءة العالية</p>
                  </div>
                  {!settings.isDarkMode && (
                    <Badge className="bg-primary">مفعّل</Badge>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !settings.isDarkMode && toggleDarkMode()}
                  className={cn(
                    'p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3',
                    settings.isDarkMode
                      ? 'border-primary bg-primary/10 shadow-lg'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <Moon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold">الوضع الليلي</h4>
                    <p className="text-sm text-muted-foreground">مريح للعين في الإضاءة المنخفضة</p>
                  </div>
                  {settings.isDarkMode && (
                    <Badge className="bg-primary">مفعّل</Badge>
                  )}
                </motion.button>
              </div>
            </CardContent>
          </Card>

          {/* Theme Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                لوحة الألوان الأساسية
              </CardTitle>
              <CardDescription>
                اختر اللون الرئيسي للهوية البصرية - يُطبّق على الأزرار والروابط والعناصر التفاعلية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {colorOptions.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setThemeColor(option.value)}
                    className={cn(
                      'relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all group',
                      settings.themeColor === option.value
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <motion.div 
                      className={cn(
                        'w-14 h-14 rounded-full bg-gradient-to-br shadow-lg',
                        option.gradient
                      )}
                      whileHover={{ rotate: 10 }}
                    />
                    <div className="text-center">
                      <span className="text-sm font-bold block">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                    {settings.themeColor === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 left-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                      >
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Contrast Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="h-5 w-5 text-primary" />
                معاينة التباين في الجداول
              </CardTitle>
              <CardDescription>
                اختبار قابلية القراءة في جداول البيانات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-right font-bold">رقم الشحنة</th>
                      <th className="p-3 text-right font-bold">الحالة</th>
                      <th className="p-3 text-right font-bold">التاريخ</th>
                      <th className="p-3 text-right font-bold">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t hover:bg-muted/50 transition-colors">
                      <td className="p-3">SHP-2026-001</td>
                      <td className="p-3"><Badge className="bg-primary">مكتمل</Badge></td>
                      <td className="p-3 text-muted-foreground">2026/02/08</td>
                      <td className="p-3 font-bold text-primary">5,000 ر.س</td>
                    </tr>
                    <tr className="border-t bg-muted/30 hover:bg-muted/50 transition-colors">
                      <td className="p-3">SHP-2026-002</td>
                      <td className="p-3"><Badge variant="secondary">قيد التنفيذ</Badge></td>
                      <td className="p-3 text-muted-foreground">2026/02/07</td>
                      <td className="p-3 font-bold text-primary">3,200 ر.س</td>
                    </tr>
                    <tr className="border-t hover:bg-muted/50 transition-colors">
                      <td className="p-3">SHP-2026-003</td>
                      <td className="p-3"><Badge variant="destructive">ملغي</Badge></td>
                      <td className="p-3 text-muted-foreground">2026/02/06</td>
                      <td className="p-3 font-bold text-muted-foreground">0 ر.س</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          {/* Font Family */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                عائلة الخط
              </CardTitle>
              <CardDescription>
                اختر الخط المناسب للقراءة - جميع الخطوط تدعم اللغة العربية بشكل كامل
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fontOptions.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFontFamily(option.value)}
                    className={cn(
                      'relative flex flex-col items-start p-5 rounded-xl border-2 transition-all text-right',
                      settings.fontFamily === option.value
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border hover:border-primary/50'
                    )}
                    style={{ fontFamily: `'${option.label}', sans-serif` }}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div>
                        <span className="font-bold text-lg block">{option.label}</span>
                        <span className="text-xs text-muted-foreground">أوزان: {option.weights}</span>
                      </div>
                      {settings.fontFamily === option.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                        >
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </motion.div>
                      )}
                    </div>
                    <span className="text-2xl mb-2">{option.preview}</span>
                    <span className="text-sm text-muted-foreground">{option.description}</span>
                    <div className="mt-3 pt-3 border-t w-full">
                      <span className="text-xs">أبجد هوز حطي كلمن سعفص قرشت</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Font Size */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Maximize2 className="h-5 w-5 text-primary" />
                حجم الخط الأساسي
              </CardTitle>
              <CardDescription>
                تحكم في حجم النص لسهولة القراءة - الحجم الافتراضي 16 بكسل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Minimize2 className="h-5 w-5 text-muted-foreground" />
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                  min={14}
                  max={20}
                  step={1}
                  className="flex-1"
                />
                <Maximize2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">14px (صغير)</span>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {settings.fontSize}px
                </Badge>
                <span className="text-sm text-muted-foreground">20px (كبير)</span>
              </div>
              
              {/* Typography Preview */}
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <h4 className="font-bold text-lg">معاينة النص</h4>
                <h1 className="text-2xl font-bold">عنوان رئيسي</h1>
                <h2 className="text-xl font-semibold">عنوان فرعي</h2>
                <p className="text-base">هذا نص عادي يمثل المحتوى الأساسي. يجب أن يكون واضحاً وسهل القراءة في جميع الأحجام.</p>
                <p className="text-sm text-muted-foreground">هذا نص ثانوي أصغر حجماً يُستخدم للتفاصيل والتعليقات.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-primary" />
                وضع العرض
              </CardTitle>
              <CardDescription>
                اختر وضع العرض المناسب - الوضع التلقائي يتكيف مع حجم شاشتك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {displayModeOptions.map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDisplayMode(option.value)}
                      className={cn(
                        'relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all',
                        settings.displayMode === option.value
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center',
                        settings.displayMode === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="text-center">
                        <span className="font-bold block">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                        <Badge variant="outline" className="mt-2">{option.breakpoint}</Badge>
                      </div>
                      {settings.displayMode === option.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 left-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                        >
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Map Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                إعدادات عرض الخرائط
              </CardTitle>
              <CardDescription>
                تخصيص مظهر الخرائط لضمان الوضوح في جميع أوضاع الإضاءة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label className="font-medium">تكيف ألوان الخريطة</Label>
                  <p className="text-sm text-muted-foreground">تغيير ألوان الخريطة تلقائياً مع الوضع الليلي</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label className="font-medium">علامات عالية التباين</Label>
                  <p className="text-sm text-muted-foreground">استخدام ألوان أكثر وضوحاً للعلامات على الخريطة</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label className="font-medium">تأثيرات الظل</Label>
                  <p className="text-sm text-muted-foreground">إضافة ظلال للعلامات لتحسين الرؤية</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          {/* Button Styles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleDot className="h-5 w-5 text-primary" />
                أنماط الأزرار
              </CardTitle>
              <CardDescription>
                معاينة جميع أنماط الأزرار المتوفرة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">زر أساسي</Button>
                  <Button variant="secondary">زر ثانوي</Button>
                  <Button variant="outline">زر محدد</Button>
                  <Button variant="ghost">زر شبح</Button>
                  <Button variant="link">زر رابط</Button>
                  <Button variant="destructive">زر حذف</Button>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-3">
                  <Button size="sm">صغير</Button>
                  <Button size="default">عادي</Button>
                  <Button size="lg">كبير</Button>
                  <Button size="icon"><Settings2 className="h-4 w-4" /></Button>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-3">
                  <Button variant="eco">زر إيكو</Button>
                  <Button variant="ecoOutline">إيكو محدد</Button>
                  <Button variant="hero">زر بطل</Button>
                  <Button variant="heroOutline">بطل محدد</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Styles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Square className="h-5 w-5 text-primary" />
                أنماط البطاقات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="card-interactive">
                  <CardContent className="pt-6">
                    <h4 className="font-bold">بطاقة تفاعلية</h4>
                    <p className="text-sm text-muted-foreground mt-2">تتفاعل عند التمرير</p>
                  </CardContent>
                </Card>
                <Card className="border-primary/30 shadow-eco-md">
                  <CardContent className="pt-6">
                    <h4 className="font-bold">بطاقة مميزة</h4>
                    <p className="text-sm text-muted-foreground mt-2">مع ظل إيكو</p>
                  </CardContent>
                </Card>
                <Card className="glass-eco">
                  <CardContent className="pt-6">
                    <h4 className="font-bold">بطاقة زجاجية</h4>
                    <p className="text-sm text-muted-foreground mt-2">تأثير الزجاج</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RectangleHorizontal className="h-5 w-5 text-primary" />
                عناصر النماذج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>حقل نصي</Label>
                  <Input placeholder="أدخل النص هنا..." />
                </div>
                <div className="space-y-2">
                  <Label>قائمة منسدلة</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر خياراً" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">الخيار الأول</SelectItem>
                      <SelectItem value="2">الخيار الثاني</SelectItem>
                      <SelectItem value="3">الخيار الثالث</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>منطقة نص</Label>
                  <Textarea placeholder="أدخل وصفاً مفصلاً..." />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>الشارات والتسميات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>افتراضي</Badge>
                <Badge variant="secondary">ثانوي</Badge>
                <Badge variant="outline">محدد</Badge>
                <Badge variant="destructive">تحذير</Badge>
                <Badge className="bg-primary/20 text-primary">مخصص</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                معاينة شاملة
              </CardTitle>
              <CardDescription>
                عرض كامل للتصميم مع جميع الإعدادات المطبقة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dashboard Preview */}
              <div className="border rounded-xl overflow-hidden">
                {/* Header */}
                <div className="bg-card p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold">آ</span>
                    </div>
                    <div>
                      <h4 className="font-bold">لوحة التحكم</h4>
                      <p className="text-xs text-muted-foreground">نظام إدارة النفايات</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm">إجراء جديد</Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-primary/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                          <p className="text-2xl font-bold text-primary">1,234</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Layers className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">السائقون النشطون</p>
                          <p className="text-2xl font-bold">45</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <MapPin className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">الإيرادات</p>
                          <p className="text-2xl font-bold">89,500</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Sparkles className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Table Preview */}
                <div className="p-4">
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-3 text-right text-sm font-bold">#</th>
                          <th className="p-3 text-right text-sm font-bold">العنوان</th>
                          <th className="p-3 text-right text-sm font-bold">الحالة</th>
                          <th className="p-3 text-right text-sm font-bold">الإجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-3 text-sm">1</td>
                          <td className="p-3 text-sm">شحنة نفايات صناعية</td>
                          <td className="p-3"><Badge>نشط</Badge></td>
                          <td className="p-3"><Button size="sm" variant="outline">عرض</Button></td>
                        </tr>
                        <tr className="border-t bg-muted/30">
                          <td className="p-3 text-sm">2</td>
                          <td className="p-3 text-sm">نفايات إلكترونية</td>
                          <td className="p-3"><Badge variant="secondary">قيد الانتظار</Badge></td>
                          <td className="p-3"><Button size="sm" variant="outline">عرض</Button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sidebar Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="bg-sidebar rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-sidebar-foreground mb-4">القائمة الجانبية</h4>
                  {['الرئيسية', 'الشحنات', 'السائقون', 'التقارير', 'الإعدادات'].map((item, i) => (
                    <div
                      key={item}
                      className={cn(
                        'p-3 rounded-lg transition-colors cursor-pointer',
                        i === 4 ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'hover:bg-sidebar-accent'
                      )}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <div className="lg:col-span-3 bg-background rounded-xl border p-4">
                  <h4 className="font-bold mb-4">المحتوى الرئيسي</h4>
                  <p className="text-muted-foreground">
                    هذه معاينة للمحتوى الرئيسي مع تطبيق جميع إعدادات المظهر الحالية.
                    يمكنك رؤية كيف تؤثر الألوان والخطوط على مظهر التطبيق بالكامل.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Save Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-6 z-50"
      >
        <Card className="shadow-lg border-primary/20">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm">الإعدادات تُحفظ تلقائياً</span>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AppearanceSettings;
