import { create } from 'zustand';
import { VocalBaseline } from '../audio/dsp/baseline';
import { OutputCalibrationProfile } from '../audio/calibration/outputCalibration';

const OUTPUT_PROFILE_KEY = 'awaaz.outputProfile';

function loadOutputProfile(): OutputCalibrationProfile | null {
  try {
    const raw = localStorage.getItem(OUTPUT_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OutputCalibrationProfile;
    if (typeof parsed?.preGainDb !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveOutputProfile(profile: OutputCalibrationProfile | null): void {
  try {
    if (profile) {
      localStorage.setItem(OUTPUT_PROFILE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(OUTPUT_PROFILE_KEY);
    }
  } catch {
    // storage may be unavailable
  }
}

export interface AppState {
  isAudioUnlocked: boolean;
  hasMicPermission: boolean;
  micError: string | null;
  vocalBaseline: VocalBaseline | null;
  outputProfile: OutputCalibrationProfile | null;
  setAudioUnlocked: (unlocked: boolean) => void;
  setMicPermission: (granted: boolean) => void;
  setMicError: (error: string | null) => void;
  setVocalBaseline: (baseline: VocalBaseline | null) => void;
  setOutputProfile: (profile: OutputCalibrationProfile | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAudioUnlocked: false,
  hasMicPermission: false,
  micError: null,
  vocalBaseline: null,
  outputProfile: loadOutputProfile(),
  setAudioUnlocked: (unlocked) => set({ isAudioUnlocked: unlocked }),
  setMicPermission: (granted) => set({ hasMicPermission: granted, micError: null }),
  setMicError: (error) => set({ micError: error, hasMicPermission: false }),
  setVocalBaseline: (baseline) => set({ vocalBaseline: baseline }),
  setOutputProfile: (profile) => {
    saveOutputProfile(profile);
    set({ outputProfile: profile });
  },
}));
