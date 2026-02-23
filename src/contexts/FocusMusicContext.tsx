import { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface FocusTrack {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  url: string;
  category: 'nature' | 'piano' | 'ambient';
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
  // ── Nature Sounds (12 tracks) ──
  { id: 'rain', name: 'Rain', nameAr: 'مطر', icon: '🌧️', url: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_460a4bc593.mp3', category: 'nature' },
  { id: 'forest', name: 'Forest', nameAr: 'غابة', icon: '🌲', url: 'https://cdn.pixabay.com/download/audio/2022/08/04/audio_2dde668d05.mp3', category: 'nature' },
  { id: 'ocean', name: 'Ocean Waves', nameAr: 'أمواج البحر', icon: '🌊', url: 'https://cdn.pixabay.com/download/audio/2022/06/07/audio_b9bd4170e4.mp3', category: 'nature' },
  { id: 'birds', name: 'Birds', nameAr: 'طيور', icon: '🐦', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_4c5b551c09.mp3', category: 'nature' },
  { id: 'thunder', name: 'Thunder', nameAr: 'رعد', icon: '⛈️', url: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_f1fde3f6f0.mp3', category: 'nature' },
  { id: 'night', name: 'Night Crickets', nameAr: 'صراصير الليل', icon: '🌙', url: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3', category: 'nature' },
  { id: 'river', name: 'River Stream', nameAr: 'نهر جاري', icon: '🏞️', url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_d1718ab41b.mp3', category: 'nature' },
  { id: 'wind', name: 'Wind', nameAr: 'رياح', icon: '💨', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_115290e833.mp3', category: 'nature' },
  { id: 'campfire', name: 'Campfire', nameAr: 'نار مخيم', icon: '🔥', url: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d04c36e911.mp3', category: 'nature' },
  { id: 'waterfall', name: 'Waterfall', nameAr: 'شلال', icon: '💦', url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_0a8e1e2f28.mp3', category: 'nature' },
  { id: 'garden', name: 'Garden Morning', nameAr: 'صباح الحديقة', icon: '🌻', url: 'https://cdn.pixabay.com/download/audio/2022/04/27/audio_67e989de2c.mp3', category: 'nature' },
  { id: 'whale', name: 'Whale Sounds', nameAr: 'أصوات الحيتان', icon: '🐋', url: 'https://cdn.pixabay.com/download/audio/2022/01/20/audio_7ef65a3313.mp3', category: 'nature' },

  // ── Piano Music (12 tracks) ──
  { id: 'piano1', name: 'Peaceful Piano', nameAr: 'بيانو هادئ', icon: '🎹', url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946ac70977.mp3', category: 'piano' },
  { id: 'piano2', name: 'Soft Piano', nameAr: 'بيانو ناعم', icon: '🎶', url: 'https://cdn.pixabay.com/download/audio/2022/08/25/audio_4f3b0a816e.mp3', category: 'piano' },
  { id: 'piano3', name: 'Emotional Piano', nameAr: 'بيانو عاطفي', icon: '💫', url: 'https://cdn.pixabay.com/download/audio/2023/07/30/audio_e00485a805.mp3', category: 'piano' },
  { id: 'piano4', name: 'Relaxing Piano', nameAr: 'بيانو مريح', icon: '✨', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', category: 'piano' },
  { id: 'piano5', name: 'Dreamy Piano', nameAr: 'بيانو حالم', icon: '🌸', url: 'https://cdn.pixabay.com/download/audio/2023/09/25/audio_0cbce02ee2.mp3', category: 'piano' },
  { id: 'piano6', name: 'Study Piano', nameAr: 'بيانو للدراسة', icon: '📚', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c7f76a4af2.mp3', category: 'piano' },
  { id: 'piano7', name: 'Classical Piano', nameAr: 'بيانو كلاسيكي', icon: '🎻', url: 'https://cdn.pixabay.com/download/audio/2022/11/09/audio_5b29c4e5b2.mp3', category: 'piano' },
  { id: 'piano8', name: 'Night Piano', nameAr: 'بيانو ليلي', icon: '🌃', url: 'https://cdn.pixabay.com/download/audio/2023/04/10/audio_fc75543cc0.mp3', category: 'piano' },
  { id: 'piano9', name: 'Gentle Keys', nameAr: 'مفاتيح رقيقة', icon: '🕊️', url: 'https://cdn.pixabay.com/download/audio/2023/01/16/audio_c4bde6fa8f.mp3', category: 'piano' },
  { id: 'piano10', name: 'Morning Piano', nameAr: 'بيانو صباحي', icon: '🌅', url: 'https://cdn.pixabay.com/download/audio/2022/12/13/audio_e0b8ab0612.mp3', category: 'piano' },
  { id: 'piano11', name: 'Nostalgic Piano', nameAr: 'بيانو حنين', icon: '🍂', url: 'https://cdn.pixabay.com/download/audio/2023/05/31/audio_14a5b1a2db.mp3', category: 'piano' },
  { id: 'piano12', name: 'Cinematic Piano', nameAr: 'بيانو سينمائي', icon: '🎬', url: 'https://cdn.pixabay.com/download/audio/2022/09/07/audio_6168b90cfd.mp3', category: 'piano' },

  // ── Ambient Music (14 tracks) ──
  { id: 'lofi', name: 'Lo-Fi', nameAr: 'لو-فاي', icon: '🎧', url: 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_0f65b25edf.mp3', category: 'ambient' },
  { id: 'meditation', name: 'Meditation', nameAr: 'تأمل', icon: '🧘', url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_67da925ead.mp3', category: 'ambient' },
  { id: 'ambient1', name: 'Deep Focus', nameAr: 'تركيز عميق', icon: '🧠', url: 'https://cdn.pixabay.com/download/audio/2022/08/23/audio_d16737dc28.mp3', category: 'ambient' },
  { id: 'ambient2', name: 'Calm Music', nameAr: 'موسيقى هادئة', icon: '🎵', url: 'https://cdn.pixabay.com/download/audio/2023/10/07/audio_4fa6762075.mp3', category: 'ambient' },
  { id: 'ambient3', name: 'Chill Beats', nameAr: 'إيقاعات مريحة', icon: '🎼', url: 'https://cdn.pixabay.com/download/audio/2022/05/17/audio_407815a838.mp3', category: 'ambient' },
  { id: 'ambient4', name: 'Space Ambient', nameAr: 'أجواء فضائية', icon: '🌌', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_ea75bfd0db.mp3', category: 'ambient' },
  { id: 'ambient5', name: 'Jazz Cafe', nameAr: 'مقهى جاز', icon: '☕', url: 'https://cdn.pixabay.com/download/audio/2022/10/18/audio_dce157e59e.mp3', category: 'ambient' },
  { id: 'ambient6', name: 'Zen Garden', nameAr: 'حديقة زِن', icon: '🎍', url: 'https://cdn.pixabay.com/download/audio/2022/04/19/audio_d2e4be5af3.mp3', category: 'ambient' },
  { id: 'ambient7', name: 'Synthwave', nameAr: 'سينث ويف', icon: '🌆', url: 'https://cdn.pixabay.com/download/audio/2022/07/12/audio_b1e9e8f85a.mp3', category: 'ambient' },
  { id: 'ambient8', name: 'Acoustic Chill', nameAr: 'أكوستيك هادئ', icon: '🎸', url: 'https://cdn.pixabay.com/download/audio/2022/09/14/audio_92aa5a9aca.mp3', category: 'ambient' },
  { id: 'ambient9', name: 'Ethereal', nameAr: 'أثيري', icon: '🔮', url: 'https://cdn.pixabay.com/download/audio/2022/06/28/audio_4508d91f64.mp3', category: 'ambient' },
  { id: 'ambient10', name: 'Yoga Flow', nameAr: 'يوغا', icon: '🪷', url: 'https://cdn.pixabay.com/download/audio/2022/02/15/audio_98e7539413.mp3', category: 'ambient' },
  { id: 'ambient11', name: 'Tropical Vibes', nameAr: 'أجواء استوائية', icon: '🌴', url: 'https://cdn.pixabay.com/download/audio/2022/07/25/audio_791e657cac.mp3', category: 'ambient' },
  { id: 'ambient12', name: 'Dream Drift', nameAr: 'انسياب حالم', icon: '☁️', url: 'https://cdn.pixabay.com/download/audio/2023/03/20/audio_1fb3f46dcf.mp3', category: 'ambient' },
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
