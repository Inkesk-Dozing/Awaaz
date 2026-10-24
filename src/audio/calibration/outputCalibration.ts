/**
 * Pure solver: mic/morphed level measurements → gain recipe.
 * No Web Audio dependencies (unit-testable).
 */

import {
  MAKEUP_MAX_DB,
  MAKEUP_MIN_DB,
  PRE_GAIN_MAX_DB,
  PRE_GAIN_MIN_DB,
  DEFAULT_INPUT_TARGET_RMS_DB,
  DEFAULT_OUTPUT_TARGET_RMS_DB,
  DEFAULT_PEAK_CEILING_DB,
} from '../mastering/targets';

export interface OutputCalibrationInput {
  /** Voiced raw-mic RMS in dBFS. */
  inputRmsDb: number;
  /** Morphed-path RMS in dBFS (with current chain, pre make-up). */
  outputRmsDb: number;
  /** Morphed-path peak in dBFS. */
  outputPeakDb: number;
  targetInputRmsDb?: number;
  targetOutputRmsDb?: number;
  peakCeilingDb?: number;
}

export interface OutputCalibrationProfile {
  preGainDb: number;
  makeupGainDb: number;
  peakCeilingDb: number;
  targetOutputRmsDb: number;
  /** Heuristic 0..1 confidence. */
  quality: number;
  /** True if any gain hit a clamp bound. */
  clamped: boolean;
  notes: string[];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Solves pre-gain (input staging) and makeup gain (output staging)
 * so the morphed voice hits a stable operating level without clipping
 * the peak ceiling.
 */
export function solveOutputCalibration(input: OutputCalibrationInput): OutputCalibrationProfile {
  const targetIn = input.targetInputRmsDb ?? DEFAULT_INPUT_TARGET_RMS_DB;
  const targetOut = input.targetOutputRmsDb ?? DEFAULT_OUTPUT_TARGET_RMS_DB;
  const ceiling = input.peakCeilingDb ?? DEFAULT_PEAK_CEILING_DB;
  const notes: string[] = [];
  let clamped = false;

  const finiteIn = Number.isFinite(input.inputRmsDb) ? input.inputRmsDb : -60;
  const finiteOut = Number.isFinite(input.outputRmsDb) ? input.outputRmsDb : -60;
  const finitePeak = Number.isFinite(input.outputPeakDb) ? input.outputPeakDb : -60;

  // 1. Stage the mic so analysis/morph sees a healthy operating level.
  const rawPre = targetIn - finiteIn;
  const preGainDb = clamp(rawPre, PRE_GAIN_MIN_DB, PRE_GAIN_MAX_DB);
  if (Math.abs(rawPre - preGainDb) > 0.01) {
    clamped = true;
    notes.push(`Input gain clamped to ${preGainDb.toFixed(1)} dB`);
  }

  // 2. Makeup toward output RMS target.
  //    Pre-gain also lifts the morphed path, so project that first.
  const projectedWithPre = finiteOut + preGainDb;
  const rawMakeup = targetOut - projectedWithPre;
  let makeupGainDb = clamp(rawMakeup, MAKEUP_MIN_DB, MAKEUP_MAX_DB);
  if (Math.abs(rawMakeup - makeupGainDb) > 0.01) {
    clamped = true;
    notes.push(`Makeup gain clamped to ${makeupGainDb.toFixed(1)} dB`);
  }

  // 3. Respect peak ceiling after makeup.
  const projectedPeak = finitePeak + preGainDb + makeupGainDb;
  if (projectedPeak > ceiling) {
    const reduceBy = projectedPeak - ceiling;
    makeupGainDb = clamp(makeupGainDb - reduceBy, MAKEUP_MIN_DB, MAKEUP_MAX_DB);
    clamped = true;
    notes.push(`Makeup reduced ${reduceBy.toFixed(1)} dB to hold peak ≤ ${ceiling} dBFS`);
  }

  // 4. Quality heuristic: penalize extreme clamps and near-silent inputs.
  let quality = 1;
  quality -= Math.abs(rawPre - preGainDb) * 0.02;
  quality -= Math.abs(rawMakeup - makeupGainDb) * 0.02;
  if (finiteIn < -50) {
    quality -= 0.4;
    notes.push('Mic signal very quiet — check device gain');
  }
  if (finiteIn > -3) {
    quality -= 0.35;
    notes.push('Mic may be clipping — back off input');
  }
  if (finitePeak - finiteOut > 12) {
    quality -= 0.15;
    notes.push('Spiky dynamics — compressor will help');
  }

  const qualityScore = clamp(Math.round(quality * 100) / 100, 0, 1);

  return {
    preGainDb: Math.round(preGainDb * 10) / 10,
    makeupGainDb: Math.round(makeupGainDb * 10) / 10,
    peakCeilingDb: ceiling,
    targetOutputRmsDb: targetOut,
    quality: qualityScore,
    clamped,
    notes,
  };
}
