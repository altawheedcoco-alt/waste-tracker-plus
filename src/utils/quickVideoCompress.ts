/**
 * ضغط ذكي للفيديو في المتصفح
 * يقلل الأبعاد لـ 720p مع bitrate منخفض — سريع وفعال
 */

export interface QuickVideoCompressOptions {
  /** أقصى عرض (الافتراضي: 720) */
  maxWidth?: number;
  /** أقصى ارتفاع (الافتراضي: 1280) */
  maxHeight?: number;
  /** معدل البت (الافتراضي: 1Mbps) */
  videoBitrate?: number;
  /** دالة تتبع التقدم */
  onProgress?: (percent: number) => void;
}

export interface QuickVideoResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

/** الحد الأدنى لتفعيل الضغط (3MB) */
const COMPRESS_THRESHOLD = 3 * 1024 * 1024;

/**
 * هل يحتاج الفيديو ضغط؟
 */
export const needsCompression = (file: File): boolean => {
  return file.type.startsWith('video/') && file.size > COMPRESS_THRESHOLD;
};

/**
 * اختيار أفضل mime type مدعوم للتسجيل
 */
const getBestMimeType = (): string => {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
};

/**
 * ضغط فيديو بتقليل الأبعاد + bitrate
 * يعمل بسرعة 2-4x من الوقت الحقيقي
 */
export const quickCompressVideo = (
  file: File,
  options: QuickVideoCompressOptions = {}
): Promise<QuickVideoResult> => {
  const {
    maxWidth = 720,
    maxHeight = 1280,
    videoBitrate = 1_000_000,
    onProgress,
  } = options;

  const mimeType = getBestMimeType();

  // لا يدعم المتصفح التسجيل — ارجع الأصلي
  if (!mimeType) {
    return Promise.resolve({
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      width: 0,
      height: 0,
    });
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    video.onloadedmetadata = () => {
      // حساب الأبعاد
      let w = video.videoWidth;
      let h = video.videoHeight;

      // لا تضغط إذا الأبعاد أصغر من المطلوب
      if (w <= maxWidth && h <= maxHeight && file.size < COMPRESS_THRESHOLD * 2) {
        cleanup();
        resolve({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
          width: w,
          height: h,
        });
        return;
      }

      if (w > maxWidth || h > maxHeight) {
        const ratio = Math.min(maxWidth / w, maxHeight / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      // أبعاد زوجية
      w = w - (w % 2);
      h = h - (h % 2);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // @ts-ignore
      const stream: MediaStream = canvas.captureStream(24);
      
      // إضافة صوت الفيديو الأصلي إن وُجد
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
      } catch {
        // لا يوجد صوت أو غير مدعوم
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: videoBitrate,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        cleanup();
        const blob = new Blob(chunks, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
        const compressedFile = new File(
          [blob],
          file.name.replace(/\.[^.]+$/, `.${ext}`),
          { type: mimeType }
        );

        // لو المضغوط أكبر — ارجع الأصلي
        if (compressedFile.size >= file.size * 0.95) {
          resolve({
            file,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 0,
            width: w,
            height: h,
          });
        } else {
          const ratio = Math.round((1 - compressedFile.size / file.size) * 100);
          console.log(`🎬 ضغط الفيديو: ${fmtSize(file.size)} → ${fmtSize(compressedFile.size)} (-${ratio}%)`);
          resolve({
            file: compressedFile,
            originalSize: file.size,
            compressedSize: compressedFile.size,
            compressionRatio: ratio,
            width: w,
            height: h,
          });
        }
      };

      recorder.onerror = () => { cleanup(); reject(new Error('Recorder error')); };

      // تشغيل بسرعة مضاعفة لتقليل وقت الضغط
      video.playbackRate = 2.0;
      recorder.start(500); // كل 500ms جزء

      video.onplay = () => {
        const draw = () => {
          if (video.ended || video.paused) return;
          ctx.drawImage(video, 0, 0, w, h);
          if (onProgress && video.duration) {
            onProgress(Math.min(95, Math.round((video.currentTime / video.duration) * 95)));
          }
          requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
      };

      video.onended = () => {
        onProgress?.(98);
        setTimeout(() => recorder.stop(), 200);
      };

      video.play().catch(() => { cleanup(); reject(new Error('Cannot play video')); });
    };

    video.onerror = () => { cleanup(); reject(new Error('Cannot load video')); };

    // Timeout: 5 دقائق
    setTimeout(() => { cleanup(); reject(new Error('Compression timeout')); }, 300_000);
  });
};

const fmtSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)}KB` : `${(b / (1024 * 1024)).toFixed(1)}MB`;
