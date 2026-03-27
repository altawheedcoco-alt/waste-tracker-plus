import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StandaloneAudioPlayerProps {
  url: string;
  title?: string;
  className?: string;
}

const StandaloneAudioPlayer = ({ url, title, className }: StandaloneAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformHeights] = useState(() => Array.from({ length: 32 }, () => Math.random() * 20 + 4));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    });
    return () => {
      audio.pause();
      audio.src = '';
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [url]);

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p);
      setCurrentTime(audioRef.current.currentTime);
      if (!audioRef.current.paused) {
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    }
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current.play();
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = (x / rect.width) * 100;
    const t = (pct / 100) * audioRef.current.duration;
    audioRef.current.currentTime = t;
    setProgress(pct);
    setCurrentTime(t);
  };

  const fmt = (s: number) => {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50', className)}>
      <button
        onClick={togglePlay}
        className="shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        {title && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            <Music className="w-3 h-3 shrink-0" />
            <span className="truncate">{title}</span>
          </div>
        )}
        <div className="flex items-center gap-[1.5px] h-6 cursor-pointer" onClick={handleSeek}>
          {waveformHeights.map((height, i) => {
            const barProg = (progress / 100) * waveformHeights.length;
            return (
              <div
                key={i}
                className={cn(
                  'w-[2px] rounded-full transition-colors duration-100',
                  i < barProg ? 'bg-primary' : 'bg-muted-foreground/25'
                )}
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          {fmt(isPlaying ? currentTime : duration || 0)}
        </div>
      </div>
    </div>
  );
};

export default StandaloneAudioPlayer;
