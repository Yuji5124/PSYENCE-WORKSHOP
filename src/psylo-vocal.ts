import spec from './psylo-vocal.json';

/** PSYLO Phase 1 — sung vocal (pre-rendered with VOICEVOX by tools/psylo-vocal.mjs) and the mix buses. */
export type VocalVersion = 'FULL' | 'SHORT';
export type VocalVoice = 'RITSU' | 'TAKEHIRO';
export type VocalStyle = 'STRAIGHT' | 'ROCK' | 'WILD';
export type GuideMode = 'off' | 'before' | 'after';
export type Levels = { vocal: number; guitar: number; bass: number; drums: number };

export type VocalNote = { lyric: string; reading: string; midi: number; start: number; dur: number; vel: number; hook?: 'sa' | 'i' | 'ro' };

export const VOCAL_BPM = spec.bpm;
export const vocalSpec = spec;
export const STYLE_LABEL: Record<VocalStyle, string> = { STRAIGHT: 'A / STRAIGHT', ROCK: 'B / ROCK', WILD: 'C / WILD' };

export function vocalNotes(version: VocalVersion): VocalNote[] {
  return spec.versions[version].notes as VocalNote[];
}

export function vocalFile(voice: VocalVoice, version: VocalVersion, style: VocalStyle): string {
  return `audio/psylo/vocal/${voice}-${version}-${style}.wav`;
}

/** seconds from bar 1 beat 1 for the サ / イ / ロー hook at the given tempo */
export function hookWindow(version: VocalVersion, bpm = VOCAL_BPM) {
  const spb = 60 / bpm;
  const n = vocalNotes(version);
  const sa = n.find((x) => x.hook === 'sa')!;
  const i = n.find((x) => x.hook === 'i')!;
  const ro = n.find((x) => x.hook === 'ro')!;
  return { sa: sa.start * spb, i: i.start * spb, ro: ro.start * spb, end: (ro.start + ro.dur) * spb, roMidi: ro.midi };
}

/** index of the note sounding at `t` seconds after bar 1 beat 1 (or -1) */
export function noteAt(version: VocalVersion, t: number, bpm = VOCAL_BPM): number {
  const spb = 60 / bpm;
  return vocalNotes(version).findIndex((n) => t >= n.start * spb && t < (n.start + n.dur) * spb);
}

export const midiName = (m: number) => `${['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][m % 12]}${Math.floor(m / 12) - 1}`;

// ---- audio ----------------------------------------------------------------------------------
export type Buses = {
  guitar: GainNode; guitarDuck: GainNode; bass: GainNode; bassDuck: GainNode; drums: GainNode; fx: GainNode; guide: GainNode; vocal: GainNode; vocalIn: AudioNode;
};

/**
 * One gain per part (user level) after one automation gain (ducking), all into `out`.
 * Vocal: high-pass 110 Hz → gentle compressor → +2.5 dB presence at 3 kHz → level, plus a short slap.
 */
export function buildBuses(ctx: BaseAudioContext, out: AudioNode, levels: Levels): Buses {
  const level = (v: number) => { const g = ctx.createGain(); g.gain.value = v; g.connect(out); return g; };
  const guitar = level(levels.guitar);
  const guitarDuck = ctx.createGain(); guitarDuck.connect(guitar);
  const bass = level(levels.bass);
  const bassDuck = ctx.createGain(); bassDuck.connect(bass);
  // keep the bass out of the kick's lowest octave
  const drums = level(levels.drums);
  const fx = ctx.createGain(); fx.gain.value = 1; fx.connect(drums);
  const guide = level(0.9);
  const vocal = level(levels.vocal);
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 110; hp.Q.value = 0.7;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.006; comp.release.value = 0.12; comp.knee.value = 8;
  const presence = ctx.createBiquadFilter(); presence.type = 'peaking'; presence.frequency.value = 3000; presence.Q.value = 0.9; presence.gain.value = 2.5;
  const makeup = ctx.createGain(); makeup.gain.value = 1.6;
  hp.connect(comp); comp.connect(presence); presence.connect(makeup); makeup.connect(vocal);
  const slap = ctx.createDelay(0.5); slap.delayTime.value = 0.11;
  const slapGain = ctx.createGain(); slapGain.gain.value = 0.16;
  makeup.connect(slap); slap.connect(slapGain); slapGain.connect(vocal);
  return { guitar, guitarDuck, bass, bassDuck, drums, fx, guide, vocal, vocalIn: hp };
}

