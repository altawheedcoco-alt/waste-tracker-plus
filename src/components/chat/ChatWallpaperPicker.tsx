import { useState, useMemo } from 'react';
import { Check, Paintbrush, Search, Palette, Image, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  COLOR_FAMILIES,
  GRADIENT_PRESETS,
  SVG_PATTERNS,
  PATTERN_CATEGORIES,
  useChatWallpaper,
  type ChatWallpaper,
} from '@/hooks/useChatWallpaper';

interface ChatWallpaperPickerProps {
  conversationId?: string;
}

const ChatWallpaperPicker = ({ conversationId }: ChatWallpaperPickerProps) => {
  const [open, setOpen] = useState(false);
  const [searchColors, setSearchColors] = useState('');
  const [selectedColorFamily, setSelectedColorFamily] = useState<string | null>(null);
  const [selectedPatternCategory, setSelectedPatternCategory] = useState<string | null>(null);
  const { wallpaper, setWallpaper } = useChatWallpaper(conversationId);

  const handleSelectColor = async (value: string) => {
    await setWallpaper({ type: 'color', value }, conversationId);
  };

  const handleSelectGradient = async (value: string) => {
    await setWallpaper({ type: 'gradient', value }, conversationId);
  };

  const handleSelectSvgPattern = async (id: string) => {
    await setWallpaper({ type: 'svg-pattern', value: id }, conversationId);
  };

  const isColorSelected = (value: string) =>
    wallpaper?.type === 'color' && wallpaper?.value === value;
  const isGradientSelected = (value: string) =>
    wallpaper?.type === 'gradient' && wallpaper?.value === value;
  const isSvgPatternSelected = (id: string) =>
    wallpaper?.type === 'svg-pattern' && wallpaper?.value === id;

  // Filter colors by search or family
  const filteredFamilies = useMemo(() => {
    if (selectedColorFamily) {
      return COLOR_FAMILIES.filter(f => f.family === selectedColorFamily);
    }
    if (searchColors.trim()) {
      const q = searchColors.trim().toLowerCase();
      return COLOR_FAMILIES.filter(f =>
        f.family.includes(q) || f.colors.some(c => c.label.includes(q) || c.value.toLowerCase().includes(q))
      );
    }
    return COLOR_FAMILIES;
  }, [searchColors, selectedColorFamily]);

  const filteredPatterns = useMemo(() => {
    if (selectedPatternCategory) {
      return SVG_PATTERNS.filter(p => p.category === selectedPatternCategory);
    }
    return SVG_PATTERNS;
  }, [selectedPatternCategory]);

  const isDark = (hex: string) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Paintbrush className="w-3.5 h-3.5" />
          خلفية الدردشة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paintbrush className="w-5 h-5 text-primary" />
            خلفية الدردشة
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="colors" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 shrink-0">
            <TabsTrigger value="colors" className="gap-1.5 text-xs">
              <Palette className="w-3.5 h-3.5" />
              ألوان
            </TabsTrigger>
            <TabsTrigger value="gradients" className="gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              تدرجات
            </TabsTrigger>
            <TabsTrigger value="patterns" className="gap-1.5 text-xs">
              <Image className="w-3.5 h-3.5" />
              أنماط
            </TabsTrigger>
          </TabsList>

          {/* ─── COLORS TAB ─── */}
          <TabsContent value="colors" className="flex-1 min-h-0 mt-3 flex flex-col gap-3">
            {/* Search */}
            <div className="relative shrink-0">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن لون..."
                value={searchColors}
                onChange={(e) => { setSearchColors(e.target.value); setSelectedColorFamily(null); }}
                className="pr-9 h-9 text-sm"
              />
            </div>

            {/* Family chips */}
            <div className="flex flex-wrap gap-1.5 shrink-0">
              <Badge
                variant={selectedColorFamily === null ? 'default' : 'outline'}
                className="cursor-pointer text-[10px] px-2 py-0.5"
                onClick={() => setSelectedColorFamily(null)}
              >
                الكل ({COLOR_FAMILIES.reduce((a, f) => a + f.colors.length, 0)})
              </Badge>
              {COLOR_FAMILIES.map(f => (
                <Badge
                  key={f.family}
                  variant={selectedColorFamily === f.family ? 'default' : 'outline'}
                  className="cursor-pointer text-[10px] px-2 py-0.5"
                  onClick={() => { setSelectedColorFamily(f.family === selectedColorFamily ? null : f.family); setSearchColors(''); }}
                >
                  {f.family}
                </Badge>
              ))}
            </div>

            {/* Color grid */}
            <ScrollArea className="flex-1 min-h-0" style={{ maxHeight: '340px' }}>
              <div className="space-y-4 pb-2">
                {filteredFamilies.map(family => (
                  <div key={family.family}>
                    <p className="text-[11px] text-muted-foreground font-semibold mb-1.5">{family.family}</p>
                    <div className="grid grid-cols-10 gap-1">
                      {family.colors.map(color => (
                        <button
                          key={color.value}
                          onClick={() => handleSelectColor(color.value)}
                          title={`${color.label} (${color.value})`}
                          className={cn(
                            "relative w-full aspect-square rounded-lg border transition-all hover:scale-110 hover:shadow-md",
                            isColorSelected(color.value)
                              ? "border-primary ring-2 ring-primary/30 shadow-md scale-110"
                              : "border-transparent hover:border-border"
                          )}
                          style={{ backgroundColor: color.value }}
                        >
                          {isColorSelected(color.value) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className={cn("w-3 h-3", isDark(color.value) ? 'text-white' : 'text-foreground')} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ─── GRADIENTS TAB ─── */}
          <TabsContent value="gradients" className="flex-1 min-h-0 mt-3">
            <ScrollArea className="h-full" style={{ maxHeight: '400px' }}>
              <div className="grid grid-cols-4 gap-2 pb-2">
                {GRADIENT_PRESETS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => handleSelectGradient(g.value)}
                    className={cn(
                      "relative w-full aspect-square rounded-xl border-2 transition-all hover:scale-105 hover:shadow-lg",
                      isGradientSelected(g.value)
                        ? "border-primary shadow-md ring-2 ring-primary/30"
                        : "border-transparent"
                    )}
                    style={{ background: g.value }}
                  >
                    {isGradientSelected(g.value) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                    )}
                    <span className="absolute bottom-0.5 inset-x-0 text-[8px] text-center font-medium text-white drop-shadow-md leading-tight">
                      {g.label}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ─── PATTERNS TAB ─── */}
          <TabsContent value="patterns" className="flex-1 min-h-0 mt-3 flex flex-col gap-3">
            {/* Category filter chips */}
            <div className="flex flex-wrap gap-1.5 shrink-0">
              <Badge
                variant={selectedPatternCategory === null ? 'default' : 'outline'}
                className="cursor-pointer text-[10px] px-2 py-0.5"
                onClick={() => setSelectedPatternCategory(null)}
              >
                الكل ({SVG_PATTERNS.length})
              </Badge>
              {PATTERN_CATEGORIES.map(cat => (
                <Badge
                  key={cat.id}
                  variant={selectedPatternCategory === cat.id ? 'default' : 'outline'}
                  className="cursor-pointer text-[10px] px-2 py-0.5"
                  onClick={() => setSelectedPatternCategory(cat.id === selectedPatternCategory ? null : cat.id)}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>

            <ScrollArea className="flex-1 min-h-0" style={{ maxHeight: '340px' }}>
              <div className="grid grid-cols-3 gap-2 pb-2">
                {filteredPatterns.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectSvgPattern(p.id)}
                    className={cn(
                      "relative w-full aspect-[4/3] rounded-xl border-2 transition-all hover:scale-105 hover:shadow-lg overflow-hidden",
                      isSvgPatternSelected(p.id)
                        ? "border-primary shadow-md ring-2 ring-primary/30"
                        : "border-border"
                    )}
                    style={{
                      backgroundColor: p.bgColor,
                      backgroundImage: p.patternSvg,
                      backgroundSize: p.bgSize || '32px 32px',
                      backgroundRepeat: 'repeat',
                    }}
                  >
                    {isSvgPatternSelected(p.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                        <Check className={cn("w-5 h-5 drop-shadow", isDark(p.bgColor) ? 'text-white' : 'text-primary')} />
                      </div>
                    )}
                    <span className={cn(
                      "absolute bottom-0.5 inset-x-0 text-[9px] text-center font-medium leading-tight drop-shadow-sm",
                      isDark(p.bgColor) ? 'text-white/80' : 'text-foreground/70'
                    )}>
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ChatWallpaperPicker;
