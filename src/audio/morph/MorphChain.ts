/**
 * MorphChain: Web Audio routing graph for real-time voice modification.
 *
 * mic → PitchShift(RubberBand|Tone) → F1 → F2 → F3 → LP
 *    → FX insert (robot | radio | bypass) → saturation
 *    → OutputStage (compress → makeup → soft-clip) → destination
 */

import * as Tone from 'tone';
import { createRubberBandNode, RubberBandNode } from './RubberBandNode';
import { MaskPreset, MASK_PRESETS } from './masks';
import { RobotFx } from './fx/robotFx';
import { RadioFx } from './fx/radioFx';
import { createTanhShaper } from './fx/saturation';
import { OutputStage } from '../mastering/outputStage';
import { DEFAULT_OUTPUT_PROFILE } from '../mastering/targets';

export class MorphChain {
  private ctx: AudioContext;
  private inputNode: MediaStreamAudioSourceNode | null = null;
  private rubberBandNode: RubberBandNode | null = null;
  private pitchShiftNode: Tone.PitchShift | null = null;
  private f1Node: BiquadFilterNode;
  private f2Node: BiquadFilterNode;
  private f3Node: BiquadFilterNode;
  private lpNode: BiquadFilterNode;
  private fxInsertIn: GainNode;
  private fxInsertOut: GainNode;
  private robotFx: RobotFx | null = null;
  private radioFx: RadioFx | null = null;
  private saturator: WaveShaperNode;
  private outputStage: OutputStage;
  private destinationNode: MediaStreamAudioDestinationNode;
  /** Tap for local monitor / output metering (post OutputStage). */
  private monitorTap: GainNode;
  private activePreset: MaskPreset = MASK_PRESETS.natural;
  private isWasmReady: boolean = false;
  private activeFx: 'none' | 'robot' | 'radio' = 'none';

  constructor(ctx: AudioContext) {
    this.ctx = ctx;

    this.f1Node = ctx.createBiquadFilter();
    this.f1Node.type = 'peaking';

    this.f2Node = ctx.createBiquadFilter();
    this.f2Node.type = 'peaking';

    this.f3Node = ctx.createBiquadFilter();
    this.f3Node.type = 'peaking';

    this.lpNode = ctx.createBiquadFilter();
    this.lpNode.type = 'lowpass';
    this.lpNode.Q.value = 0.707;

    // FX insert bus (dry-through until an FX is armed).
    this.fxInsertIn = ctx.createGain();
    this.fxInsertOut = ctx.createGain();

    // Gentle always-on warmth after FX.
    this.saturator = createTanhShaper(ctx, 1.05, 1);

    this.outputStage = new OutputStage(ctx);
    this.outputStage.applyProfile(DEFAULT_OUTPUT_PROFILE);

    this.destinationNode = ctx.createMediaStreamDestination();
    this.monitorTap = ctx.createGain();
    this.monitorTap.gain.value = 1;

    // Cascade: filters → FX bus → saturator → output stage → out
    this.f1Node.connect(this.f2Node);
    this.f2Node.connect(this.f3Node);
    this.f3Node.connect(this.lpNode);
    this.lpNode.connect(this.fxInsertIn);
    this.fxInsertOut.connect(this.saturator);
    this.saturator.connect(this.outputStage.input);
    this.outputStage.output.connect(this.destinationNode);
    this.outputStage.output.connect(this.monitorTap);

    // Default dry-through on the FX bus.
    this.fxInsertIn.connect(this.fxInsertOut);

    this.applyPreset(MASK_PRESETS.natural, 0);
  }

