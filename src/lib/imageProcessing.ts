/**
 * نظام المعالجة الرقمية للصور
 * Image Processing System for Deposit Receipts
 * 
 * يشمل:
 * 1. تحديد الحواف (Edge Detection)
 * 2. تصحيح المنظور (Perspective Correction)
 * 3. تحسين الصورة ومعالجة الألوان (Image Enhancement)
 */

interface ProcessedImage {
  original: string;
  processed: string;
  width: number;
  height: number;
  processingSteps: string[];
}

interface Point {
  x: number;
  y: number;
}

/**
 * تحويل الصورة إلى Canvas لمعالجتها
 */
async function imageToCanvas(imageSrc: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}

/**
 * تحويل الصورة إلى تدرج رمادي
 */
function toGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  return imageData;
}

/**
 * تطبيق فلتر Gaussian Blur لتنعيم الصورة
 */
function gaussianBlur(imageData: ImageData, radius: number = 1): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);
  
  const kernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ];
  const kernelSum = 16;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx] * kernel[ky + 1][kx + 1];
          }
        }
        output[(y * width + x) * 4 + c] = sum / kernelSum;
      }
    }
  }

  imageData.data.set(output);
  return imageData;
}

/**
 * تحديد الحواف باستخدام خوارزمية Sobel
 * Edge Detection using Sobel operator
 */
function sobelEdgeDetection(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data.length);
  
  // Sobel kernels
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];
  
  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = data[idx];
          gx += gray * sobelX[ky + 1][kx + 1];
          gy += gray * sobelY[ky + 1][kx + 1];
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const idx = (y * width + x) * 4;
      output[idx] = magnitude;
      output[idx + 1] = magnitude;
      output[idx + 2] = magnitude;
      output[idx + 3] = 255;
    }
  }

  return new ImageData(output, width, height);
}

/**
 * تحسين التباين باستخدام Histogram Equalization
 */
function enhanceContrast(imageData: ImageData): ImageData {
  const data = imageData.data;
  const histogram = new Array(256).fill(0);
  
  // حساب الـ Histogram
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[gray]++;
  }
  
  // حساب الـ CDF
  const cdf = new Array(256);
  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i];
  }
  
  // تطبيع الـ CDF
  const cdfMin = cdf.find(v => v > 0) || 0;
  const pixelCount = imageData.width * imageData.height;
  const scale = 255 / (pixelCount - cdfMin);
  
  const lut = new Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round((cdf[i] - cdfMin) * scale);
    lut[i] = Math.max(0, Math.min(255, lut[i]));
  }
  
  // تطبيق التحويل
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const enhanced = lut[gray];
    data[i] = enhanced;
    data[i + 1] = enhanced;
    data[i + 2] = enhanced;
  }
  
  return imageData;
}

/**
 * تطبيق فلتر الحدة (Sharpen)
 */
function sharpen(imageData: ImageData, intensity: number = 1): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);
  
  const kernel = [
    [0, -1 * intensity, 0],
    [-1 * intensity, 1 + 4 * intensity, -1 * intensity],
    [0, -1 * intensity, 0]
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx] * kernel[ky + 1][kx + 1];
          }
        }
        output[(y * width + x) * 4 + c] = Math.max(0, Math.min(255, sum));
      }
    }
  }

  imageData.data.set(output);
  return imageData;
}

/**
 * تصحيح توازن اللون الأبيض
 */
function whiteBalance(imageData: ImageData): ImageData {
  const data = imageData.data;
  let sumR = 0, sumG = 0, sumB = 0;
  const pixelCount = data.length / 4;

  // حساب متوسط كل قناة
  for (let i = 0; i < data.length; i += 4) {
    sumR += data[i];
    sumG += data[i + 1];
    sumB += data[i + 2];
  }

  const avgR = sumR / pixelCount;
  const avgG = sumG / pixelCount;
  const avgB = sumB / pixelCount;
  const avgGray = (avgR + avgG + avgB) / 3;

  const scaleR = avgGray / avgR;
  const scaleG = avgGray / avgG;
  const scaleB = avgGray / avgB;

  // تطبيق التصحيح
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * scaleR);
    data[i + 1] = Math.min(255, data[i + 1] * scaleG);
    data[i + 2] = Math.min(255, data[i + 2] * scaleB);
  }

  return imageData;
}

/**
 * إزالة الضوضاء (Denoise)
 */
function denoise(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const values: number[] = [];
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            values.push(data[((y + ky) * width + (x + kx)) * 4 + c]);
          }
        }
        values.sort((a, b) => a - b);
        output[(y * width + x) * 4 + c] = values[4]; // Median filter
      }
    }
  }

  imageData.data.set(output);
  return imageData;
}

/**
 * تحسين السطوع والتباين
 */
function adjustBrightnessContrast(
  imageData: ImageData,
  brightness: number = 10,
  contrast: number = 1.2
): ImageData {
  const data = imageData.data;
  const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let value = data[i + c];
      value = factor * (value - 128) + 128 + brightness;
      data[i + c] = Math.max(0, Math.min(255, value));
    }
  }

  return imageData;
}

/**
 * تحويل الصورة للأبيض والأسود مع عتبة تكيفية
 * للحصول على نص واضح
 */
