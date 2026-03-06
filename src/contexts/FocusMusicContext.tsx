import { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface FocusTrack {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  url: string;
  category: 'nature' | 'piano' | 'ambient' | 'calm';
}

// Split contexts for optimized re-renders
interface FocusMusicStateContextType {
  isPlaying: boolean;
  currentTrack: FocusTrack | null;
  volume: number;
  isMuted: boolean;
  tracks: FocusTrack[];
}

interface FocusMusicActionsContextType {
  playTrack: (track: FocusTrack) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  stopTrack: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

interface FocusMusicContextType extends FocusMusicStateContextType, FocusMusicActionsContextType {}

const focusTracks: FocusTrack[] = [
  // ── Nature Sounds ── (verified working URLs from pixabay download links)
  { id: 'rain', name: 'Rain', nameAr: 'مطر هادئ', icon: '🌧️', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=rain-and-thunder-16705.mp3', category: 'nature' },
  { id: 'forest', name: 'Forest Birds', nameAr: 'طيور الغابة', icon: '🌲', url: 'https://cdn.pixabay.com/download/audio/2022/02/23/audio_ea70ad08e0.mp3?filename=birds-singing-calm-river-nature-ambient-sound-127411.mp3', category: 'nature' },
  { id: 'ocean', name: 'Ocean Waves', nameAr: 'أمواج البحر', icon: '🌊', url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_0a3c290b58.mp3?filename=ocean-waves-112906.mp3', category: 'nature' },
  { id: 'birds', name: 'Morning Birds', nameAr: 'طيور الصباح', icon: '🐦', url: 'https://cdn.pixabay.com/download/audio/2022/01/20/audio_73e42e3a41.mp3?filename=birds-19624.mp3', category: 'nature' },
  { id: 'creek', name: 'Creek Water', nameAr: 'جدول ماء', icon: '💧', url: 'https://cdn.pixabay.com/download/audio/2022/04/10/audio_590e18043c.mp3?filename=creek-babbling-nature-sounds-8010.mp3', category: 'nature' },
  { id: 'night', name: 'Night Crickets', nameAr: 'صراصير الليل', icon: '🌙', url: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3?filename=night-ambience-17064.mp3', category: 'nature' },

  // ── Piano Music ──
  { id: 'piano1', name: 'Peaceful Piano', nameAr: 'بيانو هادئ', icon: '🎹', url: 'https://cdn.pixabay.com/download/audio/2024/11/04/audio_5a30a7a498.mp3?filename=reflected-light-147979.mp3', category: 'piano' },
  { id: 'piano2', name: 'Soft Piano', nameAr: 'بيانو ناعم', icon: '🎶', url: 'https://cdn.pixabay.com/download/audio/2024/09/10/audio_6e1e2b4e19.mp3?filename=solo-piano-meditation-music-for-relaxation-amp-stress-relief-245711.mp3', category: 'piano' },
  { id: 'piano3', name: 'Emotional Piano', nameAr: 'بيانو عاطفي', icon: '💫', url: 'https://cdn.pixabay.com/download/audio/2024/02/14/audio_f4a8568c44.mp3?filename=beautiful-piano-music-200836.mp3', category: 'piano' },
  { id: 'piano4', name: 'Relaxing Piano', nameAr: 'بيانو مريح', icon: '✨', url: 'https://cdn.pixabay.com/download/audio/2024/04/23/audio_79b1143437.mp3?filename=calm-and-peaceful-piano-218148.mp3', category: 'piano' },
  { id: 'piano5', name: 'Dreamy Piano', nameAr: 'بيانو حالم', icon: '🌸', url: 'https://cdn.pixabay.com/download/audio/2024/05/16/audio_48c3254d64.mp3?filename=relaxing-piano-music-for-studying-218808.mp3', category: 'piano' },
  { id: 'piano6', name: 'Study Piano', nameAr: 'بيانو للدراسة', icon: '📚', url: 'https://cdn.pixabay.com/download/audio/2024/10/28/audio_56fc452f2a.mp3?filename=hope-piano-amp-strings-beautiful-background-music-245356.mp3', category: 'piano' },

  // ── Ambient Music ──
  { id: 'lofi', name: 'Lo-Fi Beats', nameAr: 'لو-فاي', icon: '🎧', url: 'https://cdn.pixabay.com/download/audio/2024/07/19/audio_64901e95d6.mp3?filename=lofi-chill-medium-version-159456.mp3', category: 'ambient' },
  { id: 'meditation', name: 'Meditation', nameAr: 'تأمل', icon: '🧘', url: 'https://cdn.pixabay.com/download/audio/2024/04/24/audio_df5b58fb16.mp3?filename=meditation-music-for-relaxing-mind-body-soul-218160.mp3', category: 'ambient' },
  { id: 'ambient1', name: 'Deep Focus', nameAr: 'تركيز عميق', icon: '🧠', url: 'https://cdn.pixabay.com/download/audio/2024/09/03/audio_b2af71bd6b.mp3?filename=deep-meditation-192828.mp3', category: 'ambient' },
  { id: 'ambient2', name: 'Calm Ambient', nameAr: 'أجواء هادئة', icon: '🎵', url: 'https://cdn.pixabay.com/download/audio/2024/11/20/audio_66f85a9307.mp3?filename=ambient-calm-meditation-music-zen-healing-amp-relax-246773.mp3', category: 'ambient' },
  { id: 'ambient3', name: 'Chill Beats', nameAr: 'إيقاعات مريحة', icon: '🎼', url: 'https://cdn.pixabay.com/download/audio/2024/03/11/audio_b7a1f55cd1.mp3?filename=chill-lofi-song-200857.mp3', category: 'ambient' },
  { id: 'ambient4', name: 'Space Ambient', nameAr: 'أجواء فضائية', icon: '🌌', url: 'https://cdn.pixabay.com/download/audio/2024/08/22/audio_f6c57e1b9c.mp3?filename=space-ambient-sci-fi-239136.mp3', category: 'ambient' },

  // ── Calm & Relaxing ──
  { id: 'calm1', name: 'Morning Serenity', nameAr: 'صفاء الصباح', icon: '🌅', url: 'https://cdn.pixabay.com/download/audio/2024/06/13/audio_24f4586bc8.mp3?filename=morning-garden-acoustic-chill-224677.mp3', category: 'calm' },
  { id: 'calm2', name: 'Gentle Breeze', nameAr: 'نسيم لطيف', icon: '🍃', url: 'https://cdn.pixabay.com/download/audio/2024/01/18/audio_cb5a83e06a.mp3?filename=a-gentle-breeze-196506.mp3', category: 'calm' },
  { id: 'calm3', name: 'Sunset Glow', nameAr: 'وهج الغروب', icon: '🌇', url: 'https://cdn.pixabay.com/download/audio/2024/04/03/audio_eda1ca34f6.mp3?filename=calm-meditation-music-for-videos-amp-relaxation-216903.mp3', category: 'calm' },
  { id: 'calm4', name: 'Floating Clouds', nameAr: 'سحب عائمة', icon: '☁️', url: 'https://cdn.pixabay.com/download/audio/2024/08/14/audio_81aade7b3c.mp3?filename=floating-abstract-142819.mp3', category: 'calm' },
  { id: 'calm5', name: 'Quiet River', nameAr: 'نهر هادئ', icon: '🏞️', url: 'https://cdn.pixabay.com/download/audio/2024/10/03/audio_d94393a2ea.mp3?filename=relaxing-music-for-stress-relief-calm-amp-peaceful-ambient-244554.mp3', category: 'calm' },
  { id: 'calm6', name: 'Zen Garden', nameAr: 'حديقة زن', icon: '🪷', url: 'https://cdn.pixabay.com/download/audio/2024/07/10/audio_c2ec1a3dd0.mp3?filename=zen-meditation-230822.mp3', category: 'calm' },
];

const FocusMusicStateContext = createContext<FocusMusicStateContextType | undefined>(undefined);
const FocusMusicActionsContext = createContext<FocusMusicActionsContextType | undefined>(undefined);
const FocusMusicContext = createContext<FocusMusicContextType | undefined>(undefined);

// Global function to stop music on logout
let globalAudio: HTMLAudioElement | null = null;

export const stopFocusMusicOnLogout = () => {
  if (globalAudio) {
    globalAudio.pause();
    globalAudio.currentTime = 0;
    globalAudio.src = '';
  }
};

// Optimized hooks
export const useFocusMusicState = () => {
  const context = useContext(FocusMusicStateContext);
  if (context === undefined) {
    throw new Error('useFocusMusicState must be used within a FocusMusicProvider');
  }
  return context;
};

export const useFocusMusicActions = () => {
  const context = useContext(FocusMusicActionsContext);
  if (context === undefined) {
    throw new Error('useFocusMusicActions must be used within a FocusMusicProvider');
  }
  return context;
};

// Combined hook for backward compatibility
export const useFocusMusic = () => {
  const context = useContext(FocusMusicContext);
  if (context === undefined) {
    throw new Error('useFocusMusic must be used within a FocusMusicProvider');
  }
  return context;
};

// Selector hooks
export const useIsPlaying = () => {
  const { isPlaying } = useFocusMusicState();
  return isPlaying;
};

export const useCurrentTrack = () => {
  const { currentTrack } = useFocusMusicState();
  return currentTrack;
};

export const FocusMusicProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<FocusTrack | null>(null);
  const [volume, setVolumeState] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!globalAudio) {
      globalAudio = new Audio();
      globalAudio.loop = true;
    }
    audioRef.current = globalAudio;
    audioRef.current.volume = isMuted ? 0 : volume / 100;
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const playTrack = useCallback((track: FocusTrack) => {
    if (!audioRef.current) return;

    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      audioRef.current.pause();
      audioRef.current.src = track.url;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setCurrentTrack(track);
      }).catch(console.error);
    }
  }, [currentTrack, isPlaying]);

  const pauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resumeTrack = useCallback(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  }, [currentTrack]);

  const stopTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Memoized context values
  const stateValue = useMemo<FocusMusicStateContextType>(() => ({
    isPlaying,
    currentTrack,
    volume,
    isMuted,
    tracks: focusTracks,
  }), [isPlaying, currentTrack, volume, isMuted]);

  const actionsValue = useMemo<FocusMusicActionsContextType>(() => ({
    playTrack,
    pauseTrack,
    resumeTrack,
    stopTrack,
    setVolume,
    toggleMute,
  }), [playTrack, pauseTrack, resumeTrack, stopTrack, setVolume, toggleMute]);

  const combinedValue = useMemo<FocusMusicContextType>(() => ({
    ...stateValue,
    ...actionsValue,
  }), [stateValue, actionsValue]);

  return (
    <FocusMusicContext.Provider value={combinedValue}>
      <FocusMusicStateContext.Provider value={stateValue}>
        <FocusMusicActionsContext.Provider value={actionsValue}>
          {children}
        </FocusMusicActionsContext.Provider>
      </FocusMusicStateContext.Provider>
    </FocusMusicContext.Provider>
  );
};
