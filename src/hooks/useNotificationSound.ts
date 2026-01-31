import { useCallback, useRef } from 'react';

// Notification sound frequencies and patterns
const NOTIFICATION_SOUNDS = {
  default: { frequencies: [523.25, 659.25, 783.99], duration: 150 },
  success: { frequencies: [523.25, 783.99], duration: 200 },
  urgent: { frequencies: [783.99, 659.25, 783.99, 659.25], duration: 100 },
  message: { frequencies: [659.25, 783.99], duration: 180 },
} as const;

type SoundType = keyof typeof NOTIFICATION_SOUNDS;

export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isEnabledRef = useRef<boolean>(true);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, startTime: number) => {
    const audioContext = getAudioContext();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    // Smooth envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration / 1000);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration / 1000);
  }, [getAudioContext]);

  const playNotificationSound = useCallback((type: SoundType = 'default') => {
    if (!isEnabledRef.current) return;
    
    try {
      const audioContext = getAudioContext();
      const sound = NOTIFICATION_SOUNDS[type];
      const now = audioContext.currentTime;
      
      sound.frequencies.forEach((freq, index) => {
        playTone(freq, sound.duration, now + (index * sound.duration) / 1000);
      });
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [getAudioContext, playTone]);

  const setEnabled = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
    // Save preference to localStorage
    localStorage.setItem('notification_sound_enabled', String(enabled));
  }, []);

  const isEnabled = useCallback(() => {
    const stored = localStorage.getItem('notification_sound_enabled');
    if (stored !== null) {
      isEnabledRef.current = stored === 'true';
    }
    return isEnabledRef.current;
  }, []);

  return {
    playNotificationSound,
    setEnabled,
    isEnabled,
  };
};
