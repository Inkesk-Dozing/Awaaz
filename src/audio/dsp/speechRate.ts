/**
 * Syllable Peak & Speech Rate Estimator.
 * Tracks smoothed energy envelope peaks per second as a proxy for speech tempo.
 */

export class SpeechRateEstimator {
  private energyHistory: { timeMs: number; rms: number }[] = [];
  private windowDurationMs: number;

  constructor(windowDurationMs: number = 3000) {
    this.windowDurationMs = windowDurationMs;
  }

  public addSample(rms: number, timestampMs: number): void {
    this.energyHistory.push({ timeMs: timestampMs, rms });
    const cutoff = timestampMs - this.windowDurationMs;
    while (this.energyHistory.length > 0 && this.energyHistory[0].timeMs < cutoff) {
      this.energyHistory.shift();
    }
  }

  public getSpeechRateSyllablesPerSec(): number {
    if (this.energyHistory.length < 10) return 0;

    let peakCount = 0;
    const threshold = 0.02;

    for (let i = 1; i < this.energyHistory.length - 1; i++) {
      const prev = this.energyHistory[i - 1].rms;
      const curr = this.energyHistory[i].rms;
      const next = this.energyHistory[i + 1].rms;

      // Local energy peak exceeding threshold
      if (curr > prev && curr > next && curr > threshold) {
        peakCount++;
      }
    }

    const durationSec = this.windowDurationMs / 1000;
    return Number((peakCount / durationSec).toFixed(2));
  }

  public reset(): void {
    this.energyHistory = [];
  }
}
