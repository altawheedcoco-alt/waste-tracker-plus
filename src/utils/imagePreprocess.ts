/**
 * معالجة صور إيصالات الميزان بجودة عالية (مثل CamScanner)
 * تحسين التباين، الحدة، تحويل لأبيض وأسود، وإزالة الضوضاء
 */

interface PreprocessOptions {
  /** تحويل لأبيض وأسود */
  grayscale?: boolean;
  /** تحسين التباين (0-100) */
  contrast?: number;
  /** زيادة الحدة (0-5) */
  sharpness?: number;
  /** سطوع إضافي (-100 to 100) */
  brightness?: number;
  /** عتبة التحويل الثنائي (0 = تلقائي، 1-255 = يدوي) */
  binarize?: number;
  /** الحد الأقصى لعرض/ارتفاع الصورة */
  maxDimension?: number;
  /** جودة الإخراج (0-1) */
  quality?: number;
}

const DEFAULT_OCR_OPTIONS: PreprocessOptions = {
  grayscale: true,
  contrast: 60,
  sharpness: 2,
  brightness: 10,
  binarize: 0, // auto (Otsu-like)
  maxDimension: 2400,
  quality: 0.92,
};

/**
 * تحسين صورة الإيصال لاستخراج OCR عالي الدقة
 */
export async function preprocessForOCR(
  imageSource: string | File,
  options: Partial<PreprocessOptions> = {}
): Promise<string> {
  const opts = { ...DEFAULT_OCR_OPTIONS, ...options };

  // Load image
  const img = await loadImage(imageSource);

  // Create canvas
  const canvas = document.createElement('canvas');
  let { width, height } = img;

  // Scale down if too large
  if (opts.maxDimension && (width > opts.maxDimension || height > opts.maxDimension)) {
    const ratio = opts.maxDimension / Math.max(width, height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Draw original
  ctx.drawImage(img, 0, 0, width, height);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Step 1: Grayscale conversion
  if (opts.grayscale) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
  }

  // Step 2: Brightness adjustment
  if (opts.brightness && opts.brightness !== 0) {
    const b = opts.brightness * 2.55;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(data[i] + b);
      data[i + 1] = clamp(data[i + 1] + b);
      data[i + 2] = clamp(data[i + 2] + b);
    }
  }

  // Step 3: Contrast enhancement
  if (opts.contrast && opts.contrast > 0) {
    const factor = (259 * (opts.contrast * 2.55 + 255)) / (255 * (259 - opts.contrast * 2.55));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(factor * (data[i] - 128) + 128);
      data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128);
      data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128);
    }
  }

  // Step 4: Adaptive binarization (Otsu-like threshold)
  if (opts.binarize !== undefined) {
    let threshold = opts.binarize;
    if (threshold === 0) {
      threshold = computeOtsuThreshold(data);
    }
    for (let i = 0; i < data.length; i += 4) {
      const v = data[i] > threshold ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = v;
    }
  }

  // Apply processed pixels
  ctx.putImageData(imageData, 0, 0);

  // Step 5: Sharpening via unsharp mask
  if (opts.sharpness && opts.sharpness > 0) {
    applySharpen(ctx, width, height, opts.sharpness);
  }

  return canvas.toDataURL('image/png', opts.quality);
}

/** تحميل صورة من base64 أو File */
function loadImage(source: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target?.result as string; };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Otsu's threshold method */
function computeOtsuThreshold(data: Uint8ClampedArray): number {
  const histogram = new Array(256).fill(0);
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
    total++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0, wB = 0, wF = 0;
  let maxVariance = 0, threshold = 0;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  return threshold;
}

/** Unsharp mask sharpening */
function applySharpen(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;

  // 3x3 Gaussian blur kernel for unsharp mask
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kSum = 16;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let blur = 0;
        let ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            blur += src[((y + ky) * w + (x + kx)) * 4 + c] * kernel[ki++];
          }
        }
        blur /= kSum;
        const idx = (y * w + x) * 4 + c;
        const original = src[idx];
        dst[idx] = clamp(original + amount * (original - blur));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export { DEFAULT_OCR_OPTIONS };
export type { PreprocessOptions };
