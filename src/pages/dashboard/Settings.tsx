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
  Brush,
  MessageSquare,
  Globe,
  UserCircle,
  Settings2
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
import PagePasswordSettings from '@/components/security/PagePasswordSettings';
import PinCodeSettings from '@/components/security/PinCodeSettings';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import AdvancedAppearanceSettings from '@/components/settings/AdvancedAppearanceSettings';
import NotificationChannelsSettings from '@/components/settings/NotificationChannelsSettings';
import WhatsAppNotificationManager from '@/components/whatsapp/WhatsAppNotificationManager';
import LanguageSettings from '@/components/settings/LanguageSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import DocumentTemplateManager from '@/components/documents/DocumentTemplateManager';
import ProfileCustomization from '@/components/settings/ProfileCustomization';
import MovementSupervisorSettings from '@/components/settings/MovementSupervisorSettings';

const Settings = () => {
  const { t } = useLanguage();

  const colorOptions: { value: ThemeColor; label: string; color: string; gradient: string }[] = [
    { value: 'green', label: t('settings.greenNatural'), color: 'bg-green-500', gradient: 'from-green-400 to-emerald-600' },
    { value: 'blue', label: t('settings.blueSky'), color: 'bg-blue-500', gradient: 'from-blue-400 to-indigo-600' },
    { value: 'purple', label: t('settings.purpleRoyal'), color: 'bg-purple-500', gradient: 'from-purple-400 to-violet-600' },
    { value: 'orange', label: t('settings.orangeWarm'), color: 'bg-orange-500', gradient: 'from-orange-400 to-amber-600' },
    { value: 'red', label: t('settings.redBold'), color: 'bg-red-500', gradient: 'from-red-400 to-rose-600' },
    { value: 'teal', label: t('settings.tealCalm'), color: 'bg-teal-500', gradient: 'from-teal-400 to-cyan-600' },
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
  { value: 'roboto', label: 'Roboto', preview: 'The quick brown fox', description: 'Google\'s signature font' },
  { value: 'open-sans', label: 'Open Sans', preview: 'The quick brown fox', description: 'Clean & versatile' },
  { value: 'montserrat', label: 'Montserrat', preview: 'The quick brown fox', description: 'Elegant geometric' },
  { value: 'poppins', label: 'Poppins', preview: 'The quick brown fox', description: 'Geometric sans-serif' },
  { value: 'nunito', label: 'Nunito', preview: 'The quick brown fox', description: 'Rounded & friendly' },
  { value: 'raleway', label: 'Raleway', preview: 'The quick brown fox', description: 'Thin elegant display' },
  { value: 'source-sans', label: 'Source Sans 3', preview: 'The quick brown fox', description: 'Adobe\'s open source' },
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

  const displayModeOptions: { value: DisplayMode; label: string; icon: typeof Monitor; description: string }[] = [
    { value: 'auto', label: t('settings.auto'), icon: MonitorSmartphone, description: t('settings.autoDesc') },
    { value: 'desktop', label: t('settings.desktop'), icon: Monitor, description: t('settings.desktopDesc') },
    { value: 'tablet', label: t('settings.tablet'), icon: Tablet, description: t('settings.tabletDesc') },
    { value: 'mobile', label: t('settings.mobile'), icon: Smartphone, description: t('settings.mobileDesc') },
  ];

  const themePresets = [
    { name: t('settings.classicGreen'), color: 'green' as ThemeColor, font: 'cairo' as FontFamily, dark: false, icon: '🌿' },
    { name: t('settings.elegantNight'), color: 'blue' as ThemeColor, font: 'tajawal' as FontFamily, dark: true, icon: '🌙' },
    { name: t('settings.modernPro'), color: 'teal' as ThemeColor, font: 'ibm-plex' as FontFamily, dark: false, icon: '💼' },
    { name: t('settings.creative'), color: 'purple' as ThemeColor, font: 'noto-kufi' as FontFamily, dark: true, icon: '🎨' },
    { name: t('settings.warmComfy'), color: 'orange' as ThemeColor, font: 'almarai' as FontFamily, dark: false, icon: '☀️' },
    { name: t('settings.boldStrong'), color: 'red' as ThemeColor, font: 'cairo' as FontFamily, dark: true, icon: '🔥' },
  ];

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

  // Read tab from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const defaultTab = searchParams.get('tab') || 'themes';

  const applyPreset = (preset: typeof themePresets[0]) => {
    setThemeColor(preset.color);
    setFontFamily(preset.font);
    if (preset.dark !== settings.isDarkMode) {
      toggleDarkMode();
    }
  };

   return (
    <div className="space-y-4 sm:space-y-6 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-l from-primary/5 via-background to-primary/10 p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between relative z-10">
          <div className="flex items-center gap-2 sm:gap-4">
            <BackButton />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Settings2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-bold truncate">{t('settings.title')}</h1>
                <p className="text-muted-foreground text-[11px] sm:text-sm truncate">{t('settings.subtitle')}</p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={resetToDefaults} className="gap-1.5 self-end sm:self-auto text-xs sm:text-sm shrink-0">
            <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {t('settings.resetDefault')}
          </Button>
        </div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pb-1">
          <TabsList className="inline-flex w-max gap-0.5 h-auto p-1.5 bg-muted/30 backdrop-blur-sm rounded-2xl border border-border/30">
            <TabsTrigger value="profile" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.profile')}</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.language')}</span>
            </TabsTrigger>
            <TabsTrigger value="themes" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.themes')}</span>
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.colors')}</span>
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
              <Type className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.typography')}</span>
            </TabsTrigger>
            <TabsTrigger value="display" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.display')}</span>
            </TabsTrigger>
            {isTransporter && (
              <TabsTrigger value="advanced-appearance" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
                <Brush className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.advancedAppearance')}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="sounds" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.sounds')}</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.automation')}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.security')}</span>
            </TabsTrigger>
            {isTransporter && (
              <TabsTrigger value="visibility" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.visibility')}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications-channels" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.notificationChannels')}</span>
            </TabsTrigger>
            <TabsTrigger value="terms" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.terms')}</span>
            </TabsTrigger>
            <TabsTrigger value="document-templates" className="gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 transition-all duration-300">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t('sidebar.docArchive')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Customization Tab */}
        <TabsContent value="profile" className="space-y-6">
          <ProfileCustomization />
        </TabsContent>

        {/* Language Tab */}
        <TabsContent value="language" className="space-y-6">
          <LanguageSettings />
        </TabsContent>

        {/* Theme Presets Tab */}
        <TabsContent value="themes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t('settings.themePresets')}
              </CardTitle>
              <CardDescription>
                {t('settings.themePresetsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
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
                      'relative p-3 sm:p-6 rounded-xl border-2 transition-all text-right overflow-hidden group touch-manipulation',
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
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-2xl sm:text-3xl">{preset.icon}</span>
                        {settings.themeColor === preset.color && 
                         settings.fontFamily === preset.font && 
                         settings.isDarkMode === preset.dark && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                          </motion.div>
                        )}
                      </div>
                      <h3 className="font-bold text-sm sm:text-lg mb-0.5 sm:mb-1 truncate">{preset.name}</h3>
                      <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-muted-foreground flex-wrap">
                        <div className={cn(
                          'w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0',
                          colorOptions.find(c => c.value === preset.color)?.color
                        )} />
                        <span className="truncate">{fontOptions.find(f => f.value === preset.font)?.label}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">{preset.dark ? 'ليلي' : 'نهاري'}</span>
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
          {/* Arabic Fonts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                الخطوط العربية
              </CardTitle>
              <CardDescription>
                مجموعة شاملة من الخطوط العربية المجانية المميزة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {arabicFontOptions.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFontFamily(option.value)}
                    className={cn(
                      'relative flex flex-col items-start p-3 rounded-xl border-2 transition-all text-right',
                      settings.fontFamily === option.value
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border hover:border-primary/50'
                    )}
                    style={{ fontFamily: `'${option.label}', sans-serif` }}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-sm">{option.label}</span>
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
                    <span className="text-lg mb-0.5">{option.preview}</span>
                    <span className="text-[10px] text-muted-foreground">{option.description}</span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* English Fonts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                English Fonts
              </CardTitle>
              <CardDescription>
                Premium free English fonts for a professional look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {englishFontOptions.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFontFamily(option.value)}
                    className={cn(
                      'relative flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left',
                      settings.fontFamily === option.value
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border hover:border-primary/50'
                    )}
                    style={{ fontFamily: `'${option.label}', sans-serif` }}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-sm">{option.label}</span>
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
                    <span className="text-lg mb-0.5">{option.preview}</span>
                    <span className="text-[10px] text-muted-foreground">{option.description}</span>
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
          <PinCodeSettings />
          <TwoFactorSetup />
          <PagePasswordSettings />
        </TabsContent>

        {/* Partner Visibility Tab - Only for Transporters */}
        {isTransporter && (
          <TabsContent value="visibility" className="space-y-6">
            <PartnerVisibilitySettings />
          </TabsContent>
        )}

        {/* Notification Channels Tab */}
        <TabsContent value="notifications-channels" className="space-y-6">
          <NotificationChannelsSettings />
          <div className="border-t my-6" />
          <WhatsAppNotificationManager />
        </TabsContent>

        {/* Terms and Conditions Tab */}
        <TabsContent value="terms" className="space-y-6">
          <OrganizationTermsSettings />
        </TabsContent>

        {/* Document Templates Tab */}
        <TabsContent value="document-templates" className="space-y-6">
          <DocumentTemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
