import { describe, it, expect } from 'vitest';
import { MASK_PRESETS } from '../../src/audio/morph/masks';

describe('Voice Mask Presets Matrix', () => {
  it('contains standard v1 masks with valid pitch and formant structures', () => {
    expect(MASK_PRESETS.natural).toBeDefined();
    expect(MASK_PRESETS.female_morph).toBeDefined();
    expect(MASK_PRESETS.male_morph).toBeDefined();
    expect(MASK_PRESETS.robot_cyborg).toBeDefined();
    expect(MASK_PRESETS.radio_operator).toBeDefined();
  });

  it('clamps all pitch shifting within the architectural +/- 6 semitone invariant', () => {
    Object.values(MASK_PRESETS).forEach((preset) => {
      expect(preset.pitchShift).toBeGreaterThanOrEqual(-6);
      expect(preset.pitchShift).toBeLessThanOrEqual(6);
    });
  });

  it('correctly anchors 3 formant peaking biquads with realistic frequency ordering', () => {
    Object.values(MASK_PRESETS).forEach((preset) => {
      expect(preset.f1.freq).toBeLessThan(preset.f2.freq);
      expect(preset.f2.freq).toBeLessThan(preset.f3.freq);
      expect(preset.f1.gain).toBeGreaterThanOrEqual(0);
      expect(preset.lowPassFreq).toBeGreaterThan(1000);
    });
  });

  it('configures hardware FX parameters for robot and radio presets', () => {
    const robot = MASK_PRESETS.robot_cyborg;
    expect(robot.fxType).toBe('robot');
    expect(robot.fxParams?.carrierFreq).toBe(45);

    const radio = MASK_PRESETS.radio_operator;
    expect(radio.fxType).toBe('radio');
    expect(radio.lowPassFreq).toBeLessThanOrEqual(3500);
  });
});
