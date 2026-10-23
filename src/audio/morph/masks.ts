/**
 * Voice Mask Preset Definitions.
 * Configures pitch shifts, 3-peaking formant anchors (F1, F2, F3),
 * low-pass ceilings, and creative FX parameters.
 */

export interface FormantBand {
  freq: number;  // Center frequency in Hz
  gain: number;  // Gain in dB
  q: number;     // Quality factor Q
}

export interface MaskPreset {
  id: string;
  name: string;
  category: 'gender' | 'creature' | 'hardware' | 'archetype';
  pitchShift: number; // Semitones (-6 to +6)
  f1: FormantBand;
  f2: FormantBand;
  f3: FormantBand;
  lowPassFreq: number; // Cutoff in Hz
  fxType?: 'none' | 'robot' | 'radio';
  fxParams?: {
    carrierFreq?: number; // Hz for ring modulation
    bitDepth?: number;    // Bits for bitcrushing
    bandpassLow?: number; // Hz
    bandpassHigh?: number;// Hz
  };
}

export const MASK_PRESETS: Record<string, MaskPreset> = {
  natural: {
    id: 'natural',
    name: 'Natural Voice',
    category: 'gender',
    pitchShift: 0,
    f1: { freq: 600, gain: 0, q: 4 },
    f2: { freq: 1600, gain: 0, q: 4 },
    f3: { freq: 2700, gain: 0, q: 4 },
    lowPassFreq: 12000,
    fxType: 'none'
  },
  female_morph: {
    id: 'female_morph',
    name: 'Feminine Shift',
    category: 'gender',
    pitchShift: 4.5, // +4.5 semitones
    f1: { freq: 650, gain: 4.0, q: 5 },
    f2: { freq: 1770, gain: 4.0, q: 5 },
    f3: { freq: 2950, gain: 3.0, q: 4 },
    lowPassFreq: 7500,
    fxType: 'none'
  },
  male_morph: {
    id: 'male_morph',
    name: 'Masculine Shift',
    category: 'gender',
    pitchShift: -4.5, // -4.5 semitones
    f1: { freq: 500, gain: 4.0, q: 5 },
    f2: { freq: 1450, gain: 4.0, q: 5 },
    f3: { freq: 2450, gain: 3.0, q: 4 },
    lowPassFreq: 7000,
    fxType: 'none'
  },
  robot_cyborg: {
    id: 'robot_cyborg',
    name: 'Cyborg / Mech',
    category: 'hardware',
    pitchShift: -2.0,
    f1: { freq: 700, gain: 5.0, q: 6 },
    f2: { freq: 1800, gain: 5.0, q: 6 },
    f3: { freq: 3000, gain: 4.0, q: 5 },
    lowPassFreq: 6000,
    fxType: 'robot',
    fxParams: { carrierFreq: 45, bitDepth: 6 }
  },
  radio_operator: {
    id: 'radio_operator',
    name: 'Radio Operator',
    category: 'hardware',
    pitchShift: 0.5,
    f1: { freq: 800, gain: 6.0, q: 4 },
    f2: { freq: 2000, gain: 4.0, q: 4 },
    f3: { freq: 2800, gain: 2.0, q: 3 },
    lowPassFreq: 3200,
    fxType: 'radio',
    fxParams: { bandpassLow: 350, bandpassHigh: 3000 }
  },
  posh_royal: {
    id: 'posh_royal',
    name: 'Posh Royal',
    category: 'archetype',
    pitchShift: 1.5,
    f1: { freq: 580, gain: 3.5, q: 5 },
    f2: { freq: 1700, gain: 4.0, q: 4 },
    f3: { freq: 2850, gain: 3.5, q: 4 },
    lowPassFreq: 7500,
    fxType: 'none'
  },
  wise_narrator: {
    id: 'wise_narrator',
    name: 'Wise Narrator',
    category: 'archetype',
    pitchShift: -3.0,
    f1: { freq: 520, gain: 4.5, q: 4 },
    f2: { freq: 1480, gain: 3.5, q: 4 },
    f3: { freq: 2500, gain: 2.5, q: 4 },
    lowPassFreq: 7000,
    fxType: 'none'
  },
  chipmunk: {
    id: 'chipmunk',
    name: 'Chipmunk',
    category: 'creature',
    pitchShift: 6.0,
    f1: { freq: 850, gain: 5.0, q: 5 },
    f2: { freq: 2200, gain: 4.5, q: 5 },
    f3: { freq: 3400, gain: 4.0, q: 4 },
    lowPassFreq: 9000,
    fxType: 'none'
  },
  demon: {
    id: 'demon',
    name: 'Demon / Monster',
    category: 'creature',
    pitchShift: -6.0,
    f1: { freq: 400, gain: 6.0, q: 4 },
    f2: { freq: 1100, gain: 5.0, q: 4 },
    f3: { freq: 2100, gain: 4.0, q: 4 },
    lowPassFreq: 5000,
    fxType: 'none'
  }
};
