/**
 * Robot / Cyborg FX insert: audio-rate ring modulation + optional bitcrush.
 * Properly wired: input → ring-mod (AM) → bitcrush → output.
 * Dry/wet mix keeps intelligibility.
 */

import { buildBitcrushCurve } from './saturation';

export class RobotFx {
  public readonly input: GainNode;
  public readonly output: GainNode;

  private ctx: BaseAudioContext;
  private osc: OscillatorNode;
  private ringMod: GainNode;
  private bitShaper: WaveShaperNode | null = null;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private mix = 0.85;
  private carrierFreq: number;

  constructor(ctx: BaseAudioContext, carrierFreq: number = 45, bitDepth?: number, mix: number = 0.85) {
    this.ctx = ctx;
    this.carrierFreq = carrierFreq;
    this.mix = Math.max(0, Math.min(1, mix));

    this.input = ctx.createGain();
    this.output = ctx.createGain();

    // Ring modulation: output = input * osc  (audio-rate AM via gain param).
    this.osc = ctx.createOscillator();
    this.osc.type = 'sine';
    this.osc.frequency.value = carrierFreq;

    this.ringMod = ctx.createGain();
    this.ringMod.gain.value = 0; // start silent; osc drives it

    // Wet path: input → ringMod → (optional bitcrush) → wetGain
    this.input.connect(this.ringMod);

    let wetTail: AudioNode = this.ringMod;
    if (bitDepth !== undefined && bitDepth > 0) {
      this.bitShaper = ctx.createWaveShaper();
      this.bitShaper.curve = buildBitcrushCurve(bitDepth);
      this.bitShaper.oversample = 'none';
      this.ringMod.connect(this.bitShaper);
      wetTail = this.bitShaper;
    }

    this.wetGain = ctx.createGain();
    this.wetGain.gain.value = this.mix;
    wetTail.connect(this.wetGain);
    this.wetGain.connect(this.output);

    // Dry path for intelligibility.
    this.dryGain = ctx.createGain();
    this.dryGain.gain.value = 1 - this.mix;
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    // Modulate ringMod.gain with the oscillator (audio-rate).
    this.osc.connect(this.ringMod.gain);
    this.osc.start();
  }

  public setCarrierFreq(hz: number): void {
    this.carrierFreq = Math.max(20, Math.min(200, hz));
    this.osc.frequency.setTargetAtTime(this.carrierFreq, this.ctx.currentTime, 0.02);
  }

  public setMix(mix: number): void {
    this.mix = Math.max(0, Math.min(1, mix));
    const now = this.ctx.currentTime;
    this.wetGain.gain.setTargetAtTime(this.mix, now, 0.02);
    this.dryGain.gain.setTargetAtTime(1 - this.mix, now, 0.02);
  }

  public dispose(): void {
    try {
      this.osc.stop();
    } catch {
      // already stopped
    }
    this.osc.disconnect();
    this.ringMod.disconnect();
    this.bitShaper?.disconnect();
    this.dryGain.disconnect();
    this.wetGain.disconnect();
    this.input.disconnect();
    this.output.disconnect();
  }
}
