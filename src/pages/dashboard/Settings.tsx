import { motion } from 'framer-motion';
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
  Volume2,
  Shield,
  FileText,
  Lock,
  Zap,
  Brush
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useThemeSettings, ThemeColor, FontFamily, DisplayMode } from '@/contexts/ThemeSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import BackButton from '@/components/ui/back-button';
import NotificationSoundSettings from '@/components/settings/NotificationSoundSettings';
import PartnerVisibilitySettings from '@/components/settings/PartnerVisibilitySettings';
import OrganizationTermsSettings from '@/components/settings/OrganizationTermsSettings';
import TwoFactorSetup from '@/components/security/TwoFactorSetup';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import AdvancedAppearanceSettings from '@/components/settings/AdvancedAppearanceSettings';

const colorOptions: { value: ThemeColor; label: string; color: string; gradient: string }[] = [
  { value: 'green', label: 'أخضر طبيعي', color: 'bg-green-500', gradient: 'from-green-400 to-emerald-600' },
  { value: 'blue', label: 'أزرق سماوي', color: 'bg-blue-500', gradient: 'from-blue-400 to-indigo-600' },
  { value: 'purple', label: 'بنفسجي ملكي', color: 'bg-purple-500', gradient: 'from-purple-400 to-violet-600' },
  { value: 'orange', label: 'برتقالي دافئ', color: 'bg-orange-500', gradient: 'from-orange-400 to-amber-600' },
  { value: 'red', label: 'أحمر جريء', color: 'bg-red-500', gradient: 'from-red-400 to-rose-600' },
  { value: 'teal', label: 'فيروزي هادئ', color: 'bg-teal-500', gradient: 'from-teal-400 to-cyan-600' },
];

const fontOptions: { value: FontFamily; label: string; preview: string; description: string }[] = [
  { value: 'cairo', label: 'Cairo', preview: 'خط القاهرة', description: 'خط عصري ومريح للقراءة' },
  { value: 'tajawal', label: 'Tajawal', preview: 'خط تجوال', description: 'خط أنيق وواضح' },
  { value: 'almarai', label: 'Almarai', preview: 'خط المراعي', description: 'خط احترافي وبسيط' },
  { value: 'ibm-plex', label: 'IBM Plex', preview: 'خط آي بي إم', description: 'خط تقني متطور' },
  { value: 'noto-kufi', label: 'Noto Kufi', preview: 'خط نوتو كوفي', description: 'خط كوفي عربي أصيل' },
];

const displayModeOptions: { value: DisplayMode; label: string; icon: typeof Monitor; description: string }[] = [
  { value: 'auto', label: 'تلقائي', icon: MonitorSmartphone, description: 'يتكيف مع حجم الشاشة' },
  { value: 'desktop', label: 'سطح المكتب', icon: Monitor, description: 'عرض كامل للشاشات الكبيرة' },
  { value: 'tablet', label: 'تابلت', icon: Tablet, description: 'عرض متوسط للأجهزة اللوحية' },
  { value: 'mobile', label: 'هاتف', icon: Smartphone, description: 'عرض مضغوط للهواتف' },
];

// Predefined theme presets
const themePresets = [
  { 
    name: 'كلاسيكي أخضر', 
    color: 'green' as ThemeColor, 
    font: 'cairo' as FontFamily, 
    dark: false,
    icon: '🌿'
  },
  { 
    name: 'ليلي أنيق', 
    color: 'blue' as ThemeColor, 
    font: 'tajawal' as FontFamily, 
    dark: true,
    icon: '🌙'
  },
  { 
    name: 'مهني حديث', 
    color: 'teal' as ThemeColor, 
    font: 'ibm-plex' as FontFamily, 
    dark: false,
    icon: '💼'
  },
  { 
    name: 'إبداعي', 
    color: 'purple' as ThemeColor, 
    font: 'noto-kufi' as FontFamily, 
    dark: true,
    icon: '🎨'
  },
  { 
    name: 'دافئ ومريح', 
    color: 'orange' as ThemeColor, 
    font: 'almarai' as FontFamily, 
    dark: false,
    icon: '☀️'
  },
  { 
    name: 'قوي وجريء', 
    color: 'red' as ThemeColor, 
    font: 'cairo' as FontFamily, 
    dark: true,
    icon: '🔥'
  },
];

