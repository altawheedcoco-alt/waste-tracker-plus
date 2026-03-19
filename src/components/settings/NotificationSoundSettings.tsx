import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Volume2, VolumeX, Play, Bell, Package, Truck, CheckCircle, 
  AlertCircle, FileText, MessageSquare, ClipboardCheck, Send,
  Moon, Clock, Palette, Sliders
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  NotificationSoundType, 
  SOUND_LABELS,
  previewNotificationSound,
  playThemeSound,
} from '@/hooks/useNotificationSound';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { cn } from '@/lib/utils';

// Sound theme definitions
type SoundTheme = 'classic' | 'gentle' | 'modern' | 'minimal' | 'professional' | 'playful';

const SOUND_THEMES: { id: SoundTheme; label: string; description: string; emoji: string }[] = [
  { id: 'classic', label: 'كلاسيكي', description: 'أصوات واضحة ومميزة', emoji: '🔔' },
  { id: 'gentle', label: 'هادئ', description: 'نغمات ناعمة ومريحة', emoji: '🌿' },
  { id: 'modern', label: 'عصري', description: 'أصوات حديثة ومقتضبة', emoji: '⚡' },
  { id: 'minimal', label: 'بسيط', description: 'نقرات خفيفة', emoji: '✨' },
  { id: 'professional', label: 'احترافي', description: 'نغمات رسمية', emoji: '💼' },
  { id: 'playful', label: 'مرح', description: 'أصوات مبهجة', emoji: '🎵' },
];

interface SoundConfig {
  type: NotificationSoundType;
  icon: typeof Bell;
  color: string;
  bgColor: string;
}

