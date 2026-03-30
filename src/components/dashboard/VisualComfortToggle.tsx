import { Sun, Sunset, Moon } from 'lucide-react';
import { useThemeSettings, VisualMode } from '@/contexts/ThemeSettingsContext';
import { cn } from '@/lib/utils';

const modes: { value: VisualMode; icon: typeof Sun; label: string; labelEn: string }[] = [
  { value: 'light', icon: Sun, label: 'نهاري', labelEn: 'Light' },
  { value: 'dim', icon: Sunset, label: 'مسائي', labelEn: 'Dim' },
  { value: 'dark', icon: Moon, label: 'ليلي', labelEn: 'Dark' },
];

const VisualComfortToggle = () => {
  const { settings, setVisualMode } = useThemeSettings();

  return (
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
            <Icon className="w-3.5 h-3.5" />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default VisualComfortToggle;
