/**
 * مكتبة الموسيقى المدمجة — مقاطع صوتية مولّدة بـ Web Audio API
 * مجانية بالكامل، بدون API أو ملفات خارجية
 */

export interface MusicTrack {
  id: string;
  name: string;
  nameAr: string;
  category: MusicCategory;
  mood: string;
  moodAr: string;
  duration: number; // seconds
  bpm: number;
  color: string; // gradient accent
}

export type MusicCategory = 'ambient' | 'upbeat' | 'cinematic' | 'chill' | 'arabic' | 'nature';

export const MUSIC_CATEGORIES: { id: MusicCategory; label: string; labelAr: string; emoji: string }[] = [
  { id: 'ambient', label: 'Ambient', labelAr: 'هادئة', emoji: '🌙' },
  { id: 'upbeat', label: 'Upbeat', labelAr: 'حماسية', emoji: '🔥' },
  { id: 'cinematic', label: 'Cinematic', labelAr: 'سينمائية', emoji: '🎬' },
  { id: 'chill', label: 'Chill', labelAr: 'مريحة', emoji: '☕' },
  { id: 'arabic', label: 'Arabic', labelAr: 'عربية', emoji: '🎵' },
  { id: 'nature', label: 'Nature', labelAr: 'طبيعة', emoji: '🌿' },
];

export const MUSIC_TRACKS: MusicTrack[] = [
  // Ambient
  { id: 'ambient-1', name: 'Starlight', nameAr: 'ضوء النجوم', category: 'ambient', mood: 'Dreamy', moodAr: 'حالم', duration: 30, bpm: 60, color: 'from-indigo-500 to-purple-600' },
  { id: 'ambient-2', name: 'Ocean Breeze', nameAr: 'نسيم المحيط', category: 'ambient', mood: 'Peaceful', moodAr: 'هادئ', duration: 30, bpm: 50, color: 'from-cyan-500 to-blue-600' },
  { id: 'ambient-3', name: 'Floating', nameAr: 'طفو', category: 'ambient', mood: 'Ethereal', moodAr: 'أثيري', duration: 30, bpm: 55, color: 'from-violet-400 to-indigo-500' },
  // Upbeat
  { id: 'upbeat-1', name: 'Energy Rush', nameAr: 'اندفاع الطاقة', category: 'upbeat', mood: 'Energetic', moodAr: 'نشيط', duration: 30, bpm: 128, color: 'from-orange-500 to-red-600' },
  { id: 'upbeat-2', name: 'Victory March', nameAr: 'مسيرة النصر', category: 'upbeat', mood: 'Triumphant', moodAr: 'منتصر', duration: 30, bpm: 140, color: 'from-yellow-500 to-orange-600' },
  { id: 'upbeat-3', name: 'Happy Days', nameAr: 'أيام سعيدة', category: 'upbeat', mood: 'Joyful', moodAr: 'مبهج', duration: 30, bpm: 120, color: 'from-pink-500 to-rose-600' },
  // Cinematic
  { id: 'cinematic-1', name: 'Epic Rise', nameAr: 'صعود ملحمي', category: 'cinematic', mood: 'Grand', moodAr: 'عظيم', duration: 30, bpm: 90, color: 'from-amber-600 to-yellow-700' },
  { id: 'cinematic-2', name: 'Dark Mystery', nameAr: 'لغز مظلم', category: 'cinematic', mood: 'Mysterious', moodAr: 'غامض', duration: 30, bpm: 70, color: 'from-gray-700 to-gray-900' },
  { id: 'cinematic-3', name: 'Sunrise', nameAr: 'شروق', category: 'cinematic', mood: 'Hopeful', moodAr: 'أمل', duration: 30, bpm: 80, color: 'from-orange-400 to-pink-500' },
  // Chill
  { id: 'chill-1', name: 'Lo-Fi Beats', nameAr: 'لو-فاي', category: 'chill', mood: 'Relaxed', moodAr: 'مسترخي', duration: 30, bpm: 85, color: 'from-teal-500 to-emerald-600' },
  { id: 'chill-2', name: 'Coffee Shop', nameAr: 'مقهى', category: 'chill', mood: 'Cozy', moodAr: 'دافئ', duration: 30, bpm: 90, color: 'from-amber-500 to-brown-600' },
  { id: 'chill-3', name: 'Sunset Drive', nameAr: 'قيادة الغروب', category: 'chill', mood: 'Smooth', moodAr: 'ناعم', duration: 30, bpm: 95, color: 'from-purple-500 to-pink-500' },
  // Arabic
  { id: 'arabic-1', name: 'Desert Wind', nameAr: 'رياح الصحراء', category: 'arabic', mood: 'Oriental', moodAr: 'شرقي', duration: 30, bpm: 100, color: 'from-yellow-600 to-amber-700' },
  { id: 'arabic-2', name: 'Oasis', nameAr: 'واحة', category: 'arabic', mood: 'Mystical', moodAr: 'صوفي', duration: 30, bpm: 80, color: 'from-emerald-600 to-teal-700' },
  { id: 'arabic-3', name: 'Bazaar', nameAr: 'البازار', category: 'arabic', mood: 'Festive', moodAr: 'احتفالي', duration: 30, bpm: 115, color: 'from-red-600 to-orange-600' },
  // Nature
  { id: 'nature-1', name: 'Rain Forest', nameAr: 'غابة مطيرة', category: 'nature', mood: 'Natural', moodAr: 'طبيعي', duration: 30, bpm: 0, color: 'from-green-600 to-emerald-700' },
  { id: 'nature-2', name: 'Waterfall', nameAr: 'شلال', category: 'nature', mood: 'Flowing', moodAr: 'متدفق', duration: 30, bpm: 0, color: 'from-blue-500 to-cyan-600' },
  { id: 'nature-3', name: 'Birds Dawn', nameAr: 'طيور الفجر', category: 'nature', mood: 'Fresh', moodAr: 'منعش', duration: 30, bpm: 0, color: 'from-lime-500 to-green-600' },
];

