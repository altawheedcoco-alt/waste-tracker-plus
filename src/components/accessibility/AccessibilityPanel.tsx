import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAccessibility } from '@/hooks/useAccessibility';
import { 
  Accessibility, 
  Eye, 
  Type, 
  Sparkles, 
  Keyboard, 
  Focus, 
  Volume2,
  RotateCcw 
} from 'lucide-react';

export const AccessibilityPanel = () => {
  const { settings, toggleSetting, resetSettings, announce } = useAccessibility();

  const handleToggle = (key: keyof typeof settings, label: string) => {
    toggleSetting(key);
    announce(`${label}: ${settings[key] ? 'معطل' : 'مفعل'}`);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] sm:bottom-52 left-3 sm:left-4 z-40 w-10 h-10 sm:w-14 sm:h-14 rounded-full shadow-lg bg-background touch-manipulation"
          data-accessibility-trigger
          aria-label="إعدادات إمكانية الوصول"
        >
          <Accessibility className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            إمكانية الوصول
          </SheetTitle>
          <SheetDescription>
            تخصيص إعدادات العرض لتحسين تجربة الاستخدام
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Visual Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">إعدادات العرض</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="high-contrast">تباين عالي</Label>
              </div>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={() => handleToggle('highContrast', 'تباين عالي')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Type className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="large-text">نص كبير</Label>
              </div>
              <Switch
                id="large-text"
                checked={settings.largeText}
                onCheckedChange={() => handleToggle('largeText', 'نص كبير')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="reduced-motion">تقليل الحركة</Label>
              </div>
              <Switch
                id="reduced-motion"
                checked={settings.reducedMotion}
                onCheckedChange={() => handleToggle('reducedMotion', 'تقليل الحركة')}
              />
            </div>
          </div>

          <Separator />

          {/* Navigation Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">إعدادات التنقل</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Keyboard className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="keyboard-nav">تنقل بلوحة المفاتيح</Label>
              </div>
              <Switch
                id="keyboard-nav"
                checked={settings.keyboardNavigation}
                onCheckedChange={() => handleToggle('keyboardNavigation', 'تنقل بلوحة المفاتيح')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Focus className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="focus-indicators">مؤشرات التركيز</Label>
              </div>
              <Switch
                id="focus-indicators"
                checked={settings.focusIndicators}
                onCheckedChange={() => handleToggle('focusIndicators', 'مؤشرات التركيز')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="screen-reader">وضع قارئ الشاشة</Label>
              </div>
              <Switch
                id="screen-reader"
                checked={settings.screenReaderMode}
                onCheckedChange={() => handleToggle('screenReaderMode', 'وضع قارئ الشاشة')}
              />
            </div>
          </div>

          <Separator />

          {/* Keyboard Shortcuts */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">اختصارات لوحة المفاتيح</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>الرجوع للصفحة السابقة</span>
                <kbd className="px-2 py-1 bg-muted rounded">Backspace</kbd>
              </div>
              <div className="flex justify-between">
                <span>إغلاق النافذة الحالية</span>
                <kbd className="px-2 py-1 bg-muted rounded">Escape</kbd>
              </div>
              <div className="flex justify-between">
                <span>طباعة المستند</span>
                <kbd className="px-2 py-1 bg-muted rounded">Ctrl + P</kbd>
              </div>
              <div className="flex justify-between">
                <span>تحميل PDF</span>
                <kbd className="px-2 py-1 bg-muted rounded">Ctrl + D</kbd>
              </div>
              <div className="flex justify-between">
                <span>البحث السريع</span>
                <kbd className="px-2 py-1 bg-muted rounded">Ctrl + K</kbd>
              </div>
              <div className="flex justify-between">
                <span>التنقل السريع للأقسام</span>
                <kbd className="px-2 py-1 bg-muted rounded">Alt + 1-9</kbd>
              </div>
              <div className="flex justify-between">
                <span>دليل الاختصارات الكامل</span>
                <kbd className="px-2 py-1 bg-muted rounded">Ctrl + /</kbd>
              </div>
            </div>
          </div>

          <Separator />

          {/* Reset Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              resetSettings();
              announce('تم إعادة تعيين جميع الإعدادات');
            }}
          >
            <RotateCcw className="h-4 w-4 ml-2" />
            إعادة تعيين الإعدادات
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
