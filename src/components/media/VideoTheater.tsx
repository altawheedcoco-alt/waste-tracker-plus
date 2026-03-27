import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, PictureInPicture2, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DialogTitle } from '@radix-ui/react-dialog';

interface VideoTheaterProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

const VideoTheater = ({ url, isOpen, onClose, title }: VideoTheaterProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (isPlaying) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setSpeed(1);
    }
  }, [isOpen]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
    resetHideTimer();
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {}
  };

  const toggleFullscreen = async () => {
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
  };

  const fmt = (s: number) => {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 bg-black border-none overflow-hidden">
        <DialogTitle className="sr-only">{title || 'مشغل الفيديو'}</DialogTitle>
        <div
          ref={containerRef}
          className="relative w-full aspect-video cursor-pointer select-none"
          onClick={togglePlay}
          onMouseMove={resetHideTimer}
        >
          <video
            ref={videoRef}
            src={url}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration);
            }}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
          />

          {/* Play overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="w-16 h-16 text-white fill-white/80" />
            </div>
          )}

          {/* Controls bar */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 transition-opacity',
              showControls ? 'opacity-100' : 'opacity-0'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress bar */}
            <div className="h-1 bg-white/20 rounded-full cursor-pointer mb-3 group" onClick={handleSeek}>
              <div className="h-full bg-primary rounded-full relative" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
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
      </DialogContent>
    </Dialog>
  );
};

export default VideoTheater;
