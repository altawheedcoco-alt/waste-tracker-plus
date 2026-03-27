/**
 * Enhanced notification sound system v2.0
 * - 15 notification types with 6 alternate tones each
 * - HIGH volume defaults (0.6-1.0)
 * - Per-type tone selection + volume control
 * - All tones generated via Web Audio API
 */

export type NotificationSoundType =
  | 'shipment_created'
  | 'shipment_status'
  | 'shipment_approved'
  | 'shipment_delivered'
  | 'shipment_assigned'
  | 'recycling_report'
  | 'document_uploaded'
  | 'document_signed'
  | 'approval_request'
  | 'chat_message'
  | 'warning'
  | 'financial'
  | 'partner_linked'
  | 'broadcast'
  | 'default';

export type NotifToneName = 'strong' | 'bell' | 'alarm' | 'rising' | 'triple' | 'deep';

export const NOTIF_TONE_NAMES: NotifToneName[] = ['strong', 'bell', 'alarm', 'rising', 'triple', 'deep'];

export const NOTIF_TONE_LABELS: Record<NotifToneName, { ar: string; en: string }> = {
  strong: { ar: 'قوي', en: 'Strong' },
  bell:   { ar: 'جرس', en: 'Bell' },
  alarm:  { ar: 'إنذار', en: 'Alarm' },
  rising: { ar: 'صاعد', en: 'Rising' },
  triple: { ar: 'ثلاثي', en: 'Triple' },
  deep:   { ar: 'عميق', en: 'Deep' },
};

export const SOUND_LABELS: Record<NotificationSoundType, string> = {
  shipment_created: 'شحنة جديدة',
  shipment_status: 'تحديث الحالة',
  shipment_approved: 'موافقة على الشحنة',
  shipment_delivered: 'تم التسليم',
  shipment_assigned: 'إسناد شحنة',
  recycling_report: 'تقرير تدوير',
  document_uploaded: 'رفع وثيقة',
  document_signed: 'توقيع وثيقة',
  approval_request: 'طلب موافقة',
  chat_message: 'رسالة جديدة',
  warning: 'تحذير',
  financial: 'مالي',
  partner_linked: 'ربط شريك',
  broadcast: 'بث عام',
  default: 'إشعار عام',
};

// ──── Audio Context ────
let audioContext: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
};

// ──── Core helpers ────
function playOsc(ctx: AudioContext, freq: number, type: OscillatorType, vol: number, dur: number, startOffset = 0) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = ctx.currentTime + startOffset;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur);
}

// ──── 6 Tone generators (LOUD) ────
type ToneGen = (ctx: AudioContext, vol: number, baseFreqs: number[]) => void;

const TONE_GENS: Record<NotifToneName, ToneGen> = {
  strong: (ctx, vol, freqs) => {
    freqs.forEach((f, i) => {
      playOsc(ctx, f, 'sine', vol, 0.25, i * 0.09);
      playOsc(ctx, f * 1.5, 'sine', vol * 0.3, 0.15, i * 0.09); // harmonic
    });
  },
  bell: (ctx, vol, freqs) => {
    freqs.forEach((f, i) => {
      playOsc(ctx, f, 'sine', vol, 0.35, i * 0.12);
      playOsc(ctx, f * 2, 'sine', vol * 0.2, 0.2, i * 0.12 + 0.05);
    });
  },
  alarm: (ctx, vol, freqs) => {
    const f = freqs[0] || 880;
    for (let i = 0; i < 4; i++) {
      playOsc(ctx, f, 'square', vol * 0.7, 0.08, i * 0.12);
      playOsc(ctx, f * 1.2, 'square', vol * 0.5, 0.08, i * 0.12 + 0.06);
    }
  },
  rising: (ctx, vol, freqs) => {
    const base = freqs[0] || 400;
    const steps = [base, base * 1.25, base * 1.5, base * 2];
    steps.forEach((f, i) => {
      playOsc(ctx, f, 'sine', vol * (0.7 + i * 0.1), 0.18, i * 0.1);
    });
  },
  triple: (ctx, vol, freqs) => {
    const f = freqs[0] || 800;
    for (let i = 0; i < 3; i++) {
      playOsc(ctx, f, 'sine', vol, 0.1, i * 0.13);
      playOsc(ctx, f * 1.5, 'triangle', vol * 0.4, 0.08, i * 0.13);
    }
  },
  deep: (ctx, vol, freqs) => {
    const f = freqs[0] || 300;
    playOsc(ctx, f, 'sine', vol, 0.4);
    playOsc(ctx, f * 0.5, 'sine', vol * 0.6, 0.5, 0.05);
    playOsc(ctx, f, 'sine', vol * 0.4, 0.3, 0.2);
  },
};

// ──── Base frequencies per notification type ────
const BASE_FREQS: Record<NotificationSoundType, number[]> = {
  shipment_created:  [523, 659, 784, 1047],
  shipment_status:   [659, 784],
  shipment_approved: [523, 659, 784],
  shipment_delivered:[659, 784, 1047, 1319],
  shipment_assigned: [440, 554, 659],
  recycling_report:  [392, 523, 659],
  document_uploaded: [587, 784],
  document_signed:   [659, 880, 1047],
  approval_request:  [784, 659, 784, 988],
  chat_message:      [698, 880],
  warning:           [880, 698, 880, 698],
  financial:         [523, 784, 1047],
  partner_linked:    [440, 659, 880],
  broadcast:         [440, 554, 660],
  default:           [523, 659],
};

