import { describe, it, expect } from 'vitest';
import { SignalQualityGate } from '../../src/audio/dsp/vad';

describe('Signal Quality Gate & Noise Floor Tracking', () => {
  it('correctly tracks ambient noise floor and computes high SNR on clean audio', () => {
    const gate = new SignalQualityGate(-50);
    const sampleRate = 48000;
    const frame = new Float32Array(1024);

    // Clean conversational sine wave: -18 dBFS amplitude
    const amp = Math.pow(10, -18 / 20);
    for (let i = 0; i < frame.length; i++) {
      frame[i] = amp * Math.sin((2 * Math.PI * 220 * i) / sampleRate);
    }

    const metrics = gate.analyzeFrame(frame);
    expect(metrics.isClipping).toBe(false);
    expect(metrics.isReliable).toBe(true);
    expect(metrics.qualityIndex).toBeGreaterThanOrEqual(0.8);
    expect(metrics.snrDb).toBeGreaterThan(15);
  });

  it('detects digital clipping on saturated audio signals', () => {
    const gate = new SignalQualityGate(-50);
    const frame = new Float32Array(1024);
    // Hard clipped full-scale square wave
    frame.fill(1.0);

    const metrics = gate.analyzeFrame(frame);
    expect(metrics.isClipping).toBe(true);
    expect(metrics.statusMessage).toContain('CLIPPING');
    expect(metrics.qualityIndex).toBeLessThan(0.6);
  });

  it('marks signal unreliable in presence of elevated ambient noise floor', () => {
    const gate = new SignalQualityGate(-24); // Heavy AC/fan hum noise floor
    const frame = new Float32Array(1024);

    // Weak whisper at -30 dBFS (SNR < 6 dB)
    const amp = Math.pow(10, -30 / 20);
    for (let i = 0; i < frame.length; i++) {
      frame[i] = amp * (Math.random() * 2 - 1);
    }

    const metrics = gate.analyzeFrame(frame);
    expect(metrics.isReliable).toBe(false);
    expect(metrics.qualityIndex).toBeLessThan(0.45);
    expect(metrics.statusMessage).toContain('UNRELIABLE');
  });
});
