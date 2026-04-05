/**
 * Sound Engine — محرك الأصوات المركزي v2.0
 * يدعم فئات أصوات + 6 نغمات بديلة لكل فئة + تحكم منفصل بالصوت
 */

type SoundName =
  | 'click'        // نقر الأزرار
  | 'tap'          // لمس خفيف
  | 'toggle'       // تبديل (switch)
  | 'navigate'     // انتقال بين الصفحات
  | 'success'      // نجاح عملية
  | 'error'        // خطأ
  | 'warning'      // تحذير
  | 'notification' // إشعار وارد
  | 'message_sent' // إرسال رسالة
  | 'message_received' // استقبال رسالة
  | 'delete'       // حذف
  | 'refresh'      // تحديث
  | 'login'        // تسجيل دخول
  | 'logout'       // تسجيل خروج
  | 'upload'       // رفع ملف
  | 'download'     // تحميل ملف
  | 'scan'         // مسح QR
  | 'popup_open'   // فتح نافذة
  | 'popup_close'  // إغلاق نافذة
  | 'recording_start'  // بدء التسجيل الصوتي
  | 'recording_stop'   // إيقاف التسجيل
  | 'recording_cancel' // إلغاء التسجيل
  | 'reaction'     // إضافة تفاعل إيموجي
  | 'copy'         // نسخ رسالة
  | 'pin'          // تثبيت رسالة
  | 'forward'      // إعادة توجيه
  | 'typing'       // صوت الكتابة
  | 'call_ring'    // رنين مكالمة
  | 'call_end'     // إنهاء مكالمة
  | 'join_room'    // دخول غرفة/مجموعة
  | 'leave_room'   // مغادرة غرفة
  | 'mention'      // إشارة @
  | 'broadcast'    // إرسال بث
  | 'poll_vote';   // تصويت في استطلاع

type SoundCategory = 'notification' | 'chat' | 'ui';
type ToneName = 'bold' | 'chime' | 'alert' | 'melody' | 'pulse' | 'echo';

const SOUND_CATEGORY_MAP: Record<SoundName, SoundCategory> = {
  // Notification
  notification: 'notification', success: 'notification', error: 'notification',
  warning: 'notification', broadcast: 'notification',
  // Chat
  message_sent: 'chat', message_received: 'chat', recording_start: 'chat',
  recording_stop: 'chat', recording_cancel: 'chat', reaction: 'chat',
  typing: 'chat', call_ring: 'chat', call_end: 'chat', join_room: 'chat',
  leave_room: 'chat', mention: 'chat', forward: 'chat', poll_vote: 'chat',
  copy: 'chat', pin: 'chat',
  // UI
  click: 'ui', tap: 'ui', toggle: 'ui', navigate: 'ui', delete: 'ui',
  refresh: 'ui', login: 'ui', logout: 'ui', upload: 'ui', download: 'ui',
  scan: 'ui', popup_open: 'ui', popup_close: 'ui',
};

const TONE_LABELS: Record<ToneName, { ar: string; en: string }> = {
  bold: { ar: 'قوي', en: 'Bold' },
  chime: { ar: 'رنين', en: 'Chime' },
  alert: { ar: 'تنبيه', en: 'Alert' },
  melody: { ar: 'لحن', en: 'Melody' },
  pulse: { ar: 'نبض', en: 'Pulse' },
  echo: { ar: 'صدى', en: 'Echo' },
};

