/**
 * MorphChain: Web Audio routing graph for real-time voice modification.
 * PitchShift (Tone.js) -> F1 Biquad -> F2 Biquad -> F3 Biquad -> LowPass Filter -> FX Insert -> Output Destination
 */

import * as Tone from 'tone';
import { MaskPreset, MASK_PRESETS } from './masks';

export class MorphChain {
  private ctx: AudioContext;
  private inputNode: MediaStreamAudioSourceNode | null = null;
  private pitchShiftNode: Tone.PitchShift | null = null;
  private f1Node: BiquadFilterNode;
  private f2Node: BiquadFilterNode;
  private f3Node: BiquadFilterNode;
  private lpNode: BiquadFilterNode;
  private ringModOsc: OscillatorNode | null = null;
  private ringModGain: GainNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode;
  private activePreset: MaskPreset = MASK_PRESETS.natural;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;

    // Initialize 3 peaking biquads for formant anchors
    this.f1Node = ctx.createBiquadFilter();
    this.f1Node.type = 'peaking';

    this.f2Node = ctx.createBiquadFilter();
    this.f2Node.type = 'peaking';

    this.f3Node = ctx.createBiquadFilter();
    this.f3Node.type = 'peaking';

    // Low-pass ceiling filter to tame digital harshness
    this.lpNode = ctx.createBiquadFilter();
    this.lpNode.type = 'lowpass';
    this.lpNode.Q.value = 0.707;

    // Destination node that emits disguised MediaStream for WebRTC
    this.destinationNode = ctx.createMediaStreamDestination();

    // Wire filter cascade: f1 -> f2 -> f3 -> lp -> destination
    this.f1Node.connect(this.f2Node);
    this.f2Node.connect(this.f3Node);
    this.f3Node.connect(this.lpNode);
    this.lpNode.connect(this.destinationNode);

    this.applyPreset(MASK_PRESETS.natural, 0);
  }

  public connectSource(source: MediaStreamAudioSourceNode): void {
    this.inputNode = source;

    // Initialize Tone.PitchShift with 50ms voice window
    this.pitchShiftNode = new Tone.PitchShift({
      pitch: 0,
      windowSize: 0.05, // 50 ms
      wet: 1.0
    });

    // Tone.js ToneAudioNode to native Web Audio connection
    Tone.connect(this.inputNode, this.pitchShiftNode);
    Tone.connect(this.pitchShiftNode, this.f1Node);
  }

  public applyPreset(preset: MaskPreset, transitionTime: number = 0.05): void {
    this.activePreset = preset;
    const now = this.ctx.currentTime;
    const ramp = Math.max(0.01, transitionTime);

    // 1. Update pitch shift (clamped to +/- 6 semitones)
    if (this.pitchShiftNode) {
      const clampedPitch = Math.max(-6, Math.min(6, preset.pitchShift));
      this.pitchShiftNode.pitch = clampedPitch;
    }

    // 2. Exponential ramps for formant frequencies and gains (click-free glide)
    this.f1Node.frequency.setTargetAtTime(preset.f1.freq, now, ramp);
    this.f1Node.gain.setTargetAtTime(preset.f1.gain, now, ramp);
    this.f1Node.Q.setTargetAtTime(preset.f1.q, now, ramp);

    this.f2Node.frequency.setTargetAtTime(preset.f2.freq, now, ramp);
    this.f2Node.gain.setTargetAtTime(preset.f2.gain, now, ramp);
    this.f2Node.Q.setTargetAtTime(preset.f2.q, now, ramp);

    this.f3Node.frequency.setTargetAtTime(preset.f3.freq, now, ramp);
    this.f3Node.gain.setTargetAtTime(preset.f3.gain, now, ramp);
    this.f3Node.Q.setTargetAtTime(preset.f3.q, now, ramp);

    this.lpNode.frequency.setTargetAtTime(preset.lowPassFreq, now, ramp);

    // 3. Configure optional RingModulation FX for Robot
    if (preset.fxType === 'robot') {
      this.setupRobotFX(preset.fxParams?.carrierFreq || 45);
    } else {
      this.teardownRobotFX();
    }
  }

  private setupRobotFX(carrierFreq: number): void {
    if (this.ringModOsc) return;

    this.ringModOsc = this.ctx.createOscillator();
    this.ringModOsc.type = 'sine';
    this.ringModOsc.frequency.value = carrierFreq;

    this.ringModGain = this.ctx.createGain();
    this.ringModGain.gain.value = 0.5;

    this.ringModOsc.connect(this.ringModGain.gain);
    this.ringModOsc.start();
  }

  private teardownRobotFX(): void {
    if (this.ringModOsc) {
      try {
        this.ringModOsc.stop();
        this.ringModOsc.disconnect();
      } catch {
        // Ignored
      }
      this.ringModOsc = null;
    }
    if (this.ringModGain) {
      this.ringModGain.disconnect();
      this.ringModGain = null;
    }
  }

  public getDisguisedStream(): MediaStream {
    return this.destinationNode.stream;
  }

  public getActivePreset(): MaskPreset {
    return this.activePreset;
  }

  public dispose(): void {
    this.teardownRobotFX();
    if (this.pitchShiftNode) {
      this.pitchShiftNode.dispose();
      this.pitchShiftNode = null;
    }
    this.f1Node.disconnect();
    this.f2Node.disconnect();
    this.f3Node.disconnect();
    this.lpNode.disconnect();
    this.destinationNode.disconnect();
  }
}
