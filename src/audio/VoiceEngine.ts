/**
 * VoiceEngine: Manages the Web Audio API AudioContext lifecycle,
 * mic stream acquisition with raw hardware constraints, and analysis tap.
 */
import { MorphChain } from './morph/MorphChain';
import { MaskPreset, MASK_PRESETS } from './morph/masks';

export class VoiceEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private morphChain: MorphChain | null = null;
  private monitorGainNode: GainNode | null = null;
  private isMonitoring: boolean = false;
  private isUnlocked: boolean = false;

  public async unlockAudioContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: 'interactive' });
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.isUnlocked = true;
    return this.ctx;
  }

  public async acquireMicrophone(): Promise<MediaStream> {
    if (!this.ctx) {
      await this.unlockAudioContext();
    }

    // Constraints enforce raw audio tap: disable AEC, AGC, and NS for accurate DSP analysis
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1
      },
      video: false
    };

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.setupAnalysisPipeline();
      return this.micStream;
    } catch (err) {
      throw new Error(`Microphone acquisition failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private setupAnalysisPipeline(): void {
    if (!this.ctx || !this.micStream) return;

    this.sourceNode = this.ctx.createMediaStreamSource(this.micStream);
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.2;

    // Connect raw mic stream directly to AnalyserNode (Analysis path)
    this.sourceNode.connect(this.analyserNode);

    // Initialize MorphChain on separate transmit path
    this.morphChain = new MorphChain(this.ctx);
    this.morphChain.connectSource(this.sourceNode);

    // Setup feedback-guarded local monitoring node
    this.monitorGainNode = this.ctx.createGain();
    this.monitorGainNode.gain.value = 0; // Muted by default to prevent feedback howl
    const morphedStream = this.morphChain.getDisguisedStream();
    const morphedSource = this.ctx.createMediaStreamSource(morphedStream);
    morphedSource.connect(this.monitorGainNode);
    this.monitorGainNode.connect(this.ctx.destination);
  }

  public setLocalMonitoring(enabled: boolean, volume: number = 0.8): void {
    this.isMonitoring = enabled;
    if (this.monitorGainNode && this.ctx) {
      const now = this.ctx.currentTime;
      const targetGain = enabled ? Math.max(0, Math.min(1.0, volume)) : 0;
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

  public getMorphedStream(): MediaStream | null {
    return this.morphChain ? this.morphChain.getDisguisedStream() : null;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
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
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
    this.isUnlocked = false;
  }
}

export const voiceEngine = new VoiceEngine();
