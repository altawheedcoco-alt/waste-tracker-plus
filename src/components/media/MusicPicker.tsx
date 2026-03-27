import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Square, X, ChevronDown, Search, Loader2, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MUSIC_CATEGORIES,
  MUSIC_TRACKS,
  previewTrack,
  stopPreview,
  type MusicTrack,
  type MusicCategory,
} from '@/lib/musicLibrary';
import { useJamendoSearch, JAMENDO_GENRES, type JamendoTrack } from '@/hooks/useJamendoSearch';

// Extended track type that supports both built-in and Jamendo tracks
export interface UnifiedTrack {
  id: string;
  name: string;
  artist?: string;
  albumImage?: string;
  audioUrl?: string;
  duration: number;
  color?: string;
  source: 'builtin' | 'jamendo';
  builtinTrack?: MusicTrack;
  jamendoTrack?: JamendoTrack;
}

interface MusicPickerProps {
  selectedTrack: MusicTrack | null;
  onSelect: (track: MusicTrack | null) => void;
  onSelectJamendo?: (track: JamendoTrack | null) => void;
  compact?: boolean;
}

// Jamendo audio preview singleton
let jamendoAudio: HTMLAudioElement | null = null;
function previewJamendo(url: string) {
  stopJamendoPreview();
  jamendoAudio = new Audio(url);
  jamendoAudio.volume = 0.5;
  jamendoAudio.play().catch(() => {});
}
function stopJamendoPreview() {
  if (jamendoAudio) {
    jamendoAudio.pause();
    jamendoAudio.src = '';
    jamendoAudio = null;
  }
}

const MusicPicker = memo(({ selectedTrack, onSelect, onSelectJamendo, compact }: MusicPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'builtin' | 'jamendo'>('jamendo');
  const [activeCategory, setActiveCategory] = useState<MusicCategory>('ambient');
  const [activeGenre, setActiveGenre] = useState<string>('pop');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const { tracks: jamendoTracks, loading, error, search, getPopular } = useJamendoSearch();

  const filteredTracks = MUSIC_TRACKS.filter(t => t.category === activeCategory);

  // Load popular on open
  useEffect(() => {
    if (isOpen && activeTab === 'jamendo') {
      getPopular(activeGenre);
    }
  }, [isOpen, activeTab, activeGenre]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery.trim()) return;
    searchTimeoutRef.current = setTimeout(() => {
      search(searchQuery, activeGenre);
    }, 500);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery, activeGenre]);

  const handlePreviewBuiltin = useCallback((track: MusicTrack) => {
    stopJamendoPreview();
    if (playingId === track.id) {
      stopPreview();
      setPlayingId(null);
    } else {
      previewTrack(track);
      setPlayingId(track.id);
    }
  }, [playingId]);

  const handlePreviewJamendo = useCallback((track: JamendoTrack) => {
    stopPreview();
    if (playingId === track.id) {
      stopJamendoPreview();
      setPlayingId(null);
    } else {
      previewJamendo(track.audioUrl);
      setPlayingId(track.id);
    }
  }, [playingId]);

  const handleSelectBuiltin = useCallback((track: MusicTrack) => {
    stopPreview();
    stopJamendoPreview();
    setPlayingId(null);
    onSelect(track);
    onSelectJamendo?.(null);
    setIsOpen(false);
  }, [onSelect, onSelectJamendo]);

  const handleSelectJamendo = useCallback((track: JamendoTrack) => {
    stopPreview();
    stopJamendoPreview();
    setPlayingId(null);
    onSelect(null);
    onSelectJamendo?.(track);
    setIsOpen(false);
  }, [onSelect, onSelectJamendo]);

  const handleRemove = useCallback(() => {
    stopPreview();
    stopJamendoPreview();
    setPlayingId(null);
    onSelect(null);
    onSelectJamendo?.(null);
  }, [onSelect, onSelectJamendo]);

  const handleClose = useCallback(() => {
    stopPreview();
    stopJamendoPreview();
    setPlayingId(null);
    setIsOpen(false);
  }, []);

  const fmtDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

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

        {/* Tabs: Built-in vs Real Songs */}
        <div className="flex border-b border-border/20">
          <button
            onClick={() => setActiveTab('jamendo')}
            className={cn(
              'flex-1 py-2 text-xs font-bold text-center transition-colors',
              activeTab === 'jamendo'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            🎤 أغاني حقيقية
          </button>
          <button
            onClick={() => setActiveTab('builtin')}
            className={cn(
              'flex-1 py-2 text-xs font-bold text-center transition-colors',
              activeTab === 'builtin'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            🎵 موسيقى مدمجة
          </button>
        </div>

        {/* Jamendo Tab */}
        {activeTab === 'jamendo' && (
          <>
            {/* Search */}
            <div className="p-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن أغنية أو فنان..."
                  className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-muted/50 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Genre filters */}
            <div className="flex gap-1 px-2 pb-2 overflow-x-auto scrollbar-hide">
              {JAMENDO_GENRES.map(g => (
                <button
                  key={g.id}
                  onClick={() => {
                    setActiveGenre(g.id);
                    setSearchQuery('');
                  }}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all',
                    activeGenre === g.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  <span>{g.emoji}</span>
                  {g.label}
                </button>
              ))}
            </div>

            {/* Tracks */}
            <div className="max-h-[240px] overflow-y-auto p-2 space-y-1">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground mr-2">جاري البحث...</span>
                </div>
              )}
              {error && (
                <p className="text-xs text-destructive text-center py-4">{error}</p>
              )}
              {!loading && jamendoTracks.length === 0 && !error && (
                <p className="text-xs text-muted-foreground text-center py-6">لا توجد نتائج</p>
              )}
              {jamendoTracks.map(track => {
                const isPlaying = playingId === track.id;
                return (
                  <motion.div
                    key={track.id}
                    layout
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/50 transition-all cursor-pointer"
                    onClick={() => handleSelectJamendo(track)}
                  >
                    {/* Album art */}
                    {track.albumImage ? (
                      <img
                        src={track.albumImage}
                        alt={track.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0">
                        <Music className="w-4 h-4 text-primary" />
                      </div>
                    )}

                    {/* Play button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handlePreviewJamendo(track); }}
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                        isPlaying ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      {isPlaying ? (
                        <Square className="w-3 h-3 fill-current" />
                      ) : (
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{track.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {track.artist} • {fmtDuration(track.duration)}
                      </p>
                    </div>

                    {/* Waveform when playing */}
                    {isPlaying && (
                      <div className="flex items-center gap-0.5 h-4">
                        {[1, 2, 3].map(i => (
                          <motion.div
                            key={i}
                            animate={{ height: [4, 14, 4] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                            className="w-[2px] bg-primary rounded-full"
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Built-in Tab */}
        {activeTab === 'builtin' && (
          <>
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
                    onClick={() => handleSelectBuiltin(track)}
                  >
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handlePreviewBuiltin(track); }}
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{track.nameAr}</p>
                      <p className="text-[10px] text-muted-foreground">{track.moodAr} • {track.duration}ث</p>
                    </div>
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
          </>
        )}

        {/* No music */}
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
