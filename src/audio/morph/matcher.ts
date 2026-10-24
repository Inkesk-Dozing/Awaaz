/**
 * Voice Twin Matcher: 5-10s Sample Profiling to DSP Recipe.
 * Extracts acoustic feature deltas and synthesizes nearest-match MaskPresets.
 */

import { MaskPreset } from './masks';
import { yinPitch } from '../dsp/yin';
import { spectralTilt } from '../dsp/bands';

export interface AcousticSampleProfile {
  medianPitch: number;      // Hz
  pitchMin: number;         // Hz
  pitchMax: number;         // Hz
  formantShiftEstimate: number; // Multiplier e.g. 1.15
  spectralTilt: number;     // Energy ratio (low vs high bandpass)
  voicingCoverage: number;  // Ratio of voiced frames 0.0 - 1.0
}

export interface TwinRecipe {
  recipeName: string;
  preset: MaskPreset;
  matchConfidence: number;  // 0.0 - 1.0
  serializedCode: string;   // Base64 compact sharing string
}

/**
 * Profiles a raw AudioBuffer (Float32Array samples) into an AcousticSampleProfile.
 */
export function profileAcousticBuffer(
  channelData: Float32Array,
  sampleRate: number = 48000
): AcousticSampleProfile {
  const frameSize = 2048;
  const hopSize = 1024;
  const totalFrames = Math.floor((channelData.length - frameSize) / hopSize);

  if (totalFrames <= 0) {
    return {
      medianPitch: 180,
      pitchMin: 120,
      pitchMax: 240,
      formantShiftEstimate: 1.0,
      spectralTilt: 1.0,
      voicingCoverage: 0
    };
  }

  const pitchSamples: number[] = [];
  let voicedCount = 0;
  let tiltSum = 0;
  let tiltFrames = 0;

  for (let f = 0; f < totalFrames; f++) {
    const start = f * hopSize;
    const slice = channelData.subarray(start, start + frameSize);

    const yin = yinPitch(slice, sampleRate);
    if (yin.pitch > 50 && yin.confidence > 0.6) {
      pitchSamples.push(yin.pitch);
      voicedCount++;
      // Real frequency-band tilt (RBJ bandpass low ≈400 Hz vs high ≈3500 Hz).
      tiltSum += spectralTilt(slice, sampleRate);
      tiltFrames++;
    }
  }

  pitchSamples.sort((a, b) => a - b);
  const medianPitch = pitchSamples.length > 0
    ? pitchSamples[Math.floor(pitchSamples.length / 2)]
    : 180;
  const pitchMin = pitchSamples.length > 0 ? pitchSamples[0] : 120;
  const pitchMax = pitchSamples.length > 0 ? pitchSamples[pitchSamples.length - 1] : 240;

  const tilt = tiltFrames > 0
    ? Math.min(10, Math.max(0.1, tiltSum / tiltFrames))
    : 1.0;
  const voicingCoverage = voicedCount / totalFrames;

  // Estimate vocal tract scaling from fundamental pitch proxy
  const formantShiftEstimate = Math.max(0.85, Math.min(1.25, Math.pow(medianPitch / 160, 0.25)));

  return {
    medianPitch,
    pitchMin,
    pitchMax,
    formantShiftEstimate,
    spectralTilt: tilt,
    voicingCoverage
  };
}

/**
 * Synthesizes a MaskPreset DSP recipe matching user mic profile to target sample.
 */
export function generateTwinRecipe(
  userProfile: AcousticSampleProfile,
  targetProfile: AcousticSampleProfile,
  recipeName: string = 'Custom Twin'
): TwinRecipe {
  // 1. Calculate pitch semitone difference
  const pitchRatio = targetProfile.medianPitch / Math.max(50, userProfile.medianPitch);
  const rawShift = 12 * Math.log2(pitchRatio);
  const clampedPitchShift = Math.max(-6, Math.min(6, Math.round(rawShift * 10) / 10));

  // 2. Calculate formant anchors scaled by target formant shift
  const fRatio = targetProfile.formantShiftEstimate / Math.max(0.5, userProfile.formantShiftEstimate);
  const baseF1 = 550 * fRatio;
  const baseF2 = 1600 * fRatio;
  const baseF3 = 2700 * fRatio;

  // 3. Configure lowpass filter based on spectral tilt
  const lowPassFreq = targetProfile.spectralTilt > 2.0 ? 6000 : 8500;

  const preset: MaskPreset = {
    id: `twin_${Date.now()}`,
    name: recipeName,
    category: 'archetype',
    pitchShift: clampedPitchShift,
    f1: { freq: Math.round(baseF1), gain: 4.0, q: 4.5 },
    f2: { freq: Math.round(baseF2), gain: 4.0, q: 4.5 },
    f3: { freq: Math.round(baseF3), gain: 3.0, q: 4.0 },
    lowPassFreq,
    fxType: 'none'
  };

  // 4. Honest confidence rating: penalize if shift had to be heavily clamped
  const shiftPenalty = Math.abs(rawShift - clampedPitchShift) * 0.08;
  const coverageBonus = targetProfile.voicingCoverage * 0.2;
  const matchConfidence = Math.max(0.4, Math.min(0.95, 0.85 - shiftPenalty + coverageBonus));

  // 5. Serialize into base64 sharing code
  const serializedCode = btoa(JSON.stringify({
    p: preset.pitchShift,
    f1: preset.f1.freq,
    f2: preset.f2.freq,
    f3: preset.f3.freq,
    lp: preset.lowPassFreq
  }));

  return {
    recipeName,
    preset,
    matchConfidence: Math.round(matchConfidence * 100) / 100,
    serializedCode
  };
}

/**
 * Deserializes a base64 string back into a functional MaskPreset.
 */
export function deserializePresetCode(code: string, name: string = 'Imported Twin'): MaskPreset | null {
  try {
    const raw = JSON.parse(atob(code));
    return {
      id: `imported_${Date.now()}`,
      name,
      category: 'archetype',
      pitchShift: Math.max(-6, Math.min(6, raw.p || 0)),
      f1: { freq: raw.f1 || 600, gain: 4.0, q: 4.5 },
      f2: { freq: raw.f2 || 1600, gain: 4.0, q: 4.5 },
      f3: { freq: raw.f3 || 2700, gain: 3.0, q: 4.0 },
      lowPassFreq: raw.lp || 7500,
      fxType: 'none'
    };
  } catch {
    return null;
  }
}
