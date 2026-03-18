import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, Volume2, VolumeX, X, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useFocusMusic, type FocusTrack } from '@/contexts/FocusMusicContext';

const categories = [
  { key: 'nature', label: '🌿 طبيعة', description: 'أصوات طبيعية مولّدة' },
  { key: 'piano', label: '🎹 بيانو', description: 'ألحان بيانو هادئة' },
  { key: 'ambient', label: '🎵 أجواء', description: 'موسيقى محيطية' },
  { key: 'calm', label: '🎶 هادئة', description: 'استرخاء وراحة' },
  { key: 'international', label: '🌍 عالمية', description: 'أنماط متنوعة' },
  { key: 'instrumental', label: '🎻 ألحان', description: 'آلات موسيقية' },
  { key: 'noise', label: '📻 ضوضاء', description: 'ضوضاء بيضاء وملونة' },
  { key: 'binaural', label: '🧠 بينورال', description: 'موجات دماغية' },
] as const;

const FocusMusicPlayer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isPlaying,
    currentTrack,
    volume,
    isMuted,
    tracks,
    playTrack,
    stopTrack,
    setVolume,
    toggleMute,
  } = useFocusMusic();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Music className="h-5 w-5" />
          {isPlaying && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full"
            >
              <motion.span
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 bg-primary rounded-full opacity-50"
              />
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0" dir="rtl">
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-foreground">موسيقى التركيز</h3>
            </div>
            {currentTrack && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={stopTrack}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            أصوات طبيعية وموسيقى للتركيز أثناء العمل • {tracks.length} مقطع
          </p>
        </div>

        <Tabs defaultValue="nature" className="w-full">
          <ScrollArea className="w-full" dir="rtl">
            <TabsList className="w-full justify-start px-3 pt-3 bg-transparent flex-wrap gap-1 h-auto">
              {categories.map((cat) => (
                <TabsTrigger key={cat.key} value={cat.key} className="text-xs whitespace-nowrap">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          {categories.map((cat) => (
            <TabsContent key={cat.key} value={cat.key} className="mt-0">
              <div className="px-3 pt-2 pb-1">
                <p className="text-[10px] text-muted-foreground">{cat.description}</p>
              </div>
              <ScrollArea className="h-[280px]">
                <div className="p-3 grid grid-cols-3 gap-2">
                  {tracks
                    .filter((t) => t.category === cat.key)
                    .map((track) => (
                      <TrackButton
                        key={track.id}
                        track={track}
                        isActive={currentTrack?.id === track.id}
                        isPlaying={isPlaying && currentTrack?.id === track.id}
                        onClick={() => playTrack(track)}
                      />
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {/* Now Playing + Volume */}
        <AnimatePresence>
          {currentTrack && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border"
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={(v) => setVolume(v[0])}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-center">
                    {isMuted ? 0 : volume}%
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                  <span>{currentTrack.icon}</span>
                  <span className="text-muted-foreground">يتم تشغيل:</span>
                  <span className="font-medium text-foreground">{currentTrack.nameAr}</span>
                  {currentTrack.generatorKey && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">مولّد</span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
};

function TrackButton({ track, isActive, isPlaying, onClick }: {
  track: FocusTrack;
  isActive: boolean;
  isPlaying: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 border',
        isActive
          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
          : 'bg-muted/30 hover:bg-muted border-transparent hover:border-border'
      )}
    >
      <span className="text-xl">{track.icon}</span>
      <span className="text-[10px] font-medium text-center leading-tight line-clamp-2">
        {track.nameAr}
      </span>
      {isActive && (
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
          {isPlaying ? (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ height: [4, 12, 4] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                  className={cn(
                    'w-[2px] rounded-full',
                    isActive ? 'bg-primary-foreground' : 'bg-primary'
                  )}
                />
              ))}
            </div>
          ) : (
            <Play className="h-3 w-3" />
          )}
        </motion.div>
      )}
    </motion.button>
  );
}

export default FocusMusicPlayer;
