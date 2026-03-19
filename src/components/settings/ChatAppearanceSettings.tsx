import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Type, Minimize2, Clock, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatAppearance, type BubbleStyle } from '@/contexts/ChatAppearanceContext';

const BUBBLE_OPTIONS: { id: BubbleStyle; label: string; description: string; emoji: string }[] = [
  { id: 'rounded', label: 'مستدير', description: 'الشكل الافتراضي', emoji: '💬' },
  { id: 'sharp', label: 'حاد', description: 'زوايا مربعة', emoji: '🔲' },
  { id: 'minimal', label: 'بسيط', description: 'بدون ظل أو حدود', emoji: '✨' },
  { id: 'classic', label: 'كلاسيكي', description: 'مثل واتساب', emoji: '📱' },
];

const FONT_SIZES = [
  { value: 12, label: 'صغير جداً' },
  { value: 13, label: 'صغير' },
  { value: 14, label: 'عادي' },
  { value: 16, label: 'متوسط' },
  { value: 18, label: 'كبير' },
  { value: 20, label: 'كبير جداً' },
];

const ChatAppearanceSettings = () => {
  const {
    fontSize, bubbleStyle, showTimestamp, compactMode,
    setFontSize, setBubbleStyle, setShowTimestamp, setCompactMode,
    getBubbleClasses, textStyle,
  } = useChatAppearance();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          تخصيص مظهر الدردشة
        </CardTitle>
        <CardDescription>
          حجم الخط ونمط الفقاعات — تُحفظ الإعدادات تلقائياً وتنتقل معك بين الأجهزة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Font Size */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-muted-foreground" />
            <Label className="font-medium">حجم خط الرسائل</Label>
            <Badge variant="secondary" className="text-xs mr-auto">{fontSize}px</Badge>
          </div>
          <Slider
            value={[fontSize]}
            min={12}
            max={20}
            step={1}
            onValueChange={(v) => setFontSize(v[0])}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            {FONT_SIZES.map(s => (
              <span key={s.value} className={cn(fontSize === s.value && 'text-primary font-semibold')}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Bubble Style */}
        <div className="space-y-3">
          <Label className="font-medium">نمط فقاعات الرسائل</Label>
          <div className="grid grid-cols-2 gap-2">
            {BUBBLE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setBubbleStyle(opt.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center",
                  bubbleStyle === opt.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                )}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground">{opt.description}</span>
                {bubbleStyle === opt.id && <Badge className="text-[10px] h-4">مفعّل</Badge>}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">إظهار الوقت</p>
                <p className="text-xs text-muted-foreground">عرض وقت الرسالة أسفل الفقاعة</p>
              </div>
            </div>
            <Switch checked={showTimestamp} onCheckedChange={setShowTimestamp} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Minimize2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">الوضع المضغوط</p>
                <p className="text-xs text-muted-foreground">تقليل المسافات بين الرسائل</p>
              </div>
            </div>
            <Switch checked={compactMode} onCheckedChange={setCompactMode} />
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <Label className="font-medium text-sm text-muted-foreground">معاينة فورية</Label>
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2" dir="rtl">
            {/* Incoming message */}
            <div className={cn("flex justify-end", compactMode ? "mb-0.5" : "mb-1")}>
              <div className="max-w-[70%]">
                <div className={getBubbleClasses(false)}>
                  <p className="text-[10px] font-semibold text-primary mb-0.5">أحمد محمد</p>
                  <p style={textStyle} className="whitespace-pre-wrap">السلام عليكم، هل الشحنة جاهزة؟ 📦</p>
                  {showTimestamp && (
                    <div className="flex items-center gap-1 mt-0.5 justify-end">
                      <span className="text-[9px] text-muted-foreground">10:30 AM</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Own message */}
            <div className={cn("flex justify-start", compactMode ? "mb-0.5" : "mb-1")}>
              <div className="max-w-[70%]">
                <div className={getBubbleClasses(true)}>
                  <p style={textStyle} className="whitespace-pre-wrap">نعم، تم التجهيز وسيتم الشحن اليوم ✅</p>
                  {showTimestamp && (
                    <div className="flex items-center gap-1 mt-0.5 justify-start">
                      <span className={cn("text-[9px]", bubbleStyle === 'minimal' ? 'text-muted-foreground' : 'text-primary-foreground/60')}>10:32 AM</span>
                      <CheckCheck className={cn("w-3.5 h-3.5", bubbleStyle === 'minimal' ? 'text-blue-400' : 'text-primary-foreground/60')} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Another incoming */}
            <div className={cn("flex justify-end", compactMode ? "mb-0.5" : "mb-1")}>
              <div className="max-w-[70%]">
                <div className={getBubbleClasses(false)}>
                  <p style={textStyle} className="whitespace-pre-wrap">ممتاز، شكراً لك 🙏</p>
                  {showTimestamp && (
                    <div className="flex items-center gap-1 mt-0.5 justify-end">
                      <span className="text-[9px] text-muted-foreground">10:33 AM</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatAppearanceSettings;
