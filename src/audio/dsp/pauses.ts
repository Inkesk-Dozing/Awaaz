/**
 * Response Latency & Pause Dynamics Tracker.
 * Tracks response latency upon question dispatch and monitors mid-speech hesitations.
 */

export interface PauseEvent {
  startTime: number;
  durationMs: number;
  severity: 'minor' | 'hesitation' | 'severe';
}

export class PauseTracker {
  private questionDispatchedLocalMs: number | null = null;
  private firstVocalizationDetectedMs: number | null = null;
  private lastVoicedTimestamp: number | null = null;
  private activePauseStart: number | null = null;
  private pauses: PauseEvent[] = [];

  public onQuestionDispatched(hostTimestampMs: number, clockOffsetMs: number = 0): void {
    // Local estimated arrival time using EWMA clock offset
    this.questionDispatchedLocalMs = hostTimestampMs + clockOffsetMs;
    this.firstVocalizationDetectedMs = null;
    this.lastVoicedTimestamp = null;
    this.activePauseStart = null;
    this.pauses = [];
  }

  public processFrame(isVoiced: boolean, currentTimestampMs: number): {
    responseLatencyMs: number | null;
    currentPauseDurationMs: number;
    pauseSeverity: 'none' | 'minor' | 'hesitation' | 'severe';
  } {
    // 1. Initial Response Latency Detection
    if (isVoiced && this.questionDispatchedLocalMs && !this.firstVocalizationDetectedMs) {
      this.firstVocalizationDetectedMs = currentTimestampMs;
    }

    const responseLatencyMs =
      this.firstVocalizationDetectedMs && this.questionDispatchedLocalMs
        ? Math.max(0, this.firstVocalizationDetectedMs - this.questionDispatchedLocalMs)
        : null;

    // 2. Mid-speech pause tracking
    if (isVoiced) {
      if (this.activePauseStart !== null) {
        const duration = currentTimestampMs - this.activePauseStart;
        if (duration >= 250) {
          this.pauses.push({
            startTime: this.activePauseStart,
            durationMs: duration,
            severity: duration >= 1500 ? 'severe' : duration >= 600 ? 'hesitation' : 'minor',
          });
        }
        this.activePauseStart = null;
      }
      this.lastVoicedTimestamp = currentTimestampMs;
      return { responseLatencyMs, currentPauseDurationMs: 0, pauseSeverity: 'none' };
    } else {
      // Silence frame
      if (this.lastVoicedTimestamp !== null && this.activePauseStart === null) {
        this.activePauseStart = this.lastVoicedTimestamp;
      }

      const currentPauseDuration = this.activePauseStart ? currentTimestampMs - this.activePauseStart : 0;
      let severity: 'none' | 'minor' | 'hesitation' | 'severe' = 'none';
      if (currentPauseDuration >= 1500) {
        severity = 'severe';
      } else if (currentPauseDuration >= 600) {
        severity = 'hesitation';
      } else if (currentPauseDuration >= 250) {
        severity = 'minor';
      }

      return {
        responseLatencyMs,
        currentPauseDurationMs: currentPauseDuration,
        pauseSeverity: severity,
      };
    }
  }

  public getRecordedPauses(): PauseEvent[] {
    return [...this.pauses];
  }

  public getInitialLatency(): number | null {
    if (!this.firstVocalizationDetectedMs || !this.questionDispatchedLocalMs) return null;
    return Math.max(0, this.firstVocalizationDetectedMs - this.questionDispatchedLocalMs);
  }
}
