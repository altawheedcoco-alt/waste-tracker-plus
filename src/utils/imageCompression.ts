/**
 * أداة ضغط وتحسين الصور — معايير عالمية (Facebook/Instagram Level)
 * ✅ ضغط ذكي حسب المحتوى (Adaptive Quality)
 * ✅ حذف البيانات الوصفية (EXIF Strip)
 * ✅ توليد نسخ متعددة الأحجام (Responsive)
 * ✅ توليد Blur Placeholder (LQIP)
 */

export interface CompressionOptions {
  /** أقصى عرض بالبكسل (الافتراضي 1920) */
  maxWidth?: number;
  /** أقصى ارتفاع بالبكسل (الافتراضي 1920) */
  maxHeight?: number;
  /** جودة الضغط 0-1 (الافتراضي: تلقائي حسب المحتوى) */
  quality?: number;
  /** صيغة الخرج (الافتراضي webp إن كان مدعوماً) */
  outputFormat?: 'image/jpeg' | 'image/webp' | 'image/png';
  /** أقصى حجم للملف بالبايت (الافتراضي 1MB) */
  maxSizeBytes?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  format: string;
}

/** نتيجة النسخ المتعددة */
export interface ResponsiveImageSet {
  original: CompressionResult;
  thumbnail?: CompressionResult;  // 150px
  small?: CompressionResult;      // 320px
  medium?: CompressionResult;     // 720px
  large?: CompressionResult;      // 1080px
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0, // 0 = auto (adaptive)
  outputFormat: 'image/webp',
  maxSizeBytes: 3 * 1024 * 1024,
};

// ─── Adaptive Quality Detection (زي Facebook) ───

type ImageContentType = 'text_heavy' | 'simple' | 'photo' | 'screenshot';

/**
 * تحليل محتوى الصورة لتحديد الجودة المثلى
 * - صور فيها نص/لوجو → جودة عالية 85%
 * - صور طبيعية/ناس → جودة متوسطة 72%
 * - صور بسيطة/ألوان قليلة → جودة منخفضة 60%
 */
const analyzeImageContent = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): ImageContentType => {
  // عينة صغيرة للتحليل السريع
  const sampleSize = Math.min(canvas.width, 200);
  const sampleHeight = Math.min(canvas.height, 200);
  const imageData = ctx.getImageData(0, 0, sampleSize, sampleHeight);
  const pixels = imageData.data;

  let edgeCount = 0;
  let uniqueColors = new Set<number>();
  let totalVariance = 0;
  const totalPixels = sampleSize * sampleHeight;

  // تحليل الحواف والألوان
  for (let y = 1; y < sampleHeight - 1; y++) {
    for (let x = 1; x < sampleSize - 1; x++) {
      const idx = (y * sampleSize + x) * 4;
      const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];

      // تجميع الألوان (تقريب لتقليل التنوع الزائف)
      const colorKey = (Math.round(r / 16) << 8) | (Math.round(g / 16) << 4) | Math.round(b / 16);
      uniqueColors.add(colorKey);

      // كشف الحواف (Sobel مبسط)
      const rightIdx = (y * sampleSize + x + 1) * 4;
      const bottomIdx = ((y + 1) * sampleSize + x) * 4;
      const dx = Math.abs(pixels[idx] - pixels[rightIdx]) +
                 Math.abs(pixels[idx + 1] - pixels[rightIdx + 1]) +
                 Math.abs(pixels[idx + 2] - pixels[rightIdx + 2]);
      const dy = Math.abs(pixels[idx] - pixels[bottomIdx]) +
                 Math.abs(pixels[idx + 1] - pixels[bottomIdx + 1]) +
                 Math.abs(pixels[idx + 2] - pixels[bottomIdx + 2]);

      if (dx + dy > 80) edgeCount++;
      totalVariance += dx + dy;
    }
  }

  const edgeRatio = edgeCount / totalPixels;
  const colorCount = uniqueColors.size;
  const avgVariance = totalVariance / totalPixels;

  // نص/لوجو: حواف كثيرة + ألوان قليلة
  if (edgeRatio > 0.15 && colorCount < 200) return 'text_heavy';

  // سكرينشوت: حواف متوسطة + ألوان متنوعة
  if (edgeRatio > 0.08 && colorCount < 500) return 'screenshot';

  // صورة بسيطة: تباين قليل + ألوان قليلة
  if (avgVariance < 15 && colorCount < 300) return 'simple';

  // صورة فوتوغرافية
  return 'photo';
};

/** اختيار الجودة حسب نوع المحتوى */
const getAdaptiveQuality = (contentType: ImageContentType): number => {
  switch (contentType) {
    case 'text_heavy': return 0.85;  // نص/لوجو: جودة عالية للحدة
    case 'screenshot': return 0.78;  // سكرينشوت: جودة جيدة
    case 'photo':      return 0.72;  // صور فوتوغرافية: العين مش بتفرق
    case 'simple':     return 0.60;  // صور بسيطة: أقل جودة ممكنة
  }
};

// ─── EXIF Strip ───

/**
 * حذف البيانات الوصفية (EXIF/GPS/Camera Info)
 * Canvas API بتحذف EXIF تلقائياً عند إعادة الرسم
 * لكن لازم نتأكد إن الصورة بتتعامل صح مع الـ Orientation
 */
