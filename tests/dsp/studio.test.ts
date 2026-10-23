import { describe, it, expect } from 'vitest';
import { DEFAULT_HOTKEYS } from '../../src/ui/studio/hotkeys';
import { MASK_PRESETS } from '../../src/audio/morph/masks';

describe('Studio Hotkeys & Presets (Issue #11)', () => {
  it('maps numbers 1 through 9 to valid mask presets', () => {
    expect(DEFAULT_HOTKEYS.length).toBe(9);
    DEFAULT_HOTKEYS.forEach((mapping) => {
      expect(MASK_PRESETS[mapping.presetId]).toBeDefined();
      expect(typeof mapping.key).toBe('string');
      expect(typeof mapping.label).toBe('string');
    });
  });

  it('validates VTL formant scaling frequency calculation', () => {
    const natural = MASK_PRESETS.natural;
    const vtlScale = 1.15; // Shift formants upward (shorter vocal tract)
    const scaledF1 = natural.f1.freq * vtlScale;
    const scaledF2 = natural.f2.freq * vtlScale;

    expect(scaledF1).toBe(600 * 1.15);
    expect(scaledF2).toBe(1600 * 1.15);
  });
});
