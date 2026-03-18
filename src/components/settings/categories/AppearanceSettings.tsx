import { motion } from 'framer-motion';
import {
  Palette, Type, Moon, Sun, Check, Sparkles, Eye,
  Monitor, Tablet, Smartphone, MonitorSmartphone, Brush
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useThemeSettings, ThemeColor, FontFamily, DisplayMode } from '@/contexts/ThemeSettingsContext';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import AdvancedAppearanceSettings from '@/components/settings/AdvancedAppearanceSettings';

interface Props {
  showAdvanced?: boolean;
}

const colorOptions: { value: ThemeColor; label: string; color: string; gradient: string }[] = [
  { value: 'green', label: 'أخضر طبيعي', color: 'bg-green-500', gradient: 'from-green-400 to-emerald-600' },
  { value: 'blue', label: 'أزرق سماوي', color: 'bg-blue-500', gradient: 'from-blue-400 to-indigo-600' },
  { value: 'purple', label: 'بنفسجي ملكي', color: 'bg-purple-500', gradient: 'from-purple-400 to-violet-600' },
  { value: 'orange', label: 'برتقالي دافئ', color: 'bg-orange-500', gradient: 'from-orange-400 to-amber-600' },
  { value: 'red', label: 'أحمر جريء', color: 'bg-red-500', gradient: 'from-red-400 to-rose-600' },
  { value: 'teal', label: 'تيل هادئ', color: 'bg-teal-500', gradient: 'from-teal-400 to-cyan-600' },
];

const arabicFontOptions: { value: FontFamily; label: string; preview: string; description: string }[] = [
  { value: 'cairo', label: 'Cairo', preview: 'خط القاهرة', description: 'خط عصري ومريح للقراءة' },
  { value: 'tajawal', label: 'Tajawal', preview: 'خط تجوال', description: 'خط أنيق وواضح' },
  { value: 'almarai', label: 'Almarai', preview: 'خط المراعي', description: 'خط احترافي وبسيط' },
  { value: 'ibm-plex', label: 'IBM Plex Arabic', preview: 'خط آي بي إم', description: 'خط تقني متطور' },
  { value: 'noto-kufi', label: 'Noto Kufi', preview: 'خط نوتو كوفي', description: 'خط كوفي عربي أصيل' },
  { value: 'amiri', label: 'Amiri', preview: 'خط أميري', description: 'خط نسخي تقليدي فاخر' },
  { value: 'harmattan', label: 'Harmattan', preview: 'خط هرمتان', description: 'خط واضح للقراءة الطويلة' },
  { value: 'scheherazade', label: 'Scheherazade', preview: 'خط شهرزاد', description: 'خط نسخي كلاسيكي رائع' },
  { value: 'reem-kufi', label: 'Reem Kufi', preview: 'خط ريم كوفي', description: 'خط كوفي عصري ومتوازن' },
  { value: 'aref-ruqaa', label: 'Aref Ruqaa', preview: 'خط عارف رقعة', description: 'خط رقعة تقليدي جميل' },
  { value: 'lemonada', label: 'Lemonada', preview: 'خط ليموناضة', description: 'خط مرح ومبتكر' },
  { value: 'marhey', label: 'Marhey', preview: 'خط مرحي', description: 'خط ديكوري ملفت' },
  { value: 'readex-pro', label: 'Readex Pro', preview: 'خط ريدكس برو', description: 'خط حديث عالي الوضوح' },
  { value: 'baloo-bhaijaan', label: 'Baloo Bhaijaan', preview: 'خط بالو بيجان', description: 'خط مستدير ودافئ' },
  { value: 'changa', label: 'Changa', preview: 'خط شانجا', description: 'خط هندسي أنيق' },
  { value: 'el-messiri', label: 'El Messiri', preview: 'خط المسيري', description: 'خط عربي عصري مميز' },
  { value: 'lalezar', label: 'Lalezar', preview: 'خط لاله‌زار', description: 'خط عناوين قوي وعريض' },
  { value: 'rakkas', label: 'Rakkas', preview: 'خط رقّاص', description: 'خط ديواني فني رائع' },
  { value: 'mirza', label: 'Mirza', preview: 'خط ميرزا', description: 'خط نستعليق أنيق' },
  { value: 'katibeh', label: 'Katibeh', preview: 'خط كاتبة', description: 'خط عناوين ملفت ومميز' },
];

