import { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Type, Moon, Sun, Sunset, RotateCcw, Settings2, Check, Monitor, Tablet, Smartphone, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useThemeSettings, ThemeColor, FontFamily, DisplayMode, VisualMode } from '@/contexts/ThemeSettingsContext';
import { cn } from '@/lib/utils';

const colorOptions: { value: ThemeColor; label: string; color: string }[] = [
  { value: 'green', label: 'أخضر', color: 'bg-green-500' },
  { value: 'blue', label: 'أزرق', color: 'bg-blue-500' },
  { value: 'purple', label: 'بنفسجي', color: 'bg-purple-500' },
  { value: 'orange', label: 'برتقالي', color: 'bg-orange-500' },
  { value: 'red', label: 'أحمر', color: 'bg-red-500' },
  { value: 'teal', label: 'فيروزي', color: 'bg-teal-500' },
];

const fontOptions: { value: FontFamily; label: string; preview: string }[] = [
  { value: 'cairo', label: 'Cairo', preview: 'خط القاهرة' },
  { value: 'tajawal', label: 'Tajawal', preview: 'خط تجوال' },
  { value: 'almarai', label: 'Almarai', preview: 'خط المراعي' },
  { value: 'ibm-plex', label: 'IBM Plex', preview: 'خط آي بي إم' },
  { value: 'noto-kufi', label: 'Noto Kufi', preview: 'خط نوتو كوفي' },
  { value: 'amiri', label: 'Amiri', preview: 'خط أميري' },
  { value: 'reem-kufi', label: 'Reem Kufi', preview: 'خط ريم كوفي' },
  { value: 'readex-pro', label: 'Readex Pro', preview: 'خط ريدكس برو' },
  { value: 'el-messiri', label: 'El Messiri', preview: 'خط المسيري' },
  { value: 'changa', label: 'Changa', preview: 'خط شانجا' },
  { value: 'inter', label: 'Inter', preview: 'Modern Font' },
  { value: 'poppins', label: 'Poppins', preview: 'Geometric Font' },
  { value: 'montserrat', label: 'Montserrat', preview: 'Elegant Font' },
  { value: 'space-grotesk', label: 'Space Grotesk', preview: 'Tech Font' },
  { value: 'plus-jakarta', label: 'Jakarta Sans', preview: 'Sharp Font' },
];

const displayModeOptions: { value: DisplayMode; label: string; icon: typeof Monitor }[] = [
  { value: 'auto', label: 'تلقائي', icon: MonitorSmartphone },
  { value: 'desktop', label: 'سطح المكتب', icon: Monitor },
  { value: 'tablet', label: 'تابلت', icon: Tablet },
  { value: 'mobile', label: 'هاتف', icon: Smartphone },
];

const visualModeOptions: { value: VisualMode; label: string; icon: typeof Sun; desc: string }[] = [
  { value: 'light', label: 'نهاري', icon: Sun, desc: 'خطوط Cairo — مريح للنهار' },
  { value: 'dim', label: 'مسائي', icon: Sunset, desc: 'خطوط Tajawal — دافئ للمساء' },
  { value: 'dark', label: 'ليلي', icon: Moon, desc: 'خطوط Readex Pro — مريح للعين' },
];

const ThemeCustomizer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    settings,
    setThemeColor,
    setFontFamily,
    setFontSize,
    setDisplayMode,
    setVisualMode,
    toggleDarkMode,
    resetToDefaults,
    effectiveDisplayMode,
  } = useThemeSettings();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="تخصيص المظهر"
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            تخصيص المظهر
          </SheetTitle>
          <SheetDescription>
            اختر الألوان والخطوط التي تناسبك
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          {/* Visual Mode (Light / Dim / Dark) */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              وضع الراحة البصرية
            </label>
            <div className="grid grid-cols-3 gap-2">
              {visualModeOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = settings.visualMode === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setVisualMode(opt.value)}
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all',
                      isActive
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">{opt.desc}</span>
                    {isActive && (
                      <motion.div layoutId="visual-check" className="absolute top-1 left-1">
                        <Check className="h-3 w-3 text-primary" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Display Mode */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4" />
              وضع العرض
            </label>
            <div className="grid grid-cols-2 gap-2">
              {displayModeOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDisplayMode(option.value)}
                    className={cn(
                      'relative flex items-center gap-2 p-3 rounded-lg border-2 transition-all',
                      settings.displayMode === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-sm font-medium">{option.label}</span>
                    {settings.displayMode === option.value && (
                      <motion.div
                        layoutId="display-check"
                        className="absolute top-1 left-1"
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
            {settings.displayMode === 'auto' && (
              <p className="text-xs text-muted-foreground">
                الوضع الحالي: {effectiveDisplayMode === 'desktop' ? 'سطح المكتب' : effectiveDisplayMode === 'tablet' ? 'تابلت' : 'هاتف'}
              </p>
            )}
          </div>

          {/* Theme Colors */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              لون الثيم
            </label>
            <div className="grid grid-cols-3 gap-3">
              {colorOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setThemeColor(option.value)}
                  className={cn(
                    'relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                    settings.themeColor === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-full', option.color)} />
                  <span className="text-xs font-medium">{option.label}</span>
                  {settings.themeColor === option.value && (
                    <motion.div
                      layoutId="color-check"
                      className="absolute top-1 left-1"
                    >
                      <Check className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Type className="h-4 w-4" />
              نوع الخط
            </label>
            <div className="space-y-2">
              {fontOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ x: -4 }}
                  onClick={() => setFontFamily(option.value)}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-right',
                    settings.fontFamily === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                  style={{ fontFamily: `'${option.label}', sans-serif` }}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.preview}</span>
                  </div>
                  {settings.fontFamily === option.value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">حجم الخط</label>
              <span className="text-sm text-muted-foreground">{settings.fontSize}px</span>
            </div>
            <Slider
              value={[settings.fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              min={14}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>صغير</span>
              <span>كبير</span>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <label className="text-sm font-medium">معاينة</label>
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-bold text-lg mb-2">نص تجريبي</h3>
              <p className="text-muted-foreground text-sm">
                هذا نص تجريبي لمعاينة الإعدادات الحالية للثيم والخط.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm">زر أساسي</Button>
                <Button size="sm" variant="outline">زر ثانوي</Button>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={resetToDefaults}
          >
            <RotateCcw className="h-4 w-4 ml-2" />
            استعادة الإعدادات الافتراضية
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ThemeCustomizer;
