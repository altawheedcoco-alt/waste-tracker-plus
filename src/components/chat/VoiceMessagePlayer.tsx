import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface VoiceMessagePlayerProps {
  url: string;
  isOwn: boolean;
  duration?: number;
}

const VoiceMessagePlayer = ({ url, isOwn, duration: initialDuration }: VoiceMessagePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();

  // Generate random waveform heights (simulating audio visualization)
  useEffect(() => {
    const heights = Array.from({ length: 40 }, () => Math.random() * 20 + 4);
    setWaveformHeights(heights);
  }, [url]);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    });

    return () => {
      audio.pause();
      audio.src = '';
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [url]);

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      const progressPercent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progressPercent);
      setCurrentTime(audioRef.current.currentTime);
      
      if (audioRef.current.paused) return;
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      audioRef.current.play();
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = (value[0] / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setProgress(value[0]);
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
      "flex items-center gap-3 min-w-[220px] max-w-[280px]",
      isOwn ? "text-white" : "text-foreground"
    )}>
      {/* Play Button */}
      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "h-11 w-11 rounded-full shrink-0 transition-all",
          isOwn 
            ? "bg-white/20 hover:bg-white/30 text-white" 
            : "bg-emerald-500 hover:bg-emerald-600 text-white"
        )}
        onClick={togglePlay}
      >
        <motion.div
          initial={false}
          animate={{ scale: isPlaying ? 1 : 1 }}
          transition={{ duration: 0.1 }}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current mr-[-2px]" />
          )}
        </motion.div>
      </Button>

      {/* Waveform & Progress */}
      <div className="flex-1 space-y-1">
        {/* Waveform Visualization */}
        <div className="flex items-center gap-[2px] h-8 cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percent = (x / rect.width) * 100;
          handleSeek([percent]);
        }}>
          {waveformHeights.map((height, i) => {
            const barProgress = progress / 100 * waveformHeights.length;
            const isActive = i < barProgress;
            
            return (
              <motion.div
                key={i}
                className={cn(
                  "w-[3px] rounded-full transition-colors",
                  isActive 
                    ? (isOwn ? "bg-white" : "bg-emerald-500")
                    : (isOwn ? "bg-white/30" : "bg-muted-foreground/30")
                )}
                style={{ height: `${height}px` }}
                animate={isPlaying && isActive ? {
                  scaleY: [1, 1.2, 1],
                } : {}}
                transition={{
                  duration: 0.3,
                  repeat: isPlaying ? Infinity : 0,
                  delay: i * 0.02
                }}
              />
            );
          })}
        </div>

        {/* Time Display */}
        <div className="flex justify-between items-center">
          <span className={cn(
            "text-[11px] font-mono",
            isOwn ? "text-white/70" : "text-muted-foreground"
          )}>
            {formatTime(isPlaying ? currentTime : 0)}
          </span>
          <span className={cn(
            "text-[11px] font-mono",
            isOwn ? "text-white/70" : "text-muted-foreground"
          )}>
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
