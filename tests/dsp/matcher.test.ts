import { describe, it, expect } from 'vitest';
import {
  profileAcousticBuffer,
  generateTwinRecipe,
  deserializePresetCode
} from '../../src/audio/morph/matcher';

describe('Voice Twin Matcher Engine', () => {
  const sampleRate = 48000;
  const numSamples = 48000 * 2; // 2 seconds

  it('profiles acoustic buffer and detects dominant pitch', () => {
    const buffer = new Float32Array(numSamples);
    const targetFreq = 220;
    for (let i = 0; i < numSamples; i++) {
      buffer[i] = Math.sin((2 * Math.PI * targetFreq * i) / sampleRate);
    }

    const profile = profileAcousticBuffer(buffer, sampleRate);
    expect(profile.medianPitch).toBeGreaterThan(215);
    expect(profile.medianPitch).toBeLessThan(225);
    expect(profile.voicingCoverage).toBeGreaterThan(0.8);
  });

  it('calculates accurate semitone pitch shift and generates valid recipe', () => {
    const userProfile = {
      medianPitch: 120, // Low voice
      pitchMin: 100,
      pitchMax: 140,
      formantShiftEstimate: 0.95,
      spectralTilt: 1.5,
      voicingCoverage: 0.9
    };

    const targetProfile = {
      medianPitch: 240, // 1 octave higher (12 semitones raw -> clamped to 6)
      pitchMin: 220,
      pitchMax: 260,
      formantShiftEstimate: 1.15,
      spectralTilt: 0.8,
      voicingCoverage: 0.95
    };

    const recipe = generateTwinRecipe(userProfile, targetProfile, 'Octave Shift');
    expect(recipe.preset.pitchShift).toBe(6); // Clamped to max +6 semitones
    expect(recipe.preset.f1.freq).toBeGreaterThan(550);
    expect(recipe.matchConfidence).toBeGreaterThan(0.4);
    expect(recipe.matchConfidence).toBeLessThanOrEqual(1.0);
    expect(recipe.serializedCode.length).toBeGreaterThan(10);
  });

  it('serializes and deserializes preset sharing code idempotently', () => {
    const userProfile = {
      medianPitch: 150,
      pitchMin: 130,
      pitchMax: 170,
      formantShiftEstimate: 1.0,
      spectralTilt: 1.0,
      voicingCoverage: 0.8
    };

    const targetProfile = {
      medianPitch: 180,
      pitchMin: 160,
      pitchMax: 200,
      formantShiftEstimate: 1.08,
      spectralTilt: 1.2,
      voicingCoverage: 0.85
    };

    const recipe = generateTwinRecipe(userProfile, targetProfile, 'Shared Vibe');
    const imported = deserializePresetCode(recipe.serializedCode, 'Imported Vibe');

    expect(imported).not.toBeNull();
    expect(imported?.pitchShift).toBe(recipe.preset.pitchShift);
    expect(imported?.f1.freq).toBe(recipe.preset.f1.freq);
    expect(imported?.lowPassFreq).toBe(recipe.preset.lowPassFreq);
  });

  it('returns null on corrupted base64 string', () => {
    const corrupted = deserializePresetCode('not-a-valid-base64');
    expect(corrupted).toBeNull();
  });
});
