/**
 * SidebarSoundControl — تحكم سريع بالأصوات في القائمة الجانبية
 */
import { useState, useCallback } from 'react';
import { Volume2, VolumeX, Play, Bell, MessageCircle, MousePointer } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { soundEngine, TONE_NAMES, TONE_LABELS, type SoundCategory, type ToneName } from '@/lib/soundEngine';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: { key: SoundCategory; icon: typeof Bell; labelAr: string; labelEn: string }[] = [
  { key: 'notification', icon: Bell, labelAr: 'الإشعارات', labelEn: 'Notifications' },
  { key: 'chat', icon: MessageCircle, labelAr: 'الدردشة', labelEn: 'Chat' },
  { key: 'ui', icon: MousePointer, labelAr: 'الواجهة', labelEn: 'UI' },
];

export default function SidebarSoundControl({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [, rerender] = useState(0);
  const forceUpdate = useCallback(() => rerender(n => n + 1), []);

  const toggleMaster = () => {
    soundEngine.enabled = !soundEngine.enabled;
    if (soundEngine.enabled) soundEngine.play('toggle');
    forceUpdate();
  };

  const toggleCategory = (cat: SoundCategory) => {
    soundEngine.setCategoryEnabled(cat, !soundEngine.getCategoryEnabled(cat));
    forceUpdate();
  };

  const setVolume = (val: number) => {
    soundEngine.volume = val;
    forceUpdate();
  };

  const setCatVolume = (cat: SoundCategory, val: number) => {
    soundEngine.setCategoryVolume(cat, val);
    forceUpdate();
  };

  const setCatTone = (cat: SoundCategory, tone: ToneName) => {
    soundEngine.setCategoryTone(cat, tone);
    soundEngine.playTonePreview(cat, tone);
    forceUpdate();
  };

  const Icon = soundEngine.enabled ? Volume2 : VolumeX;

  const triggerButton = (
    <Button
      variant="ghost"
      size={isCollapsed ? 'icon' : 'default'}
      className={cn(
        'w-full flex items-center gap-2 h-9 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg text-[13px]',
        isCollapsed && 'justify-center'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!isCollapsed && <span className="font-medium whitespace-nowrap">الأصوات</span>}
    </Button>
  );

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            {triggerButton}
          </PopoverTrigger>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="left"><p>إعدادات الأصوات</p></TooltipContent>
        )}
      </Tooltip>

      <PopoverContent side="left" align="end" className="w-80 p-0 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">إعدادات الأصوات</span>
          </div>
          <Switch
            checked={soundEngine.enabled}
            onCheckedChange={toggleMaster}
          />
        </div>

        {soundEngine.enabled && (
          <>
            {/* Master Volume */}
            <div className="px-3 py-2 border-b border-border/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">مستوى الصوت العام</span>
                <span className="text-xs font-mono text-muted-foreground">{Math.round(soundEngine.volume * 100)}%</span>
              </div>
              <Slider
                value={[soundEngine.volume]}
                onValueChange={([v]) => setVolume(v)}
                min={0} max={1} step={0.05}
                className="w-full"
              />
            </div>

            {/* Categories */}
            {CATEGORY_CONFIG.map(({ key, icon: CatIcon, labelAr }) => {
              const enabled = soundEngine.getCategoryEnabled(key);
              const catVol = soundEngine.getCategoryVolume(key);
              const currentTone = soundEngine.getCategoryTone(key);

              return (
                <div key={key} className="px-3 py-2.5 border-b border-border/30 last:border-b-0">
                  {/* Category header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <CatIcon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold">{labelAr}</span>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggleCategory(key)}
                      className="scale-75"
                    />
                  </div>

                  {enabled && (
                    <>
                      {/* Tone selector */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {TONE_NAMES.map(tone => (
                          <button
                            key={tone}
                            onClick={() => setCatTone(key, tone)}
                            className={cn(
                              'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all border',
                              currentTone === tone
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-border'
                            )}
                          >
                            {TONE_LABELS[tone].ar}
                            {currentTone === tone && (
                              <Play className="w-2.5 h-2.5 fill-current" />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Category volume */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">الصوت</span>
                        <Slider
                          value={[catVol]}
                          onValueChange={([v]) => setCatVolume(key, v)}
                          min={0} max={1} step={0.05}
                          className="flex-1"
                        />
                        <span className="text-[10px] font-mono text-muted-foreground w-8 text-left">
                          {Math.round(catVol * 100)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
