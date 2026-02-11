import { PRINT_THEMES, PrintTheme } from './printThemes';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      <PopoverContent className="w-96 p-2" align="start" dir="rtl">
        <div className="text-sm font-semibold mb-2 px-2">اختر سمة الطباعة ({PRINT_THEMES.length} تصميم)</div>
        <ScrollArea className="h-[320px] pr-2" dir="rtl">
          <div className="grid grid-cols-3 gap-1.5 p-1">
            {PRINT_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onSelect(theme.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-md transition-all border text-xs text-center",
                  selectedThemeId === theme.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-transparent hover:bg-accent/50"
                )}
              >
                <div className="flex items-center gap-1">
                  <span className="text-base">{theme.preview}</span>
                  {selectedThemeId === theme.id && <Check className="w-3 h-3 text-primary shrink-0" />}
                </div>
                <span className="font-medium truncate w-full text-[10px]">{theme.name}</span>
                {/* Color preview dots */}
                <div className="flex gap-0.5 justify-center">
                  <div className="w-2.5 h-2.5 rounded-full border" style={{ background: theme.colors.primary }} />
                  <div className="w-2.5 h-2.5 rounded-full border" style={{ background: theme.colors.generatorBg }} />
                  <div className="w-2.5 h-2.5 rounded-full border" style={{ background: theme.colors.recyclerBg }} />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default PrintThemeSelector;
