/**
 * مشغل فيديو تكيفي — يكتشف سرعة الشبكة ويتحكم في التحميل والجودة
 * المستوى 3: تجربة مشابهة لمنصات التواصل الاجتماعي
 */
import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, PictureInPicture2, Gauge, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectNetworkSpeed, onNetworkChange, type NetworkInfo } from '@/utils/networkDetector';

interface AdaptiveVideoPlayerProps {
  url: string;
  poster?: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  /** التحكم في التحميل المسبق */
  preloadStrategy?: 'none' | 'metadata' | 'auto';
  /** عرض مؤشر الشبكة */
  showNetworkIndicator?: boolean;
  onPlay?: () => void;
  onEnded?: () => void;
}

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

const AdaptiveVideoPlayer = memo(({
  url,
  poster,
  title,
  className,
  autoPlay = false,
  muted: initialMuted = false,
  loop = false,
  preloadStrategy = 'metadata',
  showNetworkIndicator = true,
  onPlay,
  onEnded,
}: AdaptiveVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<NodeJS.Timeout>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(detectNetworkSpeed);

  // مراقبة تغيّرات الشبكة
  useEffect(() => {
    const unsub = onNetworkChange(setNetworkInfo);
    return unsub;
  }, []);

  // تحسين التحميل حسب الشبكة
  useEffect(() => {
    if (!videoRef.current) return;

    // على الشبكات البطيئة: metadata فقط
    if (networkInfo.speed === 'slow') {
      videoRef.current.preload = 'metadata';
    }
  }, [networkInfo.speed]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (isPlaying) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      onPlay?.();
    }
    setIsPlaying(!isPlaying);
    resetHideTimer();
  }, [isPlaying, resetHideTimer, onPlay]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    setCurrentTime(v.currentTime);
    setProgress((v.currentTime / v.duration) * 100);

    // تحديث buffer
    if (v.buffered.length > 0) {
      const bufferedEnd = v.buffered.end(v.buffered.length - 1);
      setBuffered((bufferedEnd / v.duration) * 100);
    }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const cycleSpeed = useCallback(() => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  }, [speed]);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {}
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {}
  }, []);

  const fmt = (s: number) => {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const networkColor = networkInfo.speed === 'slow' ? 'text-red-400' : networkInfo.speed === 'medium' ? 'text-yellow-400' : 'text-green-400';
  const NetworkIcon = networkInfo.speed === 'slow' ? WifiOff : Wifi;

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full aspect-video bg-black rounded-lg overflow-hidden cursor-pointer select-none group', className)}
      onClick={togglePlay}
      onMouseMove={resetHideTimer}
    >
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        className="w-full h-full object-contain"
        preload={preloadStrategy}
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
      />

      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Play overlay */}
      {!isPlaying && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="w-16 h-16 text-white fill-white/80" />
        </div>
      )}

      {/* Network indicator */}
      {showNetworkIndicator && (
        <div className={cn(
          'absolute top-3 left-3 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm transition-opacity',
          showControls ? 'opacity-100' : 'opacity-0'
        )}>
          <NetworkIcon className={cn('w-3 h-3', networkColor)} />
          <span className={networkColor}>
            {networkInfo.speed === 'slow' ? 'بطيء' : networkInfo.speed === 'medium' ? 'متوسط' : 'سريع'}
          </span>
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 transition-opacity',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress + Buffer bar */}
        <div className="h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/bar relative" onClick={handleSeek}>
          {/* Buffer bar */}
          <div
            className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
            style={{ width: `${buffered}%` }}
          />
          {/* Progress bar */}
          <div className="absolute inset-y-0 left-0 bg-primary rounded-full" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay}>
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={toggleMute}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="font-mono">{fmt(currentTime)} / {fmt(duration)}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={cycleSpeed} className="flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20">
              <Gauge className="w-3 h-3" /> {speed}x
            </button>
            <button onClick={togglePiP}><PictureInPicture2 className="w-4 h-4" /></button>
            <button onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

AdaptiveVideoPlayer.displayName = 'AdaptiveVideoPlayer';
export default AdaptiveVideoPlayer;