const stripExifAndFixOrientation = async (file: File): Promise<{ img: HTMLImageElement; orientation: number }> => {
  const img = await loadImage(file);

  // Canvas drawImage بيحذف كل EXIF تلقائياً
  // الـ orientation الحديثة بتتعامل معاها المتصفحات تلقائياً (CSS image-orientation)
  return { img, orientation: 1 };
};

// ─── Blur Placeholder (LQIP) ───

/**
 * توليد صورة ضبابية صغيرة جداً (< 1KB) كـ Data URL
 * تُعرض فوراً بينما الصورة الأصلية بتحمّل
 */
export const generateBlurPlaceholder = async (file: File): Promise<string> => {
  const img = await loadImage(file);

  const canvas = document.createElement('canvas');
  // 16x16 → بعد التحويل لـ base64 ≈ 200-500 bytes
  const targetWidth = 16;
  const targetHeight = Math.round((img.naturalHeight / img.naturalWidth) * targetWidth);
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'low';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  URL.revokeObjectURL(img.src);

  // تصدير كـ data URL صغير جداً
  return canvas.toDataURL('image/webp', 0.1) || canvas.toDataURL('image/jpeg', 0.1);
};

// ─── Core Utilities ───

const supportsWebP = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
};

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('فشل في تحميل الصورة'));
    img.src = URL.createObjectURL(file);
  });
};

const calculateDimensions = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('فشل في تحويل الصورة'));
      },
      format,
      quality
    );
  });
};

// ─── Main Compression ───

/**
 * ضغط صورة واحدة — بمعايير عالمية
 * ✅ تحليل ذكي للمحتوى → جودة مثلى
 * ✅ حذف EXIF تلقائي
 * ✅ WebP مع Fallback لـ JPEG
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  if (!file.type.startsWith('image/')) {
    return {
      file, originalSize: file.size, compressedSize: file.size,
      compressionRatio: 0, width: 0, height: 0, format: file.type,
    };
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (opts.outputFormat === 'image/webp' && !supportsWebP()) {
    opts.outputFormat = 'image/jpeg';
  }

  // لا ضغط لأيقونات PNG الصغيرة
  if (file.type === 'image/png' && file.size < 50 * 1024) {
    const img = await loadImage(file);
    const result = {
      file, originalSize: file.size, compressedSize: file.size,
      compressionRatio: 0, width: img.naturalWidth, height: img.naturalHeight, format: file.type,
    };
    URL.revokeObjectURL(img.src);
    return result;
  }

  // تحميل + حذف EXIF
  const { img } = await stripExifAndFixOrientation(file);
  const { width, height } = calculateDimensions(
    img.naturalWidth, img.naturalHeight, opts.maxWidth, opts.maxHeight
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(img.src);

  // ✅ جودة ذكية حسب المحتوى (إذا لم تُحدد يدوياً)
  let quality = opts.quality;
  if (quality === 0) {
    const contentType = analyzeImageContent(canvas, ctx);
    quality = getAdaptiveQuality(contentType);
    console.log(`🎯 تحليل الصورة: ${contentType} → جودة ${Math.round(quality * 100)}%`);
  }

  let blob = await canvasToBlob(canvas, opts.outputFormat, quality);

  // إعادة ضغط مرة واحدة إذا الحجم كبير جداً
  if (blob.size > opts.maxSizeBytes && quality > 0.4) {
    quality = 0.5;
    blob = await canvasToBlob(canvas, opts.outputFormat, quality);
  }

  const ext = opts.outputFormat === 'image/webp' ? 'webp' : opts.outputFormat === 'image/png' ? 'png' : 'jpg';
  const fileName = file.name.replace(/\.[^.]+$/, `.${ext}`);

  const compressedFile = blob.size < file.size
    ? new File([blob], fileName, { type: opts.outputFormat, lastModified: Date.now() })
    : file;

  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    compressionRatio: Math.round((1 - compressedFile.size / file.size) * 100),
    width,
    height,
    format: compressedFile.type,
  };
};

// ─── Responsive Image Set (زي Instagram) ───

const RESPONSIVE_SIZES = {
  thumbnail: 150,
  small: 320,
  medium: 720,
  large: 1080,
} as const;

/**
 * توليد نسخ متعددة الأحجام من صورة واحدة
 * Thumbnail (150px) + Small (320px) + Medium (720px) + Large (1080px)
 */
export const generateResponsiveSet = async (
  file: File,
  options: CompressionOptions = {}
): Promise<ResponsiveImageSet> => {
  // النسخة الأصلية (1920px max)
  const original = await compressImage(file, options);

  const sizes = Object.entries(RESPONSIVE_SIZES);
  const results: Partial<ResponsiveImageSet> = { original };

  // توليد النسخ بالتوازي
  const tasks = sizes
    .filter(([_, maxW]) => original.width > maxW)
    .map(async ([key, maxW]) => {
      const result = await compressImage(file, {
        ...options,
        maxWidth: maxW,
        maxHeight: maxW,
        quality: key === 'thumbnail' ? 0.65 : undefined,
      });
      return [key, result] as const;
    });

  const completed = await Promise.all(tasks);
  for (const [key, result] of completed) {
    (results as any)[key] = result;
  }

  return results as ResponsiveImageSet;
};

// ─── Batch Compression ───

export const compressImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> => {
  return Promise.all(files.map((f) => compressImage(f, options)));
};

// ─── Helpers ───

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
