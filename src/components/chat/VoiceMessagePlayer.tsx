import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface VoiceMessagePlayerProps {
  url: string;
  isOwn: boolean;
  duration?: number;
  senderAvatar?: string | null;
  senderName?: string | null;
}

const VoiceMessagePlayer = ({ url, isOwn, duration: initialDuration, senderAvatar, senderName }: VoiceMessagePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const heights = Array.from({ length: 28 }, () => Math.random() * 18 + 3);
    setWaveformHeights(heights);
  }, [url]);

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
      if (audioRef.current.paused) return;
      animationRef.current = requestAnimationFrame(updateProgress);
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
    const percent = (x / rect.width) * 100;
    const newTime = (percent / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setProgress(percent);
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "flex items-center gap-2 min-w-[200px] max-w-[280px] py-0.5"
    )}>
      {/* Play Button with Avatar overlay - WhatsApp style */}
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarImage src={senderAvatar || undefined} />
          <AvatarFallback className={cn(
            "text-[11px]",
            isOwn ? "bg-[hsl(var(--wa-teal-green))]/30 text-[hsl(var(--wa-teal-green))]" : "bg-muted"
          )}>
            {senderName?.[0] || '؟'}
          </AvatarFallback>
        </Avatar>
        <button
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm",
            isOwn ? "bg-[hsl(var(--wa-teal-green))] text-white" : "bg-[hsl(var(--wa-light-green))] text-white"
          )}
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="w-2.5 h-2.5 fill-current" />
          ) : (
            <Play className="w-2.5 h-2.5 fill-current ml-[1px]" />
          )}
        </button>
      </div>

      {/* Waveform & Time */}
      <div className="flex-1 space-y-0.5">
        {/* Waveform */}
        <div 
          className="flex items-center gap-[1.5px] h-7 cursor-pointer"
          onClick={handleSeek}
        >
          {waveformHeights.map((height, i) => {
            const barProgress = progress / 100 * waveformHeights.length;
            const isActive = i < barProgress;
            return (
              <div
                key={i}
                className={cn(
                  "w-[2.5px] rounded-full transition-colors duration-100",
                  isActive 
                    ? (isOwn ? "bg-[hsl(var(--wa-teal-green))]" : "bg-[hsl(var(--wa-light-green))]")
                    : (isOwn ? "bg-[hsl(var(--wa-outgoing-foreground))]/25" : "bg-muted-foreground/25")
                )}
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>

        {/* Time */}
        <div className="flex justify-between items-center">
          <span className={cn(
            "text-[10px] font-mono",
            "text-[hsl(var(--wa-time))]"
          )}>
            {formatTime(isPlaying ? currentTime : duration || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
