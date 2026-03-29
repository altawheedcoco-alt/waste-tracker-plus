/**
 * شريط تقدم مرحلتين (معالجة + رفع) لرفع الفيديو
 */
import { memo } from 'react';
import { Loader2, Upload, CheckCircle2, Cog } from 'lucide-react';

export type UploadStage = 'idle' | 'compressing' | 'uploading' | 'done' | 'error';

interface Props {
  stage: UploadStage;
  progress: number; // 0-100
  originalSize?: number;
  compressedSize?: number;
}

const stageConfig = {
  idle: { icon: Upload, label: '', color: 'bg-muted' },
  compressing: { icon: Cog, label: 'جاري معالجة الفيديو ⚙️', color: 'bg-amber-500' },
  uploading: { icon: Upload, label: 'جاري الرفع للـ Cloud 🚀', color: 'bg-primary' },
  done: { icon: CheckCircle2, label: 'تم بنجاح ✅', color: 'bg-green-500' },
  error: { icon: Loader2, label: 'خطأ في المعالجة', color: 'bg-destructive' },
};

const VideoUploadProgress = memo(({ stage, progress, originalSize, compressedSize }: Props) => {
  if (stage === 'idle') return null;

  const config = stageConfig[stage];
  const Icon = config.icon;

  return (
    <div className="space-y-2">
      {/* Stage label */}
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <Icon className={`w-3.5 h-3.5 ${stage === 'compressing' || stage === 'uploading' ? 'animate-spin' : ''}`} />
          {config.label}
        </span>
        <span className="text-muted-foreground tabular-nums">{Math.round(progress)}%</span>
      </div>

      {/* Progress bar with 2 phases */}
      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden relative">
        {/* Compression phase (0-50%) */}
        <div
          className="absolute inset-y-0 left-0 bg-amber-500 transition-all duration-300 rounded-full"
          style={{
            width: stage === 'compressing'
              ? `${Math.min(progress, 50)}%`
              : stage === 'uploading' || stage === 'done'
              ? '50%'
              : '0%',
          }}
        />
        {/* Upload phase (50-100%) */}
        <div
          className="absolute inset-y-0 bg-primary transition-all duration-300 rounded-full"
          style={{
            left: '50%',
            width: stage === 'uploading'
              ? `${Math.min((progress - 50) * 2, 50)}%`
              : stage === 'done'
              ? '50%'
              : '0%',
          }}
        />
      </div>

      {/* Phase indicators */}
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span className={stage === 'compressing' ? 'text-amber-500 font-medium' : ''}>معالجة</span>
        <span className={stage === 'uploading' ? 'text-primary font-medium' : ''}>رفع</span>
        <span className={stage === 'done' ? 'text-green-500 font-medium' : ''}>تم</span>
      </div>

      {/* Compression stats */}
      {compressedSize && originalSize && compressedSize < originalSize && (
        <p className="text-[10px] text-center text-green-600">
          تم تقليل الحجم: {fmtSize(originalSize)} → {fmtSize(compressedSize)} 
          ({Math.round((1 - compressedSize / originalSize) * 100)}% توفير)
        </p>
      )}
    </div>
  );
});

const fmtSize = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)}KB` : `${(b / (1024 * 1024)).toFixed(1)}MB`;

VideoUploadProgress.displayName = 'VideoUploadProgress';
export default VideoUploadProgress;
