import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Square, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MUSIC_CATEGORIES,
  MUSIC_TRACKS,
  previewTrack,
  stopPreview,
  type MusicTrack,
  type MusicCategory,
} from '@/lib/musicLibrary';

interface MusicPickerProps {
  selectedTrack: MusicTrack | null;
  onSelect: (track: MusicTrack | null) => void;
  compact?: boolean;
}

const MusicPicker = memo(({ selectedTrack, onSelect, compact }: MusicPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MusicCategory>('ambient');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filteredTracks = MUSIC_TRACKS.filter(t => t.category === activeCategory);

  const handlePreview = useCallback((track: MusicTrack) => {
    if (playingId === track.id) {
      stopPreview();
      setPlayingId(null);
    } else {
      previewTrack(track);
      setPlayingId(track.id);
    }
  }, [playingId]);

  const handleSelect = useCallback((track: MusicTrack) => {
    stopPreview();
    setPlayingId(null);
    onSelect(track);
    setIsOpen(false);
  }, [onSelect]);

  const handleRemove = useCallback(() => {
    stopPreview();
    setPlayingId(null);
    onSelect(null);
  }, [onSelect]);

  const handleClose = useCallback(() => {
    stopPreview();
    setPlayingId(null);
    setIsOpen(false);
  }, []);

  // Compact trigger button
  if (!isOpen) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            'flex items-center gap-2 rounded-full transition-all',
            compact
              ? 'px-3 py-1.5 text-xs bg-muted/50 hover:bg-muted'
              : 'px-4 py-2 text-sm bg-muted hover:bg-muted/80 border border-border/40'
          )}
        >
          <Music className="w-4 h-4 text-primary" />
          {selectedTrack ? (
            <span className="text-foreground font-medium">{selectedTrack.nameAr}</span>
          ) : (
            <span className="text-muted-foreground">إضافة موسيقى</span>
          )}
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
        {selectedTrack && (
          <button
            type="button"
            onClick={handleRemove}
            className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
          >
            <X className="w-3 h-3 text-destructive" />
          </button>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: 10, height: 0 }}
        className="rounded-2xl border border-border/40 bg-card overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">اختر موسيقى</span>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide">
          {MUSIC_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              <span>{cat.emoji}</span>
              {cat.labelAr}
            </button>
          ))}
        </div>

        {/* Tracks list */}
        <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
          {filteredTracks.map(track => {
            const isPlaying = playingId === track.id;
            const isSelected = selectedTrack?.id === track.id;
            return (
              <motion.div
                key={track.id}
                layout
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer',
                  isSelected
                    ? 'bg-primary/10 ring-1 ring-primary/30'
                    : 'hover:bg-muted/50'
                )}
                onClick={() => handleSelect(track)}
              >
                {/* Play/preview button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePreview(track); }}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                    `bg-gradient-to-br ${track.color}`
                  )}
                >
                  {isPlaying ? (
                    <Square className="w-3 h-3 text-white fill-white" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{track.nameAr}</p>
                  <p className="text-[10px] text-muted-foreground">{track.moodAr} • {track.duration}ث{track.bpm > 0 ? ` • ${track.bpm} BPM` : ''}</p>
                </div>

                {/* Waveform visualization */}
                {isPlaying && (
                  <div className="flex items-center gap-0.5 h-4">
                    {[1, 2, 3, 4].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 16, 4] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        className="w-[2px] bg-primary rounded-full"
                      />
                    ))}
                  </div>
                )}

                {isSelected && !isPlaying && (
                  <span className="text-xs text-primary font-bold">✓</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* No music option */}
        <div className="p-2 border-t border-border/20">
          <button
            onClick={() => { handleRemove(); setIsOpen(false); }}
            className="w-full text-center text-xs text-muted-foreground py-2 hover:text-foreground transition-colors"
          >
            بدون موسيقى
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

MusicPicker.displayName = 'MusicPicker';
export default MusicPicker;
