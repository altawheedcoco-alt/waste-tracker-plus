import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useFocusMusic } from '@/contexts/FocusMusicContext';

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
      <PopoverContent align="end" className="w-80 p-0" dir="rtl">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">موسيقى التركيز</h3>
            {currentTrack && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={stopTrack}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            الموسيقى تستمر حتى عند التنقل بين الصفحات
          </p>
        </div>

        <Tabs defaultValue="piano" className="w-full">
          <TabsList className="w-full justify-start px-3 pt-3 bg-transparent">
            <TabsTrigger value="piano" className="text-xs">🎹 بيانو</TabsTrigger>
            <TabsTrigger value="nature" className="text-xs">🌿 طبيعة</TabsTrigger>
            <TabsTrigger value="ambient" className="text-xs">🎵 أجواء</TabsTrigger>
          </TabsList>
          
          {(['piano', 'nature', 'ambient'] as const).map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              <div className="p-3 grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {tracks
                  .filter((track) => track.category === category)
                  .map((track) => (
                    <motion.button
                      key={track.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => playTrack(track)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-lg transition-colors',
                        currentTrack?.id === track.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 hover:bg-muted'
                      )}
                    >
                      <span className="text-xl">{track.icon}</span>
                      <span className="text-[10px] font-medium text-center leading-tight">{track.nameAr}</span>
                      {currentTrack?.id === track.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {isPlaying ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-center">
                    {isMuted ? 0 : volume}%
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>{currentTrack.icon}</span>
                  <span>يتم تشغيل: {currentTrack.nameAr}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
};

export default FocusMusicPlayer;
