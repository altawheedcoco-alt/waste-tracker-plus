/**
 * ضغط فيديو محسّن باستخدام ffmpeg.wasm (H.264/libx264)
 * المستوى 1: إعدادات مُحسّنة لأقل حجم مع أعلى جودة
 */

let ffmpegInstance: any = null;
let ffmpegLoading = false;
let ffmpegReady = false;

export interface FFmpegCompressOptions {
  /** نوع المحتوى — يحدد الإعدادات المثلى تلقائياً */
  preset?: 'story' | 'reel' | 'post' | 'chat' | 'auto';
  /** أقصى عرض — يُحدد تلقائياً حسب الـ preset */
  maxWidth?: number;
  /** أقصى ارتفاع */
  maxHeight?: number;
  /** CRF (24-32) — أعلى = حجم أصغر */
  crf?: number;
  /** تتبع التقدم */
  onProgress?: (percent: number) => void;
  /** تتبع المرحلة */
  onStage?: (stage: 'loading' | 'compressing' | 'done') => void;
  /** جودة الشبكة — يُحدد تلقائياً */
  networkQuality?: 'slow' | 'medium' | 'fast';
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

/** إعدادات مُحسّنة لكل نوع محتوى */
const QUALITY_PRESETS = {
  story: { maxWidth: 720, maxHeight: 1280, crf: 30, audioBitrate: '96k' },
  reel: { maxWidth: 720, maxHeight: 1280, crf: 28, audioBitrate: '128k' },
  post: { maxWidth: 1080, maxHeight: 1080, crf: 28, audioBitrate: '128k' },
  chat: { maxWidth: 480, maxHeight: 854, crf: 32, audioBitrate: '64k' },
  auto: { maxWidth: 720, maxHeight: 1280, crf: 28, audioBitrate: '128k' },
} as const;

/** إعدادات حسب سرعة الشبكة */
const NETWORK_PRESETS = {
  slow: { crfBonus: 4, maxWidth: 480, audioBitrate: '64k' },
  medium: { crfBonus: 2, maxWidth: 720, audioBitrate: '96k' },
  fast: { crfBonus: 0, maxWidth: 1080, audioBitrate: '128k' },
} as const;

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
 * تحليل أبعاد الفيديو لاختيار أفضل إعدادات
 */
const analyzeVideo = (file: File): Promise<{ width: number; height: number; duration: number }> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      const result = { width: video.videoWidth, height: video.videoHeight, duration: video.duration };
      URL.revokeObjectURL(url);
      resolve(result);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0, duration: 0 });
    };
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0, duration: 0 });
    }, 10000);
  });
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
      video.currentTime = 0.5;
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
        0.75
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
 * ضغط فيديو محسّن باستخدام ffmpeg.wasm
 */
export const ffmpegCompressVideo = async (
  file: File,
  options: FFmpegCompressOptions = {}
): Promise<FFmpegCompressResult> => {
  const {
    preset = 'auto',
    networkQuality = 'medium',
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
      width: 0, height: 0, duration: 0,
    };
  }

  // تحليل الفيديو أولاً
  const videoInfo = await analyzeVideo(file);
  onProgress?.(3);

  // اختيار الإعدادات المثلى
  const qualityPreset = QUALITY_PRESETS[preset];
  const networkPreset = NETWORK_PRESETS[networkQuality];

  // الدمج الذكي: أقل قيمة بين preset والشبكة
  const targetMaxWidth = options.maxWidth || Math.min(qualityPreset.maxWidth, networkPreset.maxWidth);
  const targetMaxHeight = options.maxHeight || qualityPreset.maxHeight;
  const targetCrf = options.crf || (qualityPreset.crf + networkPreset.crfBonus);
  const audioBitrate = networkPreset.audioBitrate;

  // لا تضغط لو الفيديو أصغر من الهدف والحجم معقول
  if (videoInfo.width > 0 && videoInfo.width <= targetMaxWidth && file.size < 2 * 1024 * 1024) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      width: videoInfo.width, height: videoInfo.height, duration: videoInfo.duration,
    };
  }

  const ffmpeg = await loadFFmpeg(onStage);
  onStage?.('compressing');
  onProgress?.(8);

  const { fetchFile } = await import('@ffmpeg/util');

  const inputName = 'input' + (file.name.endsWith('.mp4') ? '.mp4' : '.webm');
  const outputName = 'output.mp4';

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  onProgress?.(15);

  // تتبع التقدم
  ffmpeg.on('progress', ({ progress }: { progress: number }) => {
    onProgress?.(15 + Math.round(progress * 75));
  });

  // Scale filter مُصحّح — الخطأ كان في الأقواس
  const scaleFilter = `scale='min(${targetMaxWidth},iw)':'min(${targetMaxHeight},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`;

  try {
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', scaleFilter,
      '-c:v', 'libx264',
      '-crf', targetCrf.toString(),
      '-preset', 'fast',
      '-profile:v', 'baseline',  // أعلى توافقية مع الأجهزة الضعيفة
      '-level', '3.1',
      '-pix_fmt', 'yuv420p',     // ضروري للتوافقية
      '-c:a', 'aac',
      '-b:a', audioBitrate,
      '-ac', '1',                // مونو — يوفر 50% من حجم الصوت
      '-movflags', '+faststart', // يبدأ التشغيل فوراً بدون تحميل كامل
      '-y',
      outputName,
    ]);
  } catch (execErr) {
    // Fallback: بدون scale filter
    console.warn('⚠️ فشل الضغط مع تغيير الأبعاد، محاولة بدون تغيير حجم');
    await ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libx264',
      '-crf', targetCrf.toString(),
      '-preset', 'fast',
      '-profile:v', 'baseline',
      '-level', '3.1',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', audioBitrate,
      '-ac', '1',
      '-movflags', '+faststart',
      '-y',
      outputName,
    ]);
  }

  onProgress?.(92);

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
      width: videoInfo.width, height: videoInfo.height, duration: videoInfo.duration,
    };
  }

  const ratio = Math.round((1 - compressedFile.size / file.size) * 100);
  console.log(`🎬 ffmpeg ضغط: ${fmtSize(file.size)} → ${fmtSize(compressedFile.size)} (-${ratio}%)`);

  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    compressionRatio: ratio,
    width: videoInfo.width,
    height: videoInfo.height,
    duration: videoInfo.duration,
  };
};

const fmtSize = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)}KB` : `${(b / (1024 * 1024)).toFixed(1)}MB`;
