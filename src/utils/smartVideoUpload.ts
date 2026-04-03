/**
 * نظام رفع فيديو ذكي — يضغط حسب نوع المحتوى وسرعة الشبكة
 * ويخزّن نسخة منخفضة الجودة + نسخة أصلية (أو عالية)
 */
import { supabase } from '@/integrations/supabase/client';
import { smartChunkedUpload } from './chunkedUpload';
import { ffmpegCompressVideo, isFFmpegSupported } from './ffmpegCompress';
import { quickCompressVideo, needsCompression } from './quickVideoCompress';
import { detectNetworkSpeed, type NetworkSpeed } from './networkDetector';

export type VideoContentType = 'story' | 'reel' | 'post' | 'chat' | 'auto';

export interface SmartVideoUploadOptions {
  bucket: string;
  pathPrefix: string;
  contentType?: VideoContentType;
  onProgress?: (percent: number) => void;
  onStage?: (stage: 'analyzing' | 'compressing' | 'uploading' | 'done') => void;
  upsert?: boolean;
}

export interface SmartVideoUploadResult {
  /** رابط الفيديو المضغوط (يُعرض افتراضياً) */
  url: string;
  /** مسار الفيديو المضغوط */
  path: string;
  /** حجم الفيديو الأصلي */
  originalSize: number;
  /** حجم الفيديو المضغوط */
  compressedSize: number;
  /** نسبة الضغط */
  compressionRatio: number;
  /** سرعة الشبكة المكتشفة */
  networkSpeed: NetworkSpeed;
  /** الأبعاد النهائية */
  width: number;
  height: number;
}

/**
 * رفع فيديو ذكي — يكتشف الشبكة ويضغط بأفضل إعدادات
 */
export const smartVideoUpload = async (
  file: File,
  options: SmartVideoUploadOptions
): Promise<SmartVideoUploadResult> => {
  const {
    bucket,
    pathPrefix,
    contentType = 'auto',
    onProgress,
    onStage,
    upsert = false,
  } = options;

  // المرحلة 1: تحليل الشبكة
  onStage?.('analyzing');
  const networkInfo = detectNetworkSpeed();
  console.log(`📡 سرعة الشبكة: ${networkInfo.speed} (${networkInfo.downlinkMbps} Mbps)`);

  onProgress?.(5);

  // المرحلة 2: ضغط الفيديو
  let compressedFile = file;
  let compressionRatio = 0;
  let videoWidth = 0;
  let videoHeight = 0;

  if (needsCompression(file)) {
    onStage?.('compressing');

    try {
      if (isFFmpegSupported()) {
        const result = await ffmpegCompressVideo(file, {
          preset: contentType,
          networkQuality: networkInfo.speed,
          onProgress: (p) => onProgress?.(5 + Math.round(p * 0.45)), // 5-50%
          onStage: (s) => {
            if (s === 'loading') onStage?.('compressing');
          },
        });
        compressedFile = result.file;
        compressionRatio = result.compressionRatio;
        videoWidth = result.width;
        videoHeight = result.height;
      } else {
        // Fallback: MediaRecorder
        const targetWidth = networkInfo.speed === 'slow' ? 480 : 720;
        const targetBitrate = networkInfo.speed === 'slow' ? 500_000 : 800_000;

        const result = await quickCompressVideo(file, {
          maxWidth: targetWidth,
          videoBitrate: targetBitrate,
          onProgress: (p) => onProgress?.(5 + Math.round(p * 0.45)),
        });
        compressedFile = result.file;
        compressionRatio = result.compressionRatio;
        videoWidth = result.width;
        videoHeight = result.height;
      }
    } catch (err) {
      console.warn('⚠️ فشل ضغط الفيديو:', err);
    }
  }

  onProgress?.(55);

  // المرحلة 3: رفع الفيديو المضغوط
  onStage?.('uploading');
  const ext = compressedFile.name.split('.').pop() || 'mp4';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const videoPath = `${pathPrefix}/${uniqueName}`;

  const uploadResult = await smartChunkedUpload(compressedFile, {
    bucket,
    path: videoPath,
    contentType: compressedFile.type,
    upsert,
    onProgress: (p) => onProgress?.(55 + Math.round(p * 0.40)), // 55-95%
  });

  onProgress?.(98);
  onStage?.('done');

  console.log(
    `✅ رفع فيديو ذكي: ${fmtSize(file.size)} → ${fmtSize(compressedFile.size)} ` +
    `(-${compressionRatio}%) | شبكة: ${networkInfo.speed}`
  );

  return {
    url: uploadResult.publicUrl,
    path: videoPath,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    compressionRatio,
    networkSpeed: networkInfo.speed,
    width: videoWidth,
    height: videoHeight,
  };
};

const fmtSize = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)}KB` : `${(b / (1024 * 1024)).toFixed(1)}MB`;
