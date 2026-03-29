/**
 * ضغط فيديو حقيقي باستخدام ffmpeg.wasm (H.264/libx264)
 * يحقق جودة عالية مع حجم أقل بكثير من MediaRecorder
 */

let ffmpegInstance: any = null;
let ffmpegLoading = false;
let ffmpegReady = false;

export interface FFmpegCompressOptions {
  /** أقصى عرض — 1080 للريلز، 720 للستوريز */
  maxWidth?: number;
  /** أقصى ارتفاع */
  maxHeight?: number;
  /** CRF (24-28) — أقل = جودة أعلى وحجم أكبر */
  crf?: number;
  /** تتبع التقدم */
  onProgress?: (percent: number) => void;
  /** تتبع المرحلة */
  onStage?: (stage: 'loading' | 'compressing' | 'done') => void;
}

export interface FFmpegCompressResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  duration: number;
}

/**
 * هل يدعم المتصفح SharedArrayBuffer (مطلوب لـ ffmpeg.wasm)
 */
export const isFFmpegSupported = (): boolean => {
  return typeof SharedArrayBuffer !== 'undefined';
};

/**
 * تحميل ffmpeg.wasm (مرة واحدة فقط)
 */
const loadFFmpeg = async (onStage?: (stage: 'loading' | 'compressing' | 'done') => void) => {
  if (ffmpegReady && ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) {
    // انتظر حتى يكتمل التحميل
    while (ffmpegLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    return ffmpegInstance;
  }

  ffmpegLoading = true;
  onStage?.('loading');

  try {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    ffmpegReady = true;
    return ffmpeg;
  } catch (err) {
    console.error('❌ فشل تحميل ffmpeg.wasm:', err);
    throw err;
  } finally {
    ffmpegLoading = false;
  }
};

/**
 * توليد صورة مصغرة (Thumbnail) من أول إطار
 */
export const generateThumbnail = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadeddata = () => {
      video.currentTime = 0.5; // عند نصف ثانية
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth, 640);
      canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error('Failed to generate thumbnail'));
        },
        'image/jpeg',
        0.8
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Cannot load video for thumbnail'));
    };

    setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Thumbnail generation timeout'));
    }, 15000);
  });
};

/**
 * ضغط فيديو باستخدام ffmpeg.wasm
 */
export const ffmpegCompressVideo = async (
  file: File,
  options: FFmpegCompressOptions = {}
): Promise<FFmpegCompressResult> => {
  const {
    maxWidth = 1080,
    maxHeight = 1920,
    crf = 26,
    onProgress,
    onStage,
  } = options;

  // Fallback لو المتصفح لا يدعم SharedArrayBuffer
  if (!isFFmpegSupported()) {
    console.warn('⚠️ SharedArrayBuffer غير مدعوم — يتم الرفع بدون ضغط ffmpeg');
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      width: 0,
      height: 0,
      duration: 0,
    };
  }

  const ffmpeg = await loadFFmpeg(onStage);
  onStage?.('compressing');
  onProgress?.(5);

  const { fetchFile } = await import('@ffmpeg/util');

  // كتابة الملف المدخل
  const inputName = 'input' + (file.name.endsWith('.mp4') ? '.mp4' : '.webm');
  const outputName = 'output.mp4';

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  onProgress?.(15);

  // تتبع التقدم
  ffmpeg.on('progress', ({ progress }: { progress: number }) => {
    onProgress?.(15 + Math.round(progress * 75)); // 15-90%
  });

  // بناء أمر الضغط
  // scale filter: تقليل الأبعاد مع الحفاظ على النسبة
  const scaleFilter = `scale='min(${maxWidth},iw)':min'(${maxHeight},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`;

  try {
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', scaleFilter,
      '-c:v', 'libx264',
      '-crf', crf.toString(),
      '-preset', 'fast',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      outputName,
    ]);
  } catch (execErr) {
    // Fallback: حاول بدون scale filter
    console.warn('⚠️ فشل الضغط مع تغيير الأبعاد، يتم المحاولة بدون تغيير حجم');
    await ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libx264',
      '-crf', crf.toString(),
      '-preset', 'fast',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      outputName,
    ]);
  }

  onProgress?.(92);

  // قراءة الملف الناتج
  const data = await ffmpeg.readFile(outputName);
  const compressedBlob = new Blob([data], { type: 'video/mp4' });
  const compressedFile = new File(
    [compressedBlob],
    file.name.replace(/\.[^.]+$/, '.mp4'),
    { type: 'video/mp4' }
  );

  // تنظيف
  await ffmpeg.deleteFile(inputName).catch(() => {});
  await ffmpeg.deleteFile(outputName).catch(() => {});

  onProgress?.(95);
  onStage?.('done');

  // لو المضغوط أكبر — ارجع الأصلي
  if (compressedFile.size >= file.size * 0.95) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      width: 0,
      height: 0,
      duration: 0,
    };
  }

  const ratio = Math.round((1 - compressedFile.size / file.size) * 100);
  console.log(`🎬 ffmpeg ضغط: ${fmtSize(file.size)} → ${fmtSize(compressedFile.size)} (-${ratio}%)`);

  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    compressionRatio: ratio,
    width: 0,
    height: 0,
    duration: 0,
  };
};

const fmtSize = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)}KB` : `${(b / (1024 * 1024)).toFixed(1)}MB`;
