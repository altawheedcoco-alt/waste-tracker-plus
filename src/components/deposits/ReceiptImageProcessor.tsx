import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Image as ImageIcon,
  Sparkles,
  ZoomIn,
  RotateCw,
  X,
  ScanLine,
  FileImage,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  processReceiptImage,
  processForOCR,
  validateReceiptImage,
  compressImage,
} from '@/lib/imageProcessing';

interface ReceiptImageProcessorProps {
  onImageProcessed: (processedImage: string, originalImage: string) => void;
  onExtracting?: (extracting: boolean) => void;
  required?: boolean;
  value?: string | null;
  className?: string;
}

export default function ReceiptImageProcessor({
  onImageProcessed,
  onExtracting,
  required = true,
  value,
  className,
}: ReceiptImageProcessorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [isProcessed, setIsProcessed] = useState(false);
  const [showZoom, setShowZoom] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (imageSrc: string, originalFile: File) => {
    setProcessing(true);
    onExtracting?.(true);
    setProcessingProgress(0);

    try {
      // الخطوة 1: ضغط الصورة
      setProcessingStep('جاري ضغط الصورة...');
      setProcessingProgress(10);
      const compressed = await compressImage(imageSrc, 1920, 0.9);

      // الخطوة 2: معالجة الصورة
      setProcessingStep('جاري تحسين الصورة...');
      setProcessingProgress(30);

      const processed = await processReceiptImage(compressed, {
        enhanceContrast: true,
        sharpen: true,
        denoise: true,
        whiteBalance: true,
        binarize: false,
        edgeDetection: true,
      });

      setProcessingProgress(60);
      setProcessingStep('جاري تحسين جودة القراءة...');

      // الخطوة 3: تحسين للـ OCR
      const ocrOptimized = await processForOCR(processed.processed);
      setProcessingProgress(90);

      setProcessingStep('اكتمل التحسين');
      setProcessingProgress(100);

      // تحديث المعاينة
      setProcessedPreview(processed.processed);
      setIsProcessed(true);

      // إرسال الصورة المعالجة
      onImageProcessed(ocrOptimized, imageSrc);

      toast.success(
        <div className="flex flex-col">
          <span className="font-semibold">تم معالجة الصورة بنجاح</span>
          <span className="text-xs text-muted-foreground">
            {processed.processingSteps.join(' • ')}
          </span>
        </div>
      );
    } catch (error) {
      console.error('Image processing error:', error);
      toast.error('حدث خطأ أثناء معالجة الصورة');
      // استخدام الصورة الأصلية في حالة الفشل
      onImageProcessed(imageSrc, imageSrc);
    } finally {
      setProcessing(false);
      onExtracting?.(false);
      setTimeout(() => {
        setProcessingProgress(0);
        setProcessingStep('');
      }, 1500);
    }
  }, [onImageProcessed, onExtracting]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // التحقق من صحة الملف
    const validation = validateReceiptImage(selectedFile);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setFile(selectedFile);

    // قراءة الملف
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageSrc = event.target?.result as string;
      setPreview(imageSrc);

      // معالجة الصورة تلقائياً
      await processImage(imageSrc, selectedFile);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setProcessedPreview(null);
    setIsProcessed(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleReprocess = async () => {
    if (preview && file) {
      await processImage(preview, file);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <FileImage className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2">
              صورة الإيصال
              {required && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  مطلوب
                </Badge>
              )}
            </h4>
            <p className="text-xs text-muted-foreground">
              ارفع صورة واضحة للإيصال البنكي
            </p>
          </div>
        </div>

        {isProcessed && (
          <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            معالَج
          </Badge>
        )}
      </div>

      {/* Upload Area */}
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'relative border-2 border-dashed rounded-xl p-6 text-center transition-all',
              required && !preview
                ? 'border-destructive/50 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10'
                : 'border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <ScanLine className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div>
                <p className="font-medium">
                  {required ? 'يجب رفع صورة الإيصال' : 'ارفع صورة الإيصال'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  سيتم معالجة الصورة تلقائياً لتحسين جودة القراءة
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => cameraInputRef.current?.click()}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  التقاط صورة
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  رفع من الجهاز
                </Button>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  JPG, PNG, WebP
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  حتى 20 ميجابايت
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl border overflow-hidden bg-background"
          >
            {/* Processing Overlay */}
            <AnimatePresence>
              {processing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4"
                >
                  <div className="p-3 rounded-full bg-primary/10 mb-4">
                    <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <p className="text-sm font-medium mb-3">{processingStep}</p>
                  <div className="w-full max-w-xs">
                    <Progress value={processingProgress} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {processingProgress}% مكتمل
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image Preview */}
            <div 
              className="relative cursor-pointer group"
              onClick={() => setShowZoom(true)}
            >
              <img
                src={processedPreview || preview}
                alt="صورة الإيصال"
                className="w-full max-h-64 object-contain bg-muted"
              />
              
              {/* Zoom indicator */}
              <div className="absolute bottom-2 left-2 p-1.5 rounded-lg bg-foreground/70 text-background">
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between p-3 bg-muted/50">
              <div className="flex items-center gap-2">
                {isProcessed && (
                  <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700 text-xs">
                    <Wand2 className="h-3 w-3" />
                    محسّن للقراءة
                  </Badge>
                )}
                {file && (
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleReprocess}
                  disabled={processing}
                  className="gap-1 h-8 text-xs"
                >
                  <RotateCw className="h-3 w-3" />
                  إعادة معالجة
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                  className="gap-1 h-8 text-xs"
                >
                  <Upload className="h-3 w-3" />
                  تغيير
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleRemove}
                  disabled={processing}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Modal */}
      <AnimatePresence>
        {showZoom && preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4"
            onClick={() => setShowZoom(false)}
          >
            <Button
              size="icon"
              variant="outline"
              className="absolute top-4 right-4"
              onClick={() => setShowZoom(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={processedPreview || preview}
              alt="صورة الإيصال"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Message */}
      {required && !preview && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>يجب رفع صورة الإيصال للمتابعة</span>
        </div>
      )}
    </div>
  );
}