// ---- Web Audio API Synthesizer ----

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) audioContext = new AudioContext();
  return audioContext;
}

/**
 * Generate a music track using Web Audio API oscillators
 */
export function synthesizeTrack(track: MusicTrack): { play: () => void; stop: () => void; node: AudioBufferSourceNode | null } {
  const ctx = getAudioContext();
  const duration = track.duration;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Generate based on category
  switch (track.category) {
    case 'ambient':
      generateAmbient(left, right, sampleRate, duration, track.bpm);
      break;
    case 'upbeat':
      generateUpbeat(left, right, sampleRate, duration, track.bpm);
      break;
    case 'cinematic':
      generateCinematic(left, right, sampleRate, duration, track.bpm);
      break;
    case 'chill':
      generateChill(left, right, sampleRate, duration, track.bpm);
      break;
    case 'arabic':
      generateArabic(left, right, sampleRate, duration, track.bpm);
      break;
    case 'nature':
      generateNature(left, right, sampleRate, duration);
      break;
  }

  let source: AudioBufferSourceNode | null = null;
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.4;
  gainNode.connect(ctx.destination);

  return {
    node: null,
    play() {
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNode);
      source.start();
      this.node = source;
    },
    stop() {
      try { source?.stop(); } catch {}
      source = null;
      this.node = null;
    },
  };
}

// --- Generators ---

function generateAmbient(L: Float32Array, R: Float32Array, sr: number, dur: number, bpm: number) {
  const freqs = [220, 277.18, 329.63, 440];
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    let val = 0;
    freqs.forEach((f, idx) => {
      const lfo = 0.3 + 0.7 * Math.sin(2 * Math.PI * (0.1 + idx * 0.05) * t);
      val += Math.sin(2 * Math.PI * f * t) * lfo * 0.15;
    });
    // Soft pad with reverb-like delay
    const env = Math.min(t * 2, 1) * Math.min((dur - t) * 2, 1);
    L[i] = val * env;
    R[i] = val * env * 0.95 + Math.sin(2 * Math.PI * 165 * t) * 0.05 * env;
  }
}

function generateUpbeat(L: Float32Array, R: Float32Array, sr: number, dur: number, bpm: number) {
  const beatLen = 60 / bpm;
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const beatPos = (t % beatLen) / beatLen;
    // Kick
    const kick = beatPos < 0.1 ? Math.sin(2 * Math.PI * (150 - 100 * beatPos) * t) * (1 - beatPos * 10) : 0;
    // Hi-hat
    const hihatPos = ((t + beatLen / 2) % beatLen) / beatLen;
    const hihat = hihatPos < 0.05 ? (Math.random() * 2 - 1) * (1 - hihatPos * 20) * 0.3 : 0;
    // Bass
    const bass = Math.sin(2 * Math.PI * 55 * t) * 0.2 * (beatPos < 0.3 ? 1 : 0.3);
    // Lead
    const notes = [261.63, 329.63, 392, 440];
    const noteIdx = Math.floor(t / (beatLen * 2)) % notes.length;
    const lead = Math.sin(2 * Math.PI * notes[noteIdx] * t) * 0.1;

    const env = Math.min(t * 4, 1) * Math.min((dur - t) * 4, 1);
    L[i] = (kick * 0.5 + hihat + bass + lead) * env;
    R[i] = (kick * 0.5 + hihat * 0.8 + bass + lead * 0.9) * env;
  }
}

