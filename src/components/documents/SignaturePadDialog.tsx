import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MentionInput } from '@/components/ui/mention-input';
import type { MentionableUser } from '@/hooks/useMentionableUsers';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  PenTool,
  Eraser,
  CheckCircle2,
  Loader2,
  FileSignature,
  Shield,
  Type,
} from 'lucide-react';

interface SignaturePadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signerTitle: string;
  documentName: string;
  documentContent?: string | null;
  initialName?: string;
  initialTitle?: string;
  mentionableUsers?: MentionableUser[];
  isPending?: boolean;
  onSign: (data: {
    signerName: string;
    signerTitle: string;
    signerNationalId: string;
    signatureImageUrl: string | null;
    signatureMethod: string;
    notes: string;
  }) => void;
}

const SignaturePadDialog = ({
  open,
  onOpenChange,
  signerTitle,
  documentName,
  documentContent,
  initialName = '',
  initialTitle = '',
  mentionableUsers = [],
  isPending = false,
  onSign,
}: SignaturePadDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(initialName);
  const [signerTitleInput, setSignerTitleInput] = useState(initialTitle || signerTitle);
  const [signerNationalId, setSignerNationalId] = useState('');
  const [notes, setNotes] = useState('');
  const [signMethod, setSignMethod] = useState<'draw' | 'type'>('draw');

  useEffect(() => {
    if (open) {
      setSignerName(initialName);
      setSignerTitleInput(initialTitle || signerTitle);
      setSignerNationalId('');
      setNotes('');
      setHasDrawn(false);
      setSignMethod('draw');
    }
  }, [open, initialName, initialTitle, signerTitle]);

  useEffect(() => {
    if (open && canvasRef.current && signMethod === 'draw') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1a365d';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [open, signMethod]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
  }, []);

  const handleSubmit = () => {
    if (!signerName.trim()) return;

    let signatureImageUrl: string | null = null;
    let method = 'click_approve';

    if (signMethod === 'draw' && hasDrawn && canvasRef.current) {
      signatureImageUrl = canvasRef.current.toDataURL('image/png');
      method = 'drawn_signature';
    } else if (signMethod === 'type') {
      method = 'typed_name';
    }

    onSign({
      signerName: signerName.trim(),
      signerTitle: signerTitleInput.trim() || signerTitle,
      signerNationalId,
      signatureImageUrl,
      signatureMethod: method,
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-primary" />
            توقيع مستند
          </DialogTitle>
        </DialogHeader>

        {/* Document info */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm text-center space-y-1">
          <p className="font-semibold">{documentName}</p>
          <Badge variant="secondary" className="text-[10px]">{signerTitle}</Badge>
        </div>

        {/* Document content preview */}
        {documentContent && (
          <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground max-h-32 overflow-y-auto border">
            <p className="whitespace-pre-wrap">{documentContent}</p>
          </div>
        )}

        <Separator />

        {/* Signer info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">الاسم الكامل *</Label>
            <Input value={signerName} onChange={e => setSignerName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">المسمى الوظيفي</Label>
            <Input value={signerTitleInput} onChange={e => setSignerTitleInput(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">الرقم القومي (اختياري)</Label>
          <Input value={signerNationalId} onChange={e => setSignerNationalId(e.target.value)} dir="ltr" className="h-8 text-sm" />
        </div>

        {/* Signature method */}
        <Tabs value={signMethod} onValueChange={(v) => setSignMethod(v as 'draw' | 'type')}>
          <TabsList className="grid grid-cols-2 h-8">
            <TabsTrigger value="draw" className="text-xs gap-1">
              <PenTool className="w-3 h-3" />
              رسم التوقيع
            </TabsTrigger>
            <TabsTrigger value="type" className="text-xs gap-1">
              <Type className="w-3 h-3" />
              تأكيد بالاسم
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="mt-2">
            <div className="relative border rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-muted-foreground/40 text-sm">ارسم توقيعك هنا</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="mt-1 text-xs gap-1" onClick={clearCanvas}>
              <Eraser className="w-3 h-3" />
              مسح
            </Button>
          </TabsContent>

          <TabsContent value="type" className="mt-2">
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">بالضغط على "تأكيد التوقيع" أقر بصحة البيانات</p>
              {signerName && (
                <p className="text-lg font-bold text-primary" style={{ fontFamily: 'cursive' }}>
                  {signerName}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className="text-xs">ملاحظات (يمكنك الإشارة بـ @)</Label>
          <MentionInput
            value={notes}
            onChange={setNotes}
            users={mentionableUsers}
            rows={2}
            placeholder="أضف ملاحظة..."
          />
        </div>

        {/* Legal notice */}
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 text-[10px] text-amber-800 dark:text-amber-300">
          <Shield className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            بتوقيعك تُقر بصحة البيانات وتتحمل المسؤولية القانونية الكاملة. سيتم تسجيل بصمة SHA-256 للتحقق من سلامة التوقيع.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button
            onClick={handleSubmit}
            disabled={!signerName.trim() || isPending || (signMethod === 'draw' && !hasDrawn)}
            className="gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <CheckCircle2 className="w-4 h-4" />
            تأكيد التوقيع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignaturePadDialog;
