import { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { audioGenerators, type GeneratedAudioNode, closeAudioContext } from '@/utils/audioGenerator';

export interface FocusTrack {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  category: 'nature' | 'piano' | 'ambient' | 'calm' | 'international' | 'instrumental' | 'noise' | 'binaural';
  // Either a URL to stream or a generator key
  url?: string;
  generatorKey?: string;
}

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

const SH = (n: number) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

const focusTracks: FocusTrack[] = [
  // ═══════ 🌿 Nature Sounds (Generated) ═══════
  { id: 'rain', nameAr: 'مطر هادئ', name: 'Gentle Rain', icon: '🌧️', category: 'nature', generatorKey: 'rain' },
  { id: 'ocean', nameAr: 'أمواج البحر', name: 'Ocean Waves', icon: '🌊', category: 'nature', generatorKey: 'ocean' },
  { id: 'forest', nameAr: 'طيور الغابة', name: 'Forest Birds', icon: '🌲', category: 'nature', generatorKey: 'forest_birds' },
  { id: 'wind', nameAr: 'رياح ناعمة', name: 'Gentle Wind', icon: '🍃', category: 'nature', generatorKey: 'wind' },
  { id: 'creek', nameAr: 'جدول ماء', name: 'Creek Water', icon: '💧', category: 'nature', generatorKey: 'creek' },
  { id: 'thunder', nameAr: 'عاصفة رعدية', name: 'Thunderstorm', icon: '⛈️', category: 'nature', generatorKey: 'thunder_storm' },
  { id: 'night', nameAr: 'ليل هادئ', name: 'Night Crickets', icon: '🌙', category: 'nature', generatorKey: 'night_ambient' },
  { id: 'campfire', nameAr: 'نار المخيم', name: 'Campfire', icon: '🔥', category: 'nature', generatorKey: 'campfire' },

  // ═══════ 🎹 Piano & Classical (SoundHelix) ═══════
  { id: 'piano1', nameAr: 'بيانو هادئ', name: 'Peaceful Piano', icon: '🎹', category: 'piano', url: SH(1) },
  { id: 'piano2', nameAr: 'بيانو ناعم', name: 'Soft Melody', icon: '🎶', category: 'piano', url: SH(2) },
  { id: 'piano3', nameAr: 'بيانو عاطفي', name: 'Emotional Keys', icon: '💫', category: 'piano', url: SH(3) },
  { id: 'piano4', nameAr: 'بيانو مريح', name: 'Relaxing Piano', icon: '✨', category: 'piano', url: SH(4) },
  { id: 'piano5', nameAr: 'بيانو حالم', name: 'Dreamy Piano', icon: '🌸', category: 'piano', url: SH(5) },
  { id: 'piano6', nameAr: 'بيانو للدراسة', name: 'Study Piano', icon: '📚', category: 'piano', url: SH(6) },

  // ═══════ 🎵 Ambient (SoundHelix + Generated) ═══════
  { id: 'amb1', nameAr: 'تأمل عميق', name: 'Deep Meditation', icon: '🧘', category: 'ambient', url: SH(7) },
  { id: 'amb2', nameAr: 'أجواء هادئة', name: 'Calm Ambient', icon: '🎵', category: 'ambient', url: SH(8) },
  { id: 'amb3', nameAr: 'فضاء داخلي', name: 'Inner Space', icon: '🌌', category: 'ambient', url: SH(9) },
  { id: 'amb4', nameAr: 'موجات الراحة', name: 'Comfort Waves', icon: '🌈', category: 'ambient', url: SH(10) },
  { id: 'amb5', nameAr: 'باد أثيري', name: 'Ethereal Pad', icon: '☁️', category: 'ambient', generatorKey: 'pad' },
  { id: 'amb6', nameAr: 'أوعية غنائية', name: 'Singing Bowls', icon: '🪷', category: 'ambient', generatorKey: 'singing_bowls' },
  { id: 'amb7', nameAr: 'درون كوني', name: 'Cosmic Drone', icon: '🪐', category: 'ambient', generatorKey: 'drone_cosmic' },
  { id: 'amb8', nameAr: 'درون أوم', name: 'Om Drone', icon: '🕉️', category: 'ambient', generatorKey: 'drone_om' },

  // ═══════ 🎶 Calm & Relaxing (SoundHelix) ═══════
  { id: 'calm1', nameAr: 'صفاء الصباح', name: 'Morning Serenity', icon: '🌅', category: 'calm', url: SH(11) },
  { id: 'calm2', nameAr: 'نسيم لطيف', name: 'Gentle Breeze', icon: '🍃', category: 'calm', url: SH(12) },
  { id: 'calm3', nameAr: 'وهج الغروب', name: 'Sunset Glow', icon: '🌇', category: 'calm', url: SH(13) },
  { id: 'calm4', nameAr: 'سحب عائمة', name: 'Floating Clouds', icon: '☁️', category: 'calm', url: SH(14) },
  { id: 'calm5', nameAr: 'نهر هادئ', name: 'Quiet River', icon: '🏞️', category: 'calm', url: SH(15) },
  { id: 'calm6', nameAr: 'حديقة زن', name: 'Zen Garden', icon: '🪷', category: 'calm', url: SH(16) },

  // ═══════ 🌍 International (SoundHelix) ═══════
  { id: 'intl1', nameAr: 'سينمائي ملحمي', name: 'Cinematic Epic', icon: '🎬', category: 'international', url: SH(1) },
  { id: 'intl2', nameAr: 'جاز ناعم', name: 'Smooth Jazz', icon: '🎤', category: 'international', url: SH(3) },
  { id: 'intl3', nameAr: 'أكوستيك', name: 'Acoustic Vibes', icon: '🎸', category: 'international', url: SH(5) },
  { id: 'intl4', nameAr: 'جاز كافيه', name: 'Jazz Café', icon: '☕', category: 'international', url: SH(7) },
  { id: 'intl5', nameAr: 'موسيقى عالمية', name: 'World Music', icon: '🌍', category: 'international', url: SH(9) },
  { id: 'intl6', nameAr: 'بوسا نوفا', name: 'Bossa Nova', icon: '🎭', category: 'international', url: SH(11) },
  { id: 'intl7', nameAr: 'إندي هادئ', name: 'Indie Chill', icon: '🪕', category: 'international', url: SH(13) },
  { id: 'intl8', nameAr: 'كلاسيك مودرن', name: 'Modern Classic', icon: '🎼', category: 'international', url: SH(15) },

  // ═══════ 🎻 Instrumental (SoundHelix) ═══════
  { id: 'inst1', nameAr: 'جيتار عذب', name: 'Guitar Melody', icon: '🎸', category: 'instrumental', url: SH(2) },
  { id: 'inst2', nameAr: 'كمان حالم', name: 'Violin Dreams', icon: '🎻', category: 'instrumental', url: SH(4) },
  { id: 'inst3', nameAr: 'ناي هادئ', name: 'Flute Serenity', icon: '🪈', category: 'instrumental', url: SH(6) },
  { id: 'inst4', nameAr: 'أوركسترا خفيفة', name: 'Light Orchestra', icon: '🎼', category: 'instrumental', url: SH(8) },
  { id: 'inst5', nameAr: 'ساكسفون ناعم', name: 'Smooth Sax', icon: '🎷', category: 'instrumental', url: SH(10) },
  { id: 'inst6', nameAr: 'هارب ملائكي', name: 'Angel Harp', icon: '🪽', category: 'instrumental', url: SH(12) },
  { id: 'inst7', nameAr: 'تشيلو عميق', name: 'Deep Cello', icon: '🎻', category: 'instrumental', url: SH(14) },
  { id: 'inst8', nameAr: 'ماريمبا دافئة', name: 'Warm Marimba', icon: '🥁', category: 'instrumental', url: SH(16) },

  // ═══════ 📻 Noise (Generated) ═══════
  { id: 'white', nameAr: 'ضوضاء بيضاء', name: 'White Noise', icon: '⚪', category: 'noise', generatorKey: 'white_noise' },
  { id: 'pink', nameAr: 'ضوضاء وردية', name: 'Pink Noise', icon: '🩷', category: 'noise', generatorKey: 'pink_noise' },
  { id: 'brown', nameAr: 'ضوضاء بنية', name: 'Brown Noise', icon: '🟤', category: 'noise', generatorKey: 'brown_noise' },
  { id: 'drone_earth', nameAr: 'درون أرضي', name: 'Earth Drone', icon: '🌏', category: 'noise', generatorKey: 'drone_earth' },

  // ═══════ 🧠 Binaural Beats (Generated) ═══════
  { id: 'bin_alpha', nameAr: 'ألفا - استرخاء', name: 'Alpha (Relax)', icon: '🧘', category: 'binaural', generatorKey: 'binaural_alpha' },
  { id: 'bin_theta', nameAr: 'ثيتا - تأمل', name: 'Theta (Meditate)', icon: '🌀', category: 'binaural', generatorKey: 'binaural_theta' },
  { id: 'bin_delta', nameAr: 'دلتا - نوم عميق', name: 'Delta (Deep Sleep)', icon: '😴', category: 'binaural', generatorKey: 'binaural_delta' },
  { id: 'bin_beta', nameAr: 'بيتا - تركيز', name: 'Beta (Focus)', icon: '🧠', category: 'binaural', generatorKey: 'binaural_beta' },
  { id: 'bin_gamma', nameAr: 'جاما - إبداع', name: 'Gamma (Creative)', icon: '⚡', category: 'binaural', generatorKey: 'binaural_gamma' },
];

const FocusMusicStateContext = createContext<FocusMusicStateContextType | undefined>(undefined);
const FocusMusicActionsContext = createContext<FocusMusicActionsContextType | undefined>(undefined);
const FocusMusicContext = createContext<FocusMusicContextType | undefined>(undefined);

let globalAudio: HTMLAudioElement | null = null;
let globalGeneratedNode: GeneratedAudioNode | null = null;

export const stopFocusMusicOnLogout = () => {
  if (globalAudio) {
    globalAudio.pause();
    globalAudio.currentTime = 0;
    globalAudio.src = '';
  }
  if (globalGeneratedNode) {
    globalGeneratedNode.stop();
    globalGeneratedNode = null;
  }
  closeAudioContext();
};

export const useFocusMusicState = () => {
  const context = useContext(FocusMusicStateContext);
  if (!context) throw new Error('useFocusMusicState must be used within FocusMusicProvider');
  return context;
};

export const useFocusMusicActions = () => {
  const context = useContext(FocusMusicActionsContext);
  if (!context) throw new Error('useFocusMusicActions must be used within FocusMusicProvider');
  return context;
};

export const useFocusMusic = () => {
  const context = useContext(FocusMusicContext);
  if (!context) throw new Error('useFocusMusic must be used within FocusMusicProvider');
  return context;
};

export const useIsPlaying = () => useFocusMusicState().isPlaying;
export const useCurrentTrack = () => useFocusMusicState().currentTrack;

export const FocusMusicProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<FocusTrack | null>(null);
  const [volume, setVolumeState] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const generatedRef = useRef<GeneratedAudioNode | null>(null);

  useEffect(() => {
    if (!globalAudio) {
      globalAudio = new Audio();
      globalAudio.loop = true;
      globalAudio.preload = 'auto';
    }
    audioRef.current = globalAudio;

    const handleError = () => {
      console.warn('Audio playback error');
      setIsPlaying(false);
    };
    globalAudio.addEventListener('error', handleError);
    return () => { globalAudio?.removeEventListener('error', handleError); };
  }, []);

  // Volume sync
  useEffect(() => {
    const vol = isMuted ? 0 : volume / 100;
    if (audioRef.current) audioRef.current.volume = vol;
    if (generatedRef.current) generatedRef.current.setVolume(vol * 0.7);
  }, [volume, isMuted]);

  const stopGenerated = useCallback(() => {
    if (generatedRef.current) {
      generatedRef.current.stop();
      generatedRef.current = null;
      globalGeneratedNode = null;
    }
  }, []);

  const stopUrlAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
  }, []);

  const playTrack = useCallback((track: FocusTrack) => {
    // Toggle if same track
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        if (track.generatorKey) {
          stopGenerated();
        } else {
          audioRef.current?.pause();
        }
        setIsPlaying(false);
      } else {
        if (track.generatorKey) {
          const gen = audioGenerators[track.generatorKey];
          if (gen) {
            const node = gen();
            const vol = isMuted ? 0 : volume / 100;
            node.setVolume(vol * 0.7);
            generatedRef.current = node;
            globalGeneratedNode = node;
          }
        } else {
          audioRef.current?.play();
        }
        setIsPlaying(true);
      }
      return;
    }

    // Stop everything first
    stopGenerated();
    stopUrlAudio();

    if (track.generatorKey) {
      const gen = audioGenerators[track.generatorKey];
      if (gen) {
        const node = gen();
        const vol = isMuted ? 0 : volume / 100;
        node.setVolume(vol * 0.7);
        generatedRef.current = node;
        globalGeneratedNode = node;
        setIsPlaying(true);
        setCurrentTrack(track);
      }
    } else if (track.url && audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setCurrentTrack(track);
      }).catch((e) => {
        console.error('Playback failed:', e);
        setIsPlaying(false);
      });
    }
  }, [currentTrack, isPlaying, volume, isMuted, stopGenerated, stopUrlAudio]);

  const pauseTrack = useCallback(() => {
    if (currentTrack?.generatorKey) {
      stopGenerated();
    } else {
      audioRef.current?.pause();
    }
    setIsPlaying(false);
  }, [currentTrack, stopGenerated]);

  const resumeTrack = useCallback(() => {
    if (!currentTrack) return;
    if (currentTrack.generatorKey) {
      const gen = audioGenerators[currentTrack.generatorKey];
      if (gen) {
        const node = gen();
        const vol = isMuted ? 0 : volume / 100;
        node.setVolume(vol * 0.7);
        generatedRef.current = node;
        globalGeneratedNode = node;
      }
    } else {
      audioRef.current?.play().catch(console.error);
    }
    setIsPlaying(true);
  }, [currentTrack, volume, isMuted]);

  const stopTrack = useCallback(() => {
    stopGenerated();
    stopUrlAudio();
    setIsPlaying(false);
    setCurrentTrack(null);
  }, [stopGenerated, stopUrlAudio]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (isMuted && v > 0) setIsMuted(false);
  }, [isMuted]);

  const toggleMute = useCallback(() => setIsMuted(p => !p), []);

  const stateValue = useMemo<FocusMusicStateContextType>(() => ({
    isPlaying, currentTrack, volume, isMuted, tracks: focusTracks,
  }), [isPlaying, currentTrack, volume, isMuted]);

  const actionsValue = useMemo<FocusMusicActionsContextType>(() => ({
    playTrack, pauseTrack, resumeTrack, stopTrack, setVolume, toggleMute,
  }), [playTrack, pauseTrack, resumeTrack, stopTrack, setVolume, toggleMute]);

  const combinedValue = useMemo<FocusMusicContextType>(() => ({
    ...stateValue, ...actionsValue,
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