/** sidechain-style duck: the bass dips for 90 ms on each kick so the two don't fight */
export function duckBassOnKick(b: Buses, at: number): void {
  const g = b.bassDuck.gain;
  g.setValueAtTime(1, Math.max(0, at - 0.002));
  g.linearRampToValueAtTime(0.45, at + 0.006);
  g.linearRampToValueAtTime(1, at + 0.09);
}

/** the guitar steps back 2 dB from サ and 3 dB under the final ロー, so the hook stays clear */
export function duckGuitarUnderHook(b: Buses, sa: number, ro: number, end: number): void {
  const g = b.guitarDuck.gain;
  g.setValueAtTime(1, sa - 0.03);
  g.linearRampToValueAtTime(0.8, sa + 0.02);
  g.setValueAtTime(0.8, ro - 0.03);
  g.linearRampToValueAtTime(0.7, ro + 0.02);
  g.setValueAtTime(0.7, end);
  g.linearRampToValueAtTime(1, end + 0.25);
}

/** master: the existing glue compressor, then a fast limiter so the summed mix cannot clip */
export function buildMaster(ctx: BaseAudioContext): GainNode {
  const mix = ctx.createGain(); mix.gain.value = .67;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 6;
  const limit = ctx.createDynamicsCompressor(); limit.threshold.value = -2.5; limit.knee.value = 0; limit.ratio.value = 20; limit.attack.value = 0.001; limit.release.value = 0.08;
  const trim = ctx.createGain(); trim.gain.value = 0.89;
  mix.connect(comp); comp.connect(limit); limit.connect(trim); trim.connect(ctx.destination);
  return mix;
}

/**
 * Starts the pre-rendered vocal so that its bar-1-beat-1 (lead_seconds into the file) lands exactly on
 * `barOneAt` of the shared AudioContext clock. Up to 0.25 s of pre-roll is kept for leading consonants.
 */
export function scheduleVocal(ctx: BaseAudioContext, b: Buses, buffer: AudioBuffer, barOneAt: number, leadSeconds: number): AudioBufferSourceNode {
  const pre = Math.min(0.25, leadSeconds);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(b.vocalIn);
  const when = barOneAt - pre;
  const now = ctx.currentTime;
  if (when >= now) src.start(when, leadSeconds - pre);
  else src.start(now, leadSeconds - pre + (now - when));
  return src;
}

type Manifest = { lead_seconds: number; frame_rate: number; engine: string; credits: string[] };

export class VocalBank {
  private manifest: Promise<Manifest> | null = null;
  private readonly buffers = new Map<string, Promise<AudioBuffer>>();
  getManifest(): Promise<Manifest> {
    this.manifest ??= fetch(`${import.meta.env.BASE_URL}audio/psylo/vocal/manifest.json`).then((r) => {
      if (!r.ok) throw new Error('歌声のマニフェストを読み込めません (npm run vocal:render で生成)');
      return r.json() as Promise<Manifest>;
    });
    return this.manifest;
  }
  load(ctx: BaseAudioContext, file: string): Promise<AudioBuffer> {
    let p = this.buffers.get(file);
    if (!p) {
      p = fetch(`${import.meta.env.BASE_URL}${file}`).then((r) => {
        if (!r.ok) throw new Error(`歌声を読み込めません: ${file}`);
        return r.arrayBuffer();
      }).then((data) => ctx.decodeAudioData(data));
      this.buffers.set(file, p);
    }
    return p;
  }
}

/** 16-bit PCM WAV of an AudioBuffer (for the mix export) */
export function audioBufferToWav(buf: AudioBuffer): ArrayBuffer {
  const ch = buf.numberOfChannels;
  const n = buf.length;
  const out = new ArrayBuffer(44 + n * ch * 2);
  const v = new DataView(out);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, buf.sampleRate, true);
  v.setUint32(28, buf.sampleRate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * ch * 2, true);
  const data = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
  let p = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
    const x = Math.max(-1, Math.min(1, data[c][i]));
    v.setInt16(p, Math.round(x * 32767), true);
    p += 2;
  }
  return out;
}
