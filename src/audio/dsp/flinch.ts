/**
 * Startle / FLINCH Acoustic Surge Detector.
 * Flags immediate startle reactions when RMS jumps > 12 dB within 150 ms while voiced.
 */

export class FlinchDetector {
  private history: { timeMs: number; rms: number }[] = [];
  private readonly windowMs: number = 150;
  private readonly thresholdDb: number = 12.0;

  public processFrame(rms: number, isVoiced: boolean, currentTimestampMs: number): boolean {
    if (!isVoiced || rms < 0.015) {
      this.history.push({ timeMs: currentTimestampMs, rms });
      this.prune(currentTimestampMs);
      return false;
    }

    this.prune(currentTimestampMs);

    if (this.history.length > 0) {
      const oldest = this.history[0].rms;
      if (oldest > 1e-4) {
        const jumpDb = 20 * Math.log10(rms / oldest);
        if (jumpDb >= this.thresholdDb) {
          this.history.push({ timeMs: currentTimestampMs, rms });
          return true; // FLINCH triggered!
        }
      }
    }

    this.history.push({ timeMs: currentTimestampMs, rms });
    return false;
  }

  private prune(nowMs: number): void {
    const cutoff = nowMs - this.windowMs;
    while (this.history.length > 0 && this.history[0].timeMs < cutoff) {
      this.history.shift();
    }
  }

  public reset(): void {
    this.history = [];
  }
}