const STORAGE_KEY = 'app_sound_enabled';
const VOLUME_KEY = 'app_sound_volume';
const CAT_PREFIX = 'sound_cat_';
const TONE_PREFIX = 'sound_tone_';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private _enabled: boolean;
  private _volume: number;
  private _categoryEnabled: Record<SoundCategory, boolean>;
  private _categoryVolume: Record<SoundCategory, number>;
  private _categoryTone: Record<SoundCategory, ToneName>;

  constructor() {
    this._enabled = localStorage.getItem(STORAGE_KEY) !== 'false';
    this._volume = parseFloat(localStorage.getItem(VOLUME_KEY) || '0.7');
    
    this._categoryEnabled = {
      notification: localStorage.getItem(CAT_PREFIX + 'notification_enabled') !== 'false',
      chat: localStorage.getItem(CAT_PREFIX + 'chat_enabled') !== 'false',
      ui: localStorage.getItem(CAT_PREFIX + 'ui_enabled') !== 'false',
    };
    this._categoryVolume = {
      notification: parseFloat(localStorage.getItem(CAT_PREFIX + 'notification_volume') || '0.8'),
      chat: parseFloat(localStorage.getItem(CAT_PREFIX + 'chat_volume') || '0.7'),
      ui: parseFloat(localStorage.getItem(CAT_PREFIX + 'ui_volume') || '0.5'),
    };
    this._categoryTone = {
      notification: (localStorage.getItem(TONE_PREFIX + 'notification') as ToneName) || 'bold',
      chat: (localStorage.getItem(TONE_PREFIX + 'chat') as ToneName) || 'bold',
      ui: (localStorage.getItem(TONE_PREFIX + 'ui') as ToneName) || 'bold',
    };
  }

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  get enabled() { return this._enabled; }
  set enabled(val: boolean) {
    this._enabled = val;
    localStorage.setItem(STORAGE_KEY, String(val));
  }

  get volume() { return this._volume; }
  set volume(val: number) {
    this._volume = Math.max(0, Math.min(1, val));
    localStorage.setItem(VOLUME_KEY, String(this._volume));
  }

  getCategoryEnabled(cat: SoundCategory) { return this._categoryEnabled[cat]; }
  setCategoryEnabled(cat: SoundCategory, val: boolean) {
    this._categoryEnabled[cat] = val;
    localStorage.setItem(CAT_PREFIX + cat + '_enabled', String(val));
  }

  getCategoryVolume(cat: SoundCategory) { return this._categoryVolume[cat]; }
  setCategoryVolume(cat: SoundCategory, val: number) {
    this._categoryVolume[cat] = Math.max(0, Math.min(1, val));
    localStorage.setItem(CAT_PREFIX + cat + '_volume', String(this._categoryVolume[cat]));
  }

  getCategoryTone(cat: SoundCategory) { return this._categoryTone[cat]; }
  setCategoryTone(cat: SoundCategory, tone: ToneName) {
    this._categoryTone[cat] = tone;
    localStorage.setItem(TONE_PREFIX + cat, tone);
  }

  play(name: SoundName) {
    if (!this._enabled) return;
    const cat = SOUND_CATEGORY_MAP[name];
    if (!this._categoryEnabled[cat]) return;
    try {
      const catVol = this._categoryVolume[cat];
      const effectiveVol = this._volume * catVol;
      const fn = SOUNDS[name];
      if (fn) fn(this.getCtx(), effectiveVol);
    } catch {
      // silently fail
    }
  }

  /** Play a tone preview for a category */
  playTonePreview(cat: SoundCategory, tone: ToneName) {
    try {
      const ctx = this.getCtx();
      const vol = this._volume * this._categoryVolume[cat];
      TONE_GENERATORS[tone](ctx, vol);
    } catch {
      // silently fail
    }
  }
}

// ──────────── Core Oscillator Helpers ────────────

function osc(
  ctx: AudioContext,
  vol: number,
  freq: number,
  type: OscillatorType,
  duration: number,
  ramp?: number,
) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol * 0.6;
  if (ramp) {
    o.frequency.exponentialRampToValueAtTime(ramp, ctx.currentTime + duration);
  }
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + duration);
}

/** Warm chord — plays multiple sine harmonics together */
function chord(ctx: AudioContext, vol: number, freqs: number[], duration: number) {
  freqs.forEach(f => osc(ctx, vol / freqs.length, f, 'sine', duration));
}

/** Soft shimmer noise with bandpass */
function shimmer(ctx: AudioContext, vol: number, duration: number) {
  const bufSize = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.05;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = vol * 0.15;
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 2;
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start();
  src.stop(ctx.currentTime + duration);
}

// ──────────── 6 Tone Generators (for previews) ────────────

const TONE_GENERATORS: Record<ToneName, (ctx: AudioContext, vol: number) => void> = {
  bold: (ctx, vol) => {
    // Warm major triad
    chord(ctx, vol, [523, 659, 784], 0.25);
  },
  chime: (ctx, vol) => {
    osc(ctx, vol, 1047, 'sine', 0.3);
    setTimeout(() => osc(ctx, vol * 0.7, 1319, 'sine', 0.25), 120);
    setTimeout(() => osc(ctx, vol * 0.5, 1568, 'sine', 0.2), 240);
  },
  alert: (ctx, vol) => {
    osc(ctx, vol * 0.7, 659, 'triangle', 0.15);
    setTimeout(() => osc(ctx, vol * 0.6, 784, 'triangle', 0.15), 150);
    setTimeout(() => osc(ctx, vol * 0.5, 659, 'triangle', 0.2), 300);
  },
  melody: (ctx, vol) => {
    // Romantic ascending — C E G B
    osc(ctx, vol * 0.8, 523, 'sine', 0.15);
    setTimeout(() => osc(ctx, vol * 0.8, 659, 'sine', 0.15), 130);
    setTimeout(() => osc(ctx, vol * 0.8, 784, 'sine', 0.15), 260);
    setTimeout(() => osc(ctx, vol * 0.7, 988, 'sine', 0.3), 390);
  },
  pulse: (ctx, vol) => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => osc(ctx, vol * 0.6, 784, 'sine', 0.1), i * 120);
    }
  },
  echo: (ctx, vol) => {
    osc(ctx, vol, 523, 'sine', 0.35);
    setTimeout(() => osc(ctx, vol * 0.5, 523, 'sine', 0.25), 200);
    setTimeout(() => osc(ctx, vol * 0.25, 523, 'sine', 0.2), 400);
  },
};

