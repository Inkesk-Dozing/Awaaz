/**
 * VoiceEngine: Manages the Web Audio API AudioContext lifecycle,
 * mic stream acquisition with raw hardware constraints, and analysis tap.
 */
export class VoiceEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
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

    // Connect raw mic stream directly to AnalyserNode
    this.sourceNode.connect(this.analyserNode);
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
