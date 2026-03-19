// Enhanced notification sound system with distinct tones for each notification type
export type NotificationSoundType = 
  | 'shipment_created'
  | 'shipment_status'
  | 'shipment_approved'
  | 'shipment_delivered'
  | 'shipment_assigned'
  | 'recycling_report'
  | 'document_uploaded'
  | 'approval_request'
  | 'chat_message'
  | 'warning'
  | 'default';

interface SoundConfig {
  frequencies: number[];
  duration: number;
  waveform: OscillatorType;
  volume: number;
}

// Distinct sound configurations for each notification type
const NOTIFICATION_SOUNDS: Record<NotificationSoundType, SoundConfig> = {
  // New shipment - ascending cheerful tones
  shipment_created: { 
    frequencies: [523.25, 659.25, 783.99, 1046.50], 
    duration: 120, 
    waveform: 'sine',
    volume: 0.3
  },
  // Status update - two quick beeps
  shipment_status: { 
    frequencies: [659.25, 783.99], 
    duration: 100, 
    waveform: 'triangle',
    volume: 0.25
  },
  // Approval - success ascending melody
  shipment_approved: { 
    frequencies: [523.25, 659.25, 783.99], 
    duration: 150, 
    waveform: 'sine',
    volume: 0.3
  },
  // Delivered - celebratory tones
  shipment_delivered: { 
    frequencies: [659.25, 783.99, 1046.50, 1318.51], 
    duration: 130, 
    waveform: 'sine',
    volume: 0.35
  },
  // Assignment - attention grabbing
  shipment_assigned: { 
    frequencies: [440, 554.37, 659.25], 
    duration: 140, 
    waveform: 'triangle',
    volume: 0.3
  },
  // Recycling report - eco-friendly gentle tones
  recycling_report: { 
    frequencies: [392, 523.25, 659.25], 
    duration: 180, 
    waveform: 'sine',
    volume: 0.25
  },
  // Document uploaded - quick confirmation
  document_uploaded: { 
    frequencies: [587.33, 783.99], 
    duration: 100, 
    waveform: 'triangle',
    volume: 0.2
  },
  // Approval request - important attention
  approval_request: { 
    frequencies: [783.99, 659.25, 783.99, 987.77], 
    duration: 110, 
    waveform: 'square',
    volume: 0.25
  },
  // Chat message - friendly notification
  chat_message: { 
    frequencies: [698.46, 880], 
    duration: 80, 
    waveform: 'sine',
    volume: 0.2
  },
  // Warning - urgent attention
  warning: { 
    frequencies: [880, 698.46, 880, 698.46], 
    duration: 100, 
    waveform: 'sawtooth',
    volume: 0.35
  },
  // Default - simple notification
  default: { 
    frequencies: [523.25, 659.25], 
    duration: 150, 
    waveform: 'sine',
    volume: 0.25
  },
};

// Sound labels in Arabic
export const SOUND_LABELS: Record<NotificationSoundType, string> = {
  shipment_created: 'شحنة جديدة',
  shipment_status: 'تحديث الحالة',
  shipment_approved: 'موافقة على الشحنة',
  shipment_delivered: 'تم التسليم',
  shipment_assigned: 'إسناد شحنة',
  recycling_report: 'تقرير تدوير',
  document_uploaded: 'رفع وثيقة',
  approval_request: 'طلب موافقة',
  chat_message: 'رسالة جديدة',
  warning: 'تحذير',
  default: 'إشعار عام',
};

let audioContext: AudioContext | null = null;
let audioUnlocked = false;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Must be called from a user gesture handler to unlock audio
const ensureAudioUnlocked = async (): Promise<boolean> => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    audioUnlocked = ctx.state === 'running';
    return audioUnlocked;
  } catch {
    return false;
  }
};

const playTone = (
  frequency: number, 
  duration: number, 
  startTime: number, 
  waveform: OscillatorType,
  volume: number
) => {
  const ctx = getAudioContext();
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = waveform;
  
  // Smooth envelope
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration / 1000);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration / 1000);
};

// Get sound settings from localStorage
const getSoundSettings = (): Record<NotificationSoundType, boolean> => {
  const stored = localStorage.getItem('notification_sound_settings');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return getDefaultSoundSettings();
    }
  }
  return getDefaultSoundSettings();
};

const getDefaultSoundSettings = (): Record<NotificationSoundType, boolean> => {
  // All sounds enabled by default
  return {
    shipment_created: true,
    shipment_status: true,
    shipment_approved: true,
    shipment_delivered: true,
    shipment_assigned: true,
    recycling_report: true,
    document_uploaded: true,
    approval_request: true,
    chat_message: true,
    warning: true,
    default: true,
  };
};

