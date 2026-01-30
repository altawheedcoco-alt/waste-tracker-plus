import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface FocusTrack {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  url: string;
  category: 'nature' | 'piano' | 'ambient';
}

interface FocusMusicContextType {
  isPlaying: boolean;
  currentTrack: FocusTrack | null;
  volume: number;
  isMuted: boolean;
  tracks: FocusTrack[];
  playTrack: (track: FocusTrack) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  stopTrack: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

const focusTracks: FocusTrack[] = [
  // Nature Sounds
  {
    id: 'rain',
    name: 'Rain',
    nameAr: 'مطر',
    icon: '🌧️',
    url: 'https://cdn.pixabay.com/audio/2022/05/16/audio_460a4bc593.mp3',
    category: 'nature',
  },
  {
    id: 'forest',
    name: 'Forest',
    nameAr: 'غابة',
    icon: '🌲',
    url: 'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3',
    category: 'nature',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    nameAr: 'أمواج البحر',
    icon: '🌊',
    url: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3',
    category: 'nature',
  },
  {
    id: 'birds',
    name: 'Birds',
    nameAr: 'طيور',
    icon: '🐦',
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_4c5b551c09.mp3',
    category: 'nature',
  },
  {
    id: 'thunder',
    name: 'Thunder',
    nameAr: 'رعد',
    icon: '⛈️',
    url: 'https://cdn.pixabay.com/audio/2022/10/30/audio_f1fde3f6f0.mp3',
    category: 'nature',
  },
  {
    id: 'night',
    name: 'Night',
    nameAr: 'ليل',
    icon: '🌙',
    url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3',
    category: 'nature',
  },
  
  // Piano Music
  {
    id: 'piano1',
    name: 'Peaceful Piano',
    nameAr: 'بيانو هادئ',
    icon: '🎹',
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946ac70977.mp3',
    category: 'piano',
  },
  {
    id: 'piano2',
    name: 'Soft Piano',
    nameAr: 'بيانو ناعم',
    icon: '🎶',
    url: 'https://cdn.pixabay.com/audio/2022/08/25/audio_4f3b0a816e.mp3',
    category: 'piano',
  },
  {
    id: 'piano3',
    name: 'Emotional Piano',
    nameAr: 'بيانو عاطفي',
    icon: '💫',
    url: 'https://cdn.pixabay.com/audio/2023/07/30/audio_e00485a805.mp3',
    category: 'piano',
  },
  {
    id: 'piano4',
    name: 'Relaxing Piano',
    nameAr: 'بيانو مريح',
    icon: '✨',
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    category: 'piano',
  },
  {
    id: 'piano5',
    name: 'Dreamy Piano',
    nameAr: 'بيانو حالم',
    icon: '🌸',
    url: 'https://cdn.pixabay.com/audio/2023/09/25/audio_0cbce02ee2.mp3',
    category: 'piano',
  },
  {
    id: 'piano6',
    name: 'Study Piano',
    nameAr: 'بيانو للدراسة',
    icon: '📚',
    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c7f76a4af2.mp3',
    category: 'piano',
  },
  
  // Ambient Music
  {
    id: 'lofi',
    name: 'Lo-Fi',
    nameAr: 'لو-فاي',
    icon: '🎧',
    url: 'https://cdn.pixabay.com/audio/2022/11/22/audio_0f65b25edf.mp3',
    category: 'ambient',
  },
  {
    id: 'meditation',
    name: 'Meditation',
    nameAr: 'تأمل',
    icon: '🧘',
    url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_67da925ead.mp3',
    category: 'ambient',
  },
  {
    id: 'ambient1',
    name: 'Deep Focus',
    nameAr: 'تركيز عميق',
    icon: '🧠',
    url: 'https://cdn.pixabay.com/audio/2022/08/23/audio_d16737dc28.mp3',
    category: 'ambient',
  },
  {
    id: 'ambient2',
    name: 'Calm Music',
    nameAr: 'موسيقى هادئة',
    icon: '🎵',
    url: 'https://cdn.pixabay.com/audio/2023/10/07/audio_4fa6762075.mp3',
    category: 'ambient',
  },
  {
    id: 'ambient3',
    name: 'Chill Beats',
    nameAr: 'إيقاعات مريحة',
    icon: '🎼',
    url: 'https://cdn.pixabay.com/audio/2022/05/17/audio_407815a838.mp3',
    category: 'ambient',
  },
  {
    id: 'ambient4',
    name: 'Space Ambient',
    nameAr: 'أجواء فضائية',
    icon: '🌌',
    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_ea75bfd0db.mp3',
    category: 'ambient',
  },
];

const FocusMusicContext = createContext<FocusMusicContextType | undefined>(undefined);

// Create a singleton audio element that persists across the app
let globalAudio: HTMLAudioElement | null = null;

export const FocusMusicProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<FocusTrack | null>(null);
  const [volume, setVolumeState] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Use singleton audio element
    if (!globalAudio) {
      globalAudio = new Audio();
      globalAudio.loop = true;
    }
    audioRef.current = globalAudio;

    // Restore volume
    audioRef.current.volume = isMuted ? 0 : volume / 100;

    // Cleanup only when app is fully unmounted (page close)
    const handleBeforeUnload = () => {
      if (globalAudio) {
        globalAudio.pause();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const playTrack = (track: FocusTrack) => {
    if (!audioRef.current) return;

    if (currentTrack?.id === track.id) {
      // Toggle play/pause for same track
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // Switch to new track
      audioRef.current.pause();
      audioRef.current.src = track.url;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setCurrentTrack(track);
      }).catch(console.error);
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeTrack = () => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  };

  const stopTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <FocusMusicContext.Provider
      value={{
        isPlaying,
        currentTrack,
        volume,
        isMuted,
        tracks: focusTracks,
        playTrack,
        pauseTrack,
        resumeTrack,
        stopTrack,
        setVolume,
        toggleMute,
      }}
    >
      {children}
    </FocusMusicContext.Provider>
  );
};

export const useFocusMusic = () => {
  const context = useContext(FocusMusicContext);
  if (context === undefined) {
    throw new Error('useFocusMusic must be used within a FocusMusicProvider');
  }
  return context;
};
