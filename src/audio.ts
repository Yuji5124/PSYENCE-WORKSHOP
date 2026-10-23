import { seededRandom, type Experiment } from './model';

type AudioContextCtor = typeof AudioContext & { new (...args: ConstructorParameters<typeof AudioContext>): AudioContext };

function audioContextConstructor(): AudioContextCtor {
  const root = window as typeof window & { webkitAudioContext?: AudioContextCtor };
  const constructor = window.AudioContext ?? root.webkitAudioContext;
  if (!constructor) throw new Error('このブラウザはWeb Audioに対応していません。');
  return constructor;
}

function makeNoiseBuffer(context: BaseAudioContext, seed: string): AudioBuffer {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.3), context.sampleRate);
  const data = buffer.getChannelData(0);
  const random = seededRandom(`${seed}|drum-noise`);
  for (let index = 0; index < data.length; index += 1) data[index] = random() * 2 - 1;
  return buffer;
}

const curveCache = new Map<number, Float32Array<ArrayBuffer>>();
function distortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const key = Math.round(amount * 1000);
  const cached = curveCache.get(key);
  if (cached) return cached;
  const samples = 44_100;
  const curve = new Float32Array(samples);
  const k = amount * 3.2;
  const normalization = k ? Math.tanh(1 + k) : 1;
  for (let index = 0; index < samples; index += 1) {
    const x = (index * 2) / (samples - 1) - 1;
    curve[index] = k ? Math.tanh(x * (1 + k)) / normalization : x;
  }
  curveCache.set(key, curve);
  return curve;
}

function makeGraph(context: BaseAudioContext, analyser?: AnalyserNode) {
  const master = context.createGain();
  master.gain.value = 0.7;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -9;
  compressor.knee.value = 14;
  compressor.ratio.value = 8;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.16;
  master.connect(compressor);
  if (analyser) {
    compressor.connect(analyser);
    analyser.connect(context.destination);
  } else {
    compressor.connect(context.destination);
  }
  return master;
}

function scheduleGuitar(context: BaseAudioContext, master: AudioNode, time: number, pitch: number, gateSeconds: number, accent: boolean, tone: Experiment['tone']) {
  const frequency = 440 * 2 ** ((pitch - 69) / 12);
  const end = time + Math.max(0.09, gateSeconds);
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, time);
  envelope.gain.linearRampToValueAtTime(accent ? 0.27 : 0.18, time + 0.008);
  envelope.gain.exponentialRampToValueAtTime(accent ? 0.105 : 0.065, time + 0.075);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(tone.filter, time);
  filter.Q.value = 0.72;
  const shaper = context.createWaveShaper();
  shaper.curve = distortionCurve(tone.distortion / 100) as Float32Array<ArrayBuffer>;
  shaper.oversample = '4x';
  shaper.connect(filter);
  filter.connect(envelope);
  envelope.connect(master);

  for (const [type, cents, level] of [['sawtooth', -4, 0.65], ['square', 4, 0.2]] as const) {
    const oscillator = context.createOscillator();
    const voiceGain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency * 0.94, time);
    oscillator.frequency.exponentialRampToValueAtTime(frequency, time + 0.035);
    oscillator.detune.value = cents;
    voiceGain.gain.value = level;
    oscillator.connect(voiceGain);
    voiceGain.connect(shaper);
    oscillator.start(time);
    oscillator.stop(end + 0.015);
  }
}

function scheduleKick(context: BaseAudioContext, master: AudioNode, time: number) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(145, time);
  oscillator.frequency.exponentialRampToValueAtTime(43, time + 0.13);
  envelope.gain.setValueAtTime(0.72, time);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.23);
  oscillator.connect(envelope);
  envelope.connect(master);
  oscillator.start(time);
  oscillator.stop(time + 0.24);
}

function scheduleNoise(context: BaseAudioContext, master: AudioNode, noiseBuffer: AudioBuffer, time: number, kind: 'snare' | 'hat') {
  const source = context.createBufferSource();
  source.buffer = noiseBuffer;
  const filter = context.createBiquadFilter();
  filter.type = kind === 'hat' ? 'highpass' : 'bandpass';
  filter.frequency.value = kind === 'hat' ? 7200 : 1850;
  filter.Q.value = kind === 'hat' ? 0.5 : 0.75;
  const envelope = context.createGain();
  const duration = kind === 'hat' ? 0.055 : 0.17;
  envelope.gain.setValueAtTime(kind === 'hat' ? 0.09 : 0.24, time);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(master);
  source.start(time);
  source.stop(time + duration + 0.005);
  if (kind === 'snare') {
    const body = context.createOscillator();
    const bodyGain = context.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(190, time);
    body.frequency.exponentialRampToValueAtTime(105, time + 0.075);
    bodyGain.gain.setValueAtTime(0.16, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);
    body.connect(bodyGain);
    bodyGain.connect(master);
    body.start(time);
    body.stop(time + 0.12);
  }
}