export const playNotificationSound = async (type: NotificationSoundType = 'default') => {
  // Check if master sound is enabled
  const masterEnabled = localStorage.getItem('notification_sound_enabled');
  if (masterEnabled === 'false') return;
  
  // Check if specific sound type is enabled
  const soundSettings = getSoundSettings();
  if (!soundSettings[type]) return;
  
  try {
    const unlocked = await ensureAudioUnlocked();
    if (!unlocked) {
      console.warn('🔇 Audio context not unlocked yet - needs user gesture first');
      return;
    }
    
    const ctx = getAudioContext();
    const sound = NOTIFICATION_SOUNDS[type] || NOTIFICATION_SOUNDS.default;
    const now = ctx.currentTime;
    
    sound.frequencies.forEach((freq, index) => {
      playTone(
        freq, 
        sound.duration, 
        now + (index * sound.duration) / 1000,
        sound.waveform,
        sound.volume
      );
    });
    
    // sound played
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};

// Preview a specific sound
export const previewNotificationSound = async (type: NotificationSoundType) => {
  try {
    const unlocked = await ensureAudioUnlocked();
    if (!unlocked) return;
    
    const ctx = getAudioContext();
    const sound = NOTIFICATION_SOUNDS[type] || NOTIFICATION_SOUNDS.default;
    const now = ctx.currentTime;
    
    sound.frequencies.forEach((freq, index) => {
      playTone(
        freq, 
        sound.duration, 
        now + (index * sound.duration) / 1000,
        sound.waveform,
        sound.volume
      );
    });
  } catch (error) {
    console.warn('Could not preview notification sound:', error);
  }
};

// Theme-based volume multipliers
const THEME_MULTIPLIERS: Record<string, { volumeMul: number; durationMul: number; waveform?: OscillatorType }> = {
  classic: { volumeMul: 1, durationMul: 1 },
  gentle: { volumeMul: 0.6, durationMul: 1.5, waveform: 'sine' },
  modern: { volumeMul: 0.9, durationMul: 0.7, waveform: 'triangle' },
  minimal: { volumeMul: 0.5, durationMul: 0.5, waveform: 'sine' },
  professional: { volumeMul: 0.7, durationMul: 0.9, waveform: 'triangle' },
  playful: { volumeMul: 1, durationMul: 0.8, waveform: 'square' },
};

// Play sound with theme and volume applied
export const playThemeSound = async (type: NotificationSoundType, theme: string = 'classic', globalVolume: number = 0.7) => {
  try {
    const unlocked = await ensureAudioUnlocked();
    if (!unlocked) return;
    
    const ctx = getAudioContext();
    const sound = NOTIFICATION_SOUNDS[type] || NOTIFICATION_SOUNDS.default;
    const themeMod = THEME_MULTIPLIERS[theme] || THEME_MULTIPLIERS.classic;
    const now = ctx.currentTime;
    const vol = sound.volume * themeMod.volumeMul * globalVolume;
    const dur = sound.duration * themeMod.durationMul;
    
    sound.frequencies.forEach((freq, index) => {
      playTone(
        freq,
        dur,
        now + (index * dur) / 1000,
        themeMod.waveform || sound.waveform,
        vol
      );
    });
  } catch (error) {
    console.warn('Could not play theme sound:', error);
  }
};

// Initialize/unlock audio context (required by most browsers; needs a user gesture)
export const initNotificationAudio = async () => {
  await ensureAudioUnlocked();
};

export const setNotificationSoundEnabled = (enabled: boolean) => {
  localStorage.setItem('notification_sound_enabled', String(enabled));
};

export const isNotificationSoundEnabled = (): boolean => {
  const stored = localStorage.getItem('notification_sound_enabled');
  // Default to true if not set
  return stored !== 'false';
};

// Initialize all sounds to enabled on first load
export const ensureSoundsEnabled = () => {
  if (localStorage.getItem('notification_sound_enabled') === null) {
    localStorage.setItem('notification_sound_enabled', 'true');
  }
  if (localStorage.getItem('notification_sound_settings') === null) {
    localStorage.setItem('notification_sound_settings', JSON.stringify(getDefaultSoundSettings()));
  }
};

export const setSoundTypeEnabled = (type: NotificationSoundType, enabled: boolean) => {
  const settings = getSoundSettings();
  settings[type] = enabled;
  localStorage.setItem('notification_sound_settings', JSON.stringify(settings));
};

export const isSoundTypeEnabled = (type: NotificationSoundType): boolean => {
  const settings = getSoundSettings();
  return settings[type] !== false;
};

export const getAllSoundSettings = (): Record<NotificationSoundType, boolean> => {
  return getSoundSettings();
};

export const resetSoundSettings = () => {
  localStorage.removeItem('notification_sound_settings');
  localStorage.removeItem('notification_sound_enabled');
};

// Map notification types from DB to sound types
export const mapNotificationTypeToSound = (dbType: string | null): NotificationSoundType => {
  switch (dbType) {
    case 'shipment_created':
      return 'shipment_created';
    case 'shipment_status':
    case 'status_update':
      return 'shipment_status';
    case 'shipment_approved':
      return 'shipment_approved';
    case 'shipment_delivered':
      return 'shipment_delivered';
    case 'shipment_assigned':
    case 'driver_assignment':
      return 'shipment_assigned';
    case 'recycling_report':
    case 'report':
    case 'certificate':
      return 'recycling_report';
    case 'document_uploaded':
    case 'document_issued':
    case 'signing_request':
    case 'document_signed':
    case 'stamp_applied':
      return 'document_uploaded';
    case 'approval_request':
      return 'approval_request';
    case 'chat_message':
    case 'message':
    case 'broadcast':
    case 'mention':
    case 'partner_message':
    case 'partner_note':
    case 'partner_post':
      return 'chat_message';
    case 'warning':
    case 'signal_lost':
      return 'warning';
    case 'invoice':
    case 'payment':
    case 'deposit':
    case 'financial':
      return 'default';
    default:
      return 'default';
  }
};