function generateCinematic(L: Float32Array, R: Float32Array, sr: number, dur: number, bpm: number) {
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const progress = t / dur;
    // Building strings
    const freq = 110 + progress * 110;
    const strings = (Math.sin(2 * Math.PI * freq * t) + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.5) * 0.15;
    // Sub bass
    const sub = Math.sin(2 * Math.PI * 55 * t) * 0.1 * (0.5 + progress * 0.5);
    // Rising pad
    const pad = Math.sin(2 * Math.PI * (220 + progress * 220) * t) * 0.08 * progress;
    // Impact at climax
    const impactT = Math.abs(progress - 0.7);
    const impact = impactT < 0.02 ? Math.sin(2 * Math.PI * 40 * t) * (1 - impactT * 50) * 0.4 : 0;

    const env = Math.min(t * 2, 1) * Math.min((dur - t) * 3, 1);
    L[i] = (strings + sub + pad + impact) * env;
    R[i] = (strings * 0.95 + sub + pad * 1.05 + impact) * env;
  }
}

function generateChill(L: Float32Array, R: Float32Array, sr: number, dur: number, bpm: number) {
  const beatLen = 60 / bpm;
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    // Lo-fi piano chords
    const chords = [
      [261.63, 329.63, 392],
      [220, 277.18, 329.63],
      [246.94, 311.13, 369.99],
      [196, 246.94, 293.66],
    ];
    const chordIdx = Math.floor(t / (beatLen * 4)) % chords.length;
    let chord = 0;
    chords[chordIdx].forEach(f => {
      chord += Math.sin(2 * Math.PI * f * t) * 0.08;
    });
    // Vinyl crackle
    const crackle = (Math.random() * 2 - 1) * 0.01;
    // Soft kick
    const beatPos = (t % (beatLen * 2)) / (beatLen * 2);
    const kick = beatPos < 0.08 ? Math.sin(2 * Math.PI * 80 * t) * (1 - beatPos * 12) * 0.2 : 0;

    const env = Math.min(t * 3, 1) * Math.min((dur - t) * 3, 1);
    L[i] = (chord + crackle + kick) * env;
    R[i] = (chord * 0.95 + crackle + kick) * env;
  }
}

function generateArabic(L: Float32Array, R: Float32Array, sr: number, dur: number, bpm: number) {
  const beatLen = 60 / bpm;
  // Arabic maqam (Hijaz scale)
  const scale = [220, 233.08, 277.18, 293.66, 329.63, 349.23, 415.3, 440];
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const noteIdx = Math.floor(t / (beatLen * 2)) % scale.length;
    const freq = scale[noteIdx];
    // Oud-like
    const oud = Math.sin(2 * Math.PI * freq * t) * 0.12 * Math.exp(-((t % (beatLen * 2)) * 3));
    const oud2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.06 * Math.exp(-((t % (beatLen * 2)) * 4));
    // Darbuka pattern
    const beatPos = (t % beatLen) / beatLen;
    const dum = beatPos < 0.08 ? Math.sin(2 * Math.PI * 100 * t) * (1 - beatPos * 12) * 0.25 : 0;
    const tek = (((t + beatLen * 0.5) % beatLen) / beatLen) < 0.05 ? (Math.random() * 2 - 1) * 0.15 : 0;

    const env = Math.min(t * 2, 1) * Math.min((dur - t) * 2, 1);
    L[i] = (oud + oud2 + dum + tek) * env;
    R[i] = (oud * 0.9 + oud2 * 1.1 + dum + tek * 0.8) * env;
  }
}

function generateNature(L: Float32Array, R: Float32Array, sr: number, dur: number) {
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    // Rain/water
    const rain = (Math.random() * 2 - 1) * 0.06;
    // Wind (filtered noise)
    const windFreq = 0.2 + 0.1 * Math.sin(2 * Math.PI * 0.05 * t);
    const wind = (Math.random() * 2 - 1) * 0.04 * (0.5 + 0.5 * Math.sin(2 * Math.PI * windFreq * t));
    // Birds (occasional chirps)
    const birdT = t % 3;
    const bird = birdT < 0.15 ? Math.sin(2 * Math.PI * (2000 + 1000 * Math.sin(2 * Math.PI * 20 * birdT)) * t) * 0.03 * (1 - birdT / 0.15) : 0;

    const env = Math.min(t * 2, 1) * Math.min((dur - t) * 2, 1);
    L[i] = (rain + wind + bird) * env;
    R[i] = (rain * 0.9 + wind * 1.1 + bird * 0.7) * env;
  }
}

// --- Preview player singleton ---
let currentPreview: ReturnType<typeof synthesizeTrack> | null = null;

export function previewTrack(track: MusicTrack) {
  stopPreview();
  currentPreview = synthesizeTrack(track);
  currentPreview.play();
}

export function stopPreview() {
  currentPreview?.stop();
  currentPreview = null;
}

export function isPreviewPlaying(): boolean {
  return currentPreview !== null;
}
