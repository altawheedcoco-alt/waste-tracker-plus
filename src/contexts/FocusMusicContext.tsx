import { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface FocusTrack {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  url: string;
  category: 'nature' | 'piano' | 'ambient' | 'calm' | 'international' | 'instrumental';
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
  // ── Nature Sounds ── (Internet Archive - reliable MP3s)
  { id: 'rain', name: 'Rain', nameAr: 'مطر هادئ', icon: '🌧️', url: 'https://cdn.pixabay.com/audio/2022/05/13/audio_257112671d.mp3', category: 'nature' },
  { id: 'forest', name: 'Forest Birds', nameAr: 'طيور الغابة', icon: '🌲', url: 'https://cdn.pixabay.com/audio/2022/02/23/audio_ea70ad08e3.mp3', category: 'nature' },
  { id: 'ocean', name: 'Ocean Waves', nameAr: 'أمواج البحر', icon: '🌊', url: 'https://cdn.pixabay.com/audio/2024/11/28/audio_9e11e1a2c0.mp3', category: 'nature' },
  { id: 'creek', name: 'Creek Water', nameAr: 'جدول ماء', icon: '💧', url: 'https://cdn.pixabay.com/audio/2022/08/31/audio_419263a958.mp3', category: 'nature' },
  { id: 'night', name: 'Night Crickets', nameAr: 'صراصير الليل', icon: '🌙', url: 'https://cdn.pixabay.com/audio/2022/04/01/audio_71816e4bee.mp3', category: 'nature' },
  { id: 'thunder', name: 'Thunder Rain', nameAr: 'رعد ومطر', icon: '⛈️', url: 'https://cdn.pixabay.com/audio/2022/10/30/audio_f3b0e82c76.mp3', category: 'nature' },

  // ── Piano Music ──
  { id: 'piano1', name: 'Peaceful Piano', nameAr: 'بيانو هادئ', icon: '🎹', url: 'https://cdn.pixabay.com/audio/2023/09/19/audio_8e16e09e45.mp3', category: 'piano' },
  { id: 'piano2', name: 'Soft Piano', nameAr: 'بيانو ناعم', icon: '🎶', url: 'https://cdn.pixabay.com/audio/2024/11/14/audio_223e725bc5.mp3', category: 'piano' },
  { id: 'piano3', name: 'Emotional Piano', nameAr: 'بيانو عاطفي', icon: '💫', url: 'https://cdn.pixabay.com/audio/2023/07/07/audio_98ae12a16e.mp3', category: 'piano' },
  { id: 'piano4', name: 'Relaxing Piano', nameAr: 'بيانو مريح', icon: '✨', url: 'https://cdn.pixabay.com/audio/2023/10/26/audio_9e1fcf3f04.mp3', category: 'piano' },
  { id: 'piano5', name: 'Dreamy Piano', nameAr: 'بيانو حالم', icon: '🌸', url: 'https://cdn.pixabay.com/audio/2024/02/14/audio_8e153fe315.mp3', category: 'piano' },
  { id: 'piano6', name: 'Study Piano', nameAr: 'بيانو للدراسة', icon: '📚', url: 'https://cdn.pixabay.com/audio/2024/09/10/audio_6e1833f0c5.mp3', category: 'piano' },

  // ── Ambient Music ──
  { id: 'lofi', name: 'Lo-Fi Beats', nameAr: 'لو-فاي', icon: '🎧', url: 'https://cdn.pixabay.com/audio/2023/04/11/audio_14a47e7eb2.mp3', category: 'ambient' },
  { id: 'meditation', name: 'Meditation', nameAr: 'تأمل', icon: '🧘', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', category: 'ambient' },
  { id: 'ambient1', name: 'Deep Focus', nameAr: 'تركيز عميق', icon: '🧠', url: 'https://cdn.pixabay.com/audio/2023/03/20/audio_413990928b.mp3', category: 'ambient' },
  { id: 'ambient2', name: 'Calm Ambient', nameAr: 'أجواء هادئة', icon: '🎵', url: 'https://cdn.pixabay.com/audio/2022/01/20/audio_cdd8fa8ccc.mp3', category: 'ambient' },
  { id: 'ambient3', name: 'Chill Beats', nameAr: 'إيقاعات مريحة', icon: '🎼', url: 'https://cdn.pixabay.com/audio/2024/06/11/audio_d08c12503a.mp3', category: 'ambient' },
  { id: 'ambient4', name: 'Space Ambient', nameAr: 'أجواء فضائية', icon: '🌌', url: 'https://cdn.pixabay.com/audio/2023/09/04/audio_3dd51cd41a.mp3', category: 'ambient' },

  // ── Calm & Relaxing ──
  { id: 'calm1', name: 'Morning Serenity', nameAr: 'صفاء الصباح', icon: '🌅', url: 'https://cdn.pixabay.com/audio/2022/05/16/audio_1333dfda21.mp3', category: 'calm' },
  { id: 'calm2', name: 'Gentle Breeze', nameAr: 'نسيم لطيف', icon: '🍃', url: 'https://cdn.pixabay.com/audio/2023/10/24/audio_0a2887e620.mp3', category: 'calm' },
  { id: 'calm3', name: 'Sunset Glow', nameAr: 'وهج الغروب', icon: '🌇', url: 'https://cdn.pixabay.com/audio/2024/01/10/audio_e723e8aad1.mp3', category: 'calm' },
  { id: 'calm4', name: 'Floating Clouds', nameAr: 'سحب عائمة', icon: '☁️', url: 'https://cdn.pixabay.com/audio/2023/04/07/audio_1cecbc0e39.mp3', category: 'calm' },
  { id: 'calm5', name: 'Quiet River', nameAr: 'نهر هادئ', icon: '🏞️', url: 'https://cdn.pixabay.com/audio/2022/10/18/audio_db74590783.mp3', category: 'calm' },
  { id: 'calm6', name: 'Zen Garden', nameAr: 'حديقة زن', icon: '🪷', url: 'https://cdn.pixabay.com/audio/2023/06/07/audio_9f320cceec.mp3', category: 'calm' },

  // ── International / Classical ──
  { id: 'intl1', name: 'Cinematic Epic', nameAr: 'سينمائي ملحمي', icon: '🎬', url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3', category: 'international' },
  { id: 'intl2', name: 'Jazz Smooth', nameAr: 'جاز ناعم', icon: '🎤', url: 'https://cdn.pixabay.com/audio/2024/09/18/audio_7d9d5d16de.mp3', category: 'international' },
  { id: 'intl3', name: 'Acoustic Vibes', nameAr: 'أكوستيك', icon: '🎸', url: 'https://cdn.pixabay.com/audio/2024/04/16/audio_ceb70a3e02.mp3', category: 'international' },
  { id: 'intl4', name: 'Jazz Café', nameAr: 'جاز كافيه', icon: '☕', url: 'https://cdn.pixabay.com/audio/2023/10/13/audio_4fa080b314.mp3', category: 'international' },
  { id: 'intl5', name: 'World Music', nameAr: 'موسيقى عالمية', icon: '🌍', url: 'https://cdn.pixabay.com/audio/2022/08/25/audio_4f3b0a8791.mp3', category: 'international' },
  { id: 'intl6', name: 'Indie Chill', nameAr: 'إندي هادئ', icon: '🪕', url: 'https://cdn.pixabay.com/audio/2023/05/17/audio_10a62b3b3f.mp3', category: 'international' },

  // ── Instrumental / Melodies ──
  { id: 'inst1', name: 'Guitar Melody', nameAr: 'جيتار عذب', icon: '🎸', url: 'https://cdn.pixabay.com/audio/2023/07/27/audio_4348a5cd38.mp3', category: 'instrumental' },
  { id: 'inst2', name: 'Violin Dreams', nameAr: 'كمان حالم', icon: '🎻', url: 'https://cdn.pixabay.com/audio/2022/09/08/audio_3e6e8a88c6.mp3', category: 'instrumental' },
  { id: 'inst3', name: 'Flute Serenity', nameAr: 'ناي هادئ', icon: '🪈', url: 'https://cdn.pixabay.com/audio/2023/09/28/audio_0606dbd4f5.mp3', category: 'instrumental' },
  { id: 'inst4', name: 'Orchestra Light', nameAr: 'أوركسترا خفيفة', icon: '🎼', url: 'https://cdn.pixabay.com/audio/2024/01/22/audio_bfb0db417c.mp3', category: 'instrumental' },
  { id: 'inst5', name: 'Harp Angels', nameAr: 'هارب ملائكي', icon: '🪽', url: 'https://cdn.pixabay.com/audio/2023/11/06/audio_1df24c1968.mp3', category: 'instrumental' },
  { id: 'inst6', name: 'Saxophone Smooth', nameAr: 'ساكسفون ناعم', icon: '🎷', url: 'https://cdn.pixabay.com/audio/2024/03/04/audio_2b3ad0d01d.mp3', category: 'instrumental' },
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
      globalAudio.crossOrigin = 'anonymous';
      globalAudio.preload = 'auto';
    }
    audioRef.current = globalAudio;
    audioRef.current.volume = isMuted ? 0 : volume / 100;

    // Handle playback errors gracefully
    const handleError = () => {
      console.warn('Audio playback error — track may be unavailable');
      setIsPlaying(false);
    };
    globalAudio.addEventListener('error', handleError);
    return () => {
      globalAudio?.removeEventListener('error', handleError);
    };
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
