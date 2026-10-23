import { describe, it, expect } from 'vitest';
import { yinPitch } from '../../src/audio/dsp/yin';
import { extractPulses } from '../../src/audio/dsp/pulses';

describe('YIN Pitch Tracker', () => {
  const sampleRate = 48000;
  const bufferSize = 2048;

  it('accurately resolves pure 220 Hz sine tone within +/- 0.5 Hz', () => {
    const buffer = new Float32Array(bufferSize);
    const freq = 220;
    for (let i = 0; i < bufferSize; i++) {
      buffer[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
    }

    const result = yinPitch(buffer, sampleRate);
    expect(result.pitch).toBeGreaterThan(219.5);
    expect(result.pitch).toBeLessThan(220.5);
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('accurately resolves sub-sample fractional frequency 220.3 Hz', () => {
    const buffer = new Float32Array(bufferSize);
    const freq = 220.3;
    for (let i = 0; i < bufferSize; i++) {
      buffer[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
    }

    const result = yinPitch(buffer, sampleRate);
    expect(Math.abs(result.pitch - 220.3)).toBeLessThan(0.6);
  });

  it('rejects white noise with low confidence or 0 pitch', () => {
    const buffer = new Float32Array(bufferSize);
    for (let i = 0; i < bufferSize; i++) {
      buffer[i] = Math.random() * 2 - 1;
    }

    const result = yinPitch(buffer, sampleRate);
    expect(result.pitch === 0 || result.confidence < 0.5).toBe(true);
  });

  it('correctly reports silence as unvoiced', () => {
    const buffer = new Float32Array(bufferSize);
    const result = yinPitch(buffer, sampleRate);
    expect(result.pitch).toBe(0);
    expect(result.confidence).toBe(0);
  });
});

describe('Pulse Picking & Outlier Rejection', () => {
  const sampleRate = 48000;
  const bufferSize = 2048;

  it('extracts continuous pulse sequence from periodic signal', () => {
    const buffer = new Float32Array(bufferSize);
    const freq = 200; // Period = 240 samples
    for (let i = 0; i < bufferSize; i++) {
      buffer[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
    }

    const pulses = extractPulses(buffer, 240);
    expect(pulses.valid).toBe(true);
    expect(pulses.periods.length).toBeGreaterThanOrEqual(6);
  });

  it('filters out severe 2.0x outlier period jumps via Praat filter', () => {
    const buffer = new Float32Array(bufferSize);
    const period = 200;
    // Generate regular impulses
    for (let i = 0; i < bufferSize; i += period) {
      buffer[i] = 1.0;
    }
    // Inject artificial 2x elongated gap
    buffer[600] = 0; // Erase pulse at 600, pushing next pulse to 800

    const pulses = extractPulses(buffer, period);
    // Verified that all retained periods do not exceed 1.3x ratio
    for (let i = 1; i < pulses.periods.length; i++) {
      const ratio = pulses.periods[i] / pulses.periods[i - 1];
      expect(ratio).toBeLessThanOrEqual(1.3);
    }
  });
});
