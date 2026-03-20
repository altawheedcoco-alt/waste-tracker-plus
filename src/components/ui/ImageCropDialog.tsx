import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Move, RotateCcw, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CropMode = 'cover' | 'avatar';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  mode: CropMode;
  onSave: (croppedBlob: Blob) => Promise<void>;
}

const ASPECT_RATIOS: Record<CropMode, number> = {
  cover: 3 / 1,
  avatar: 1 / 1,
};

const ImageCropDialog = ({ open, onOpenChange, imageFile, mode, onSave }: ImageCropDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  const aspectRatio = ASPECT_RATIOS[mode];

  // Load image when file changes
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImageSrc(url);
    const img = new Image();
    img.onload = () => {
      setImageEl(img);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Calculate container dimensions
  const getContainerSize = useCallback(() => {
    const maxW = Math.min(600, window.innerWidth - 48);
    const h = mode === 'cover' ? maxW / aspectRatio : Math.min(maxW, 400);
    const w = mode === 'cover' ? maxW : h;
    return { w, h };
  }, [mode, aspectRatio]);

  // Draw preview
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageEl) return;

    const { w, h } = getContainerSize();
    canvas.width = w * 2; // retina
    canvas.height = h * 2;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, w, h);

    // Calculate image draw dimensions
    const imgAspect = imageEl.width / imageEl.height;
    const containerAspect = w / h;

    let drawW: number, drawH: number;
    if (imgAspect > containerAspect) {
      // Image is wider — fit by height
      drawH = h * scale;
      drawW = drawH * imgAspect;
    } else {
      // Image is taller — fit by width
      drawW = w * scale;
      drawH = drawW / imgAspect;
    }

    const drawX = (w - drawW) / 2 + offset.x;
    const drawY = (h - drawH) / 2 + offset.y;

    ctx.drawImage(imageEl, drawX, drawY, drawW, drawH);
  }, [imageEl, scale, offset, getContainerSize]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Mouse/Touch handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handleSave = useCallback(async () => {
    if (!imageEl) return;
    setSaving(true);

    try {
      // Create output canvas at target resolution
      const outputW = mode === 'cover' ? 1200 : 500;
      const outputH = mode === 'cover' ? Math.round(1200 / aspectRatio) : 500;

      const outCanvas = document.createElement('canvas');
      outCanvas.width = outputW;
      outCanvas.height = outputH;
      const outCtx = outCanvas.getContext('2d')!;

      const { w, h } = getContainerSize();

      // Map from preview space to output space
      const scaleX = outputW / w;
      const scaleY = outputH / h;

      const imgAspect = imageEl.width / imageEl.height;
      const containerAspect = w / h;

      let drawW: number, drawH: number;
      if (imgAspect > containerAspect) {
        drawH = h * scale;
        drawW = drawH * imgAspect;
      } else {
        drawW = w * scale;
        drawH = drawW / imgAspect;
      }

      const drawX = (w - drawW) / 2 + offset.x;
      const drawY = (h - drawH) / 2 + offset.y;

      outCtx.drawImage(
        imageEl,
        drawX * scaleX,
        drawY * scaleY,
        drawW * scaleX,
        drawH * scaleY
      );

      outCanvas.toBlob(async (blob) => {
        if (blob) {
          await onSave(blob);
        }
        setSaving(false);
        onOpenChange(false);
      }, 'image/jpeg', 0.9);
    } catch {
      setSaving(false);
    }
  }, [imageEl, scale, offset, mode, aspectRatio, getContainerSize, onSave, onOpenChange]);

  const { w, h } = getContainerSize();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[660px] p-0 gap-0" dir="rtl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-right">
            {mode === 'cover' ? 'ضبط صورة الغلاف' : 'ضبط الصورة الشخصية'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-right">
            اسحب الصورة لتحديد الجزء الظاهر، واستخدم التكبير للتحكم في الحجم
          </p>
        </DialogHeader>

        {/* Preview area */}
        <div className="px-4">
          <div
            ref={containerRef}
            className={cn(
              'relative mx-auto overflow-hidden bg-muted/50 border-2 border-dashed border-primary/30',
              mode === 'avatar' ? 'rounded-full' : 'rounded-xl',
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
            style={{ width: w, height: h }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="touch-none"
              style={{ width: w, height: h }}
            />

            {/* Overlay grid for cover */}
            {mode === 'cover' && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-0 top-1/3 border-t border-white/20" />
                <div className="absolute inset-x-0 top-2/3 border-t border-white/20" />
                <div className="absolute inset-y-0 left-1/3 border-l border-white/20" />
                <div className="absolute inset-y-0 left-2/3 border-l border-white/20" />
              </div>
            )}

            {/* Drag hint */}
            {!isDragging && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
                <div className="bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-xs text-foreground shadow">
                  <Move className="w-3.5 h-3.5" />
                  اسحب لتحريك الصورة
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="px-6 py-3">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
            <Slider
              value={[scale]}
              min={0.5}
              max={3}
              step={0.05}
              onValueChange={([v]) => setScale(v)}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={handleReset} title="إعادة تعيين">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 pt-2 flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="w-4 h-4 ml-1.5" />
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={saving || !imageEl}>
            {saving ? <Loader2 className="w-4 h-4 ml-1.5 animate-spin" /> : <Check className="w-4 h-4 ml-1.5" />}
            حفظ التعديل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;