const Settings = () => {
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

  const { organization } = useAuth();
  const isTransporter = organization?.organization_type === 'transporter';

  const applyPreset = (preset: typeof themePresets[0]) => {
    setThemeColor(preset.color);
    setFontFamily(preset.font);
    if (preset.dark !== settings.isDarkMode) {
      toggleDarkMode();
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">الإعدادات</h1>
            <p className="text-muted-foreground">تخصيص مظهر وإعدادات لوحة التحكم</p>
          </div>
        </div>
        <Button variant="outline" onClick={resetToDefaults}>
          <RotateCcw className="h-4 w-4 ml-2" />
          استعادة الافتراضي
        </Button>
      </div>

      <Tabs defaultValue="themes" className="space-y-6">
        <TabsList className={cn(
          "grid w-full lg:w-auto lg:inline-grid overflow-x-auto",
          isTransporter ? "grid-cols-10" : "grid-cols-9"
        )}>
          <TabsTrigger value="themes" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">ثيمات جاهزة</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">الألوان</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="gap-2">
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">الخطوط</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">العرض</span>
          </TabsTrigger>
          {isTransporter && (
            <TabsTrigger value="advanced-appearance" className="gap-2">
              <Brush className="h-4 w-4" />
              <span className="hidden sm:inline">الهوية البصرية</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="sounds" className="gap-2">
            <Volume2 className="h-4 w-4" />
            <span className="hidden sm:inline">الأصوات</span>
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">الأتمتة</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">الأمان</span>
          </TabsTrigger>
          {isTransporter && (
            <TabsTrigger value="visibility" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">الصلاحيات</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="terms" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">الشروط والأحكام</span>
          </TabsTrigger>
        </TabsList>

        {/* Theme Presets Tab */}
        <TabsContent value="themes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                ثيمات جاهزة
              </CardTitle>
              <CardDescription>
                اختر من مجموعة ثيمات مصممة مسبقاً لتطبيقها بنقرة واحدة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {themePresets.map((preset, index) => (
                  <motion.button
                    key={preset.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      'relative p-6 rounded-xl border-2 transition-all text-right overflow-hidden group',
                      settings.themeColor === preset.color && 
                      settings.fontFamily === preset.font && 
                      settings.isDarkMode === preset.dark
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {/* Background gradient */}
                    <div className={cn(
                      'absolute inset-0 opacity-10 bg-gradient-to-br',
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          {/* Dark Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {settings.isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                الوضع الليلي
              </CardTitle>
              <CardDescription>
                تبديل بين الوضع النهاري والليلي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ 
                      rotate: settings.isDarkMode ? 0 : 180,
                      scale: settings.isDarkMode ? 1 : 0.8
                    }}
                  >
                    {settings.isDarkMode ? (
                      <Moon className="h-8 w-8 text-primary" />
                    ) : (
                      <Sun className="h-8 w-8 text-primary" />
                    )}
                  </motion.div>
                  <div>
                    <p className="font-medium">{settings.isDarkMode ? 'الوضع الليلي مفعّل' : 'الوضع النهاري مفعّل'}</p>
                    <p className="text-sm text-muted-foreground">
                      {settings.isDarkMode ? 'مريح للعين في الإضاءة المنخفضة' : 'مثالي للاستخدام النهاري'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.isDarkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                لون الثيم الأساسي
              </CardTitle>
              <CardDescription>
                اختر اللون الرئيسي للواجهة والأزرار
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
                      'relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all',
                      settings.themeColor === option.value
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <motion.div 
                      className={cn(
                        'w-12 h-12 rounded-full bg-gradient-to-br shadow-lg',
                        option.gradient
                      )}
                      whileHover={{ rotate: 10 }}
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                    {settings.themeColor === option.value && (
                      <motion.div
                        layoutId="color-check"
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
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          {/* Font Family */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                نوع الخط
              </CardTitle>
              <CardDescription>
                اختر الخط المناسب لك من مجموعة الخطوط العربية
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
                      'relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-right',
                      settings.fontFamily === option.value
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border hover:border-primary/50'
                    )}
                    style={{ fontFamily: `'${option.label}', sans-serif` }}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="font-bold text-lg">{option.label}</span>
                      {settings.fontFamily === option.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                        >
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </div>
                    <span className="text-xl mb-1">{option.preview}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Font Size */}
          <Card>
            <CardHeader>
              <CardTitle>حجم الخط</CardTitle>
              <CardDescription>
                تعديل حجم النص في الواجهة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label>الحجم الحالي</Label>
                <span className="text-2xl font-bold text-primary">{settings.fontSize}px</span>
              </div>
              <Slider
                value={[settings.fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                min={14}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="text-xs">أ</span>
                  <span>صغير (14px)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg">أ</span>
                  <span>كبير (20px)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MonitorSmartphone className="h-5 w-5 text-primary" />
                وضع العرض
              </CardTitle>
              <CardDescription>
                اختر كيفية عرض الواجهة بناءً على تفضيلاتك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayModeOptions.map((option, index) => {
                  const IconComponent = option.icon;
                  return (
                    <motion.button
                      key={option.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDisplayMode(option.value)}
                      className={cn(
                        'relative flex items-center gap-4 p-5 rounded-xl border-2 transition-all',
                        settings.displayMode === option.value
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center transition-colors',
                        settings.displayMode === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}>
                        <IconComponent className="h-7 w-7" />
                      </div>
                      <div className="text-right flex-1">
                        <span className="font-bold text-lg block">{option.label}</span>
                        <span className="text-sm text-muted-foreground">{option.description}</span>
                      </div>
                      {settings.displayMode === option.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                        >
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              {settings.displayMode === 'auto' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-4 bg-muted/50 rounded-lg"
                >
                  <p className="text-sm text-muted-foreground">
                    الوضع المكتشف حالياً: <strong className="text-foreground">
                      {effectiveDisplayMode === 'desktop' ? 'سطح المكتب' : 
                       effectiveDisplayMode === 'tablet' ? 'تابلت' : 'هاتف'}
                    </strong>
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle>معاينة المظهر</CardTitle>
              <CardDescription>
                شاهد كيف ستبدو الإعدادات الحالية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 rounded-xl border bg-card shadow-sm space-y-4">
                <h3 className="font-bold text-xl">نص عنوان تجريبي</h3>
                <p className="text-muted-foreground">
                  هذا نص تجريبي لمعاينة الإعدادات الحالية للثيم والخط. يمكنك رؤية كيف ستظهر النصوص والألوان في الواجهة الفعلية.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button>زر أساسي</Button>
                  <Button variant="secondary">زر ثانوي</Button>
                  <Button variant="outline">زر خارجي</Button>
                  <Button variant="ghost">زر شفاف</Button>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-center">
                    <span className="text-2xl font-bold text-primary">١٢٣</span>
                    <p className="text-xs text-muted-foreground">إحصائية</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <span className="text-2xl font-bold">٤٥٦</span>
                    <p className="text-xs text-muted-foreground">بيانات</p>
                  </div>
                  <div className="p-3 bg-primary text-primary-foreground rounded-lg text-center">
                    <span className="text-2xl font-bold">٧٨٩</span>
                    <p className="text-xs opacity-80">نتائج</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Appearance Tab - Only for Transporters */}
        {isTransporter && (
          <TabsContent value="advanced-appearance" className="space-y-6">
            <AdvancedAppearanceSettings />
          </TabsContent>
        )}

        {/* Sounds Tab */}
        <TabsContent value="sounds" className="space-y-6">
          <NotificationSoundSettings />
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                الإجراءات التلقائية
              </CardTitle>
              <CardDescription>
                إدارة أتمتة العمليات والمهام التلقائية في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AutomationSettingsDialog>
                <Button className="w-full gap-2" size="lg">
                  <Zap className="h-5 w-5" />
                  فتح إعدادات الأتمتة
                </Button>
              </AutomationSettingsDialog>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                أكثر من 150 إجراء تلقائي متاح للتفعيل
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <TwoFactorSetup />
        </TabsContent>

        {/* Partner Visibility Tab - Only for Transporters */}
        {isTransporter && (
          <TabsContent value="visibility" className="space-y-6">
            <PartnerVisibilitySettings />
          </TabsContent>
        )}

        {/* Terms and Conditions Tab */}
        <TabsContent value="terms" className="space-y-6">
          <OrganizationTermsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
