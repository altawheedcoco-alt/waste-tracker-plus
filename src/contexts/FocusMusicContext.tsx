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
  // ── Nature Sounds ──
  { id: 'rain', name: 'Rain', nameAr: 'مطر', icon: '🌧️', url: 'https://cdn.pixabay.com/audio/2022/05/16/audio_460a4bc593.mp3', category: 'nature' },
  { id: 'forest', name: 'Forest', nameAr: 'غابة', icon: '🌲', url: 'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3', category: 'nature' },
  { id: 'ocean', name: 'Ocean Waves', nameAr: 'أمواج البحر', icon: '🌊', url: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3', category: 'nature' },
  { id: 'birds', name: 'Birds', nameAr: 'طيور', icon: '🐦', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_4c5b551c09.mp3', category: 'nature' },
  { id: 'thunder', name: 'Thunder', nameAr: 'رعد', icon: '⛈️', url: 'https://cdn.pixabay.com/audio/2022/10/30/audio_f1fde3f6f0.mp3', category: 'nature' },
  { id: 'night', name: 'Night', nameAr: 'ليل', icon: '🌙', url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3', category: 'nature' },

  // ── Piano Music ──
  { id: 'piano1', name: 'Peaceful Piano', nameAr: 'بيانو هادئ', icon: '🎹', url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946ac70977.mp3', category: 'piano' },
  { id: 'piano2', name: 'Soft Piano', nameAr: 'بيانو ناعم', icon: '🎶', url: 'https://cdn.pixabay.com/audio/2022/08/25/audio_4f3b0a816e.mp3', category: 'piano' },
  { id: 'piano3', name: 'Emotional Piano', nameAr: 'بيانو عاطفي', icon: '💫', url: 'https://cdn.pixabay.com/audio/2023/07/30/audio_e00485a805.mp3', category: 'piano' },
  { id: 'piano4', name: 'Relaxing Piano', nameAr: 'بيانو مريح', icon: '✨', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', category: 'piano' },
  { id: 'piano5', name: 'Dreamy Piano', nameAr: 'بيانو حالم', icon: '🌸', url: 'https://cdn.pixabay.com/audio/2023/09/25/audio_0cbce02ee2.mp3', category: 'piano' },
  { id: 'piano6', name: 'Study Piano', nameAr: 'بيانو للدراسة', icon: '📚', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c7f76a4af2.mp3', category: 'piano' },

  // ── Ambient Music ──
  { id: 'lofi', name: 'Lo-Fi', nameAr: 'لو-فاي', icon: '🎧', url: 'https://cdn.pixabay.com/audio/2022/11/22/audio_0f65b25edf.mp3', category: 'ambient' },
  { id: 'meditation', name: 'Meditation', nameAr: 'تأمل', icon: '🧘', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_67da925ead.mp3', category: 'ambient' },
  { id: 'ambient1', name: 'Deep Focus', nameAr: 'تركيز عميق', icon: '🧠', url: 'https://cdn.pixabay.com/audio/2022/08/23/audio_d16737dc28.mp3', category: 'ambient' },
  { id: 'ambient2', name: 'Calm Music', nameAr: 'موسيقى هادئة', icon: '🎵', url: 'https://cdn.pixabay.com/audio/2023/10/07/audio_4fa6762075.mp3', category: 'ambient' },
  { id: 'ambient3', name: 'Chill Beats', nameAr: 'إيقاعات مريحة', icon: '🎼', url: 'https://cdn.pixabay.com/audio/2022/05/17/audio_407815a838.mp3', category: 'ambient' },
  { id: 'ambient4', name: 'Space Ambient', nameAr: 'أجواء فضائية', icon: '🌌', url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_ea75bfd0db.mp3', category: 'ambient' },

  // ── 🎶 Calm & Relaxing Music (30 tracks) ──
  { id: 'calm1', name: 'Morning Serenity', nameAr: 'صفاء الصباح', icon: '🌅', url: 'https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3', category: 'calm' },
  { id: 'calm2', name: 'Gentle Breeze', nameAr: 'نسيم لطيف', icon: '🍃', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', category: 'calm' },
  { id: 'calm3', name: 'Sunset Glow', nameAr: 'وهج الغروب', icon: '🌇', url: 'https://cdn.pixabay.com/audio/2022/10/18/audio_6d50266557.mp3', category: 'calm' },
  { id: 'calm4', name: 'Floating Clouds', nameAr: 'سحب عائمة', icon: '☁️', url: 'https://cdn.pixabay.com/audio/2023/04/07/audio_247b8ff0a6.mp3', category: 'calm' },
  { id: 'calm5', name: 'Quiet River', nameAr: 'نهر هادئ', icon: '🏞️', url: 'https://cdn.pixabay.com/audio/2022/08/31/audio_419263aaff.mp3', category: 'calm' },
  { id: 'calm6', name: 'Velvet Night', nameAr: 'ليلة مخملية', icon: '🌃', url: 'https://cdn.pixabay.com/audio/2023/01/16/audio_5b1a7e9f48.mp3', category: 'calm' },
  { id: 'calm7', name: 'Sakura Garden', nameAr: 'حديقة الساكورا', icon: '🌸', url: 'https://cdn.pixabay.com/audio/2022/12/13/audio_e85e0f0939.mp3', category: 'calm' },
  { id: 'calm8', name: 'Crystal Waters', nameAr: 'مياه كريستالية', icon: '💎', url: 'https://cdn.pixabay.com/audio/2023/03/20/audio_30a9f1b1de.mp3', category: 'calm' },
  { id: 'calm9', name: 'Warm Embrace', nameAr: 'عناق دافئ', icon: '🤗', url: 'https://cdn.pixabay.com/audio/2023/05/31/audio_9ea498d8c9.mp3', category: 'calm' },
  { id: 'calm10', name: 'Starlit Path', nameAr: 'درب النجوم', icon: '⭐', url: 'https://cdn.pixabay.com/audio/2022/09/07/audio_1ceab2f32e.mp3', category: 'calm' },
  { id: 'calm11', name: 'Zen Garden', nameAr: 'حديقة زن', icon: '🪷', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_67da925ead.mp3', category: 'calm' },
  { id: 'calm12', name: 'Soft Whispers', nameAr: 'همسات ناعمة', icon: '🤫', url: 'https://cdn.pixabay.com/audio/2023/08/07/audio_f3bde72e3f.mp3', category: 'calm' },
  { id: 'calm13', name: 'Lavender Fields', nameAr: 'حقول اللافندر', icon: '💜', url: 'https://cdn.pixabay.com/audio/2022/11/09/audio_1cf1b6c035.mp3', category: 'calm' },
  { id: 'calm14', name: 'Golden Hour', nameAr: 'الساعة الذهبية', icon: '🌤️', url: 'https://cdn.pixabay.com/audio/2022/04/27/audio_67ca808e0c.mp3', category: 'calm' },
  { id: 'calm15', name: 'Moonrise', nameAr: 'شروق القمر', icon: '🌕', url: 'https://cdn.pixabay.com/audio/2023/02/15/audio_7cf5d3e37f.mp3', category: 'calm' },
  { id: 'calm16', name: 'Tranquil Lake', nameAr: 'بحيرة هادئة', icon: '🏔️', url: 'https://cdn.pixabay.com/audio/2022/07/19/audio_c031b62948.mp3', category: 'calm' },
  { id: 'calm17', name: 'Silk Dreams', nameAr: 'أحلام حريرية', icon: '💤', url: 'https://cdn.pixabay.com/audio/2023/06/14/audio_4bc539ab09.mp3', category: 'calm' },
  { id: 'calm18', name: 'Tea Ceremony', nameAr: 'حفل الشاي', icon: '🍵', url: 'https://cdn.pixabay.com/audio/2022/12/28/audio_fddf7cac07.mp3', category: 'calm' },
  { id: 'calm19', name: 'Autumn Leaves', nameAr: 'أوراق الخريف', icon: '🍂', url: 'https://cdn.pixabay.com/audio/2022/10/04/audio_b92ef4e2db.mp3', category: 'calm' },
  { id: 'calm20', name: 'Deep Calm', nameAr: 'هدوء عميق', icon: '🕊️', url: 'https://cdn.pixabay.com/audio/2023/09/04/audio_c4b1569a7d.mp3', category: 'calm' },
  { id: 'calm21', name: 'Gentle Rain Piano', nameAr: 'بيانو تحت المطر', icon: '🎹', url: 'https://cdn.pixabay.com/audio/2022/06/30/audio_ba0ffcab34.mp3', category: 'calm' },
  { id: 'calm22', name: 'Watercolor Sky', nameAr: 'سماء مائية', icon: '🎨', url: 'https://cdn.pixabay.com/audio/2023/07/11/audio_3b5e3cc167.mp3', category: 'calm' },
  { id: 'calm23', name: 'Peaceful Mind', nameAr: 'عقل مسالم', icon: '🧘‍♂️', url: 'https://cdn.pixabay.com/audio/2022/09/22/audio_e47e2c097f.mp3', category: 'calm' },
  { id: 'calm24', name: 'Snow Falling', nameAr: 'تساقط الثلوج', icon: '❄️', url: 'https://cdn.pixabay.com/audio/2023/01/30/audio_5efe12ca8d.mp3', category: 'calm' },
  { id: 'calm25', name: 'Candlelight', nameAr: 'ضوء الشموع', icon: '🕯️', url: 'https://cdn.pixabay.com/audio/2022/11/15/audio_1b3f6e6a4c.mp3', category: 'calm' },
  { id: 'calm26', name: 'Misty Mountains', nameAr: 'جبال ضبابية', icon: '🏔️', url: 'https://cdn.pixabay.com/audio/2023/04/22/audio_2c7f5aee6c.mp3', category: 'calm' },
  { id: 'calm27', name: 'Bamboo Flute', nameAr: 'ناي الخيزران', icon: '🎋', url: 'https://cdn.pixabay.com/audio/2022/08/14/audio_925c8c83dc.mp3', category: 'calm' },
  { id: 'calm28', name: 'Horizon Gaze', nameAr: 'نظرة الأفق', icon: '🌊', url: 'https://cdn.pixabay.com/audio/2023/08/28/audio_8e8e0f9c5b.mp3', category: 'calm' },
  { id: 'calm29', name: 'Inner Peace', nameAr: 'سلام داخلي', icon: '☮️', url: 'https://cdn.pixabay.com/audio/2022/04/07/audio_8b9cad3e4f.mp3', category: 'calm' },
  { id: 'calm30', name: 'Eternal Calm', nameAr: 'هدوء أبدي', icon: '🌿', url: 'https://cdn.pixabay.com/audio/2023/10/18/audio_6a7e8d5f2c.mp3', category: 'calm' },
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
