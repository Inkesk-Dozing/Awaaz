import { describe, it, expect } from 'vitest';
import { PauseTracker } from '../../src/audio/dsp/pauses';
import { SpeechRateEstimator } from '../../src/audio/dsp/speechRate';
import { FlinchDetector } from '../../src/audio/dsp/flinch';

describe('Dynamic Pause & Speech Rate Analysis, Hesitation Ribbon & FLINCH (Issue #15)', () => {
  it('measures response latency and registers pause severity correctly', () => {
    const tracker = new PauseTracker();
    const hostT = 1000;
    tracker.onQuestionDispatched(hostT, 50); // local dispatch = 1050ms

    // Silent until 2500ms
    tracker.processFrame(false, 1500);
    tracker.processFrame(false, 2000);

    // First voice at 2500ms (latency = 2500 - 1050 = 1450ms)
    const initial = tracker.processFrame(true, 2500);
    expect(initial.responseLatencyMs).toBe(1450);

    // Continued speaking
    tracker.processFrame(true, 3000);

    // Mid-sentence pause of 350ms (minor)
    tracker.processFrame(false, 3200);
    const minorPause = tracker.processFrame(false, 3350);
    expect(minorPause.pauseSeverity).toBe('minor');

    // Prolonged hesitation of 1600ms (severe)
    tracker.processFrame(false, 4600);
    const severePause = tracker.processFrame(false, 4950);
    expect(severePause.pauseSeverity).toBe('severe');
  });

  it('detects acoustic FLINCH when voiced RMS jumps > 12 dB in 150 ms', () => {
    const flinch = new FlinchDetector();

    // Baseline calm phonation
    expect(flinch.processFrame(0.05, true, 100)).toBe(false);
    expect(flinch.processFrame(0.052, true, 150)).toBe(false);

    // Sudden 14 dB surge: from 0.05 to 0.26 in 50 ms
    const triggered = flinch.processFrame(0.26, true, 200);
    expect(triggered).toBe(true);

    // Unvoiced surge should NOT trigger flinch (e.g. mic bump or silent click)
    flinch.reset();
    expect(flinch.processFrame(0.02, false, 500)).toBe(false);
    expect(flinch.processFrame(0.30, false, 550)).toBe(false);
  });

  it('estimates syllables per second accurately from energy envelope', () => {
    const estimator = new SpeechRateEstimator(1000); // 1-second rolling window

    // Simulate 4 syllable peaks in 1 second
    const timePoints = [
      { t: 100, rms: 0.01 },
      { t: 150, rms: 0.08 }, // peak 1
      { t: 200, rms: 0.01 },
      { t: 350, rms: 0.01 },
      { t: 400, rms: 0.09 }, // peak 2
      { t: 450, rms: 0.01 },
      { t: 600, rms: 0.01 },
      { t: 650, rms: 0.07 }, // peak 3
      { t: 700, rms: 0.01 },
      { t: 850, rms: 0.01 },
      { t: 900, rms: 0.08 }, // peak 4
      { t: 950, rms: 0.01 },
    ];

    timePoints.forEach((p) => estimator.addSample(p.rms, p.t));
    const rate = estimator.getSpeechRateSyllablesPerSec();
    expect(rate).toBe(4.0);
  });
});
