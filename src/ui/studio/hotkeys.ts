/**
 * Studio Keyboard Hotkey Trigger Subsystem.
 * Maps number keys 1-9 to preset switching with smooth crossfades.
 */

export interface HotkeyMapping {
  key: string;       // e.g. '1', '2'
  presetId: string;  // e.g. 'natural', 'female_morph'
  label: string;
}

export const DEFAULT_HOTKEYS: HotkeyMapping[] = [
  { key: '1', presetId: 'natural', label: 'Natural' },
  { key: '2', presetId: 'female_morph', label: 'Feminine' },
  { key: '3', presetId: 'male_morph', label: 'Masculine' },
  { key: '4', presetId: 'chipmunk', label: 'Chipmunk' },
  { key: '5', presetId: 'demon', label: 'Demon' },
  { key: '6', presetId: 'robot_cyborg', label: 'Cyborg / Mech' },
  { key: '7', presetId: 'radio_operator', label: 'Radio Operator' },
  { key: '8', presetId: 'posh_royal', label: 'Posh Royal' },
  { key: '9', presetId: 'wise_narrator', label: 'Wise Narrator' },
];

export function setupStudioHotkeys(
  onTriggerPreset: (presetId: string) => void,
  mappings: HotkeyMapping[] = DEFAULT_HOTKEYS
): () => void {
  const handler = (e: KeyboardEvent) => {
    // Avoid triggering when user is typing in input or textarea
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
      return;
    }

    const match = mappings.find((m) => m.key === e.key);
    if (match) {
      e.preventDefault();
      onTriggerPreset(match.presetId);
    }
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
