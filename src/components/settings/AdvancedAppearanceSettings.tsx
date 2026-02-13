import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Type, 
  Moon, 
  Sun, 
  Check,
  Layers,
  Table2,
  MapPin,
  Contrast,
  Droplets,
  Maximize2,
  Minimize2,
  LayoutGrid,
  CircleDot,
  Square,
  RectangleHorizontal,
  Download,
  Copy,
  Brush,
  Grid3X3,
  Settings2
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
import { toast } from '@/hooks/use-toast';

// Extended color options with HSL values for consistency
const colorOptions: { 
  value: ThemeColor; 
  label: string; 
  gradient: string;
  description: string;
}[] = [
  { 
    value: 'green', 
    label: 'أخضر طبيعي', 
    gradient: 'from-eco-green to-eco-emerald',
    description: 'مستوحى من الطبيعة والاستدامة'
  },
  { 
    value: 'blue', 
    label: 'أزرق سماوي', 
    gradient: 'from-blue-400 to-blue-600',
    description: 'احترافي وموثوق'
  },
  { 
    value: 'purple', 
    label: 'بنفسجي ملكي', 
    gradient: 'from-purple-400 to-purple-600',
    description: 'فاخر وإبداعي'
  },
  { 
    value: 'orange', 
    label: 'برتقالي دافئ', 
    gradient: 'from-orange-400 to-orange-600',
    description: 'نشيط ومفعم بالحيوية'
  },
  { 
    value: 'red', 
    label: 'أحمر جريء', 
    gradient: 'from-red-400 to-red-600',
    description: 'قوي ومؤثر'
  },
  { 
    value: 'teal', 
    label: 'فيروزي هادئ', 
    gradient: 'from-teal-400 to-teal-600',
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

// Advanced theme presets with categories
const themePresets = [
  { name: 'كلاسيكي أخضر', color: 'green' as ThemeColor, font: 'cairo' as FontFamily, dark: false, icon: '🌿', category: 'nature' },
  { name: 'ليلي أنيق', color: 'blue' as ThemeColor, font: 'tajawal' as FontFamily, dark: true, icon: '🌙', category: 'professional' },
  { name: 'مهني حديث', color: 'teal' as ThemeColor, font: 'ibm-plex' as FontFamily, dark: false, icon: '💼', category: 'professional' },
  { name: 'إبداعي', color: 'purple' as ThemeColor, font: 'noto-kufi' as FontFamily, dark: true, icon: '🎨', category: 'creative' },
  { name: 'دافئ ومريح', color: 'orange' as ThemeColor, font: 'almarai' as FontFamily, dark: false, icon: '☀️', category: 'warm' },
  { name: 'قوي وجريء', color: 'red' as ThemeColor, font: 'cairo' as FontFamily, dark: true, icon: '🔥', category: 'bold' },
  { name: 'طبيعة هادئة', color: 'green' as ThemeColor, font: 'almarai' as FontFamily, dark: false, icon: '🍃', category: 'nature' },
  { name: 'محيط عميق', color: 'blue' as ThemeColor, font: 'ibm-plex' as FontFamily, dark: true, icon: '🌊', category: 'nature' },
  { name: 'غروب الشمس', color: 'orange' as ThemeColor, font: 'tajawal' as FontFamily, dark: true, icon: '🌅', category: 'warm' },
  { name: 'بساطة عصرية', color: 'teal' as ThemeColor, font: 'cairo' as FontFamily, dark: false, icon: '✨', category: 'minimal' },
  { name: 'ملكي فاخر', color: 'purple' as ThemeColor, font: 'almarai' as FontFamily, dark: false, icon: '👑', category: 'creative' },
  { name: 'تقني متقدم', color: 'blue' as ThemeColor, font: 'ibm-plex' as FontFamily, dark: false, icon: '🔧', category: 'professional' },
];

const AdvancedAppearanceSettings = () => {
  const {
    settings,
    setThemeColor,
    setFontFamily,
    setFontSize,
    toggleDarkMode,
    effectiveDisplayMode,
  } = useThemeSettings();

  const [activePresetCategory, setActivePresetCategory] = useState<string>('all');

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
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Brush className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-bold text-lg">الهوية البصرية المتقدمة</h3>
            <p className="text-sm text-muted-foreground">تخصيص شامل للمظهر والتصميم</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copySettingsToClipboard}>
            <Copy className="h-4 w-4 ml-2" />
            نسخ
          </Button>
          <Button variant="outline" size="sm" onClick={exportSettings}>
            <Download className="h-4 w-4 ml-2" />
            تصدير
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
                  'w-14 h-14 rounded-2xl bg-gradient-to-br shadow-lg flex items-center justify-center',
                  colorOptions.find(c => c.value === settings.themeColor)?.gradient
                )}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {settings.isDarkMode ? (
                  <Moon className="h-7 w-7 text-primary-foreground" />
                ) : (
                  <Sun className="h-7 w-7 text-primary-foreground" />
                )}
              </motion.div>
              <div>
                <h4 className="font-bold">الثيم الحالي</h4>
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
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="presets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
          <TabsTrigger value="presets" className="gap-2">
            <Layers className="h-4 w-4" />
            <span>ثيمات جاهزة</span>
          </TabsTrigger>
          <TabsTrigger value="contrast" className="gap-2">
            <Table2 className="h-4 w-4" />
            <span>تباين الجداول</span>
          </TabsTrigger>
          <TabsTrigger value="components" className="gap-2">
            <CircleDot className="h-4 w-4" />
            <span>المكونات</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            <span>معاينة شاملة</span>
          </TabsTrigger>
        </TabsList>

        {/* Extended Presets Tab */}
        <TabsContent value="presets" className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={activePresetCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePresetCategory('all')}
            >
              الكل ({themePresets.length})
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredPresets.map((preset, index) => (
                <motion.button
                  key={preset.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all text-right overflow-hidden group',
                    settings.themeColor === preset.color && 
                    settings.fontFamily === preset.font && 
                    settings.isDarkMode === preset.dark
                      ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="relative z-10 flex items-center gap-3">
                    <span className="text-2xl">{preset.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-bold">{preset.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {fontOptions.find(f => f.value === preset.font)?.label} • {preset.dark ? 'ليلي' : 'نهاري'}
                      </p>
                    </div>
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
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Table Contrast Tab */}
        <TabsContent value="contrast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="h-5 w-5 text-primary" />
                معاينة تباين الجداول والخرائط
              </CardTitle>
              <CardDescription>
                اختبار قابلية القراءة في جداول البيانات مع الثيم الحالي
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data Table Preview */}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-right font-bold text-sm">رقم الشحنة</th>
                      <th className="p-3 text-right font-bold text-sm">الحالة</th>
                      <th className="p-3 text-right font-bold text-sm">التاريخ</th>
                      <th className="p-3 text-right font-bold text-sm">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-sm">SHP-2026-001</td>
                      <td className="p-3"><Badge className="bg-primary text-primary-foreground">مكتمل</Badge></td>
                      <td className="p-3 text-muted-foreground text-sm">2026/02/08</td>
                      <td className="p-3 font-bold text-primary">5,000 ج.م</td>
                    </tr>
                    <tr className="border-t bg-muted/30 hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-sm">SHP-2026-002</td>
                      <td className="p-3"><Badge variant="secondary">قيد التنفيذ</Badge></td>
                      <td className="p-3 text-muted-foreground text-sm">2026/02/07</td>
                      <td className="p-3 font-bold text-primary">3,200 ر.س</td>
                    </tr>
                    <tr className="border-t hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-sm">SHP-2026-003</td>
                      <td className="p-3"><Badge variant="destructive">ملغي</Badge></td>
                      <td className="p-3 text-muted-foreground text-sm">2026/02/06</td>
                      <td className="p-3 font-bold text-muted-foreground">0 ر.س</td>
                    </tr>
                    <tr className="border-t bg-muted/30 hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-sm">SHP-2026-004</td>
                      <td className="p-3"><Badge variant="outline">معلق</Badge></td>
                      <td className="p-3 text-muted-foreground text-sm">2026/02/05</td>
                      <td className="p-3 font-bold text-primary">7,800 ر.س</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Map Settings */}
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    إعدادات عرض الخرائط
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="font-medium">تكيف ألوان الخريطة</Label>
                      <p className="text-xs text-muted-foreground">تغيير ألوان الخريطة مع الوضع الليلي</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="font-medium">علامات عالية التباين</Label>
                      <p className="text-xs text-muted-foreground">استخدام ألوان أوضح للعلامات</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-4">
          {/* Button Styles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleDot className="h-5 w-5 text-primary" />
                أنماط الأزرار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              </div>
            </CardContent>
          </Card>

          {/* Cards & Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Square className="h-4 w-4 text-primary" />
                  أنماط البطاقات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg border card-interactive">
                  <p className="text-sm font-medium">بطاقة تفاعلية</p>
                  <p className="text-xs text-muted-foreground">تتفاعل عند التمرير</p>
                </div>
                <div className="p-3 rounded-lg border border-primary/30 shadow-eco-sm">
                  <p className="text-sm font-medium">بطاقة مميزة</p>
                  <p className="text-xs text-muted-foreground">مع ظل إيكو</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">الشارات والتسميات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>افتراضي</Badge>
                  <Badge variant="secondary">ثانوي</Badge>
                  <Badge variant="outline">محدد</Badge>
                  <Badge variant="destructive">تحذير</Badge>
                  <Badge className="bg-primary/20 text-primary border-0">مخصص</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-primary" />
                معاينة لوحة التحكم
              </CardTitle>
              <CardDescription>
                عرض كامل للتصميم مع جميع الإعدادات المطبقة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Dashboard Preview */}
              <div className="border rounded-xl overflow-hidden">
                {/* Header */}
                <div className="bg-card p-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">ن</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm">شركة النقل</h5>
                      <p className="text-xs text-muted-foreground">لوحة التحكم</p>
                    </div>
                  </div>
                  <Button size="sm">إجراء جديد</Button>
                </div>

                {/* Content */}
                <div className="p-3 grid grid-cols-3 gap-3">
                  <Card className="border-primary/20">
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">الشحنات</p>
                      <p className="text-xl font-bold text-primary">234</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">السائقون</p>
                      <p className="text-xl font-bold">45</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">الإيرادات</p>
                      <p className="text-xl font-bold">89K</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar Preview */}
                <div className="grid grid-cols-4 border-t">
                  <div className="bg-sidebar p-3 space-y-1 border-l">
                    {['الرئيسية', 'الشحنات', 'السائقون', 'الإعدادات'].map((item, i) => (
                      <div
                        key={item}
                        className={cn(
                          'p-2 rounded-md text-xs transition-colors cursor-pointer',
                          i === 3 ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'hover:bg-sidebar-accent text-sidebar-foreground'
                        )}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="col-span-3 p-3 bg-background">
                    <p className="text-sm text-muted-foreground">
                      هذه معاينة للمحتوى الرئيسي مع تطبيق إعدادات المظهر.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAppearanceSettings;
