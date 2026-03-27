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
  g.gain.value = vol * 0.5; // raised from 0.3
  if (ramp) {
    o.frequency.linearRampToValueAtTime(ramp, ctx.currentTime + duration);
  }
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + duration);
}

function noise(ctx: AudioContext, vol: number, duration: number) {
  const bufSize = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = vol * 0.3; // raised from 0.2
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 4000;
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start();
  src.stop(ctx.currentTime + duration);
}

// ──────────── 6 Tone Generators (for previews) ────────────

const TONE_GENERATORS: Record<ToneName, (ctx: AudioContext, vol: number) => void> = {
  bold: (ctx, vol) => {
    osc(ctx, vol, 880, 'sine', 0.12);
    setTimeout(() => osc(ctx, vol, 1100, 'sine', 0.15), 80);
    setTimeout(() => osc(ctx, vol, 1320, 'sine', 0.12), 180);
  },
  chime: (ctx, vol) => {
    osc(ctx, vol, 1200, 'sine', 0.2);
    setTimeout(() => osc(ctx, vol * 0.8, 1500, 'sine', 0.15), 100);
    setTimeout(() => osc(ctx, vol * 0.6, 1800, 'sine', 0.1), 200);
  },
  alert: (ctx, vol) => {
    osc(ctx, vol, 800, 'square', 0.1);
    setTimeout(() => osc(ctx, vol, 1000, 'square', 0.1), 120);
    setTimeout(() => osc(ctx, vol, 800, 'square', 0.15), 240);
  },
  melody: (ctx, vol) => {
    osc(ctx, vol, 523, 'sine', 0.1);  // C5
    setTimeout(() => osc(ctx, vol, 659, 'sine', 0.1), 100); // E5
    setTimeout(() => osc(ctx, vol, 784, 'sine', 0.1), 200); // G5
    setTimeout(() => osc(ctx, vol, 1047, 'sine', 0.2), 300); // C6
  },
  pulse: (ctx, vol) => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => osc(ctx, vol, 900, 'sine', 0.06), i * 80);
    }
  },
  echo: (ctx, vol) => {
    osc(ctx, vol, 600, 'sine', 0.25);
    setTimeout(() => osc(ctx, vol * 0.6, 600, 'sine', 0.2), 150);
    setTimeout(() => osc(ctx, vol * 0.3, 600, 'sine', 0.15), 300);
  },
};

// ──────────── Sound Generators ────────────

