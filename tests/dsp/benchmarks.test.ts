import { describe, it, expect } from 'vitest';
import {
  generatePureSine,
  generateFrequencyModulatedSine,
  generateAmplitudeModulatedSine,
  generateGlottalPulseTrain,
  generateWhiteNoise
} from './generators';
import { yinPitch } from '../../src/audio/dsp/yin';
import { extractPulses } from '../../src/audio/dsp/pulses';
import { jitterLocal } from '../../src/audio/dsp/jitter';
import { shimmerLocal } from '../../src/audio/dsp/shimmer';
import { calculateHNR } from '../../src/audio/dsp/hnr';

describe('Synthetic Audio Fixtures & DSP Benchmarks (Issue #017)', () => {
  const sampleRate = 48000;
  const frameSize = 2048;

  describe('1. Synthetic Signal Verification', () => {
    it('detects 130 Hz fundamental frequency accurately on pure sine wave', () => {
      const sine = generatePureSine(130, { sampleRate, durationSec: 0.1 });
      const frame = sine.subarray(0, frameSize);
      const res = yinPitch(frame, sampleRate);

      expect(res.pitch).toBeCloseTo(130, 0);
      expect(res.confidence).toBeGreaterThan(0.9);
    });

    it('detects 240 Hz female register fundamental on pure sine wave', () => {
      const sine = generatePureSine(240, { sampleRate, durationSec: 0.1 });
      const frame = sine.subarray(0, frameSize);
      const res = yinPitch(frame, sampleRate);

      expect(res.pitch).toBeCloseTo(240, 0);
      expect(res.confidence).toBeGreaterThan(0.9);
    });

    it('rejects white Gaussian noise with low voicing confidence', () => {
      const noise = generateWhiteNoise({ sampleRate, durationSec: 0.1, amplitude: 0.4 });
      const frame = noise.subarray(0, frameSize);
      const res = yinPitch(frame, sampleRate);

      expect(res.confidence).toBeLessThan(0.4);
    });

    it('extracts elevated jitter on frequency-modulated sine', () => {
      const fm = generateFrequencyModulatedSine(150, 6, 0.4, { sampleRate, durationSec: 0.5 });
      const periodSamples = sampleRate / 150;
      const pulses = extractPulses(fm, periodSamples);
      const jitter = jitterLocal(pulses.periods);

      expect(jitter).toBeGreaterThan(0.0001);
    });

    it('extracts elevated shimmer on amplitude-modulated sine', () => {
      const am = generateAmplitudeModulatedSine(180, 5, 0.25, { sampleRate, durationSec: 0.5 });
      const periodSamples = sampleRate / 180;
      const pulses = extractPulses(am, periodSamples);
      const shimmer = shimmerLocal(pulses.amplitudes);

      expect(shimmer).toBeGreaterThan(0.001);
    });

    it('detects high HNR on pure periodic signal and low HNR on noisy signal', () => {
      const pure = generatePureSine(200, { sampleRate, durationSec: 0.2 });
      const noisy = generateWhiteNoise({ sampleRate, durationSec: 0.2 });

      const yinPure = yinPitch(pure.subarray(0, frameSize), sampleRate);
      const yinNoisy = yinPitch(noisy.subarray(0, frameSize), sampleRate);

      const hnrPure = calculateHNR(yinPure.confidence);
      const hnrNoisy = calculateHNR(yinNoisy.confidence);

      expect(hnrPure).toBeGreaterThan(10);
      expect(hnrNoisy).toBeLessThan(5);
    });
  });

  describe('2. Throughput & Execution Speed Benchmarks', () => {
    it('executes YIN pitch detection > 10x faster than real-time playback', () => {
      const framesCount = 100;
      const testBuffer = generatePureSine(160, { sampleRate, durationSec: (framesCount * frameSize) / sampleRate });

      const startTime = performance.now();
      for (let i = 0; i < framesCount; i++) {
        const frame = testBuffer.subarray(i * 128, i * 128 + frameSize);
        if (frame.length === frameSize) {
          yinPitch(frame, sampleRate);
        }
      }
      const totalElapsedMs = performance.now() - startTime;
      const avgMsPerFrame = totalElapsedMs / framesCount;

      // 2048 samples at 48kHz = 42.6 ms of real audio.
      // 10x faster than real-time requires < 4.26 ms per frame.
      expect(avgMsPerFrame).toBeLessThan(4.26);
    });

    it('maintains glottal pulse extraction in < 1.0 ms per 2048 frame', () => {
      const pulseSignal = generateGlottalPulseTrain(140, 0.05, { sampleRate, durationSec: 0.2 });
      const frame = pulseSignal.subarray(0, frameSize);
      const periodSamples = sampleRate / 140;

      const startTime = performance.now();
      const iterations = 100;
      for (let i = 0; i < iterations; i++) {
        extractPulses(frame, periodSamples);
      }
      const avgPulseMs = (performance.now() - startTime) / iterations;

      expect(avgPulseMs).toBeLessThan(1.0);
    });
  });
});
