/**
 * Sound Engine — محرك الأصوات المركزي
 * يستخدم Web Audio API لتوليد أصوات UI قصيرة بدون ملفات خارجية
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
  | 'popup_close'; // إغلاق نافذة

const STORAGE_KEY = 'app_sound_enabled';
const VOLUME_KEY = 'app_sound_volume';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private _enabled: boolean;
  private _volume: number;

  constructor() {
    this._enabled = localStorage.getItem(STORAGE_KEY) !== 'false'; // default on
    this._volume = parseFloat(localStorage.getItem(VOLUME_KEY) || '0.4');
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

  play(name: SoundName) {
    if (!this._enabled) return;
    try {
      const fn = SOUNDS[name];
      if (fn) fn(this.getCtx(), this._volume);
    } catch {
      // silently fail — never block UI for sound
    }
  }
}

// ──────────── Sound Generators ────────────

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
  g.gain.value = vol * 0.3;
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
  g.gain.value = vol * 0.2;
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 4000;
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start();
  src.stop(ctx.currentTime + duration);
}

const SOUNDS: Record<SoundName, (ctx: AudioContext, vol: number) => void> = {
  // ── أزرار وتنقل ──
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

  // ── نجاح/فشل/تحذير ──
  success: (ctx, vol) => {
    osc(ctx, vol, 523, 'sine', 0.12); // C5
    setTimeout(() => osc(ctx, vol, 659, 'sine', 0.12), 100); // E5
    setTimeout(() => osc(ctx, vol, 784, 'sine', 0.18), 200); // G5
  },
  error: (ctx, vol) => {
    osc(ctx, vol, 300, 'square', 0.15);
    setTimeout(() => osc(ctx, vol, 250, 'square', 0.2), 120);
  },
  warning: (ctx, vol) => {
    osc(ctx, vol, 440, 'triangle', 0.15);
    setTimeout(() => osc(ctx, vol, 440, 'triangle', 0.15), 180);
  },

  // ── إشعارات ──
  notification: (ctx, vol) => {
    osc(ctx, vol, 880, 'sine', 0.1);
    setTimeout(() => osc(ctx, vol, 1100, 'sine', 0.15), 80);
    setTimeout(() => osc(ctx, vol, 1320, 'sine', 0.12), 180);
  },

  // ── رسائل ──
  message_sent: (ctx, vol) => {
    osc(ctx, vol * 0.7, 600, 'sine', 0.08, 900);
  },
  message_received: (ctx, vol) => {
    osc(ctx, vol, 700, 'sine', 0.1);
    setTimeout(() => osc(ctx, vol, 900, 'sine', 0.12), 90);
  },

  // ── حذف ──
  delete: (ctx, vol) => {
    osc(ctx, vol, 500, 'sine', 0.12, 200);
    noise(ctx, vol * 0.5, 0.1);
  },

  // ── تحديث ──
  refresh: (ctx, vol) => {
    osc(ctx, vol * 0.5, 300, 'sine', 0.2, 800);
  },

  // ── تسجيل دخول/خروج ──
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

  // ── رفع/تحميل ──
  upload: (ctx, vol) => {
    osc(ctx, vol * 0.6, 400, 'sine', 0.15, 800);
  },
  download: (ctx, vol) => {
    osc(ctx, vol * 0.6, 800, 'sine', 0.15, 400);
  },

  // ── مسح QR ──
  scan: (ctx, vol) => {
    osc(ctx, vol, 1200, 'sine', 0.05);
    setTimeout(() => osc(ctx, vol, 1500, 'sine', 0.08), 60);
  },

  // ── نوافذ ──
  popup_open: (ctx, vol) => {
    osc(ctx, vol * 0.5, 500, 'sine', 0.1, 700);
  },
  popup_close: (ctx, vol) => {
    osc(ctx, vol * 0.5, 700, 'sine', 0.08, 400);
  },
};

// Singleton
export const soundEngine = new SoundEngine();
export type { SoundName };
