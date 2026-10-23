/**
 * Typed Wire Protocol for Awaaz DataChannel messages.
 * Versioned { v: 1, type, ... } contracts.
 */

export interface StressTelemetryPacket {
  pitch: number;
  jitter: number;
  shimmer: number;
  hnr: number;
  tremor: number;
  silenceRatio: number;
  isSpeaking: boolean;
  quality: number;
}

export interface PlayerSlot {
  id: string;
  slot: number;
  name: string;
  maskId: string | null;
  connected: boolean;
  isHost: boolean;
}

export type WireMessage =
  | { v: 1; type: 'hello'; name: string; slot?: number }
  | { v: 1; type: 'snapshot'; roster: PlayerSlot[]; phase: string; hostTime: number }
  | { v: 1; type: 'phase'; phase: string; payload?: unknown }
  | { v: 1; type: 'question'; qid: string; text: string; hostTime: number; durationSec: number }
  | { v: 1; type: 'onset'; clientTime: number }
  | { v: 1; type: 'tel'; data: StressTelemetryPacket; slot: number }
  | { v: 1; type: 'score'; composite: number; confidence: number; verdict: string; slot: number }
  | { v: 1; type: 'vote'; targetSlot: number; voterSlot: number }
  | { v: 1; type: 'mask'; maskId: string; slot: number }
  | { v: 1; type: 'ping'; t0: number }
  | { v: 1; type: 'pong'; t0: number; t1: number }
  | { v: 1; type: 'relay_status'; isRelayed: boolean; slot: number }
  | { v: 1; type: 'bye'; reason: string; slot: number };
