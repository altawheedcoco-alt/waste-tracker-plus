/**
 * أداة رفع ملفات مركزية مع ضغط تلقائي للصور
 * تضغط الصور قبل الرفع وتعيد الـ URL العام
 */
import { supabase } from '@/integrations/supabase/client';
import { compressImage, CompressionOptions, formatFileSize } from './imageCompression';
import { smartChunkedUpload } from './chunkedUpload';
import { needsCompression, quickCompressVideo } from './quickVideoCompress';
import { ffmpegCompressVideo, isFFmpegSupported } from './ffmpegCompress';

export interface UploadOptions {
  /** اسم الـ bucket */
  bucket: string;
  /** مسار الملف داخل الـ bucket */
  path: string;
  /** تفعيل ضغط الصور (الافتراضي: true) */
  compress?: boolean;
  /** خيارات الضغط */
  compressionOptions?: CompressionOptions;
  /** نوع المحتوى (يُكتشف تلقائياً) */
  contentType?: string;
  /** استبدال الملف إن وُجد */
  upsert?: boolean;
  /** مدة التخزين المؤقت بالثواني */
  cacheControl?: string;
  /** دالة تتبع التقدم (0-100) */
  onProgress?: (percent: number) => void;
}

export interface UploadResult {
  publicUrl: string;
  path: string;
  originalSize: number;
  finalSize: number;
  compressed: boolean;
  compressionRatio: number;
}

/**
 * رفع ملف واحد مع ضغط تلقائي للصور
 */
export const uploadFile = async (
  file: File,
  options: UploadOptions
): Promise<UploadResult> => {
  const {
    bucket,
    path,
    compress = true,
    compressionOptions,
    upsert = false,
    cacheControl = '3600',
  } = options;

  let fileToUpload = file;
  let compressed = false;
  let compressionRatio = 0;
  const originalSize = file.size;

  // ضغط الصور تلقائياً
  if (compress && file.type.startsWith('image/')) {
    try {
      const result = await compressImage(file, compressionOptions);
      fileToUpload = result.file;
      compressed = result.compressionRatio > 0;
      compressionRatio = result.compressionRatio;
    } catch (err) {
      console.warn('⚠️ فشل ضغط الصورة، سيتم رفع الأصلية:', err);
    }
  }

  // ضغط الفيديو تلقائياً — يفضل ffmpeg.wasm ثم يرجع لـ MediaRecorder
  if (compress && needsCompression(file)) {
    try {
      if (isFFmpegSupported()) {
        const result = await ffmpegCompressVideo(file, {
          maxWidth: 1080,
          crf: 26,
          onProgress: options.onProgress,
        });
        fileToUpload = result.file;
        compressed = result.compressionRatio > 0;
        compressionRatio = result.compressionRatio;
      } else {
        const result = await quickCompressVideo(file, { onProgress: options.onProgress });
        fileToUpload = result.file;
        compressed = result.compressionRatio > 0;
        compressionRatio = result.compressionRatio;
      }
    } catch (err) {
      console.warn('⚠️ فشل ضغط الفيديو، سيتم رفع الأصلي:', err);
    }
  }

  // تحديث امتداد المسار إن تغيرت الصيغة
  let finalPath = path;
  if (compressed && fileToUpload.name !== file.name) {
    const newExt = fileToUpload.name.split('.').pop();
    finalPath = path.replace(/\.[^.]+$/, `.${newExt}`);
  }

  // استخدام الرفع المقسم للملفات الكبيرة (> 5MB)
  const result = await smartChunkedUpload(fileToUpload, {
    bucket,
    path: finalPath,
    contentType: options.contentType || fileToUpload.type,
    upsert,
    onProgress: options.onProgress,
  });

  return {
    publicUrl: result.publicUrl,
    path: finalPath,
    originalSize,
    finalSize: fileToUpload.size,
    compressed,
    compressionRatio,
  };
};

/**
 * رفع عدة ملفات بالتوازي مع ضغط تلقائي
 */
export const uploadFiles = async (
  files: File[],
  options: Omit<UploadOptions, 'path'> & { pathPrefix: string }
): Promise<UploadResult[]> => {
  const { pathPrefix, ...rest } = options;

  return Promise.all(
    files.map((file) => {
      const ext = file.name.split('.').pop();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const path = `${pathPrefix}/${uniqueName}`;
      return uploadFile(file, { ...rest, path });
    })
  );
};
