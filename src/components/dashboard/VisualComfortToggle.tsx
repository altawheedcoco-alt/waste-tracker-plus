import { useState, useEffect, useCallback } from 'react';
import { Sun, Sunset, Moon, Eye, EyeOff, Minus, Plus, Thermometer, SlidersHorizontal } from 'lucide-react';
import { useThemeSettings, VisualMode } from '@/contexts/ThemeSettingsContext';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

const modes: { value: VisualMode; icon: typeof Sun; label: string; color: string }[] = [
  { value: 'light', icon: Sun, label: 'نهاري', color: 'text-amber-500' },
  { value: 'dim', icon: Sunset, label: 'مسائي', color: 'text-orange-400' },
  { value: 'dark', icon: Moon, label: 'ليلي', color: 'text-indigo-400' },
];

const COMFORT_KEY = 'irecycle-eye-comfort';

interface EyeComfortSettings {
  blueFilter: number; // 0-100
  brightness: number; // 50-150
  contrast: number; // 80-120
  warmth: number; // 0-50
  reducedMotion: boolean;
  autoSchedule: boolean;
  dimStartHour: number; // 0-23
  darkStartHour: number; // 0-23
  lightStartHour: number; // 0-23
}

const defaultComfort: EyeComfortSettings = {
  blueFilter: 0,
  brightness: 100,
  contrast: 100,
  warmth: 0,
  reducedMotion: false,
  autoSchedule: false,
  dimStartHour: 17,
  darkStartHour: 21,
  lightStartHour: 6,
};

const VisualComfortToggle = () => {
  const { settings, setVisualMode } = useThemeSettings();
  const [expanded, setExpanded] = useState(false);
  const [comfort, setComfort] = useState<EyeComfortSettings>(() => {
    try {
      const saved = localStorage.getItem(COMFORT_KEY);
      return saved ? { ...defaultComfort, ...JSON.parse(saved) } : defaultComfort;
    } catch { return defaultComfort; }
  });

  // Apply eye comfort filters to root
  const applyFilters = useCallback((c: EyeComfortSettings) => {
    const filters: string[] = [];
    if (c.brightness !== 100) filters.push(`brightness(${c.brightness / 100})`);
    if (c.contrast !== 100) filters.push(`contrast(${c.contrast / 100})`);
    if (c.blueFilter > 0) filters.push(`sepia(${c.blueFilter / 100 * 0.4})`);
    if (c.warmth > 0) filters.push(`hue-rotate(-${c.warmth * 0.15}deg)`);
    
    document.documentElement.style.filter = filters.length > 0 ? filters.join(' ') : '';
    
    if (c.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, []);

  useEffect(() => {
    applyFilters(comfort);
    localStorage.setItem(COMFORT_KEY, JSON.stringify(comfort));
  }, [comfort, applyFilters]);

  // Auto schedule with user-configurable times
  useEffect(() => {
    if (!comfort.autoSchedule) return;
    const check = () => {
      const hour = new Date().getHours();
      const { dimStartHour, darkStartHour, lightStartHour } = comfort;
      if (darkStartHour > dimStartHour) {
        // Normal: light -> dim -> dark
        if (hour >= darkStartHour || hour < lightStartHour) setVisualMode('dark');
        else if (hour >= dimStartHour) setVisualMode('dim');
        else if (hour >= lightStartHour) setVisualMode('light');
      } else {
        // Edge case
        if (hour >= darkStartHour && hour < lightStartHour) setVisualMode('dark');
        else if (hour >= dimStartHour) setVisualMode('dim');
        else setVisualMode('light');
      }
    };
    check();
    const interval = setInterval(check, 60000); // check every minute
    return () => clearInterval(interval);
  }, [comfort.autoSchedule, comfort.dimStartHour, comfort.darkStartHour, comfort.lightStartHour, setVisualMode]);

  const updateComfort = (key: keyof EyeComfortSettings, value: number | boolean) => {
    setComfort(prev => ({ ...prev, [key]: value }));
  };

  const resetComfort = () => {
    setComfort(defaultComfort);
  };

  return (
    <div className="space-y-2">
      {/* Mode Switcher */}
      <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg w-full">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = settings.visualMode === mode.value;
          return (
            <button
              key={mode.value}
              onClick={() => setVisualMode(mode.value)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={mode.label}
            >
              <Icon className={cn('w-3.5 h-3.5', isActive && mode.color)} />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Eye Comfort Expand Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors',
          expanded ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
      >
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          راحة العين
        </span>
        <SlidersHorizontal className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')} />
      </button>

      {/* Eye Comfort Controls */}
      {expanded && (
        <div className="space-y-3 p-2.5 bg-muted/30 rounded-lg border border-border/50 animate-in slide-in-from-top-2 duration-200">
          {/* Blue Light Filter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium flex items-center gap-1">
                <EyeOff className="w-3 h-3 text-blue-400" />
                فلتر الضوء الأزرق
              </label>
              <span className="text-[10px] text-muted-foreground">{comfort.blueFilter}%</span>
            </div>
            <Slider
              value={[comfort.blueFilter]}
              onValueChange={([v]) => updateComfort('blueFilter', v)}
              min={0} max={80} step={5}
              className="w-full"
            />
          </div>

          {/* Brightness */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" />
                السطوع
              </label>
              <span className="text-[10px] text-muted-foreground">{comfort.brightness}%</span>
            </div>
            <Slider
              value={[comfort.brightness]}
              onValueChange={([v]) => updateComfort('brightness', v)}
              min={60} max={130} step={5}
              className="w-full"
            />
          </div>

          {/* Warmth */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-orange-400" />
                دفء الألوان
              </label>
              <span className="text-[10px] text-muted-foreground">{comfort.warmth}%</span>
            </div>
            <Slider
              value={[comfort.warmth]}
              onValueChange={([v]) => updateComfort('warmth', v)}
              min={0} max={50} step={5}
              className="w-full"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium">تقليل الحركة</label>
              <Switch
                checked={comfort.reducedMotion}
                onCheckedChange={(v) => updateComfort('reducedMotion', v)}
                className="scale-75"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium">تبديل تلقائي حسب الوقت</label>
              <Switch
                checked={comfort.autoSchedule}
                onCheckedChange={(v) => updateComfort('autoSchedule', v)}
                className="scale-75"
              />
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={resetComfort}
            className="w-full text-[11px] text-muted-foreground hover:text-foreground py-1 text-center transition-colors"
          >
            إعادة ضبط
          </button>
        </div>
      )}
    </div>
  );
};

export default VisualComfortToggle;