function scheduleStep(context: BaseAudioContext, master: AudioNode, noise: AudioBuffer, experiment: Experiment, step: number, time: number) {
  const drum = experiment.drums[step];
  if (drum.kick) scheduleKick(context, master, time);
  if (drum.snare) scheduleNoise(context, master, noise, time, 'snare');
  if (drum.hat) scheduleNoise(context, master, noise, time, 'hat');
  if (step % 2 === 0) {
    const riff = experiment.riff[step / 2];
    if (riff.pitch !== null) scheduleGuitar(context, master, time, riff.pitch, (60 / experiment.bpm / 2) * riff.length * 0.92, riff.accent, experiment.tone);
  }
}

export class LiveAudioEngine {
  private context: AudioContext | null = null;
  private master: AudioNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noise: AudioBuffer | null = null;
  private playback: Experiment | null = null;
  private pending: Experiment | null = null;
  private interval: number | null = null;
  private nextTime = 0;
  private step = 0;
  private onStep: ((step: number, time: number) => void) | null = null;

  get visualizationNode(): AnalyserNode | null {
    return this.analyser;
  }

  async play(experiment: Experiment, onStep: (step: number, time: number) => void): Promise<void> {
    if (this.context && this.context.state !== 'closed') await this.stop();
    const Constructor = audioContextConstructor();
    const context = new Constructor();
    this.context = context;
    await context.resume();
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.master = makeGraph(context, this.analyser);
    this.playback = structuredClone(experiment);
    this.pending = null;
    this.noise = makeNoiseBuffer(context, experiment.seed);
    this.onStep = onStep;
    this.step = 0;
    this.nextTime = context.currentTime + 0.12;
    this.interval = window.setInterval(() => this.scheduleAhead(), 25);
  }

  update(experiment: Experiment): void {
    if (!this.context || !this.playback || this.context.state === 'closed') return;
    this.pending = structuredClone(experiment);
  }

  async stop(): Promise<void> {
    if (this.interval !== null) window.clearInterval(this.interval);
    this.interval = null;
    const context = this.context;
    this.context = null;
    this.master = null;
    this.analyser = null;
    this.noise = null;
    this.playback = null;
    this.pending = null;
    this.onStep = null;
    if (context && context.state !== 'closed') await context.close();
  }

  private scheduleAhead(): void {
    if (!this.context || !this.master || !this.playback || !this.noise) return;
    const horizon = this.context.currentTime + 0.12;
    while (this.nextTime < horizon) {
      if (this.step === 0 && this.pending) {
        this.playback = this.pending;
        this.pending = null;
        this.noise = makeNoiseBuffer(this.context, this.playback.seed);
      }
      scheduleStep(this.context, this.master, this.noise, this.playback, this.step, this.nextTime);
      const step = this.step;
      const scheduledAt = this.nextTime;
      const delay = Math.max(0, (scheduledAt - this.context.currentTime) * 1000);
      window.setTimeout(() => this.onStep?.(step, scheduledAt), delay);
      this.nextTime += 60 / this.playback.bpm / 4;
      this.step = (this.step + 1) % 16;
    }
  }
}

export async function renderWav(experiment: Experiment): Promise<Blob> {
  const barSeconds = 60 / experiment.bpm * 4;
  const duration = barSeconds * 4;
  const context = new OfflineAudioContext(2, Math.ceil(duration * 44_100), 44_100);
  const master = makeGraph(context);
  const noise = makeNoiseBuffer(context, experiment.seed);
  const sixteenth = 60 / experiment.bpm / 4;
  for (let bar = 0; bar < 4; bar += 1) {
    for (let step = 0; step < 16; step += 1) {
      scheduleStep(context, master, noise, experiment, step, bar * barSeconds + step * sixteenth + 0.01);
    }
  }
  const rendered = await context.startRendering();
  return new Blob([encodeWav(rendered)], { type: 'audio/wav' });
}

function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const channels = buffer.numberOfChannels;
  const frames = buffer.length;
  const bytesPerSample = 2;
  const dataSize = frames * channels * bytesPerSample;
  const output = new ArrayBuffer(44 + dataSize);
  const view = new DataView(output);
  const writeText = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index));
  };
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, dataSize, true);
  const channelData = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));
  let offset = 44;
  for (let frame = 0; frame < frames; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][frame]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return output;
}
