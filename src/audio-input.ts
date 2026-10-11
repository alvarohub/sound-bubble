export interface AudioLevelConfig {
  noiseFloor: number;
  gain: number;
  attackSeconds: number;
  releaseSeconds: number;
}

export const DEFAULT_AUDIO_CONFIG: AudioLevelConfig = {
  noiseFloor: 0.012,
  gain: 18,
  attackSeconds: 0.05,
  releaseSeconds: 0.25,
};

export function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.sqrt(sum / samples.length);
}

export function smoothLevel(current: number, target: number, deltaSeconds: number, config = DEFAULT_AUDIO_CONFIG): number {
  const safeTarget = Math.min(1, Math.max(0, target));
  const timeConstant = safeTarget > current ? config.attackSeconds : config.releaseSeconds;
  const amount = 1 - Math.exp(-deltaSeconds / timeConstant);
  return current + (safeTarget - current) * amount;
}

export class AudioInput {
  private readonly samples = new Float32Array(1024);
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private level = 0;

  public get active(): boolean {
    return this.analyser !== null;
  }

  public async enable(): Promise<void> {
    if (this.active) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { autoGainControl: false, echoCancellation: false, noiseSuppression: false },
    });
    this.context = new AudioContext();
    await this.context.resume();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.context.createMediaStreamSource(this.stream).connect(this.analyser);
  }

  public read(deltaSeconds: number): number {
    if (!this.analyser) return 0;
    this.analyser.getFloatTimeDomainData(this.samples);
    const raw = Math.min(1, Math.max(0, (rms(this.samples) - DEFAULT_AUDIO_CONFIG.noiseFloor) * DEFAULT_AUDIO_CONFIG.gain));
    this.level = smoothLevel(this.level, raw, deltaSeconds);
    return this.level;
  }

  public async stop(): Promise<void> {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.analyser = null;
    await this.context?.close();
    this.context = null;
    this.level = 0;
  }
}