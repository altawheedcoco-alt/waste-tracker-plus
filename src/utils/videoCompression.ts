/**
 * ضغط الفيديو في المتصفح قبل الرفع
 * يستخدم Canvas + MediaRecorder لإعادة ترميز الفيديو بجودة أقل
 */

export interface VideoCompressionOptions {
  /** أقصى عرض (الافتراضي: 720) */
  maxWidth?: number;
  /** أقصى ارتفاع (الافتراضي: 1280) */
  maxHeight?: number;
  /** معدل البت بالبايت/ثانية (الافتراضي: 1_500_000 = 1.5Mbps) */
  videoBitrate?: number;
  /** نوع الملف الناتج */
  mimeType?: string;
}

export interface VideoCompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  duration: number;
}

/**
 * توليد صورة مصغرة (poster) من أول إطار في الفيديو
 */
export const generateVideoPoster = (file: File | string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const src = typeof file === 'string' ? file : URL.createObjectURL(file);
    video.src = src;

    video.onloadeddata = () => {
      video.currentTime = 0.5; // اذهب لنصف ثانية لتجنب إطار أسود
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth, 480);
        canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No canvas context')); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/webp', 0.6);
        if (typeof file !== 'string') URL.revokeObjectURL(src);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    video.onerror = () => {
      if (typeof file !== 'string') URL.revokeObjectURL(src);
      reject(new Error('Failed to load video for poster'));
    };

    // Timeout
    setTimeout(() => {
      if (typeof file !== 'string') URL.revokeObjectURL(src);
      reject(new Error('Poster generation timed out'));
    }, 10000);
  });
};

/**
 * ضغط الفيديو باستخدام MediaRecorder
 * يعمل مع معظم المتصفحات الحديثة (Chrome, Edge, Firefox)
 */
export const compressVideo = async (
  file: File,
  options: VideoCompressionOptions = {}
): Promise<VideoCompressionResult> => {
  const {
    maxWidth = 720,
    maxHeight = 1280,
    videoBitrate = 1_500_000,
    mimeType = 'video/webm',
  } = options;

  // تحقق من دعم المتصفح
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    console.warn('⚠️ المتصفح لا يدعم ضغط الفيديو، سيتم رفع الأصلي');
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

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      // حساب الأبعاد الجديدة
      let w = video.videoWidth;
      let h = video.videoHeight;

      if (w > maxWidth || h > maxHeight) {
        const ratio = Math.min(maxWidth / w, maxHeight / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      // تأكد الأبعاد زوجية (مطلوب للترميز)
      w = w % 2 === 0 ? w : w - 1;
      h = h % 2 === 0 ? h : h - 1;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // @ts-ignore - captureStream is available in modern browsers
      const stream = canvas.captureStream(30);

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: videoBitrate,
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(objectUrl);
        const blob = new Blob(chunks, { type: mimeType });
        const ext = mimeType === 'video/webm' ? 'webm' : 'mp4';
        const compressedFile = new File(
          [blob],
          file.name.replace(/\.[^.]+$/, `.${ext}`),
          { type: mimeType }
        );

        const result: VideoCompressionResult = {
          file: compressedFile,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          compressionRatio: Math.round((1 - compressedFile.size / file.size) * 100),
          width: w,
          height: h,
          duration: video.duration,
        };

        // إذا الملف المضغوط أكبر، ارجع الأصلي
        if (compressedFile.size >= file.size) {
          resolve({ ...result, file, compressedSize: file.size, compressionRatio: 0 });
        } else {
          console.log(`📦 تم ضغط الفيديو: ${formatSize(file.size)} → ${formatSize(compressedFile.size)} (${result.compressionRatio}%)`);
          resolve(result);
        }
      };

      recorder.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('MediaRecorder error'));
      };

      // ابدأ التسجيل
      recorder.start();

      // ارسم إطارات الفيديو على Canvas
      video.play();
      const drawFrame = () => {
        if (video.ended || video.paused) {
          recorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        requestAnimationFrame(drawFrame);
      };
      requestAnimationFrame(drawFrame);

      video.onended = () => {
        setTimeout(() => recorder.stop(), 100);
      };
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video'));
    };

    // Timeout: 3 دقائق
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Video compression timed out'));
    }, 180_000);
  });
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

/**
 * هل الملف فيديو كبير يحتاج ضغط؟
 * أي فيديو أكبر من 5 ميجابايت يُضغط
 */
export const shouldCompressVideo = (file: File): boolean => {
  return file.type.startsWith('video/') && file.size > 5 * 1024 * 1024;
};
