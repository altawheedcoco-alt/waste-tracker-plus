import { PRINT_THEMES, PrintTheme } from './printThemes';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrintThemeSelectorProps {
  selectedThemeId: string;
  onSelect: (themeId: string) => void;
}

const PrintThemeSelector = ({ selectedThemeId, onSelect }: PrintThemeSelectorProps) => {
  const selected = PRINT_THEMES.find(t => t.id === selectedThemeId) || PRINT_THEMES[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <Palette className="w-4 h-4" />
          <span className="text-xs">{selected.preview} {selected.name}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start" dir="rtl">
        <div className="text-sm font-semibold mb-2 px-2">اختر سمة الطباعة</div>
        <div className="grid grid-cols-2 gap-1.5">
          {PRINT_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md text-right transition-all border text-xs",
                selectedThemeId === theme.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-transparent hover:bg-accent/50"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{theme.preview}</span>
                  <span className="font-medium truncate">{theme.name}</span>
                  {selectedThemeId === theme.id && <Check className="w-3 h-3 text-primary shrink-0" />}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{theme.description}</p>
              </div>
              {/* Color preview dots */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <div className="w-3 h-3 rounded-full border" style={{ background: theme.colors.primary }} />
                <div className="w-3 h-3 rounded-full border" style={{ background: theme.colors.generatorBg }} />
                <div className="w-3 h-3 rounded-full border" style={{ background: theme.colors.recyclerBg }} />
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PrintThemeSelector;
