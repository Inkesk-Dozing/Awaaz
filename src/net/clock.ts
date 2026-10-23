/**
 * EWMA NTP-style Clock Synchronization over DataChannel.
 * Estimates clock offset theta between local client and host to within +/- 50ms.
 */

export class ClockSync {
  private offsetMs: number = 0;
  private alpha: number = 0.2; // EWMA weight
  private isInitialized: boolean = false;

  public createPing(t0: number = performance.now()): { type: 'ping'; t0: number } {
    return { type: 'ping', t0 };
  }

  public handlePong(t0: number, t1: number, t2: number = performance.now()): number {
    const rtt = t2 - t0;
    // Reject anomalous packet delay spikes (> 400ms)
    if (rtt > 400 && this.isInitialized) {
      return this.offsetMs;
    }

    const instantOffset = t1 - (t0 + rtt / 2);

    if (!this.isInitialized) {
      this.offsetMs = instantOffset;
      this.isInitialized = true;
    } else {
      this.offsetMs = (1 - this.alpha) * this.offsetMs + this.alpha * instantOffset;
    }

    return this.offsetMs;
  }

  public getEstimatedHostTime(): number {
    return performance.now() + this.offsetMs;
  }

  public getOffset(): number {
    return this.offsetMs;
  }
}
