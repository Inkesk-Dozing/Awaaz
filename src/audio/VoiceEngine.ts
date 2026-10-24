/**
 * VoiceEngine: Manages the Web Audio API AudioContext lifecycle,
 * mic stream acquisition, analysis tap (raw), output tap (morphed),
 * and output-stage calibration hooks.
 */
import * as Tone from 'tone';
import { MorphChain } from './morph/MorphChain';
import { MaskPreset, MASK_PRESETS } from './morph/masks';
import { OutputProfileId, OUTPUT_PROFILES, OutputProfileParams } from './mastering/targets';
import { OutputCalibrationProfile } from './calibration/outputCalibration';

export class VoiceEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private outputAnalyserNode: AnalyserNode | null = null;
  private preMorphAnalyserNode: AnalyserNode | null = null;
  private morphChain: MorphChain | null = null;
  private monitorGainNode: GainNode | null = null;
  private isMonitoring: boolean = false;
  private isUnlocked: boolean = false;
  private outputProfileId: OutputProfileId = 'broadcast';

  public async unlockAudioContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: 'interactive' });
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    try {
      Tone.setContext(this.ctx);
      await Tone.start();
    } catch {
      // Ignored if already started
    }

    this.isUnlocked = true;
    return this.ctx;
  }

  public async acquireMicrophone(): Promise<MediaStream> {
    if (!this.ctx) {
      await this.unlockAudioContext();
    }

    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
      video: false,
    };

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.setupAnalysisPipeline();
      return this.micStream;
    } catch (err) {
      throw new Error(
        `Microphone acquisition failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  private setupAnalysisPipeline(): void {
    if (!this.ctx || !this.micStream) return;

    this.sourceNode = this.ctx.createMediaStreamSource(this.micStream);

    // RAW analysis path (stress DSP) — never morphed.
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.2;
    this.sourceNode.connect(this.analyserNode);

    // Pre-morph meter tap (same raw signal, for output calibration input RMS).
    this.preMorphAnalyserNode = this.ctx.createAnalyser();
    this.preMorphAnalyserNode.fftSize = 2048;
    this.preMorphAnalyserNode.smoothingTimeConstant = 0;
    this.sourceNode.connect(this.preMorphAnalyserNode);

    this.morphChain = new MorphChain(this.ctx);
    this.morphChain.connectSource(this.sourceNode);

    // Post-stage morphed analyser (output calibration output RMS/peak).
    this.outputAnalyserNode = this.ctx.createAnalyser();
    this.outputAnalyserNode.fftSize = 2048;
    this.outputAnalyserNode.smoothingTimeConstant = 0;
    this.morphChain.getMonitorTap().connect(this.outputAnalyserNode);

    // Feedback-guarded local monitoring (soft-limited, muted by default).
    this.monitorGainNode = this.ctx.createGain();
    this.monitorGainNode.gain.value = 0;
    const morphedStream = this.morphChain.getDisguisedStream();
    const morphedSource = this.ctx.createMediaStreamSource(morphedStream);
    morphedSource.connect(this.monitorGainNode);
    this.monitorGainNode.connect(this.ctx.destination);
  }

  public setLocalMonitoring(enabled: boolean, volume: number = 0.5): void {
    this.isMonitoring = enabled;
    if (this.monitorGainNode && this.ctx) {
      const now = this.ctx.currentTime;
      // Cap default monitor level for headphone safety.
      const safe = Math.max(0, Math.min(0.7, volume));
      const targetGain = enabled ? safe : 0;
      this.monitorGainNode.gain.setTargetAtTime(targetGain, now, 0.05);
    }
  }

  public getIsMonitoring(): boolean {
    return this.isMonitoring;
  }

  public setMask(presetId: string): void {
    const preset = MASK_PRESETS[presetId] || MASK_PRESETS.natural;
    if (this.morphChain) {
      this.morphChain.applyPreset(preset);
    }
  }

  public setCustomMask(preset: MaskPreset): void {
    if (this.morphChain) {
      this.morphChain.applyPreset(preset);
    }
  }

  /** Select a mastering profile (broadcast | clean | punchy). */
  public setOutputProfile(id: OutputProfileId): void {
    this.outputProfileId = id;
    const params: OutputProfileParams = OUTPUT_PROFILES[id] ?? OUTPUT_PROFILES.broadcast;
    this.morphChain?.getOutputStage().applyProfile(params);
  }

  public getOutputProfileId(): OutputProfileId {
    return this.outputProfileId;
  }

  /** Manual master makeup gain trim (dB) on the OutputStage. */
  public setMasterMakeupGain(db: number): void {
    this.morphChain?.getOutputStage().setMakeupGainDb(db);
  }

  public getMasterMakeupGain(): number {
    return this.morphChain?.getOutputStage().getMakeupGainDb() ?? 0;
  }

  /** Apply a solved output calibration profile to the OutputStage. */
  public applyOutputCalibration(profile: OutputCalibrationProfile): void {
    const stage = this.morphChain?.getOutputStage();
    if (!stage) return;
    stage.setPreGainDb(profile.preGainDb);
    stage.setMakeupGainDb(profile.makeupGainDb);
    stage.setPeakCeilingDb(profile.peakCeilingDb);
  }

  public getMorphedStream(): MediaStream | null {
    return this.morphChain ? this.morphChain.getDisguisedStream() : null;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public getPreMorphAnalyser(): AnalyserNode | null {
    return this.preMorphAnalyserNode;
  }

  public getOutputAnalyser(): AnalyserNode | null {
    return this.outputAnalyserNode;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getRawStream(): MediaStream | null {
    return this.micStream;
  }

  public getUnlockedStatus(): boolean {
    return this.isUnlocked && this.ctx?.state === 'running';
  }

  public dispose(): void {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.morphChain) {
      this.morphChain.dispose();
      this.morphChain = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
    if (this.preMorphAnalyserNode) {
      this.preMorphAnalyserNode.disconnect();
      this.preMorphAnalyserNode = null;
    }
    if (this.outputAnalyserNode) {
      this.outputAnalyserNode.disconnect();
      this.outputAnalyserNode = null;
    }
    if (this.monitorGainNode) {
      this.monitorGainNode.disconnect();
      this.monitorGainNode = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
    this.isUnlocked = false;
  }
}

export const voiceEngine = new VoiceEngine();
