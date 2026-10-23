import { create } from 'zustand';
import { VocalBaseline } from '../audio/dsp/baseline';

export interface AppState {
  isAudioUnlocked: boolean;
  hasMicPermission: boolean;
  micError: string | null;
  vocalBaseline: VocalBaseline | null;
  setAudioUnlocked: (unlocked: boolean) => void;
  setMicPermission: (granted: boolean) => void;
  setMicError: (error: string | null) => void;
  setVocalBaseline: (baseline: VocalBaseline | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAudioUnlocked: false,
  hasMicPermission: false,
  micError: null,
  vocalBaseline: null,
  setAudioUnlocked: (unlocked) => set({ isAudioUnlocked: unlocked }),
  setMicPermission: (granted) => set({ hasMicPermission: granted, micError: null }),
  setMicError: (error) => set({ micError: error, hasMicPermission: false }),
  setVocalBaseline: (baseline) => set({ vocalBaseline: baseline }),
}));
