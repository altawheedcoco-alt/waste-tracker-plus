import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Loader2, Image as ImageIcon, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { compressImage, formatFileSize } from '@/utils/imageCompression';

interface AnalysisResult {
  waste_type?: string;
  waste_type_en?: string;
  estimated_weight_kg?: number;
  weight_confidence?: string;
  condition?: string;
  description?: string;
  hazardous?: boolean;
  container_type?: string;
  fill_level_percent?: number;
  notes?: string;
}

interface ShipmentImageAnalyzerProps {
  onAnalysis: (result: AnalysisResult) => void;
  className?: string;
}

const ShipmentImageAnalyzer = ({ onAnalysis, className }: ShipmentImageAnalyzerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setIsAnalyzing(true);
    setResult(null);

    try {
      // ضغط الصورة قبل الإرسال للتحليل
      const compressed = await compressImage(file, { maxWidth: 1280, quality: 0.75 });
      if (compressed.compressionRatio > 0) {
        console.log(`📦 تم ضغط الصورة: ${formatFileSize(compressed.originalSize)} → ${formatFileSize(compressed.compressedSize)} (${compressed.compressionRatio}%)`);
      }

      const formData = new FormData();
      formData.append('image', compressed.file);

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-shipment-image`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('فشل تحليل الصورة');
      const analysis: AnalysisResult = await response.json();

      setResult(analysis);
      onAnalysis(analysis);
      toast.success('✅ تم تحليل الصورة بنجاح');
    } catch (err) {
      console.error('Image analysis error:', err);
      toast.error('حدث خطأ في تحليل الصورة');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleCapture}
        disabled={isAnalyzing}
        className="gap-2 w-full h-14 text-base"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            جاري تحليل الصورة...
          </>
        ) : (
          <>
            <Camera className="h-5 w-5" />
            📸 تصوير الشحنة للتحليل الذكي
          </>
        )}
      </Button>

      {previewUrl && (
        <div className="rounded-lg overflow-hidden border max-h-40">
          <img src={previewUrl} alt="صورة الشحنة" className="w-full h-full object-cover" />
        </div>
      )}

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3 space-y-2 text-right text-sm" dir="rtl">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Package className="h-4 w-4" />
              نتائج التحليل الذكي
            </div>
            {result.waste_type && (
              <div className="flex justify-between">
                <span className="font-medium">{result.waste_type}</span>
                <span className="text-muted-foreground">نوع المخلف</span>
              </div>
            )}
            {result.estimated_weight_kg != null && (
              <div className="flex justify-between">
                <span className="font-medium">
                  {result.estimated_weight_kg} كجم
                  {result.weight_confidence && (
                    <span className={cn(
                      'text-xs mr-1 px-1.5 py-0.5 rounded',
                      result.weight_confidence === 'high' ? 'bg-green-100 text-green-700' :
                      result.weight_confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {result.weight_confidence === 'high' ? 'دقة عالية' : 
                       result.weight_confidence === 'medium' ? 'دقة متوسطة' : 'تقديري'}
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground">الوزن المتوقع</span>
              </div>
            )}
            {result.container_type && (
              <div className="flex justify-between">
                <span className="font-medium">{result.container_type}</span>
                <span className="text-muted-foreground">نوع الحاوية</span>
              </div>
            )}
            {result.fill_level_percent != null && (
              <div className="flex justify-between">
                <span className="font-medium">{result.fill_level_percent}%</span>
                <span className="text-muted-foreground">نسبة الامتلاء</span>
              </div>
            )}
            {result.hazardous && (
              <div className="p-2 rounded bg-destructive/10 text-destructive text-xs font-medium">
                ⚠️ مخلفات خطرة - يلزم ترخيص خاص
              </div>
            )}
            {result.description && (
              <p className="text-xs text-muted-foreground border-t pt-2 mt-2">{result.description}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShipmentImageAnalyzer;
