import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, Check, RotateCcw, Sparkles, CreditCard, FlipHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { processReceiptImage } from '@/lib/imageProcessing';
import { cn } from '@/lib/utils';

interface IDCardScannerProps {
  onCapture: (imageDataUrl: string, side: 'front' | 'back') => void;
  onComplete: () => void;
  isVerifying?: boolean;
  frontCaptured?: boolean;
  backCaptured?: boolean;
  frontVerified?: boolean;
  backVerified?: boolean;
}

type ScanPhase = 'idle' | 'scanning' | 'detecting' | 'captured' | 'enhancing';

const CARD_ASPECT_RATIO = 1.586; // ISO/IEC 7810 ID-1 standard

const IDCardScanner = ({
  onCapture,
  onComplete,
  isVerifying = false,
  frontCaptured = false,
  backCaptured = false,
  frontVerified = false,
  backVerified = false,
}: IDCardScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const stableFramesRef = useRef(0);
  const lastEdgeScoreRef = useRef(0);

  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [edgeStrength, setEdgeStrength] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cardDetected, setCardDetected] = useState(false);

  // Determine which side we're scanning
  useEffect(() => {
    if (frontCaptured && frontVerified && !backCaptured) {
      setCurrentSide('back');
    }
  }, [frontCaptured, frontVerified, backCaptured]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      streamRef.current = stream;
      setPhase('scanning');
      startAnalysis();
    } catch (err) {
      setCameraError('لا يمكن الوصول إلى الكاميرا. يرجى السماح بالوصول.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setPhase('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Analyze frames for card detection within the rectangle
  const startAnalysis = useCallback(() => {
    const analyze = () => {
      if (!videoRef.current || !analysisCanvasRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(analyze);
        return;
      }

      const video = videoRef.current;
      const canvas = analysisCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

      // Use a smaller canvas for analysis performance
      const aw = 320;
      const ah = 240;
      canvas.width = aw;
      canvas.height = ah;

      ctx.drawImage(video, 0, 0, aw, ah);

      // Analyze the card rectangle region
      const rectW = aw * 0.82;
      const rectH = rectW / CARD_ASPECT_RATIO;
      const rx = (aw - rectW) / 2;
      const ry = (ah - rectH) / 2;

      const imageData = ctx.getImageData(rx, ry, rectW, rectH);
      const score = computeEdgeScore(imageData);

      setEdgeStrength(Math.min(100, Math.round(score)));

      // Card detection: high edge score + stable
      const detected = score > 35;
      setCardDetected(detected);

      if (detected) {
        stableFramesRef.current++;
        // Auto-capture after 15 stable frames (~0.5s)
        if (stableFramesRef.current >= 15 && Math.abs(score - lastEdgeScoreRef.current) < 8) {
          captureFrame();
          return;
        }
      } else {
        stableFramesRef.current = 0;
      }

      lastEdgeScoreRef.current = score;
      animFrameRef.current = requestAnimationFrame(analyze);
    };

    animFrameRef.current = requestAnimationFrame(analyze);
  }, []);

  // Sobel-based edge detection score
  const computeEdgeScore = (imageData: ImageData): number => {
    const { data, width, height } = imageData;
    const gray = new Uint8Array(width * height);

    // Convert to grayscale
    for (let i = 0; i < gray.length; i++) {
      const idx = i * 4;
      gray[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
    }

    // Sample edges (skip pixels for performance)
    let edgeSum = 0;
    let count = 0;
    const step = 3;

    for (let y = 1; y < height - 1; y += step) {
      for (let x = 1; x < width - 1; x += step) {
        const gx =
          -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)]
          - 2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)]
          - gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];

        const gy =
          -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)]
          + gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];

        edgeSum += Math.sqrt(gx * gx + gy * gy);
        count++;
      }
    }

    return count > 0 ? (edgeSum / count) * 0.7 : 0;
  };

  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    setPhase('captured');
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Capture at full resolution
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    // Crop to the card rectangle area
    const rectW = canvas.width * 0.82;
    const rectH = rectW / CARD_ASPECT_RATIO;
    const rx = (canvas.width - rectW) / 2;
    const ry = (canvas.height - rectH) / 2;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = rectW;
    cropCanvas.height = rectH;
    const cropCtx = cropCanvas.getContext('2d')!;
    cropCtx.drawImage(canvas, rx, ry, rectW, rectH, 0, 0, rectW, rectH);

    const rawDataUrl = cropCanvas.toDataURL('image/jpeg', 0.97);
    setCapturedImage(rawDataUrl);

    // Enhance image
    setPhase('enhancing');
    try {
      const result = await processReceiptImage(rawDataUrl, {
        enhanceContrast: true,
        sharpen: true,
        denoise: true,
        whiteBalance: true,
        binarize: false,
        edgeDetection: false,
      });
      setEnhancedImage(result.processed);
      onCapture(result.processed, currentSide);
    } catch {
      setEnhancedImage(rawDataUrl);
      onCapture(rawDataUrl, currentSide);
    }
  }, [currentSide, onCapture]);

  const manualCapture = useCallback(() => {
    captureFrame();
  }, [captureFrame]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setEnhancedImage(null);
    stableFramesRef.current = 0;
    setPhase('scanning');
    startAnalysis();
  }, [startAnalysis]);

  const proceedToBack = useCallback(() => {
    setCapturedImage(null);
    setEnhancedImage(null);
    stableFramesRef.current = 0;
    setCurrentSide('back');
    setPhase('scanning');
    startAnalysis();
  }, [startAnalysis]);

  const getGuideColor = () => {
    if (phase === 'captured' || phase === 'enhancing') return 'border-green-400';
    if (cardDetected && edgeStrength > 50) return 'border-green-400';
    if (cardDetected) return 'border-yellow-400';
    return 'border-white/60';
  };

  const getShadowColor = () => {
    if (cardDetected && edgeStrength > 50) return '0 0 20px rgba(34,197,94,0.5)';
    if (cardDetected) return '0 0 15px rgba(234,179,8,0.4)';
    return '0 0 10px rgba(255,255,255,0.15)';
  };

  return (
    <div className="w-full space-y-3" dir="rtl">
      {/* Header info */}
      <div className="flex items-center gap-2 justify-center">
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
          currentSide === 'front'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
        )}>
          {currentSide === 'front' ? (
            <><CreditCard className="w-3.5 h-3.5" /> مسح وجه البطاقة</>
          ) : (
            <><FlipHorizontal className="w-3.5 h-3.5" /> مسح ظهر البطاقة</>
          )}
        </div>
        {/* Step indicators */}
        <div className="flex items-center gap-1">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full transition-all",
            frontVerified ? 'bg-green-500' : frontCaptured ? 'bg-yellow-400' : 'bg-muted-foreground/30'
          )} />
          <div className={cn(
            "w-2.5 h-2.5 rounded-full transition-all",
            backVerified ? 'bg-green-500' : backCaptured ? 'bg-yellow-400' : 'bg-muted-foreground/30'
          )} />
        </div>
      </div>

      {/* Camera viewport */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            (phase === 'captured' || phase === 'enhancing') ? 'opacity-30' : 'opacity-100'
          )}
        />
        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={analysisCanvasRef} className="hidden" />

        {/* Card rectangle overlay */}
        {(phase === 'scanning' || phase === 'detecting') && (
          <>
            {/* Dark overlay outside rectangle */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <mask id="card-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x="9%" y="15%"
                      width="82%" height="70%"
                      rx="12" ry="12"
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#card-mask)" />
              </svg>
            </div>

            {/* Animated card border */}
            <motion.div
              className={cn(
                "absolute border-[3px] rounded-xl pointer-events-none transition-colors duration-300",
                getGuideColor()
              )}
              style={{
                left: '9%', top: '15%', width: '82%', height: '70%',
                boxShadow: getShadowColor(),
              }}
              animate={cardDetected ? {
                borderColor: edgeStrength > 50
                  ? ['rgba(34,197,94,0.9)', 'rgba(34,197,94,0.5)', 'rgba(34,197,94,0.9)']
                  : ['rgba(234,179,8,0.9)', 'rgba(234,179,8,0.5)', 'rgba(234,179,8,0.9)'],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {/* Corner markers */}
              {[
                'top-0 left-0 border-t-[4px] border-l-[4px] rounded-tl-xl',
                'top-0 right-0 border-t-[4px] border-r-[4px] rounded-tr-xl',
                'bottom-0 left-0 border-b-[4px] border-l-[4px] rounded-bl-xl',
                'bottom-0 right-0 border-b-[4px] border-r-[4px] rounded-br-xl',
              ].map((cls, i) => (
                <div key={i} className={cn(
                  "absolute w-7 h-7",
                  cls,
                  cardDetected ? (edgeStrength > 50 ? 'border-green-400' : 'border-yellow-400') : 'border-white'
                )} />
              ))}
            </motion.div>

            {/* Scanning laser line */}
            <motion.div
              className="absolute left-[10%] w-[80%] h-[2px] pointer-events-none"
              style={{
                background: cardDetected
                  ? 'linear-gradient(90deg, transparent, rgba(34,197,94,0.7), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)',
              }}
              animate={{ top: ['18%', '80%', '18%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Detection status */}
            <div className="absolute bottom-3 inset-x-0 flex justify-center">
              <motion.div
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md",
                  cardDetected
                    ? 'bg-green-500/80 text-white'
                    : 'bg-black/50 text-white/80'
                )}
                animate={cardDetected ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: cardDetected ? Infinity : 0, repeatDelay: 1 }}
              >
                {cardDetected ? (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {stableFramesRef.current > 5 ? 'جاري الالتقاط...' : 'تم الكشف — ثبّت البطاقة'}
                  </span>
                ) : (
                  'ضع البطاقة داخل الإطار'
                )}
              </motion.div>
            </div>

            {/* Edge strength indicator */}
            <div className="absolute top-3 left-3 right-3">
              <div className="h-1 rounded-full bg-black/30 overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full transition-colors",
                    edgeStrength > 50 ? 'bg-green-400' : edgeStrength > 25 ? 'bg-yellow-400' : 'bg-red-400'
                  )}
                  animate={{ width: `${edgeStrength}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>
          </>
        )}

        {/* Captured state overlay */}
        <AnimatePresence>
          {(phase === 'captured' || phase === 'enhancing') && capturedImage && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <img
                  src={enhancedImage || capturedImage}
                  alt={currentSide === 'front' ? 'وجه البطاقة' : 'ظهر البطاقة'}
                  className="max-w-[85%] mx-auto rounded-xl border-2 border-green-400 shadow-2xl"
                />
                {phase === 'enhancing' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                      <span className="text-white text-xs font-medium">تحسين جودة الصورة...</span>
                    </div>
                  </div>
                )}
                {enhancedImage && phase !== 'enhancing' && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-500 text-white text-[10px] px-2 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" /> محسّنة
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle / Error state */}
        {phase === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 gap-3">
            {cameraError ? (
              <>
                <p className="text-sm text-destructive text-center px-4">{cameraError}</p>
                <Button onClick={startCamera} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-1.5" /> إعادة المحاولة
                </Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">اضغط لبدء مسح البطاقة</p>
                <Button onClick={startCamera} className="gap-2">
                  <Camera className="w-4 h-4" /> بدء المسح
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 justify-center">
        {phase === 'scanning' && (
          <>
            <Button onClick={manualCapture} size="sm" variant="outline" className="gap-1.5 text-xs">
              <Camera className="w-3.5 h-3.5" /> التقاط يدوي
            </Button>
            <Button onClick={stopCamera} size="sm" variant="ghost" className="text-xs text-muted-foreground">
              إلغاء
            </Button>
          </>
        )}

        {enhancedImage && phase !== 'enhancing' && !isVerifying && (
          <div className="flex gap-2">
            <Button onClick={retake} size="sm" variant="outline" className="gap-1.5 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> إعادة التقاط
            </Button>
            {currentSide === 'front' && frontVerified && !backCaptured && (
              <Button onClick={proceedToBack} size="sm" className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700">
                <FlipHorizontal className="w-3.5 h-3.5" /> اقلب للظهر
              </Button>
            )}
            {currentSide === 'back' && backVerified && (
              <Button onClick={() => { stopCamera(); onComplete(); }} size="sm" className="gap-1.5 text-xs bg-green-600 hover:bg-green-700">
                <Check className="w-3.5 h-3.5" /> تم
              </Button>
            )}
          </div>
        )}

        {isVerifying && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            التحقق بالذكاء الاصطناعي...
          </div>
        )}
      </div>
    </div>
  );
};

export default IDCardScanner;
