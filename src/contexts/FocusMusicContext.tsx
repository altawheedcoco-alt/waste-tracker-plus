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
  // ── Nature Sounds ── (Wikimedia Commons - verified OGG/MP3)
  { id: 'rain', name: 'Rain', nameAr: 'مطر هادئ', icon: '🌧️', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Rain_moderate.ogg', category: 'nature' },
  { id: 'forest', name: 'Forest Birds', nameAr: 'طيور الغابة', icon: '🌲', url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Bird_singing_in_the_morning.ogg', category: 'nature' },
  { id: 'ocean', name: 'Ocean Waves', nameAr: 'أمواج البحر', icon: '🌊', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Ocean_waves_%28calm%29.ogg', category: 'nature' },
  { id: 'birds', name: 'Morning Birds', nameAr: 'طيور الصباح', icon: '🐦', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Bird_singing.ogg', category: 'nature' },
  { id: 'creek', name: 'Creek Water', nameAr: 'جدول ماء', icon: '💧', url: 'https://upload.wikimedia.org/wikipedia/commons/5/55/Riviere.ogg', category: 'nature' },
  { id: 'night', name: 'Night Crickets', nameAr: 'صراصير الليل', icon: '🌙', url: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Gryllidae_sp.ogg', category: 'nature' },

  // ── Piano Music ── (Wikimedia Commons classical piano)
  { id: 'piano1', name: 'Peaceful Piano', nameAr: 'بيانو هادئ', icon: '🎹', url: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Clair_de_Lune_-_Claude_Debussy.ogg', category: 'piano' },
  { id: 'piano2', name: 'Soft Piano', nameAr: 'بيانو ناعم', icon: '🎶', url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chopin_-_Nocturne_Op._9_No._2.ogg', category: 'piano' },
  { id: 'piano3', name: 'Emotional Piano', nameAr: 'بيانو عاطفي', icon: '💫', url: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Gymnopedie_No._1.ogg', category: 'piano' },
  { id: 'piano4', name: 'Relaxing Piano', nameAr: 'بيانو مريح', icon: '✨', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Arabesque_No._1_%28Debussy%29.ogg', category: 'piano' },
  { id: 'piano5', name: 'Dreamy Piano', nameAr: 'بيانو حالم', icon: '🌸', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Beethoven_-_Moonlight_Sonata.ogg', category: 'piano' },
  { id: 'piano6', name: 'Study Piano', nameAr: 'بيانو للدراسة', icon: '📚', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Chopin_-_Waltz_in_C-sharp_minor%2C_Op._64%2C_No._2.ogg', category: 'piano' },

  // ── Ambient Music ── (Wikimedia Commons ambient/electronic)
  { id: 'lofi', name: 'Lo-Fi Beats', nameAr: 'لو-فاي', icon: '🎧', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Ambient_Music_-_Healing.ogg', category: 'ambient' },
  { id: 'meditation', name: 'Meditation', nameAr: 'تأمل', icon: '🧘', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Meditation_-_Deep_Relaxation.ogg', category: 'ambient' },
  { id: 'ambient1', name: 'Deep Focus', nameAr: 'تركيز عميق', icon: '🧠', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/01_-_Debussy_-_Reverie.ogg', category: 'ambient' },
  { id: 'ambient2', name: 'Calm Ambient', nameAr: 'أجواء هادئة', icon: '🎵', url: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Satie_-_Gnossienne_No._1.ogg', category: 'ambient' },
  { id: 'ambient3', name: 'Chill Beats', nameAr: 'إيقاعات مريحة', icon: '🎼', url: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Satie_-_Gymnopedie_No._3.ogg', category: 'ambient' },
  { id: 'ambient4', name: 'Space Ambient', nameAr: 'أجواء فضائية', icon: '🌌', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Debussy_-_Prelude_to_the_Afternoon_of_a_Faun.ogg', category: 'ambient' },

  // ── Calm & Relaxing ── (Classical relaxing pieces)
  { id: 'calm1', name: 'Morning Serenity', nameAr: 'صفاء الصباح', icon: '🌅', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Grieg_-_Morning_Mood.ogg', category: 'calm' },
  { id: 'calm2', name: 'Gentle Breeze', nameAr: 'نسيم لطيف', icon: '🍃', url: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Pachelbel_-_Canon_in_D.ogg', category: 'calm' },
  { id: 'calm3', name: 'Sunset Glow', nameAr: 'وهج الغروب', icon: '🌇', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Bach_-_Air_on_the_G_String.ogg', category: 'calm' },
  { id: 'calm4', name: 'Floating Clouds', nameAr: 'سحب عائمة', icon: '☁️', url: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Debussy_-_The_Girl_with_the_Flaxen_Hair.ogg', category: 'calm' },
  { id: 'calm5', name: 'Quiet River', nameAr: 'نهر هادئ', icon: '🏞️', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Barcarolle_-_Offenbach.ogg', category: 'calm' },
  { id: 'calm6', name: 'Zen Garden', nameAr: 'حديقة زن', icon: '🪷', url: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Liszt_-_Liebestraum_No._3.ogg', category: 'calm' },

  // ── International / Classical Masterpieces ──
  { id: 'intl1', name: 'Cinematic Epic', nameAr: 'سينمائي ملحمي', icon: '🎬', url: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Holst_-_Jupiter.ogg', category: 'international' },
  { id: 'intl2', name: 'Jazz Smooth', nameAr: 'جاز ناعم', icon: '🎤', url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Jazz_Piano_-_Blue_Bossa.ogg', category: 'international' },
  { id: 'intl3', name: 'Acoustic Vibes', nameAr: 'أكوستيك', icon: '🎸', url: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Vivaldi_-_Spring_from_The_Four_Seasons.ogg', category: 'international' },
  { id: 'intl4', name: 'Jazz Café', nameAr: 'جاز كافيه', icon: '☕', url: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Ravel_-_Bolero_excerpt.ogg', category: 'international' },
  { id: 'intl5', name: 'World Music', nameAr: 'موسيقى عالمية', icon: '🌍', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Dvorak_-_New_World_Symphony_Largo.ogg', category: 'international' },
  { id: 'intl6', name: 'Indie Chill', nameAr: 'إندي هادئ', icon: '🪕', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Massenet_-_Meditation_from_Thais.ogg', category: 'international' },

  // ── Instrumental / Melodies ──
  { id: 'inst1', name: 'Guitar Melody', nameAr: 'جيتار عذب', icon: '🎸', url: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Tarrega_-_Recuerdos_de_la_Alhambra.ogg', category: 'instrumental' },
  { id: 'inst2', name: 'Violin Dreams', nameAr: 'كمان حالم', icon: '🎻', url: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Saint-Saens_-_The_Swan.ogg', category: 'instrumental' },
  { id: 'inst3', name: 'Flute Serenity', nameAr: 'ناي هادئ', icon: '🪈', url: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Debussy_-_Syrinx.ogg', category: 'instrumental' },
  { id: 'inst4', name: 'Orchestra Light', nameAr: 'أوركسترا خفيفة', icon: '🎼', url: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Tchaikovsky_-_Waltz_of_the_Flowers.ogg', category: 'instrumental' },
  { id: 'inst5', name: 'Harp Angels', nameAr: 'هارب ملائكي', icon: '🪽', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Handel_-_Harp_Concerto_in_B-flat_major.ogg', category: 'instrumental' },
  { id: 'inst6', name: 'Saxophone Smooth', nameAr: 'ساكسفون ناعم', icon: '🎷', url: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Take_Five_-_Dave_Brubeck.ogg', category: 'instrumental' },
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