// ──── Settings persistence ────
const NOTIF_SETTINGS_KEY = 'notif_sound_settings_v2';

interface NotifTypeSettings {
  enabled: boolean;
  tone: NotifToneName;
  volume: number; // 0-1
}

type AllNotifSettings = Record<NotificationSoundType, NotifTypeSettings>;

const DEFAULT_SETTINGS: AllNotifSettings = Object.fromEntries(
  (Object.keys(SOUND_LABELS) as NotificationSoundType[]).map(k => [
    k,
    { enabled: true, tone: 'strong' as NotifToneName, volume: 0.8 },
  ])
) as AllNotifSettings;

export function getNotifSettings(): AllNotifSettings {
  try {
    const raw = localStorage.getItem(NOTIF_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults for any new types
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveNotifSettings(settings: AllNotifSettings) {
  localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(settings));
}

export function setNotifTypeSetting(type: NotificationSoundType, patch: Partial<NotifTypeSettings>) {
  const s = getNotifSettings();
  s[type] = { ...s[type], ...patch };
  saveNotifSettings(s);
}

export function getNotifTypeSetting(type: NotificationSoundType): NotifTypeSettings {
  return getNotifSettings()[type] || DEFAULT_SETTINGS.default;
}

// ──── Play functions ────
export async function playNotificationSound(type: NotificationSoundType = 'default') {
  // Master check
  const masterEnabled = localStorage.getItem('notification_sound_enabled');
  if (masterEnabled === 'false') return;

  const settings = getNotifSettings();
  const typeSettings = settings[type] || settings.default;
  if (!typeSettings.enabled) return;

  // Quiet hours check
  const qhEnabled = localStorage.getItem('quiet_hours_enabled') === 'true';
  if (qhEnabled) {
    const start = localStorage.getItem('quiet_hours_start') || '22:00';
    const end = localStorage.getItem('quiet_hours_end') || '07:00';
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const sMin = sH * 60 + sM, eMin = eH * 60 + eM;
    const inQuiet = sMin <= eMin ? (mins >= sMin && mins <= eMin) : (mins >= sMin || mins <= eMin);
    if (inQuiet) return;
  }

  const globalVol = parseFloat(localStorage.getItem('sound_global_volume') || '0.8');

  try {
    const ctx = getCtx();
    const freqs = BASE_FREQS[type] || BASE_FREQS.default;
    const effectiveVol = globalVol * typeSettings.volume;
    const gen = TONE_GENS[typeSettings.tone] || TONE_GENS.strong;
    gen(ctx, effectiveVol, freqs);
  } catch (e) {
    console.warn('Could not play notification sound:', e);
  }
}

export async function previewNotificationSound(type: NotificationSoundType, tone?: NotifToneName) {
  try {
    const ctx = getCtx();
    const freqs = BASE_FREQS[type] || BASE_FREQS.default;
    const settings = getNotifTypeSetting(type);
    const useTone = tone || settings.tone;
    const gen = TONE_GENS[useTone] || TONE_GENS.strong;
    gen(ctx, settings.volume * 0.9, freqs);
  } catch (e) {
    console.warn('Could not preview notification sound:', e);
  }
}

// ──── Compat exports ────
export const initNotificationAudio = async () => { try { getCtx(); } catch {} };
export const setNotificationSoundEnabled = (enabled: boolean) => localStorage.setItem('notification_sound_enabled', String(enabled));
export const isNotificationSoundEnabled = (): boolean => localStorage.getItem('notification_sound_enabled') !== 'false';
export const ensureSoundsEnabled = () => {
  if (localStorage.getItem('notification_sound_enabled') === null) localStorage.setItem('notification_sound_enabled', 'true');
};

// Per-type enable/disable (compat)
export const setSoundTypeEnabled = (type: NotificationSoundType, enabled: boolean) => setNotifTypeSetting(type, { enabled });
export const isSoundTypeEnabled = (type: NotificationSoundType): boolean => getNotifTypeSetting(type).enabled;
export const getAllSoundSettings = (): Record<NotificationSoundType, boolean> => {
  const s = getNotifSettings();
  return Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v.enabled])) as Record<NotificationSoundType, boolean>;
};
export const resetSoundSettings = () => { localStorage.removeItem(NOTIF_SETTINGS_KEY); localStorage.removeItem('notification_sound_enabled'); };

// Map DB notification type to sound type
export const mapNotificationTypeToSound = (dbType: string | null): NotificationSoundType => {
  switch (dbType) {
    case 'shipment_created': return 'shipment_created';
    case 'shipment_status': case 'status_update': return 'shipment_status';
    case 'shipment_approved': return 'shipment_approved';
    case 'shipment_delivered': return 'shipment_delivered';
    case 'shipment_assigned': case 'driver_assignment': return 'shipment_assigned';
    case 'recycling_report': case 'report': case 'certificate': return 'recycling_report';
    case 'document_uploaded': case 'document_issued': case 'signing_request': return 'document_uploaded';
    case 'document_signed': case 'stamp_applied': return 'document_signed';
    case 'approval_request': return 'approval_request';
    case 'chat_message': case 'message': case 'mention': case 'partner_message': case 'partner_note': case 'partner_post': return 'chat_message';
    case 'warning': case 'signal_lost': return 'warning';
    case 'invoice': case 'payment': case 'deposit': case 'financial': return 'financial';
    case 'broadcast': return 'broadcast';
    case 'partner_linked': return 'partner_linked';
    default: return 'default';
  }
};