const SOUNDS: Record<SoundName, (ctx: AudioContext, vol: number) => void> = {
  click: (ctx, vol) => {
    osc(ctx, vol, 800, 'sine', 0.06);
    noise(ctx, vol * 0.3, 0.03);
  },
  tap: (ctx, vol) => {
    osc(ctx, vol * 0.6, 600, 'sine', 0.04);
  },
  toggle: (ctx, vol) => {
    osc(ctx, vol, 500, 'sine', 0.08, 700);
  },
  navigate: (ctx, vol) => {
    osc(ctx, vol * 0.5, 400, 'sine', 0.1, 600);
  },
  success: (ctx, vol) => {
    osc(ctx, vol, 523, 'sine', 0.12);
    setTimeout(() => osc(ctx, vol, 659, 'sine', 0.12), 100);
    setTimeout(() => osc(ctx, vol, 784, 'sine', 0.18), 200);
  },
  error: (ctx, vol) => {
    osc(ctx, vol, 300, 'square', 0.15);
    setTimeout(() => osc(ctx, vol, 250, 'square', 0.2), 120);
  },
  warning: (ctx, vol) => {
    osc(ctx, vol, 440, 'triangle', 0.15);
    setTimeout(() => osc(ctx, vol, 440, 'triangle', 0.15), 180);
  },
  notification: (ctx, vol) => {
    osc(ctx, vol, 880, 'sine', 0.1);
    setTimeout(() => osc(ctx, vol, 1100, 'sine', 0.15), 80);
    setTimeout(() => osc(ctx, vol, 1320, 'sine', 0.12), 180);
  },
  message_sent: (ctx, vol) => {
    osc(ctx, vol * 0.7, 600, 'sine', 0.08, 900);
  },
  message_received: (ctx, vol) => {
    osc(ctx, vol, 700, 'sine', 0.1);
    setTimeout(() => osc(ctx, vol, 900, 'sine', 0.12), 90);
  },
  delete: (ctx, vol) => {
    osc(ctx, vol, 500, 'sine', 0.12, 200);
    noise(ctx, vol * 0.5, 0.1);
  },
  refresh: (ctx, vol) => {
    osc(ctx, vol * 0.5, 300, 'sine', 0.2, 800);
  },
  login: (ctx, vol) => {
    osc(ctx, vol, 440, 'sine', 0.1);
    setTimeout(() => osc(ctx, vol, 554, 'sine', 0.1), 80);
    setTimeout(() => osc(ctx, vol, 660, 'sine', 0.15), 160);
  },
  logout: (ctx, vol) => {
    osc(ctx, vol, 660, 'sine', 0.1);
    setTimeout(() => osc(ctx, vol, 554, 'sine', 0.1), 80);
    setTimeout(() => osc(ctx, vol, 440, 'sine', 0.15), 160);
  },
  upload: (ctx, vol) => {
    osc(ctx, vol * 0.6, 400, 'sine', 0.15, 800);
  },
  download: (ctx, vol) => {
    osc(ctx, vol * 0.6, 800, 'sine', 0.15, 400);
  },
  scan: (ctx, vol) => {
    osc(ctx, vol, 1200, 'sine', 0.05);
    setTimeout(() => osc(ctx, vol, 1500, 'sine', 0.08), 60);
  },
  popup_open: (ctx, vol) => {
    osc(ctx, vol * 0.5, 500, 'sine', 0.1, 700);
  },
  popup_close: (ctx, vol) => {
    osc(ctx, vol * 0.5, 700, 'sine', 0.08, 400);
  },
  recording_start: (ctx, vol) => {
    osc(ctx, vol * 0.6, 600, 'sine', 0.08);
    setTimeout(() => osc(ctx, vol * 0.6, 800, 'sine', 0.1), 80);
  },
  recording_stop: (ctx, vol) => {
    osc(ctx, vol * 0.6, 800, 'sine', 0.08);
    setTimeout(() => osc(ctx, vol * 0.6, 600, 'sine', 0.1), 80);
  },
  recording_cancel: (ctx, vol) => {
    osc(ctx, vol * 0.5, 400, 'sawtooth', 0.1, 200);
  },
  reaction: (ctx, vol) => {
    osc(ctx, vol * 0.5, 1000, 'sine', 0.06);
    setTimeout(() => osc(ctx, vol * 0.4, 1200, 'sine', 0.05), 50);
  },
  copy: (ctx, vol) => {
    osc(ctx, vol * 0.4, 700, 'sine', 0.05);
    osc(ctx, vol * 0.3, 900, 'sine', 0.05);
  },
  pin: (ctx, vol) => {
    osc(ctx, vol * 0.5, 800, 'sine', 0.08, 1200);
  },
  forward: (ctx, vol) => {
    osc(ctx, vol * 0.5, 500, 'sine', 0.1, 900);
  },
  typing: (ctx, vol) => {
    osc(ctx, vol * 0.15, 1200, 'sine', 0.02);
    noise(ctx, vol * 0.1, 0.02);
  },
  call_ring: (ctx, vol) => {
    osc(ctx, vol, 880, 'sine', 0.15);
    setTimeout(() => osc(ctx, vol, 880, 'sine', 0.15), 200);
    setTimeout(() => osc(ctx, vol, 1100, 'sine', 0.2), 400);
  },
  call_end: (ctx, vol) => {
    osc(ctx, vol * 0.7, 600, 'sine', 0.1);
    setTimeout(() => osc(ctx, vol * 0.7, 400, 'sine', 0.15), 100);
    setTimeout(() => osc(ctx, vol * 0.5, 300, 'sine', 0.2), 200);
  },
  join_room: (ctx, vol) => {
    osc(ctx, vol * 0.5, 500, 'sine', 0.08);
    setTimeout(() => osc(ctx, vol * 0.6, 700, 'sine', 0.1), 80);
  },
  leave_room: (ctx, vol) => {
    osc(ctx, vol * 0.5, 700, 'sine', 0.08);
    setTimeout(() => osc(ctx, vol * 0.4, 400, 'sine', 0.12), 80);
  },
  mention: (ctx, vol) => {
    osc(ctx, vol * 0.6, 900, 'sine', 0.06);
    setTimeout(() => osc(ctx, vol * 0.5, 1100, 'sine', 0.08), 60);
  },
  broadcast: (ctx, vol) => {
    osc(ctx, vol * 0.6, 440, 'sine', 0.1);
    setTimeout(() => osc(ctx, vol * 0.6, 554, 'sine', 0.1), 100);
    setTimeout(() => osc(ctx, vol * 0.7, 660, 'sine', 0.15), 200);
  },
  poll_vote: (ctx, vol) => {
    osc(ctx, vol * 0.5, 700, 'sine', 0.06, 1000);
  },
};

// Singleton
export const soundEngine = new SoundEngine();
export { TONE_LABELS, SOUND_CATEGORY_MAP, TONE_GENERATORS };
export const TONE_NAMES: ToneName[] = ['bold', 'chime', 'alert', 'melody', 'pulse', 'echo'];
export const CATEGORY_NAMES: SoundCategory[] = ['notification', 'chat', 'ui'];
export type { SoundName, SoundCategory, ToneName };
