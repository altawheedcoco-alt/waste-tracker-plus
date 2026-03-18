import { useState } from 'react';
import { Check, Paintbrush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { WALLPAPER_PRESETS, useChatWallpaper, type ChatWallpaper } from '@/hooks/useChatWallpaper';

interface ChatWallpaperPickerProps {
  conversationId?: string;
}

const ChatWallpaperPicker = ({ conversationId }: ChatWallpaperPickerProps) => {
  const [open, setOpen] = useState(false);
  const { wallpaper, setWallpaper } = useChatWallpaper(conversationId);

  const handleSelect = async (preset: typeof WALLPAPER_PRESETS[0]) => {
    await setWallpaper({ type: preset.type, value: preset.value }, conversationId);
    setOpen(false);
  };

  const isSelected = (preset: typeof WALLPAPER_PRESETS[0]) =>
    wallpaper?.type === preset.type && wallpaper?.value === preset.value;

  const getPreviewStyle = (preset: typeof WALLPAPER_PRESETS[0]): React.CSSProperties => {
    if (preset.type === 'gradient') return { background: preset.value };
    if (preset.type === 'pattern') return { backgroundColor: 'hsl(var(--muted))', backgroundImage: `radial-gradient(circle, hsl(var(--foreground) / 0.15) 1px, transparent 1px)`, backgroundSize: '8px 8px' };
    return { backgroundColor: preset.value };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Paintbrush className="w-3.5 h-3.5" />
          خلفية الدردشة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>خلفية الدردشة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Colors */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">ألوان</p>
            <div className="grid grid-cols-4 gap-2">
              {WALLPAPER_PRESETS.filter(p => p.type === 'color').map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleSelect(preset)}
                  className={cn(
                    "relative w-full aspect-square rounded-xl border-2 transition-all hover:scale-105",
                    isSelected(preset) ? "border-primary shadow-md" : "border-transparent"
                  )}
                  style={getPreviewStyle(preset)}
                >
                  {isSelected(preset) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary drop-shadow" />
                    </div>
                  )}
                  <span className="absolute bottom-1 inset-x-0 text-[9px] text-center font-medium" style={{ color: preset.value.startsWith('#1') || preset.value.startsWith('#0') ? '#fff' : '#333' }}>
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Gradients */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">تدرجات</p>
            <div className="grid grid-cols-4 gap-2">
              {WALLPAPER_PRESETS.filter(p => p.type === 'gradient').map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleSelect(preset)}
                  className={cn(
                    "relative w-full aspect-square rounded-xl border-2 transition-all hover:scale-105",
                    isSelected(preset) ? "border-primary shadow-md" : "border-transparent"
                  )}
                  style={getPreviewStyle(preset)}
                >
                  {isSelected(preset) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white drop-shadow" />
                    </div>
                  )}
                  <span className="absolute bottom-1 inset-x-0 text-[9px] text-center font-medium text-white drop-shadow">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Patterns */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">أنماط</p>
            <div className="grid grid-cols-3 gap-2">
              {WALLPAPER_PRESETS.filter(p => p.type === 'pattern').map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleSelect(preset)}
                  className={cn(
                    "relative w-full aspect-[4/3] rounded-xl border-2 transition-all hover:scale-105 bg-muted",
                    isSelected(preset) ? "border-primary shadow-md" : "border-border"
                  )}
                  style={getPreviewStyle(preset)}
                >
                  {isSelected(preset) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary drop-shadow" />
                    </div>
                  )}
                  <span className="absolute bottom-1 inset-x-0 text-[9px] text-center font-medium text-muted-foreground">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatWallpaperPicker;