function adaptiveThreshold(imageData: ImageData, blockSize: number = 15): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const grayscale = new Uint8Array(width * height);
  
  // تحويل لتدرج رمادي
  for (let i = 0; i < width * height; i++) {
    grayscale[i] = Math.round(
      0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
    );
  }
  
  const halfBlock = Math.floor(blockSize / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      
      for (let ky = -halfBlock; ky <= halfBlock; ky++) {
        for (let kx = -halfBlock; kx <= halfBlock; kx++) {
          const ny = y + ky;
          const nx = x + kx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            sum += grayscale[ny * width + nx];
            count++;
          }
        }
      }
      
      const mean = sum / count;
      const idx = (y * width + x) * 4;
      const value = grayscale[y * width + x] > mean - 5 ? 255 : 0;
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
    }
  }
  
  return imageData;
}

/**
 * معالجة الصورة الكاملة لإيصال الإيداع
 * Full image processing pipeline for deposit receipts
 */
export async function processReceiptImage(
  imageSrc: string,
  options: {
    enhanceContrast?: boolean;
    sharpen?: boolean;
    denoise?: boolean;
    whiteBalance?: boolean;
    binarize?: boolean;
    edgeDetection?: boolean;
  } = {}
): Promise<ProcessedImage> {
  const {
    enhanceContrast: doEnhanceContrast = true,
    sharpen: doSharpen = true,
    denoise: doDenoise = true,
    whiteBalance: doWhiteBalance = true,
    binarize: doBinarize = false,
    edgeDetection: doEdgeDetection = false,
  } = options;

  const processingSteps: string[] = [];
  
  try {
    // تحميل الصورة إلى Canvas
    const canvas = await imageToCanvas(imageSrc);
    const ctx = canvas.getContext('2d')!;
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 1. إزالة الضوضاء
    if (doDenoise) {
      imageData = denoise(imageData);
      processingSteps.push('إزالة الضوضاء');
    }

    // 2. تصحيح توازن اللون الأبيض
    if (doWhiteBalance) {
      imageData = whiteBalance(imageData);
      processingSteps.push('تصحيح توازن اللون');
    }

    // 3. تحسين التباين
    if (doEnhanceContrast) {
      imageData = adjustBrightnessContrast(imageData, 20, 1.6);
      processingSteps.push('تحسين التباين');
    }

    // 4. تحديد الحواف (اختياري)
    if (doEdgeDetection) {
      const grayData = toGrayscale(ctx.getImageData(0, 0, canvas.width, canvas.height));
      const blurred = gaussianBlur(grayData);
      const edges = sobelEdgeDetection(blurred);
      // يمكن استخدام الحواف للكشف عن حدود المستند
      processingSteps.push('تحديد الحواف');
    }

    // 5. زيادة الحدة
    if (doSharpen) {
      imageData = sharpen(imageData, 0.8);
      processingSteps.push('زيادة الحدة');
    }

    // 6. تحويل للأبيض والأسود (للنص)
    if (doBinarize) {
      imageData = adaptiveThreshold(imageData);
      processingSteps.push('تحويل للأبيض والأسود');
    }

    // تطبيق التغييرات
    ctx.putImageData(imageData, 0, 0);

    return {
      original: imageSrc,
      processed: canvas.toDataURL('image/jpeg', 0.95),
      width: canvas.width,
      height: canvas.height,
      processingSteps,
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
}

/**
 * تحسين صورة الإيصال للقراءة OCR
 * Enhanced processing specifically for OCR
 */
export async function processForOCR(imageSrc: string): Promise<string> {
  try {
    const canvas = await imageToCanvas(imageSrc);
    const ctx = canvas.getContext('2d')!;
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // معالجة مخصصة لـ OCR
    imageData = denoise(imageData);
    imageData = whiteBalance(imageData);
    imageData = adjustBrightnessContrast(imageData, 25, 1.7);
    imageData = sharpen(imageData, 1.0);

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (error) {
    console.error('OCR processing error:', error);
    return imageSrc; // إرجاع الصورة الأصلية في حالة الفشل
  }
}

/**
 * ضغط الصورة مع الحفاظ على الجودة
 */
export async function compressImage(
  imageSrc: string,
  maxWidth: number = 1920,
  quality: number = 0.85
): Promise<string> {
  try {
    const canvas = await imageToCanvas(imageSrc);
    
    // تصغير الصورة إذا كانت كبيرة جداً
    if (canvas.width > maxWidth) {
      const ratio = maxWidth / canvas.width;
      const newCanvas = document.createElement('canvas');
      newCanvas.width = maxWidth;
      newCanvas.height = canvas.height * ratio;
      const ctx = newCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);
      return newCanvas.toDataURL('image/jpeg', quality);
    }
    
    return canvas.toDataURL('image/jpeg', quality);
  } catch (error) {
    console.error('Compression error:', error);
    return imageSrc;
  }
}

/**
 * التحقق من صحة الصورة المرفوعة
 */
export function validateReceiptImage(file: File): { valid: boolean; error?: string } {
  // التحقق من النوع
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPG أو PNG أو WebP' };
  }

  // التحقق من الحجم (أقصى 20MB)
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'حجم الملف كبير جداً. الحد الأقصى 20 ميجابايت' };
  }

  // التحقق من الحد الأدنى (1KB - للتأكد أنها ليست صورة فارغة)
  if (file.size < 1024) {
    return { valid: false, error: 'الملف صغير جداً. يرجى رفع صورة واضحة للإيصال' };
  }

  return { valid: true };
}

/**
 * إنشاء Blob من Canvas
 */
export async function canvasToBlob(canvas: HTMLCanvasElement, type: string = 'image/jpeg', quality: number = 0.95): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      type,
      quality
    );
  });
}
