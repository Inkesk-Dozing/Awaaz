/**
 * OutputStage: broadcast-style mastering insert for the morph chain.
 * preGain → compressor → makeup → soft-clip limiter → output
 *
 * Gains accept dB; internals use linear GainNodes with setTargetAtTime ramps.
 */

import { dbToLinear, linearToDb } from './metering';
import { createTanhShaper } from '../morph/fx/saturation';
import {
  DEFAULT_OUTPUT_PROFILE,
  OutputProfileParams,
  DEFAULT_PEAK_CEILING_DB,
} from './targets';

export class OutputStage {
  public readonly input: GainNode;
  public readonly output: GainNode;

  private ctx: BaseAudioContext;
  private compressor: DynamicsCompressorNode;
  private makeup: GainNode;
  private limiter: WaveShaperNode;
  private preGainDb = 0;
  private makeupDb = 0;
  private ceilingDb = DEFAULT_PEAK_CEILING_DB;
  private profile: OutputProfileParams = DEFAULT_OUTPUT_PROFILE;

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;

    this.input = ctx.createGain();
    this.input.gain.value = 1;

    this.compressor = ctx.createDynamicsCompressor();
    this.applyCompressorParams(DEFAULT_OUTPUT_PROFILE);

    this.makeup = ctx.createGain();
    this.makeup.gain.value = 1;

    this.limiter = createTanhShaper(ctx, 1.5, dbToLinear(DEFAULT_PEAK_CEILING_DB));

    this.output = ctx.createGain();
    this.output.gain.value = 1;

    this.input.connect(this.compressor);
    this.compressor.connect(this.makeup);
    this.makeup.connect(this.limiter);
    this.limiter.connect(this.output);
  }

  private applyCompressorParams(p: OutputProfileParams): void {
    const now = this.ctx.currentTime;
    this.compressor.threshold.setTargetAtTime(p.compressorThresholdDb, now, 0.02);
    this.compressor.ratio.setTargetAtTime(p.compressorRatio, now, 0.02);
    this.compressor.knee.setTargetAtTime(p.compressorKneeDb, now, 0.02);
    this.compressor.attack.setTargetAtTime(p.compressorAttackSec, now, 0.02);
    this.compressor.release.setTargetAtTime(p.compressorReleaseSec, now, 0.02);
  }

  /** Apply a named broadcast profile (compressor + saturation character). */
  public applyProfile(profile: OutputProfileParams): void {
    this.profile = profile;
    this.applyCompressorParams(profile);
    this.setPeakCeilingDb(profile.peakCeilingDb);
    this.setSaturationDrive(profile.saturationDrive);
  }

  public getProfile(): OutputProfileParams {
    return this.profile;
  }

  public setPreGainDb(db: number): void {
    this.preGainDb = Math.max(-24, Math.min(24, db));
    this.input.gain.setTargetAtTime(dbToLinear(this.preGainDb), this.ctx.currentTime, 0.05);
  }

  public getPreGainDb(): number {
    return this.preGainDb;
  }

  public setMakeupGainDb(db: number): void {
    this.makeupDb = Math.max(-24, Math.min(24, db));
    this.makeup.gain.setTargetAtTime(dbToLinear(this.makeupDb), this.ctx.currentTime, 0.05);
  }

  public getMakeupGainDb(): number {
    return this.makeupDb;
  }

  public setPeakCeilingDb(db: number): void {
    this.ceilingDb = Math.max(-12, Math.min(0, db));
    // Rebuild limiter curve; drive stays aggressive enough to soft-knee peaks.
    const drive = 1.2 + Math.max(0, 1 + this.ceilingDb / 12) * 0.6;
    this.limiter.curve = createTanhShaper(this.ctx, drive, dbToLinear(this.ceilingDb)).curve;
  }

  public getPeakCeilingDb(): number {
    return this.ceilingDb;
  }

  public setSaturationDrive(drive: number): void {
    const d = Math.max(1, Math.min(3, drive));
    this.limiter.curve = createTanhShaper(this.ctx, d, dbToLinear(this.ceilingDb)).curve;
  }

  /** Estimate post-stage RMS if meter pre-stage (diagnostic helper). */
  public static makeupDbForTarget(measuredRmsDb: number, targetRmsDb: number): number {
    const delta = targetRmsDb - measuredRmsDb;
    return Math.max(-12, Math.min(12, Math.round(delta * 10) / 10));
  }

  public snapshot(): { preGainDb: number; makeupDb: number; ceilingDb: number; profile: string } {
    return {
      preGainDb: this.preGainDb,
      makeupDb: this.makeupDb,
      ceilingDb: this.ceilingDb,
      profile: this.profile.id,
    };
  }

  /** Current makeup as linear (for tests). */
  public makeupLinear(): number {
    return dbToLinear(this.makeupDb);
  }

  public dispose(): void {
    this.input.disconnect();
    this.compressor.disconnect();
    this.makeup.disconnect();
    this.limiter.disconnect();
    this.output.disconnect();
  }
}

/** Re-export for convenience. */
export { linearToDb, dbToLinear };
