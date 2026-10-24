/**
 * Peak / RMS metering helpers (pure math over Float32Array).
 * All levels are full-scale digital (dBFS) where 1.0 = 0 dBFS.
 */

export const SILENCE_FLOOR = 1e-8;

export function linearToDb(linear: number): number {
  return 20 * Math.log10(Math.max(SILENCE_FLOOR, Math.abs(linear)));
}

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/** RMS of a buffer in dBFS. Returns -Infinity-safe floor via SILENCE_FLOOR. */
export function rmsDbfs(samples: Float32Array): number {
  if (samples.length === 0) return linearToDb(0);
  let sumSq = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    sumSq += v * v;
  }
  return linearToDb(Math.sqrt(sumSq / samples.length));
}

/** Absolute peak of a buffer in dBFS. */
export function peakDbfs(samples: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
  }
  return linearToDb(peak);
}

/** Running RMS accumulator for streaming metering. */
export class RmsAccumulator {
  private sumSq = 0;
  private count = 0;

  public push(samples: Float32Array): void {
    for (let i = 0; i < samples.length; i++) {
      const v = samples[i];
      this.sumSq += v * v;
    }
    this.count += samples.length;
  }

  public rmsDb(): number {
    if (this.count === 0) return linearToDb(0);
    return linearToDb(Math.sqrt(this.sumSq / this.count));
  }

  public peakDb(): number {
    return linearToDb(0);
  }

  public reset(): void {
    this.sumSq = 0;
    this.count = 0;
  }

  public get frames(): number {
    return this.count;
  }
}

/** Track peak while accumulating RMS. */
export class PeakRmsMeter {
  private sumSq = 0;
  private count = 0;
  private peak = 0;

  public push(samples: Float32Array): void {
    for (let i = 0; i < samples.length; i++) {
      const v = samples[i];
      const sq = v * v;
      this.sumSq += sq;
      const a = Math.abs(v);
      if (a > this.peak) this.peak = a;
    }
    this.count += samples.length;
  }

  public rmsDb(): number {
    if (this.count === 0) return linearToDb(0);
    return linearToDb(Math.sqrt(this.sumSq / this.count));
  }

  public peakDb(): number {
    return linearToDb(this.peak);
  }

  public reset(): void {
    this.sumSq = 0;
    this.count = 0;
    this.peak = 0;
  }

  public get samples(): number {
    return this.count;
  }
}
