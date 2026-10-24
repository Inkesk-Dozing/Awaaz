/**
 * Default broadcast-ish operating targets for morphed voice output.
 * Tuned for WebRTC chat headroom (not studio mastering LUFS).
 */

export const DEFAULT_INPUT_TARGET_RMS_DB = -18;
export const DEFAULT_OUTPUT_TARGET_RMS_DB = -16;
export const DEFAULT_PEAK_CEILING_DB = -1.0;

export const PRE_GAIN_MIN_DB = -12;
export const PRE_GAIN_MAX_DB = 18;
export const MAKEUP_MIN_DB = -12;
export const MAKEUP_MAX_DB = 12;

export type OutputProfileId = 'broadcast' | 'clean' | 'punchy';

export interface OutputProfileParams {
  id: OutputProfileId;
  label: string;
  targetInputRmsDb: number;
  targetOutputRmsDb: number;
  peakCeilingDb: number;
  compressorThresholdDb: number;
  compressorRatio: number;
  compressorKneeDb: number;
  compressorAttackSec: number;
  compressorReleaseSec: number;
  saturationDrive: number;
}

export const OUTPUT_PROFILES: Record<OutputProfileId, OutputProfileParams> = {
  broadcast: {
    id: 'broadcast',
    label: 'Broadcast',
    targetInputRmsDb: DEFAULT_INPUT_TARGET_RMS_DB,
    targetOutputRmsDb: DEFAULT_OUTPUT_TARGET_RMS_DB,
    peakCeilingDb: DEFAULT_PEAK_CEILING_DB,
    compressorThresholdDb: -18,
    compressorRatio: 3,
    compressorKneeDb: 6,
    compressorAttackSec: 0.01,
    compressorReleaseSec: 0.2,
    saturationDrive: 1.15,
  },
  clean: {
    id: 'clean',
    label: 'Clean',
    targetInputRmsDb: DEFAULT_INPUT_TARGET_RMS_DB,
    targetOutputRmsDb: -18,
    peakCeilingDb: -1.5,
    compressorThresholdDb: -14,
    compressorRatio: 2,
    compressorKneeDb: 8,
    compressorAttackSec: 0.02,
    compressorReleaseSec: 0.25,
    saturationDrive: 1.0,
  },
  punchy: {
    id: 'punchy',
    label: 'Punchy',
    targetInputRmsDb: -16,
    targetOutputRmsDb: -14,
    peakCeilingDb: -0.5,
    compressorThresholdDb: -20,
    compressorRatio: 4,
    compressorKneeDb: 4,
    compressorAttackSec: 0.005,
    compressorReleaseSec: 0.15,
    saturationDrive: 1.35,
  },
};

export const DEFAULT_OUTPUT_PROFILE: OutputProfileParams = OUTPUT_PROFILES.broadcast;