const englishFontOptions: { value: FontFamily; label: string; preview: string; description: string }[] = [
  { value: 'inter', label: 'Inter', preview: 'The quick brown fox', description: 'Modern & highly readable' },
  { value: 'roboto', label: 'Roboto', preview: 'The quick brown fox', description: "Google's signature font" },
  { value: 'open-sans', label: 'Open Sans', preview: 'The quick brown fox', description: 'Clean & versatile' },
  { value: 'montserrat', label: 'Montserrat', preview: 'The quick brown fox', description: 'Elegant geometric' },
  { value: 'poppins', label: 'Poppins', preview: 'The quick brown fox', description: 'Geometric sans-serif' },
  { value: 'nunito', label: 'Nunito', preview: 'The quick brown fox', description: 'Rounded & friendly' },
  { value: 'raleway', label: 'Raleway', preview: 'The quick brown fox', description: 'Thin elegant display' },
  { value: 'source-sans', label: 'Source Sans 3', preview: 'The quick brown fox', description: "Adobe's open source" },
  { value: 'work-sans', label: 'Work Sans', preview: 'The quick brown fox', description: 'Optimized for screens' },
  { value: 'dm-sans', label: 'DM Sans', preview: 'The quick brown fox', description: 'Low-contrast geometric' },
  { value: 'space-grotesk', label: 'Space Grotesk', preview: 'The quick brown fox', description: 'Tech & futuristic' },
  { value: 'outfit', label: 'Outfit', preview: 'The quick brown fox', description: 'Geometric & modern' },
  { value: 'plus-jakarta', label: 'Plus Jakarta Sans', preview: 'The quick brown fox', description: 'Contemporary & sharp' },
  { value: 'manrope', label: 'Manrope', preview: 'The quick brown fox', description: 'Semi-rounded modern' },
  { value: 'sora', label: 'Sora', preview: 'The quick brown fox', description: 'Bold & expressive' },
  { value: 'lexend', label: 'Lexend', preview: 'The quick brown fox', description: 'Designed for readability' },
  { value: 'red-hat', label: 'Red Hat Display', preview: 'The quick brown fox', description: 'Professional & clean' },
  { value: 'be-vietnam', label: 'Be Vietnam Pro', preview: 'The quick brown fox', description: 'Vietnamese-inspired' },
  { value: 'cabinet-grotesk', label: 'Josefin Sans', preview: 'The quick brown fox', description: 'Elegant vintage feel' },
  { value: 'general-sans', label: 'General Sans', preview: 'The quick brown fox', description: 'Versatile & neutral' },
];

const fontOptions = [...arabicFontOptions, ...englishFontOptions];

