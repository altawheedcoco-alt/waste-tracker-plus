import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  PenTool, RotateCcw, CheckCircle2, User,
  FileSignature, Save, Smartphone
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriverDeliverySignatureProps {
  shipmentId?: string;
  driverId: string;
  onSigned?: (signatureUrl: string, receiverName: string) => void;
}

const DriverDeliverySignature = ({ shipmentId, driverId, onSigned }: DriverDeliverySignatureProps) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'hsl(var(--foreground))';

    // Draw guidelines
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'hsl(var(--muted-foreground) / 0.2)';
    ctx.beginPath();
    ctx.moveTo(20, rect.height - 30);
    ctx.lineTo(rect.width - 20, rect.height - 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'hsl(var(--foreground))';
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] || e.changedTouches[0] : null;
    const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
    const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasSignature(true);
    lastPosRef.current = getPos(e);
  }, []);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !lastPosRef.current) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
  }, [isDrawing]);

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
    lastPosRef.current = null;
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    // Redraw guideline
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'hsl(var(--muted-foreground) / 0.2)';
    ctx.beginPath();
    ctx.moveTo(20, rect.height - 30);
    ctx.lineTo(rect.width - 20, rect.height - 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'hsl(var(--foreground))';
    setHasSignature(false);
  };

  const handleSave = async () => {
    if (!hasSignature || !receiverName.trim()) {
      toast({ title: 'يرجى كتابة اسم المستلم والتوقيع', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;

      const fileName = `signatures/${driverId}/${shipmentId || 'general'}_${Date.now()}.png`;
      const { data: uploadData } = await supabase.storage
        .from('shipment-photos')
        .upload(fileName, blob, { contentType: 'image/png' });

      const url = uploadData
        ? supabase.storage.from('shipment-photos').getPublicUrl(uploadData.path).data.publicUrl
        : '';

      setSaved(true);
      toast({ title: 'تم حفظ التوقيع بنجاح ✅', description: `المستلم: ${receiverName}` });
      onSigned?.(url, receiverName);
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'خطأ في حفظ التوقيع', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (saved) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="w-14 h-14 mx-auto mb-3 text-emerald-500" />
          <p className="font-bold text-lg">تم التوقيع بنجاح ✅</p>
          <p className="text-sm text-muted-foreground">المستلم: {receiverName}</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setSaved(false); clearSignature(); }}>
            توقيع جديد
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignature className="w-5 h-5 text-primary" />
          التوقيع الرقمي للتسليم
          <Badge variant="outline" className="text-[10px] mr-auto gap-1">
            <Smartphone className="w-3 h-3" />
            لمس
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Receiver Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              اسم المستلم *
            </label>
            <Input
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="الاسم الكامل"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              رقم الجوال
            </label>
            <Input
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="h-9 text-sm"
              dir="ltr"
            />
          </div>
        </div>

        {/* Signature Canvas */}
        <div className="relative">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <PenTool className="w-3 h-3" />
            وقّع هنا بالإصبع أو القلم
          </p>
          <div className="rounded-xl border-2 border-dashed border-primary/30 bg-background overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full touch-none cursor-crosshair"
              style={{ height: 180 }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>
          {hasSignature && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-7 left-2 text-xs gap-1"
              onClick={clearSignature}
            >
              <RotateCcw className="w-3 h-3" />
              مسح
            </Button>
          )}
        </div>

        {/* Save */}
        <Button
          className="w-full gap-2 h-11"
          disabled={!hasSignature || !receiverName.trim() || isSaving}
          onClick={handleSave}
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'جاري الحفظ...' : 'حفظ التوقيع وتأكيد التسليم'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DriverDeliverySignature;
