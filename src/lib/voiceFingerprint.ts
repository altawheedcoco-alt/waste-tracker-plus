/**
 * Voice Fingerprint — بصمة صوتية بسيطة لتعرّف المستخدم
 * تعتمد على خصائص الصوت (pitch, energy, tempo) لبناء "بروفايل" صوتي
 */

interface VoiceProfile {
  id: string;
  name: string;
  features: VoiceFeatures;
  samples: number;
  createdAt: number;
  lastUsed: number;
}

interface VoiceFeatures {
  avgPitch: number;
  avgEnergy: number;
  speakingRate: number; // words per second estimate
  pitchVariance: number;
}

const STORAGE_KEY = 'voice_fingerprints';
const SIMILARITY_THRESHOLD = 0.72;

function getProfiles(): VoiceProfile[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveProfiles(profiles: VoiceProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

/**
 * Extract voice features from audio data using Web Audio API
 */
export async function extractVoiceFeatures(audioStream: MediaStream, durationMs = 3000): Promise<VoiceFeatures> {
  return new Promise((resolve) => {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(audioStream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    const pitches: number[] = [];
    const energies: number[] = [];
    let sampleCount = 0;

    const interval = setInterval(() => {
      analyser.getFloatTimeDomainData(dataArray);
      
      // Estimate pitch using autocorrelation
      const pitch = estimatePitch(dataArray, audioCtx.sampleRate);
      if (pitch > 50 && pitch < 500) pitches.push(pitch);
      
      // Calculate energy (RMS)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      energies.push(Math.sqrt(sum / bufferLength));
      sampleCount++;
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      source.disconnect();
      audioCtx.close();

      const avgPitch = pitches.length > 0 ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 150;
      const avgEnergy = energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : 0.1;
      const pitchVariance = pitches.length > 1
        ? pitches.reduce((acc, p) => acc + Math.pow(p - avgPitch, 2), 0) / pitches.length
        : 0;

      resolve({
        avgPitch: Math.round(avgPitch * 100) / 100,
        avgEnergy: Math.round(avgEnergy * 10000) / 10000,
        speakingRate: Math.round((sampleCount / (durationMs / 1000)) * 100) / 100,
        pitchVariance: Math.round(pitchVariance * 100) / 100,
      });
    }, durationMs);
  });
}

function estimatePitch(buffer: Float32Array, sampleRate: number): number {
  // Simple autocorrelation pitch detection
  const size = buffer.length;
  let maxCorr = 0;
  let bestLag = 0;
  
  for (let lag = Math.floor(sampleRate / 500); lag < Math.floor(sampleRate / 50); lag++) {
    let corr = 0;
    for (let i = 0; i < size - lag; i++) {
      corr += buffer[i] * buffer[i + lag];
    }
    if (corr > maxCorr) {
      maxCorr = corr;
      bestLag = lag;
    }
  }
  
  return bestLag > 0 ? sampleRate / bestLag : 0;
}

/**
 * Calculate similarity between two voice profiles (0-1)
 */
function calculateSimilarity(a: VoiceFeatures, b: VoiceFeatures): number {
  const pitchSim = 1 - Math.min(Math.abs(a.avgPitch - b.avgPitch) / 200, 1);
  const energySim = 1 - Math.min(Math.abs(a.avgEnergy - b.avgEnergy) / 0.5, 1);
  const rateSim = 1 - Math.min(Math.abs(a.speakingRate - b.speakingRate) / 5, 1);
  const varSim = 1 - Math.min(Math.abs(a.pitchVariance - b.pitchVariance) / 1000, 1);

  return pitchSim * 0.35 + energySim * 0.25 + rateSim * 0.2 + varSim * 0.2;
}

/**
 * Enroll a new voice profile
 */
export function enrollVoice(name: string, features: VoiceFeatures): VoiceProfile {
  const profiles = getProfiles();
  const profile: VoiceProfile = {
    id: `vp_${Date.now()}`,
    name,
    features,
    samples: 1,
    createdAt: Date.now(),
    lastUsed: Date.now(),
  };
  profiles.push(profile);
  saveProfiles(profiles);
  return profile;
}

/**
 * Identify speaker from voice features
 */
export function identifySpeaker(features: VoiceFeatures): { profile: VoiceProfile | null; confidence: number } {
  const profiles = getProfiles();
  let bestMatch: VoiceProfile | null = null;
  let bestScore = 0;

  for (const profile of profiles) {
    const sim = calculateSimilarity(features, profile.features);
    if (sim > bestScore) {
      bestScore = sim;
      bestMatch = profile;
    }
  }

  if (bestMatch && bestScore >= SIMILARITY_THRESHOLD) {
    // Update last used
    bestMatch.lastUsed = Date.now();
    bestMatch.samples++;
    // Running average of features
    bestMatch.features.avgPitch = (bestMatch.features.avgPitch * (bestMatch.samples - 1) + features.avgPitch) / bestMatch.samples;
    bestMatch.features.avgEnergy = (bestMatch.features.avgEnergy * (bestMatch.samples - 1) + features.avgEnergy) / bestMatch.samples;
    saveProfiles(getProfiles().map(p => p.id === bestMatch!.id ? bestMatch! : p));
    
    return { profile: bestMatch, confidence: bestScore };
  }

  return { profile: null, confidence: bestScore };
}

/**
 * Delete a voice profile
 */
export function deleteVoiceProfile(id: string) {
  saveProfiles(getProfiles().filter(p => p.id !== id));
}

/**
 * Get all enrolled profiles
 */
export function getVoiceProfiles(): VoiceProfile[] {
  return getProfiles();
}

/**
 * Verify voice for sensitive operations
 */
export function verifySpeaker(features: VoiceFeatures, profileId: string): { verified: boolean; confidence: number } {
  const profiles = getProfiles();
  const target = profiles.find(p => p.id === profileId);
  if (!target) return { verified: false, confidence: 0 };

  const sim = calculateSimilarity(features, target.features);
  return { verified: sim >= SIMILARITY_THRESHOLD, confidence: sim };
}
