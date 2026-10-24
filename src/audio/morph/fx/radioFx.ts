/**
 * Radio Operator FX insert: bandpass window + optional noise static bed.
 * input → highpass → lowpass → (+ static) → output
 */

export class RadioFx {
  public readonly input: GainNode;
  public readonly output: GainNode;

  private ctx: BaseAudioContext;
  private hp: BiquadFilterNode;
  private lp: BiquadFilterNode;
  private presence: BiquadFilterNode;
  private staticGain: GainNode;
  private noiseSrc: AudioBufferSourceNode | null = null;

  constructor(
    ctx: BaseAudioContext,
    bandLow: number = 350,
    bandHigh: number = 3000,
    staticLevel: number = 0.025
  ) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();

    this.hp = ctx.createBiquadFilter();
    this.hp.type = 'highpass';
    this.hp.frequency.value = Math.max(50, bandLow);
    this.hp.Q.value = 0.7;

    this.lp = ctx.createBiquadFilter();
    this.lp.type = 'lowpass';
    this.lp.frequency.value = Math.max(this.hp.frequency.value + 100, bandHigh);
    this.lp.Q.value = 0.7;

    // Mid presence bump for "walkie" character.
    this.presence = ctx.createBiquadFilter();
    this.presence.type = 'peaking';
    this.presence.frequency.value = 1800;
    this.presence.gain.value = 4;
    this.presence.Q.value = 1.2;

    this.input.connect(this.hp);
    this.hp.connect(this.lp);
    this.lp.connect(this.presence);
    this.presence.connect(this.output);

    // Static bed: looped white noise at low level, summed after voice.
    this.staticGain = ctx.createGain();
    this.staticGain.gain.value = Math.max(0, Math.min(0.15, staticLevel));
    this.noiseSrc = this.createNoiseSource();
    this.noiseSrc.connect(this.staticGain);
    this.staticGain.connect(this.output);
  }

  private createNoiseSource(): AudioBufferSourceNode {
    const len = Math.floor(this.ctx.sampleRate * 1.5);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.start();
    return src;
  }

  public setBands(bandLow: number, bandHigh: number): void {
    const now = this.ctx.currentTime;
    const lo = Math.max(50, bandLow);
    const hi = Math.max(lo + 100, bandHigh);
    this.hp.frequency.setTargetAtTime(lo, now, 0.05);
    this.lp.frequency.setTargetAtTime(hi, now, 0.05);
  }

  public setStaticLevel(level: number): void {
    this.staticGain.gain.setTargetAtTime(
      Math.max(0, Math.min(0.15, level)),
      this.ctx.currentTime,
      0.05
    );
  }

  public dispose(): void {
    try {
      this.noiseSrc?.stop();
    } catch {
      // already stopped
    }
    this.noiseSrc?.disconnect();
    this.staticGain.disconnect();
    this.hp.disconnect();
    this.lp.disconnect();
    this.presence.disconnect();
    this.input.disconnect();
    this.output.disconnect();
  }
}
