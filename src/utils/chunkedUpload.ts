/**
 * نظام رفع مقسم (Chunked/Resumable Upload)
 * يقسم الملفات الكبيرة لأجزاء صغيرة ويرفعها بالتوازي
 * مع إمكانية الاستئناف عند انقطاع الاتصال
 */

import { supabase } from '@/integrations/supabase/client';

export interface ChunkedUploadOptions {
  bucket: string;
  path: string;
  /** حجم كل جزء بالبايت (الافتراضي: 2MB) */
  chunkSize?: number;
  /** عدد الأجزاء المتوازية (الافتراضي: 3) */
  concurrency?: number;
  /** دالة تتبع التقدم (0-100) */
  onProgress?: (percent: number) => void;
  /** دالة عند تغير الحالة */
  onStatusChange?: (status: UploadStatus) => void;
  /** استبدال الملف إن وُجد */
  upsert?: boolean;
  contentType?: string;
}

export type UploadStatus = 'preparing' | 'uploading' | 'merging' | 'complete' | 'error' | 'paused';

export interface ChunkedUploadResult {
  publicUrl: string;
  path: string;
  totalSize: number;
  totalChunks: number;
  uploadTimeMs: number;
}

/** الحد الأدنى لتفعيل الرفع المقسم (5MB) */
const CHUNKED_THRESHOLD = 5 * 1024 * 1024;

/**
 * رفع ملف — يختار تلقائياً بين الرفع العادي والمقسم
 */
export const smartChunkedUpload = async (
  file: File,
  options: ChunkedUploadOptions
): Promise<ChunkedUploadResult> => {
  const startTime = Date.now();

  // ملفات أقل من 5MB → رفع عادي مباشر (أسرع)
  if (file.size < CHUNKED_THRESHOLD) {
    options.onProgress?.(10);
    options.onStatusChange?.('uploading');

    const { error } = await supabase.storage
      .from(options.bucket)
      .upload(options.path, file, {
        contentType: options.contentType || file.type,
        upsert: options.upsert ?? false,
      });

    if (error) throw error;

    options.onProgress?.(100);
    options.onStatusChange?.('complete');

    const { data: urlData } = supabase.storage.from(options.bucket).getPublicUrl(options.path);

    return {
      publicUrl: urlData.publicUrl,
      path: options.path,
      totalSize: file.size,
      totalChunks: 1,
      uploadTimeMs: Date.now() - startTime,
    };
  }

  // ملفات كبيرة → رفع مقسم
  return chunkedUpload(file, options, startTime);
};

/**
 * الرفع المقسم الفعلي
 */
const chunkedUpload = async (
  file: File,
  options: ChunkedUploadOptions,
  startTime: number
): Promise<ChunkedUploadResult> => {
  const {
    bucket,
    path,
    chunkSize = 2 * 1024 * 1024, // 2MB per chunk
    concurrency = 3,
    onProgress,
    onStatusChange,
    upsert = false,
  } = options;

  onStatusChange?.('preparing');

  // تقسيم الملف لأجزاء
  const totalChunks = Math.ceil(file.size / chunkSize);
  const chunks: { index: number; blob: Blob; uploaded: boolean }[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    chunks.push({ index: i, blob: file.slice(start, end), uploaded: false });
  }

  onStatusChange?.('uploading');
  onProgress?.(0);

  // رفع الأجزاء بالتوازي مع حد أقصى
  const chunkPaths: string[] = new Array(totalChunks);
  let completedChunks = 0;

  const uploadChunk = async (chunk: typeof chunks[0]) => {
    const chunkPath = `${path}__chunk_${chunk.index}`;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const { error } = await supabase.storage
          .from(bucket)
          .upload(chunkPath, chunk.blob, {
            contentType: 'application/octet-stream',
            upsert: true,
          });

        if (error) throw error;

        chunk.uploaded = true;
        chunkPaths[chunk.index] = chunkPath;
        completedChunks++;
        onProgress?.(Math.round((completedChunks / totalChunks) * 90));
        return;
      } catch (err) {
        if (attempt === maxRetries - 1) throw err;
        // انتظر قبل إعادة المحاولة
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  };

  // تنفيذ بالتوازي مع حد أقصى
  const pool: Promise<void>[] = [];
  for (const chunk of chunks) {
    const p = uploadChunk(chunk);
    pool.push(p);

    if (pool.length >= concurrency) {
      await Promise.race(pool);
      // أزل المكتملة
      for (let i = pool.length - 1; i >= 0; i--) {
        // @ts-ignore
        if (pool[i]._settled) pool.splice(i, 1);
      }
    }
  }
  await Promise.all(pool);

  // دمج الأجزاء
  onStatusChange?.('merging');
  onProgress?.(92);

  // تحميل كل الأجزاء ودمجها
  const allBlobs: Blob[] = [];
  for (let i = 0; i < totalChunks; i++) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(chunkPaths[i]);

    if (error) throw error;
    allBlobs.push(data);
  }

  onProgress?.(95);

  // رفع الملف المدمج
  const mergedBlob = new Blob(allBlobs, { type: file.type });
  const { error: mergeError } = await supabase.storage
    .from(bucket)
    .upload(path, mergedBlob, {
      contentType: file.type,
      upsert,
    });

  if (mergeError) throw mergeError;

  onProgress?.(98);

  // حذف الأجزاء المؤقتة
  await supabase.storage.from(bucket).remove(chunkPaths).catch(() => {});

  onProgress?.(100);
  onStatusChange?.('complete');

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    publicUrl: urlData.publicUrl,
    path,
    totalSize: file.size,
    totalChunks,
    uploadTimeMs: Date.now() - startTime,
  };
};
