// Notification sound frequencies and patterns
const NOTIFICATION_SOUNDS = {
  default: { frequencies: [523.25, 659.25, 783.99], duration: 150 },
  success: { frequencies: [523.25, 783.99], duration: 200 },
  urgent: { frequencies: [783.99, 659.25, 783.99, 659.25], duration: 100 },
  message: { frequencies: [659.25, 783.99], duration: 180 },
} as const;

type SoundType = keyof typeof NOTIFICATION_SOUNDS;

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const playTone = (frequency: number, duration: number, startTime: number) => {
  const ctx = getAudioContext();
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  // Smooth envelope
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration / 1000);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration / 1000);
};

export const playNotificationSound = (type: SoundType = 'default') => {
  const enabled = localStorage.getItem('notification_sound_enabled');
  if (enabled === 'false') return;
  
  try {
    const ctx = getAudioContext();
    const sound = NOTIFICATION_SOUNDS[type];
    const now = ctx.currentTime;
    
    sound.frequencies.forEach((freq, index) => {
      playTone(freq, sound.duration, now + (index * sound.duration) / 1000);
    });
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};

export const setNotificationSoundEnabled = (enabled: boolean) => {
  localStorage.setItem('notification_sound_enabled', String(enabled));
};

export const isNotificationSoundEnabled = (): boolean => {
  const stored = localStorage.getItem('notification_sound_enabled');
  return stored !== 'false';
};
