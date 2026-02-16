import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Camera, CheckCircle2, XCircle, Loader2, Upload,
  Image as ImageIcon, Eye, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriverSmartCameraProps {
  shipmentId?: string;
  driverId: string;
  type: 'load' | 'scale' | 'delivery' | 'general';
  onPhotoTaken?: (url: string, analysis: any) => void;
}

const typeLabels: Record<string, { label: string; hint: string }> = {
  load: { label: 'صورة الحمولة', hint: 'التقط صورة واضحة للحمولة' },
  scale: { label: 'صورة الميزان', hint: 'التقط صورة قراءة الميزان' },
  delivery: { label: 'صورة التسليم', hint: 'التقط صورة موقع التسليم' },
  general: { label: 'صورة عامة', hint: 'التقط صورة للتوثيق' },
};

const DriverSmartCamera = ({ shipmentId, driverId, type, onPhotoTaken }: DriverSmartCameraProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleCapture = useCallback(async (file: File) => {
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsAnalyzing(true);
    try {
      // Upload to storage
      const fileName = `driver/${driverId}/${type}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('shipment-photos')
        .upload(fileName, file, { contentType: 'image/jpeg' });

      if (uploadError) {
        // If bucket doesn't exist, just save locally
        console.warn('Upload failed:', uploadError);
      }

      const url = uploadData 
        ? supabase.storage.from('shipment-photos').getPublicUrl(uploadData.path).data.publicUrl
        : preview || '';

      setUploadedUrl(url);

      // AI Analysis via edge function
      try {
        const base64 = await fileToBase64(file);
        const { data: aiResult } = await supabase.functions.invoke('analyze-driver-photo', {
          body: { image: base64, type, shipmentId },
        });

        if (aiResult) {
          setAnalysis(aiResult);
          onPhotoTaken?.(url, aiResult);
        }
      } catch (aiError) {
        console.warn('AI analysis unavailable:', aiError);
        // Still save the photo without AI
        setAnalysis({ status: 'saved', message: 'تم حفظ الصورة بنجاح (التحليل الذكي غير متاح)' });
        onPhotoTaken?.(url, null);
      }

      toast({ title: 'تم التقاط الصورة بنجاح ✅' });
    } catch (error) {
      console.error('Capture error:', error);
      toast({ title: 'خطأ في التقاط الصورة', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  }, [driverId, type, shipmentId, onPhotoTaken, toast, preview]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const config = typeLabels[type];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="w-5 h-5 text-primary" />
          {config.label}
          <Badge variant="outline" className="text-[10px] mr-auto gap-1">
            <Sparkles className="w-3 h-3" />
            تحليل ذكي
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleCapture(file);
          }}
        />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-xs font-medium">جاري التحليل الذكي...</p>
                    </div>
                  </div>
                )}
              </div>

              {analysis && (
                <div className={`p-3 rounded-lg border ${analysis.verified ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-amber-500/5 border-amber-500/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {analysis.verified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-sm font-semibold">
                      {analysis.verified ? 'تم التحقق ✅' : 'تم الحفظ'}
                    </span>
                  </div>
                  {analysis.message && (
                    <p className="text-xs text-muted-foreground">{analysis.message}</p>
                  )}
                  {analysis.details && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(analysis.details).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-[10px]">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setPreview(null);
                  setAnalysis(null);
                  fileInputRef.current?.click();
                }}
              >
                <Camera className="w-4 h-4 ml-2" />
                التقاط صورة جديدة
              </Button>
            </motion.div>
          ) : (
            <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-3 hover:bg-primary/10 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">{config.hint}</p>
                  <p className="text-xs text-muted-foreground">سيتم تحليل الصورة تلقائياً بالذكاء الاصطناعي</p>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default DriverSmartCamera;
