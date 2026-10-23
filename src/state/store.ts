import { create } from 'zustand';

export interface AppState {
  isAudioUnlocked: boolean;
  hasMicPermission: boolean;
  micError: string | null;
  setAudioUnlocked: (unlocked: boolean) => void;
  setMicPermission: (granted: boolean) => void;
  setMicError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAudioUnlocked: false,
  hasMicPermission: false,
  micError: null,
  setAudioUnlocked: (unlocked) => set({ isAudioUnlocked: unlocked }),
  setMicPermission: (granted) => set({ hasMicPermission: granted, micError: null }),
  setMicError: (error) => set({ micError: error, hasMicPermission: false })
}));