const AppearanceSettings = ({ showAdvanced = false }: Props) => {
  const { t } = useLanguage();
  const {
    settings, setThemeColor, setFontFamily, setFontSize,
    setDisplayMode, toggleDarkMode, effectiveDisplayMode,
  } = useThemeSettings();

  const themePresets = [
    { name: 'الأخضر الكلاسيكي', color: 'green' as ThemeColor, font: 'cairo' as FontFamily, dark: false, icon: '🌿' },
    { name: 'الليل الأنيق', color: 'blue' as ThemeColor, font: 'tajawal' as FontFamily, dark: true, icon: '🌙' },
    { name: 'المودرن', color: 'teal' as ThemeColor, font: 'ibm-plex' as FontFamily, dark: false, icon: '💼' },
    { name: 'الإبداعي', color: 'purple' as ThemeColor, font: 'noto-kufi' as FontFamily, dark: true, icon: '🎨' },
    { name: 'الدافئ', color: 'orange' as ThemeColor, font: 'almarai' as FontFamily, dark: false, icon: '☀️' },
    { name: 'الجريء', color: 'red' as ThemeColor, font: 'cairo' as FontFamily, dark: true, icon: '🔥' },
  ];

  const displayModeOptions: { value: DisplayMode; label: string; icon: typeof Monitor; description: string }[] = [
    { value: 'auto', label: 'تلقائي', icon: MonitorSmartphone, description: 'يتكيف مع حجم الشاشة' },
    { value: 'desktop', label: 'سطح المكتب', icon: Monitor, description: 'عرض كامل العناصر' },
    { value: 'tablet', label: 'تابلت', icon: Tablet, description: 'مناسب للشاشات المتوسطة' },
    { value: 'mobile', label: 'هاتف', icon: Smartphone, description: 'مضغوط للشاشات الصغيرة' },
  ];

  const applyPreset = (preset: typeof themePresets[0]) => {
    setThemeColor(preset.color);
    setFontFamily(preset.font);
    if (preset.dark !== settings.isDarkMode) toggleDarkMode();
  };

  return (
    <Tabs defaultValue="themes" className="space-y-4">
      <div className="overflow-x-auto scrollbar-thin pb-1">
        <TabsList className="inline-flex w-max gap-0.5 h-auto p-1 bg-muted/30 backdrop-blur-sm rounded-xl border border-border/30">
          <TabsTrigger value="themes" className="gap-1.5 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />قوالب
          </TabsTrigger>
          <TabsTrigger value="colors" className="gap-1.5 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Palette className="h-3.5 w-3.5" />ألوان
          </TabsTrigger>
          <TabsTrigger value="typography" className="gap-1.5 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Type className="h-3.5 w-3.5" />خطوط
          </TabsTrigger>
          <TabsTrigger value="display" className="gap-1.5 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Eye className="h-3.5 w-3.5" />عرض
          </TabsTrigger>
          {showAdvanced && (
            <TabsTrigger value="advanced" className="gap-1.5 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Brush className="h-3.5 w-3.5" />متقدم
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      {/* Themes */}
      <TabsContent value="themes">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />قوالب جاهزة</CardTitle>
            <CardDescription className="text-xs">اختر قالباً لتطبيقه فوراً</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
              {themePresets.map((preset, i) => (
                <motion.button key={preset.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => applyPreset(preset)}
                  className={cn('relative p-3 rounded-xl border-2 text-right overflow-hidden',
                    settings.themeColor === preset.color && settings.fontFamily === preset.font && settings.isDarkMode === preset.dark
                      ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                  )}>
                  <div className={cn('absolute inset-0 opacity-10 bg-gradient-to-br', colorOptions.find(c => c.value === preset.color)?.gradient)} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{preset.icon}</span>
                      {settings.themeColor === preset.color && settings.fontFamily === preset.font && settings.isDarkMode === preset.dark && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-sm truncate">{preset.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <div className={cn('w-3 h-3 rounded-full shrink-0', colorOptions.find(c => c.value === preset.color)?.color)} />
                      <span className="truncate">{fontOptions.find(f => f.value === preset.font)?.label}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Colors */}
      <TabsContent value="colors" className="space-y-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div animate={{ rotate: settings.isDarkMode ? 0 : 180 }}>
                  {settings.isDarkMode ? <Moon className="h-6 w-6 text-primary" /> : <Sun className="h-6 w-6 text-primary" />}
                </motion.div>
                <div>
                  <p className="font-medium text-sm">{settings.isDarkMode ? 'الوضع الليلي' : 'الوضع النهاري'}</p>
                  <p className="text-xs text-muted-foreground">{settings.isDarkMode ? 'مريح للإضاءة المنخفضة' : 'مثالي للاستخدام النهاري'}</p>
                </div>
              </div>
              <Switch checked={settings.isDarkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4 text-primary" />لون الثيم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {colorOptions.map((option) => (
                <motion.button key={option.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setThemeColor(option.value)}
                  className={cn('relative flex flex-col items-center gap-2 p-3 rounded-xl border-2',
                    settings.themeColor === option.value ? 'border-primary bg-primary/10 shadow-lg' : 'border-border hover:border-primary/50'
                  )}>
                  <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br shadow-md', option.gradient)} />
                  <span className="text-xs font-medium">{option.label}</span>
                  {settings.themeColor === option.value && (
                    <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Typography */}
      <TabsContent value="typography" className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Type className="h-4 w-4 text-primary" />الخطوط العربية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {arabicFontOptions.map((option) => (
                <motion.button key={option.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setFontFamily(option.value)}
                  className={cn('flex flex-col items-start p-2.5 rounded-lg border-2 text-right',
                    settings.fontFamily === option.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  )} style={{ fontFamily: `'${option.label}', sans-serif` }}>
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <span className="font-bold text-xs">{option.label}</span>
                    {settings.fontFamily === option.value && (
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm">{option.preview}</span>
                  <span className="text-[9px] text-muted-foreground">{option.description}</span>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Type className="h-4 w-4 text-primary" />English Fonts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {englishFontOptions.map((option) => (
                <motion.button key={option.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setFontFamily(option.value)}
                  className={cn('flex flex-col items-start p-2.5 rounded-lg border-2 text-left',
                    settings.fontFamily === option.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  )} style={{ fontFamily: `'${option.label}', sans-serif` }}>
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <span className="font-bold text-xs">{option.label}</span>
                    {settings.fontFamily === option.value && (
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm">{option.preview}</span>
                  <span className="text-[9px] text-muted-foreground">{option.description}</span>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">حجم الخط</Label>
              <span className="text-xl font-bold text-primary">{settings.fontSize}px</span>
            </div>
            <Slider value={[settings.fontSize]} onValueChange={(v) => setFontSize(v[0])} min={14} max={20} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>صغير (14px)</span>
              <span>كبير (20px)</span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Display */}
      <TabsContent value="display" className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><MonitorSmartphone className="h-4 w-4 text-primary" />وضع العرض</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {displayModeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <motion.button key={option.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setDisplayMode(option.value)}
                    className={cn('flex items-center gap-3 p-4 rounded-xl border-2',
                      settings.displayMode === option.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    )}>
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
                      settings.displayMode === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-right flex-1">
                      <span className="font-bold text-sm block">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            {settings.displayMode === 'auto' && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                الوضع المكتشف: <strong className="text-foreground">
                  {effectiveDisplayMode === 'desktop' ? 'سطح المكتب' : effectiveDisplayMode === 'tablet' ? 'تابلت' : 'هاتف'}
                </strong>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">معاينة المظهر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
              <h3 className="font-bold text-lg">نص عنوان تجريبي</h3>
              <p className="text-sm text-muted-foreground">هذا نص تجريبي لمعاينة إعدادات الثيم والخط الحالية.</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">زر أساسي</Button>
                <Button size="sm" variant="secondary">زر ثانوي</Button>
                <Button size="sm" variant="outline">زر خارجي</Button>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-2.5 bg-primary/10 rounded-lg text-center">
                  <span className="text-xl font-bold text-primary">١٢٣</span>
                  <p className="text-[10px] text-muted-foreground">إحصائية</p>
                </div>
                <div className="p-2.5 bg-muted rounded-lg text-center">
                  <span className="text-xl font-bold">٤٥٦</span>
                  <p className="text-[10px] text-muted-foreground">بيانات</p>
                </div>
                <div className="p-2.5 bg-primary text-primary-foreground rounded-lg text-center">
                  <span className="text-xl font-bold">٧٨٩</span>
                  <p className="text-[10px] opacity-80">نتائج</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Advanced */}
      {showAdvanced && (
        <TabsContent value="advanced">
          <AdvancedAppearanceSettings />
        </TabsContent>
      )}
    </Tabs>
  );
};

export default AppearanceSettings;
