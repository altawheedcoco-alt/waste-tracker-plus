/**
 * Web Audio API-based ambient sound generators.
 * These generate sounds client-side — no external files needed, 100% reliable.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

export interface GeneratedAudioNode {
  gainNode: GainNode;
  stop: () => void;
  setVolume: (v: number) => void;
}

// ─── Noise Generators ───

function createNoiseBuffer(ctx: AudioContext, type: 'white' | 'pink' | 'brown', seconds = 4): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * seconds;
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, lastOut = 0;

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;

      if (type === 'white') {
        data[i] = white * 0.5;
      } else if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      } else {
        // brown noise
        const out = (lastOut + (0.02 * white)) / 1.02;
        lastOut = out;
        data[i] = out * 3.5;
      }
    }
  }
  return buffer;
}

// ─── Rain Sound ───
export function createRain(): GeneratedAudioNode {
  const ctx = getAudioContext();
  const noiseBuffer = createNoiseBuffer(ctx, 'brown', 4);

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  filter.Q.value = 0.6;

  const highFilter = ctx.createBiquadFilter();
  highFilter.type = 'highshelf';
  highFilter.frequency.value = 4000;
  highFilter.gain.value = -8;

  const gain = ctx.createGain();
  gain.gain.value = 0.7;

  source.connect(filter);
  filter.connect(highFilter);
  highFilter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  // Add rain droplets
  const dropletsGain = ctx.createGain();
  dropletsGain.gain.value = 0.15;
  dropletsGain.connect(gain);

  const dropletInterval = setInterval(() => {
    if (ctx.state === 'closed') { clearInterval(dropletInterval); return; }
    const osc = ctx.createOscillator();
    const dGain = ctx.createGain();
    osc.frequency.value = 2000 + Math.random() * 4000;
    osc.type = 'sine';
    dGain.gain.setValueAtTime(0.03 * Math.random(), ctx.currentTime);
    dGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05 + Math.random() * 0.05);
    osc.connect(dGain);
    dGain.connect(dropletsGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, 30 + Math.random() * 50);

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => {
      clearInterval(dropletInterval);
      source.stop();
      source.disconnect();
      gain.disconnect();
    },
  };
}

// ─── Ocean Waves ───
export function createOcean(): GeneratedAudioNode {
  const ctx = getAudioContext();
  const noiseBuffer = createNoiseBuffer(ctx, 'pink', 4);

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 600;

  // LFO to modulate filter for wave effect
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.08; // slow wave rhythm
  lfo.type = 'sine';
  lfoGain.gain.value = 400;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  // Volume LFO
  const volLfo = ctx.createOscillator();
  const volLfoGain = ctx.createGain();
  volLfo.frequency.value = 0.08;
  volLfo.type = 'sine';
  volLfoGain.gain.value = 0.25;
  volLfo.connect(volLfoGain);

  const gain = ctx.createGain();
  gain.gain.value = 0.6;
  volLfoGain.connect(gain.gain);
  volLfo.start();

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => {
      source.stop(); lfo.stop(); volLfo.stop();
      source.disconnect(); gain.disconnect();
    },
  };
}

// ─── Wind ───
export function createWind(): GeneratedAudioNode {
  const ctx = getAudioContext();
  const noiseBuffer = createNoiseBuffer(ctx, 'white', 4);

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 400;
  filter.Q.value = 0.5;

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.15;
  lfo.type = 'sine';
  lfoGain.gain.value = 300;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  const gain = ctx.createGain();
  gain.gain.value = 0.4;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => { source.stop(); lfo.stop(); source.disconnect(); gain.disconnect(); },
  };
}

// ─── White Noise ───
export function createWhiteNoise(): GeneratedAudioNode {
  const ctx = getAudioContext();
  const noiseBuffer = createNoiseBuffer(ctx, 'white', 4);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0.3;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => { source.stop(); source.disconnect(); gain.disconnect(); },
  };
}

// ─── Pink Noise ───
export function createPinkNoise(): GeneratedAudioNode {
  const ctx = getAudioContext();
  const noiseBuffer = createNoiseBuffer(ctx, 'pink', 4);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0.4;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => { source.stop(); source.disconnect(); gain.disconnect(); },
  };
}

// ─── Brown Noise ───
export function createBrownNoise(): GeneratedAudioNode {
  const ctx = getAudioContext();
  const noiseBuffer = createNoiseBuffer(ctx, 'brown', 4);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0.5;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => { source.stop(); source.disconnect(); gain.disconnect(); },
  };
}

// ─── Binaural Beats ───
export function createBinauralBeats(baseFreq = 200, beatFreq = 10): GeneratedAudioNode {
  const ctx = getAudioContext();

  const oscL = ctx.createOscillator();
  const oscR = ctx.createOscillator();
  oscL.type = 'sine';
  oscR.type = 'sine';
  oscL.frequency.value = baseFreq;
  oscR.frequency.value = baseFreq + beatFreq;

  const merger = ctx.createChannelMerger(2);
  const gain = ctx.createGain();
  gain.gain.value = 0.3;

  oscL.connect(merger, 0, 0);
  oscR.connect(merger, 0, 1);
  merger.connect(gain);
  gain.connect(ctx.destination);

  oscL.start();
  oscR.start();

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => { oscL.stop(); oscR.stop(); oscL.disconnect(); oscR.disconnect(); gain.disconnect(); },
  };
}

// ─── Singing Bowl / Drone ───
export function createDrone(baseFreq = 136.1): GeneratedAudioNode {
  const ctx = getAudioContext();
  const gain = ctx.createGain();
  gain.gain.value = 0.25;

  const harmonics = [1, 2, 3, 4.01, 5.02];
  const oscs: OscillatorNode[] = [];

  harmonics.forEach((h, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = baseFreq * h;
    const hGain = ctx.createGain();
    hGain.gain.value = 0.15 / (i + 1);
    osc.connect(hGain);
    hGain.connect(gain);
    osc.start();
    oscs.push(osc);
  });

  gain.connect(ctx.destination);

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => { oscs.forEach(o => { o.stop(); o.disconnect(); }); gain.disconnect(); },
  };
}

// ─── Creek / Water Bubbles ───
export function createCreek(): GeneratedAudioNode {
  const ctx = getAudioContext();
  const noiseBuffer = createNoiseBuffer(ctx, 'pink', 4);

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2500;
  filter.Q.value = 2;

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.3;
  lfoGain.gain.value = 1500;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  const gain = ctx.createGain();
  gain.gain.value = 0.35;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  // Bubble sounds
  const bubbleInterval = setInterval(() => {
    if (ctx.state === 'closed') { clearInterval(bubbleInterval); return; }
    const osc = ctx.createOscillator();
    const bGain = ctx.createGain();
    osc.frequency.value = 600 + Math.random() * 2000;
    osc.type = 'sine';
    bGain.gain.setValueAtTime(0.02 * Math.random(), ctx.currentTime);
    bGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03 + Math.random() * 0.04);
    osc.connect(bGain);
    bGain.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }, 80 + Math.random() * 120);

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => { clearInterval(bubbleInterval); source.stop(); lfo.stop(); source.disconnect(); gain.disconnect(); },
  };
}

// ─── Campfire ───
export function createCampfire(): GeneratedAudioNode {
  const ctx = getAudioContext();
  const noiseBuffer = createNoiseBuffer(ctx, 'brown', 4);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.8;

  const gain = ctx.createGain();
  gain.gain.value = 0.5;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  // Crackle effect
  const crackleInterval = setInterval(() => {
    if (ctx.state === 'closed') { clearInterval(crackleInterval); return; }
    const osc = ctx.createOscillator();
    const cGain = ctx.createGain();
    osc.frequency.value = 3000 + Math.random() * 5000;
    osc.type = 'sawtooth';
    cGain.gain.setValueAtTime(0.04 * Math.random(), ctx.currentTime);
    cGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.01 + Math.random() * 0.02);
    osc.connect(cGain);
    cGain.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, 50 + Math.random() * 150);

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => { clearInterval(crackleInterval); source.stop(); source.disconnect(); gain.disconnect(); },
  };
}

// ─── Thunder Storm ───
export function createThunderStorm(): GeneratedAudioNode {
  const ctx = getAudioContext();
  const rain = createRain();

  // Periodic thunder rumble
  const thunderInterval = setInterval(() => {
    if (ctx.state === 'closed') { clearInterval(thunderInterval); return; }
    const noiseBuffer = createNoiseBuffer(ctx, 'brown', 2);
    const s = ctx.createBufferSource();
    s.buffer = noiseBuffer;

    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 150;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.3);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);

    s.connect(f);
    f.connect(g);
    g.connect(rain.gainNode);
    s.start();
    s.stop(ctx.currentTime + 2.5);
  }, 8000 + Math.random() * 15000);

  return {
    gainNode: rain.gainNode,
    setVolume: (v: number) => rain.setVolume(v),
    stop: () => { clearInterval(thunderInterval); rain.stop(); },
  };
}

// ─── Night Ambient (crickets) ───
export function createNightAmbient(): GeneratedAudioNode {
  const ctx = getAudioContext();
  const noiseBuffer = createNoiseBuffer(ctx, 'brown', 4);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;

  const gain = ctx.createGain();
  gain.gain.value = 0.3;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  // Cricket chirps
  const cricketInterval = setInterval(() => {
    if (ctx.state === 'closed') { clearInterval(cricketInterval); return; }
    const chirpCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < chirpCount; i++) {
      setTimeout(() => {
        if (ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const cGain = ctx.createGain();
        osc.frequency.value = 4000 + Math.random() * 2000;
        osc.type = 'sine';
        cGain.gain.setValueAtTime(0.02, ctx.currentTime);
        cGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(cGain);
        cGain.connect(gain);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      }, i * 60);
    }
  }, 400 + Math.random() * 800);

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => { clearInterval(cricketInterval); source.stop(); source.disconnect(); gain.disconnect(); },
  };
}

// ─── Forest Birds ───
export function createForestBirds(): GeneratedAudioNode {
  const ctx = getAudioContext();
  const noiseBuffer = createNoiseBuffer(ctx, 'pink', 4);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 300;

  const gain = ctx.createGain();
  gain.gain.value = 0.2;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  // Bird-like chirps
  const birdInterval = setInterval(() => {
    if (ctx.state === 'closed') { clearInterval(birdInterval); return; }
    const noteCount = 2 + Math.floor(Math.random() * 5);
    const baseFreq = 1500 + Math.random() * 3000;
    for (let i = 0; i < noteCount; i++) {
      setTimeout(() => {
        if (ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const bGain = ctx.createGain();
        osc.frequency.value = baseFreq + (Math.random() - 0.5) * 800;
        osc.type = 'sine';
        const dur = 0.05 + Math.random() * 0.1;
        bGain.gain.setValueAtTime(0.04, ctx.currentTime);
        bGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.connect(bGain);
        bGain.connect(gain);
        osc.start();
        osc.stop(ctx.currentTime + dur + 0.01);
      }, i * (80 + Math.random() * 120));
    }
  }, 1500 + Math.random() * 4000);

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => { clearInterval(birdInterval); source.stop(); source.disconnect(); gain.disconnect(); },
  };
}

// ─── Singing Bowls ───
export function createSingingBowls(): GeneratedAudioNode {
  const ctx = getAudioContext();
  const gain = ctx.createGain();
  gain.gain.value = 0.25;
  gain.connect(ctx.destination);

  const bowlFreqs = [261.63, 329.63, 392.00, 523.25];
  const oscs: OscillatorNode[] = [];

  bowlFreqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const bGain = ctx.createGain();
    bGain.gain.value = 0.06;

    // Slight vibrato
    const vib = ctx.createOscillator();
    const vibGain = ctx.createGain();
    vib.frequency.value = 4 + Math.random() * 2;
    vibGain.gain.value = 2;
    vib.connect(vibGain);
    vibGain.connect(osc.frequency);
    vib.start();

    osc.connect(bGain);
    bGain.connect(gain);
    osc.start();
    oscs.push(osc, vib);
  });

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => { oscs.forEach(o => { o.stop(); o.disconnect(); }); gain.disconnect(); },
  };
}

// ─── Gentle Pad (ethereal synth pad) ───
export function createPad(): GeneratedAudioNode {
  const ctx = getAudioContext();
  const gain = ctx.createGain();
  gain.gain.value = 0.2;

  const reverb = ctx.createConvolver();
  // Simple reverb impulse
  const reverbLength = ctx.sampleRate * 2;
  const impulse = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch);
    for (let i = 0; i < reverbLength; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 2);
    }
  }
  reverb.buffer = impulse;

  const chordFreqs = [220, 277.18, 329.63, 440];
  const oscs: OscillatorNode[] = [];

  chordFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = i % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    const oGain = ctx.createGain();
    oGain.gain.value = 0.05;
    osc.connect(oGain);
    oGain.connect(reverb);
    osc.start();
    oscs.push(osc);
  });

  reverb.connect(gain);
  gain.connect(ctx.destination);

  return {
    gainNode: gain,
    setVolume: (v: number) => { gain.gain.value = v; },
    stop: () => { oscs.forEach(o => { o.stop(); o.disconnect(); }); gain.disconnect(); reverb.disconnect(); },
  };
}

// Export all generators
export const audioGenerators: Record<string, () => GeneratedAudioNode> = {
  rain: createRain,
  ocean: createOcean,
  wind: createWind,
  creek: createCreek,
  campfire: createCampfire,
  thunder_storm: createThunderStorm,
  night_ambient: createNightAmbient,
  forest_birds: createForestBirds,
  white_noise: createWhiteNoise,
  pink_noise: createPinkNoise,
  brown_noise: createBrownNoise,
  binaural_alpha: () => createBinauralBeats(200, 10),
  binaural_theta: () => createBinauralBeats(200, 6),
  binaural_delta: () => createBinauralBeats(200, 2),
  binaural_beta: () => createBinauralBeats(200, 20),
  binaural_gamma: () => createBinauralBeats(200, 40),
  drone_om: () => createDrone(136.1),
  drone_earth: () => createDrone(128),
  drone_cosmic: () => createDrone(172),
  singing_bowls: createSingingBowls,
  pad: createPad,
};

export function closeAudioContext() {
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
    audioContext = null;
  }
}