// ──────────── Sound Generators — Romantic & Warm ────────────

const SOUNDS: Record<SoundName, (ctx: AudioContext, vol: number) => void> = {
  click: (ctx, vol) => {
    // Gentle water drop
    osc(ctx, vol * 0.5, 1200, 'sine', 0.08, 800);
    shimmer(ctx, vol * 0.2, 0.06);
  },
  tap: (ctx, vol) => {
    osc(ctx, vol * 0.4, 900, 'sine', 0.06, 600);
  },
  toggle: (ctx, vol) => {
    // Soft harp pluck
    osc(ctx, vol * 0.5, 659, 'sine', 0.15, 988);
    shimmer(ctx, vol * 0.15, 0.1);
  },
  navigate: (ctx, vol) => {
    // Gentle breeze whoosh
    osc(ctx, vol * 0.35, 440, 'sine', 0.18, 660);
    shimmer(ctx, vol * 0.2, 0.15);
  },
  success: (ctx, vol) => {
    // Warm ascending major7 — dreamy
    osc(ctx, vol * 0.6, 523, 'sine', 0.18);
    setTimeout(() => osc(ctx, vol * 0.6, 659, 'sine', 0.18), 120);
    setTimeout(() => osc(ctx, vol * 0.6, 784, 'sine', 0.18), 240);
    setTimeout(() => chord(ctx, vol * 0.5, [988, 1175], 0.3), 360);
  },
  error: (ctx, vol) => {
    // Soft descending minor — gentle disappointment
    osc(ctx, vol * 0.5, 440, 'triangle', 0.2);
    setTimeout(() => osc(ctx, vol * 0.4, 392, 'triangle', 0.25), 150);
  },
  warning: (ctx, vol) => {
    // Gentle bell ding-ding
    osc(ctx, vol * 0.45, 587, 'sine', 0.2);
    setTimeout(() => osc(ctx, vol * 0.4, 587, 'sine', 0.2), 220);
  },
  notification: (ctx, vol) => {
    // Crystal chime — magical
    osc(ctx, vol * 0.5, 1047, 'sine', 0.15);
    setTimeout(() => osc(ctx, vol * 0.5, 1319, 'sine', 0.15), 100);
    setTimeout(() => chord(ctx, vol * 0.4, [1568, 2093], 0.25), 200);
  },
  message_sent: (ctx, vol) => {
    // Soft whoosh up
    osc(ctx, vol * 0.4, 523, 'sine', 0.12, 1047);
    shimmer(ctx, vol * 0.15, 0.1);
  },
  message_received: (ctx, vol) => {
    // Sweet two-note chime
    osc(ctx, vol * 0.5, 784, 'sine', 0.15);
    setTimeout(() => osc(ctx, vol * 0.5, 1047, 'sine', 0.2), 110);
  },
  delete: (ctx, vol) => {
    // Soft dissolve
    osc(ctx, vol * 0.4, 659, 'sine', 0.15, 330);
    shimmer(ctx, vol * 0.3, 0.15);
  },
  refresh: (ctx, vol) => {
    // Gentle spiral up
    osc(ctx, vol * 0.35, 392, 'sine', 0.25, 784);
  },
  login: (ctx, vol) => {
    // Welcome — warm ascending major
    osc(ctx, vol * 0.5, 523, 'sine', 0.12);
    setTimeout(() => osc(ctx, vol * 0.5, 659, 'sine', 0.12), 100);
    setTimeout(() => chord(ctx, vol * 0.5, [784, 1047], 0.25), 200);
  },
  logout: (ctx, vol) => {
    // Gentle farewell — descending
    osc(ctx, vol * 0.4, 784, 'sine', 0.12);
    setTimeout(() => osc(ctx, vol * 0.4, 659, 'sine', 0.12), 100);
    setTimeout(() => osc(ctx, vol * 0.3, 523, 'sine', 0.2), 200);
  },
  upload: (ctx, vol) => {
    // Soft rising tone
    osc(ctx, vol * 0.4, 440, 'sine', 0.2, 880);
    shimmer(ctx, vol * 0.15, 0.15);
  },
  download: (ctx, vol) => {
    // Soft descending tone
    osc(ctx, vol * 0.4, 880, 'sine', 0.2, 440);
    shimmer(ctx, vol * 0.15, 0.15);
  },
  scan: (ctx, vol) => {
    // Quick crystal ping
    osc(ctx, vol * 0.5, 1319, 'sine', 0.08);
    setTimeout(() => osc(ctx, vol * 0.4, 1568, 'sine', 0.1), 70);
  },
  popup_open: (ctx, vol) => {
    // Gentle bloom
    osc(ctx, vol * 0.35, 523, 'sine', 0.15, 784);
    shimmer(ctx, vol * 0.1, 0.12);
  },
  popup_close: (ctx, vol) => {
    // Soft close
    osc(ctx, vol * 0.35, 784, 'sine', 0.12, 523);
  },
  recording_start: (ctx, vol) => {
    // Gentle activate
    osc(ctx, vol * 0.4, 659, 'sine', 0.1);
    setTimeout(() => osc(ctx, vol * 0.5, 880, 'sine', 0.15), 100);
  },
  recording_stop: (ctx, vol) => {
    // Gentle deactivate
    osc(ctx, vol * 0.4, 880, 'sine', 0.1);
    setTimeout(() => osc(ctx, vol * 0.4, 659, 'sine', 0.15), 100);
  },
  recording_cancel: (ctx, vol) => {
    osc(ctx, vol * 0.3, 523, 'triangle', 0.15, 330);
  },
  reaction: (ctx, vol) => {
    // Sparkle
    osc(ctx, vol * 0.4, 1319, 'sine', 0.08);
    setTimeout(() => osc(ctx, vol * 0.3, 1568, 'sine', 0.06), 50);
    shimmer(ctx, vol * 0.1, 0.08);
  },
  copy: (ctx, vol) => {
    osc(ctx, vol * 0.3, 784, 'sine', 0.06);
    osc(ctx, vol * 0.25, 988, 'sine', 0.06);
  },
  pin: (ctx, vol) => {
    osc(ctx, vol * 0.4, 880, 'sine', 0.1, 1319);
  },
  forward: (ctx, vol) => {
    osc(ctx, vol * 0.35, 523, 'sine', 0.12, 988);
  },
  typing: (ctx, vol) => {
    // Ultra-soft keypress
    osc(ctx, vol * 0.1, 1047, 'sine', 0.025);
    shimmer(ctx, vol * 0.05, 0.02);
  },
  call_ring: (ctx, vol) => {
    // Musical ring — romantic melody
    osc(ctx, vol * 0.5, 784, 'sine', 0.2);
    setTimeout(() => osc(ctx, vol * 0.5, 988, 'sine', 0.2), 220);
    setTimeout(() => chord(ctx, vol * 0.4, [1175, 1568], 0.3), 440);
  },
  call_end: (ctx, vol) => {
    // Gentle goodbye
    osc(ctx, vol * 0.4, 784, 'sine', 0.15);
    setTimeout(() => osc(ctx, vol * 0.35, 587, 'sine', 0.15), 130);
    setTimeout(() => osc(ctx, vol * 0.3, 440, 'sine', 0.25), 260);
  },
  join_room: (ctx, vol) => {
    // Welcome chime
    osc(ctx, vol * 0.4, 523, 'sine', 0.1);
    setTimeout(() => osc(ctx, vol * 0.5, 784, 'sine', 0.15), 100);
  },
  leave_room: (ctx, vol) => {
    osc(ctx, vol * 0.35, 784, 'sine', 0.1);
    setTimeout(() => osc(ctx, vol * 0.3, 523, 'sine', 0.15), 100);
  },
  mention: (ctx, vol) => {
    // Gentle sparkle attention
    osc(ctx, vol * 0.45, 988, 'sine', 0.08);
    setTimeout(() => osc(ctx, vol * 0.4, 1319, 'sine', 0.1), 70);
  },
  broadcast: (ctx, vol) => {
    // Majestic fanfare — soft
    osc(ctx, vol * 0.4, 523, 'sine', 0.12);
    setTimeout(() => osc(ctx, vol * 0.4, 659, 'sine', 0.12), 120);
    setTimeout(() => chord(ctx, vol * 0.4, [784, 1047], 0.25), 240);
  },
  poll_vote: (ctx, vol) => {
    osc(ctx, vol * 0.4, 784, 'sine', 0.1, 1175);
  },
};

// Singleton
export const soundEngine = new SoundEngine();
export { TONE_LABELS, SOUND_CATEGORY_MAP, TONE_GENERATORS };
export const TONE_NAMES: ToneName[] = ['bold', 'chime', 'alert', 'melody', 'pulse', 'echo'];
export const CATEGORY_NAMES: SoundCategory[] = ['notification', 'chat', 'ui'];
export type { SoundName, SoundCategory, ToneName };