  public async connectSource(source: MediaStreamAudioSourceNode): Promise<void> {
    this.inputNode = source;

    try {
      const processorUrl = '/rubberband-processor.js';
      this.rubberBandNode = await createRubberBandNode(this.ctx, processorUrl);
      this.rubberBandNode.setHighQuality(true);
      this.inputNode.connect(this.rubberBandNode);
      this.rubberBandNode.connect(this.f1Node);
      this.isWasmReady = true;
      this.applyPitchRatio(this.activePreset.pitchShift);
      return;
    } catch {
      this.isWasmReady = false;
    }

    // Fallback: Tone.PitchShift with 50 ms voice window (spec-aligned).
    this.pitchShiftNode = new Tone.PitchShift({
      pitch: 0,
      windowSize: 0.05,
      delayTime: 0,
      feedback: 0,
      wet: 1.0,
    });

    // Tone.js ToneAudioNode to native Web Audio connection
    try {
      if ((this.pitchShiftNode as any).input && (this.pitchShiftNode as any).output) {
        this.inputNode.connect((this.pitchShiftNode as any).input);
        (this.pitchShiftNode as any).output.connect(this.f1Node);
      } else {
        Tone.connect(this.inputNode as any, this.pitchShiftNode as any);
        Tone.connect(this.pitchShiftNode as any, this.f1Node as any);
      }
    } catch {
      // Fallback: direct connection from mic input into formant cascade
      this.inputNode.connect(this.f1Node);
    }
  }

  public applyPreset(preset: MaskPreset, transitionTime: number = 0.05): void {
    this.activePreset = preset;
    const now = this.ctx.currentTime;
    const ramp = Math.max(0.01, transitionTime);

    this.applyPitchRatio(preset.pitchShift);

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

    this.routeFx(preset);
  }

  /** Wire the FX insert bus for the active preset (robot | radio | bypass). */
  private routeFx(preset: MaskPreset): void {
    const fxType = preset.fxType ?? 'none';

    // Disconnect previous insert routing.
    try {
      this.fxInsertIn.disconnect();
    } catch {
      // not connected
    }

    if (this.robotFx) {
      try {
        this.robotFx.input.disconnect();
        this.robotFx.output.disconnect();
      } catch {
        // ignore
      }
      this.robotFx.dispose();
      this.robotFx = null;
    }
    if (this.radioFx) {
      try {
        this.radioFx.input.disconnect();
        this.radioFx.output.disconnect();
      } catch {
        // ignore
      }
      this.radioFx.dispose();
      this.radioFx = null;
    }

    if (fxType === 'robot') {
      this.robotFx = new RobotFx(
        this.ctx,
        preset.fxParams?.carrierFreq ?? 45,
        preset.fxParams?.bitDepth ?? 6,
        0.85
      );
      this.fxInsertIn.connect(this.robotFx.input);
      this.robotFx.output.connect(this.fxInsertOut);
      this.activeFx = 'robot';
      return;
    }

    if (fxType === 'radio') {
      this.radioFx = new RadioFx(
        this.ctx,
        preset.fxParams?.bandpassLow ?? 350,
        preset.fxParams?.bandpassHigh ?? 3000,
        0.025
      );
      this.fxInsertIn.connect(this.radioFx.input);
      this.radioFx.output.connect(this.fxInsertOut);
      this.activeFx = 'radio';
      return;
    }

    this.fxInsertIn.connect(this.fxInsertOut);
    this.activeFx = 'none';
  }

  public getOutputStage(): OutputStage {
    return this.outputStage;
  }

  /** Post-stage tap for monitor gain / output analyser. */
  public getMonitorTap(): GainNode {
    return this.monitorTap;
  }

  public getActiveFx(): 'none' | 'robot' | 'radio' {
    return this.activeFx;
  }

  public getDisguisedStream(): MediaStream {
    return this.destinationNode.stream;
  }

  public getActivePreset(): MaskPreset {
    return this.activePreset;
  }

  public dispose(): void {
    if (this.robotFx) {
      this.robotFx.dispose();
      this.robotFx = null;
    }
    if (this.radioFx) {
      this.radioFx.dispose();
      this.radioFx = null;
    }
    if (this.rubberBandNode) {
      try {
        this.rubberBandNode.close();
      } catch {
        // Ignored
      }
      this.rubberBandNode.disconnect();
      this.rubberBandNode = null;
    }
    if (this.pitchShiftNode) {
      this.pitchShiftNode.dispose();
      this.pitchShiftNode = null;
    }
    this.f1Node.disconnect();
    this.f2Node.disconnect();
    this.f3Node.disconnect();
    this.lpNode.disconnect();
    this.fxInsertIn.disconnect();
    this.fxInsertOut.disconnect();
    this.saturator.disconnect();
    this.outputStage.dispose();
    this.monitorTap.disconnect();
    this.destinationNode.disconnect();
  }
}
