import { seededRandom } from './model';

type Root = { midi: number; velocity_layers: Array<{ velocity: number; round_robins: string[] }> };
type Manifest = { roots: Root[]; release_seconds: number };

/** Loads only the sample notes used by a pattern. Source: CC0 FreePats Fender clean bank. */
export class GuitarSampleBank {
  private manifest: Manifest | null = null;
  private readonly buffers = new Map<string, Promise<AudioBuffer>>();
  private decodeQueue: Promise<void> = Promise.resolve();

  private async getManifest(): Promise<Manifest> {
    if (!this.manifest) {
      const response = await fetch(`${import.meta.env.BASE_URL}audio/guitar/freepats-fsbs-clean/manifest.json`);
      if (!response.ok) throw new Error('ギター音源のマニフェストを読み込めません。');
      this.manifest = await response.json() as Manifest;
    }
    return this.manifest;
  }

  private async resolve(context: BaseAudioContext, pitch: number, velocity: number, seed: string, round: number): Promise<{ buffer: AudioBuffer; rate: number } | null> {
    const manifest = await this.getManifest();
    const root = manifest.roots.reduce((best, item) => Math.abs(item.midi - pitch) < Math.abs(best.midi - pitch) ? item : best);
    const layer = root.velocity_layers.reduce((best, item) => Math.abs(item.velocity - velocity) < Math.abs(best.velocity - velocity) ? item : best);
    if (!layer.round_robins.length) return null;
    const rr = (Math.floor(seededRandom(`${seed}|${pitch}`)() * layer.round_robins.length) + round) % layer.round_robins.length;
    const file = layer.round_robins[rr];
    let loading = this.buffers.get(file);
    if (!loading) {
      loading = fetch(`${import.meta.env.BASE_URL}audio/guitar/freepats-fsbs-clean/${encodeURIComponent(file)}`)
        .then((response) => { if (!response.ok) throw new Error(`サンプルを読み込めません: ${file}`); return response.arrayBuffer(); })
        .then((data) => {
          // Mobile Safari and low-memory browsers are less reliable when many
          // OGG clips are decoded at once. Fetch in parallel, decode in order.
          const decoded = this.decodeQueue.then(() => context.decodeAudioData(data));
          this.decodeQueue = decoded.then(() => undefined, () => undefined);
          return decoded.catch((error: unknown) => {
            throw new Error(`ギターサンプルをデコードできません: ${file}`, { cause: error });
          });
        });
      this.buffers.set(file, loading);
    }
    return { buffer: await loading, rate: 2 ** ((pitch - root.midi) / 12) };
  }

  async prepare(context: BaseAudioContext, pitches: Array<{ pitch: number; accent: boolean }>, seed: string): Promise<void> {
    await Promise.all(pitches.flatMap((note) => [0, 1, 2, 3].map((round) => this.resolve(context, note.pitch, note.accent ? 112 : 74, seed, round))));
  }

  async play(context: BaseAudioContext, destination: AudioNode, pitch: number, accent: boolean, gate: number, seed: string, round: number, drive: number, tone: number, space: number, time: number, palmMute = false): Promise<void> {
    const voice = await this.resolve(context, pitch, accent ? 112 : 74, seed, round);
    if (!voice || context.state === 'closed') return;
    const source = context.createBufferSource();
    source.buffer = voice.buffer;
    source.playbackRate.value = voice.rate;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = palmMute ? 1_450 : 900 + tone * 7_100; filter.Q.value = 0.7;
    const dcBlock = context.createBiquadFilter();
    dcBlock.type = 'highpass'; dcBlock.frequency.value = 75; dcBlock.Q.value = 0.5;
    const shaper = context.createWaveShaper();
    const curve = new Float32Array(2048);
    const amount = drive / 100 * 6;
    for (let i = 0; i < curve.length; i++) {
      const x = i * 2 / (curve.length - 1) - 1;
      const driven = Math.tanh(x * (1 + amount) + 0.12 * x * x);
      curve[i] = amount === 0 ? x : x * 0.22 + driven * 0.78;
    }
    shaper.curve = curve;
    const envelope = context.createGain();
    const start = Math.max(context.currentTime + 0.003, time);
    const end = start + Math.max(0.045, palmMute ? gate * 0.36 : gate);
    const release = palmMute ? 0.12 : (this.manifest?.release_seconds ?? 1.1);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(accent ? 0.56 : 0.38, start + 0.006);
    envelope.gain.setTargetAtTime(0.0001, end, release / 5);
    source.connect(shaper); shaper.connect(dcBlock); dcBlock.connect(filter); filter.connect(envelope); envelope.connect(destination);
    source.start(start);
    source.stop(end + release);
    if (space > 0) {
      const delay = context.createDelay(0.25); delay.delayTime.value = 0.055;
      const echo = context.createGain(); echo.gain.value = space * 0.22;
      envelope.connect(delay); delay.connect(echo); echo.connect(destination);
    }
  }
}
