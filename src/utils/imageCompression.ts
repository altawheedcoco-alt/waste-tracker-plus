/**
 * أداة ضغط وتحسين الصور قبل الرفع
 * تقلل حجم الملفات بنسبة 60-90% مع الحفاظ على الجودة البصرية
 */

export interface CompressionOptions {
  /** أقصى عرض بالبكسل (الافتراضي 1920) */
  maxWidth?: number;
  /** أقصى ارتفاع بالبكسل (الافتراضي 1920) */
  maxHeight?: number;
  /** جودة الضغط 0-1 (الافتراضي 0.8) */
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

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.75,
  outputFormat: 'image/webp',
  maxSizeBytes: 3 * 1024 * 1024, // 3MB - حد أعلى لتجنب إعادة الضغط المتكررة
};

/**
 * التحقق مما إذا كان المتصفح يدعم صيغة WebP
 */
const supportsWebP = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
};

/**
 * تحميل صورة من ملف File
 */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('فشل في تحميل الصورة'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * حساب الأبعاد الجديدة مع الحفاظ على النسبة
 */
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

/**
 * تحويل Canvas إلى Blob
 */
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

/**
 * ضغط صورة واحدة
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  // تجاوز الملفات غير الصور
  if (!file.type.startsWith('image/')) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      width: 0,
      height: 0,
      format: file.type,
    };
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  // استخدام JPEG بدل WebP إن لم يكن مدعوماً
  if (opts.outputFormat === 'image/webp' && !supportsWebP()) {
    opts.outputFormat = 'image/jpeg';
  }

  // لا ضغط لملفات PNG الصغيرة (أيقونات)
  if (file.type === 'image/png' && file.size < 50 * 1024) {
    const img = await loadImage(file);
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      width: img.naturalWidth,
      height: img.naturalHeight,
      format: file.type,
    };
  }

  const img = await loadImage(file);
  const { width, height } = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    opts.maxWidth,
    opts.maxHeight
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('فشل في إنشاء سياق الرسم');

  // تنعيم الصورة عند التصغير
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // تحرير عنوان URL
  URL.revokeObjectURL(img.src);

  // ضغط تدريجي إذا تجاوز الحجم المطلوب
  let quality = opts.quality;
  let blob = await canvasToBlob(canvas, opts.outputFormat, quality);

  while (blob.size > opts.maxSizeBytes && quality > 0.3) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, opts.outputFormat, quality);
  }

  // اختيار الأصغر: المضغوط أو الأصلي
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

/**
 * ضغط مجموعة صور
 */
export const compressImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> => {
  return Promise.all(files.map((f) => compressImage(f, options)));
};

/**
 * تنسيق حجم الملف للعرض
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