const soundConfigs: SoundConfig[] = [
  { type: 'shipment_created', icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { type: 'shipment_status', icon: Truck, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { type: 'shipment_approved', icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { type: 'shipment_delivered', icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { type: 'shipment_assigned', icon: Send, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { type: 'recycling_report', icon: ClipboardCheck, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
  { type: 'document_uploaded', icon: FileText, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
  { type: 'approval_request', icon: ClipboardCheck, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { type: 'chat_message', icon: MessageSquare, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  { type: 'warning', icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  { type: 'default', icon: Bell, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
];

const NotificationSoundSettings = () => {
  const { t } = useLanguage();
  const { getPref, setPref } = useUserPreferences();
  const [playingSound, setPlayingSound] = useState<NotificationSoundType | null>(null);
  const [activeSection, setActiveSection] = useState<'themes' | 'types' | 'quiet'>('themes');

  // Read from DB-backed preferences
  const masterEnabled = getPref('sound_enabled', true) as boolean;
  const soundTypes = getPref('sound_types', {}) as Record<string, boolean>;
  const soundTheme = getPref('sound_theme', 'classic') as SoundTheme;
  const globalVolume = getPref('sound_global_volume', 0.7) as number;
  const soundVolumes = getPref('sound_volumes', {}) as Record<string, number>;
  const quietHoursEnabled = getPref('quiet_hours_enabled', false) as boolean;
  const quietHoursStart = getPref('quiet_hours_start', '22:00') as string;
  const quietHoursEnd = getPref('quiet_hours_end', '07:00') as string;
  const notificationPreview = getPref('notification_preview', true) as boolean;
  const notificationVibrate = getPref('notification_vibrate', true) as boolean;

  // Also sync to localStorage for backward compat
  useEffect(() => {
    localStorage.setItem('notification_sound_enabled', String(masterEnabled));
    localStorage.setItem('notification_sound_settings', JSON.stringify(soundTypes));
    localStorage.setItem('sound_theme', soundTheme);
    localStorage.setItem('sound_global_volume', String(globalVolume));
  }, [masterEnabled, soundTypes, soundTheme, globalVolume]);

  const handleMasterToggle = (enabled: boolean) => {
    setPref('sound_enabled', enabled);
  };

  const handleSoundToggle = (type: NotificationSoundType, enabled: boolean) => {
    setPref('sound_types', { ...soundTypes, [type]: enabled });
  };

  const handleThemeChange = (theme: SoundTheme) => {
    setPref('sound_theme', theme);
  };

  const handleVolumeChange = (value: number[]) => {
    setPref('sound_global_volume', value[0]);
  };

  const handleTypeVolumeChange = (type: string, value: number[]) => {
    setPref('sound_volumes', { ...soundVolumes, [type]: value[0] });
  };

  const handlePreview = (type: NotificationSoundType) => {
    setPlayingSound(type);
    playThemeSound(type, soundTheme, globalVolume);
    setTimeout(() => setPlayingSound(null), 1200);
  };

  const handleReset = () => {
    setPref('sound_enabled', true);
    setPref('sound_types', {});
    setPref('sound_theme', 'classic');
    setPref('sound_global_volume', 0.7);
    setPref('sound_volumes', {});
    setPref('quiet_hours_enabled', false);
    setPref('notification_preview', true);
    setPref('notification_vibrate', true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          {t('soundSettings.title')}
        </CardTitle>
        <CardDescription>
          تخصيص أصوات وتنبيهات حسابك — هذه الإعدادات خاصة بحسابك وتنتقل معك بين الأجهزة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle + Volume */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div className="flex items-center gap-3">
            {masterEnabled ? (
              <Volume2 className="h-6 w-6 text-primary" />
            ) : (
              <VolumeX className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">{t('soundSettings.enableSounds')}</p>
              <p className="text-sm text-muted-foreground">
                {masterEnabled ? t('soundSettings.soundsEnabled') : t('soundSettings.soundsDisabled')}
              </p>
            </div>
          </div>
          <Switch checked={masterEnabled} onCheckedChange={handleMasterToggle} />
        </div>

        {/* Global Volume Slider */}
        {masterEnabled && (
          <div className="px-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">مستوى الصوت العام</span>
              <span className="text-xs text-muted-foreground">{Math.round(globalVolume * 100)}%</span>
            </div>
            <Slider
              value={[globalVolume]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={handleVolumeChange}
              className="w-full"
            />
          </div>
        )}

        {/* Section Tabs */}
        {masterEnabled && (
          <div className="flex rounded-lg bg-muted/50 p-0.5" dir="rtl">
            {[
              { key: 'themes' as const, label: 'سمة الصوت', icon: Palette },
              { key: 'types' as const, label: 'حسب النوع', icon: Sliders },
              { key: 'quiet' as const, label: 'الوضع الهادئ', icon: Moon },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md transition-colors",
                  activeSection === tab.key ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ─── Sound Themes Section ─── */}
        {masterEnabled && activeSection === 'themes' && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">اختر سمة الأصوات لحسابك</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SOUND_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center",
                    soundTheme === theme.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  )}
                >
                  <span className="text-2xl">{theme.emoji}</span>
                  <span className="text-sm font-semibold">{theme.label}</span>
                  <span className="text-[10px] text-muted-foreground">{theme.description}</span>
                  {soundTheme === theme.id && (
                    <Badge className="text-[10px] h-4">مفعّل</Badge>
                  )}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handlePreview('default')}
            >
              <Play className="w-3.5 h-3.5 ml-1" />
              تجربة السمة الحالية
            </Button>
          </div>
        )}

        {/* ─── Per-Type Section ─── */}
        {masterEnabled && activeSection === 'types' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground">التحكم بكل نوع إشعار</h4>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                إعادة ضبط
              </Button>
            </div>
            
            <div className="grid gap-2">
              {soundConfigs.map((config, index) => {
                const Icon = config.icon;
                const isEnabled = soundTypes[config.type] !== false;
                const isPlaying = playingSound === config.type;
                const typeVolume = soundVolumes[config.type] ?? globalVolume;
                
                return (
                  <motion.div
                    key={config.type}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      'flex flex-col gap-2 p-3 rounded-lg border transition-all',
                      isEnabled ? 'bg-card' : 'bg-muted/30',
                      isPlaying && 'ring-2 ring-primary'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center', config.bgColor)}>
                          <Icon className={cn('h-4 w-4', config.color)} />
                        </div>
                        <span className="font-medium text-sm">{SOUND_LABELS[config.type]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(config.type)}
                          disabled={!isEnabled}
                          className="h-7 w-7 p-0"
                        >
                          <motion.div
                            animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.5 }}
                          >
                            <Play className={cn('h-3.5 w-3.5', isPlaying ? 'text-primary' : 'text-muted-foreground')} />
                          </motion.div>
                        </Button>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(enabled) => handleSoundToggle(config.type, enabled)}
                        />
                      </div>
                    </div>
                    {isEnabled && (
                      <div className="flex items-center gap-2 pr-12">
                        <VolumeX className="w-3 h-3 text-muted-foreground shrink-0" />
                        <Slider
                          value={[typeVolume]}
                          min={0}
                          max={1}
                          step={0.05}
                          onValueChange={(v) => handleTypeVolumeChange(config.type, v)}
                          className="flex-1"
                        />
                        <Volume2 className="w-3 h-3 text-muted-foreground shrink-0" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Quiet Hours Section ─── */}
        {masterEnabled && activeSection === 'quiet' && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">الوضع الهادئ وإعدادات التنبيهات</h4>
            
            {/* Quiet Hours */}
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium">ساعات الهدوء</p>
                    <p className="text-xs text-muted-foreground">إيقاف الأصوات تلقائياً في أوقات محددة</p>
                  </div>
                </div>
                <Switch
                  checked={quietHoursEnabled}
                  onCheckedChange={(v) => setPref('quiet_hours_enabled', v)}
                />
              </div>
              
              {quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label className="text-xs">من الساعة</Label>
                    <Input
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setPref('quiet_hours_start', e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">إلى الساعة</Label>
                    <Input
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setPref('quiet_hours_end', e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Additional notification preferences */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">معاينة الإشعارات</p>
                  <p className="text-xs text-muted-foreground">عرض محتوى الإشعار في شريط التنبيه</p>
                </div>
                <Switch
                  checked={notificationPreview}
                  onCheckedChange={(v) => setPref('notification_preview', v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">الاهتزاز</p>
                  <p className="text-xs text-muted-foreground">اهتزاز الجهاز عند وصول إشعار</p>
                </div>
                <Switch
                  checked={notificationVibrate}
                  onCheckedChange={(v) => setPref('notification_vibrate', v)}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSoundSettings;
