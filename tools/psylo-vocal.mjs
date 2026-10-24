#!/usr/bin/env node
/**
 * PSYLO vocal renderer — sings src/psylo-vocal.json with a local VOICEVOX Engine (CPU, no GPU, no network).
 *
 *   1. Start VOICEVOX Engine 0.26+ (https://github.com/VOICEVOX/voicevox_engine/releases), e.g. `run --port 50021`
 *   2. npm run vocal:render            (VOICEVOX_URL=http://127.0.0.1:50021 by default)
 *
 * Flow per take: score → POST /sing_frame_audio_query (波音リツ sing style, makes pitch/timing/phonemes)
 *               → style edits on that query (f0 / volume / phoneme lengths only — features the engine exposes)
 *               → POST /frame_synthesis (the chosen voice) → public/audio/psylo/vocal/<VOICE>-<VERSION>-<STYLE>.wav
 * Credits: VOICEVOX:波音リツ / VOICEVOX:玄野武宏 (see songs/PSYLO/vocal/README.md).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_BASE = process.env.VOICEVOX_URL ?? 'http://127.0.0.1:50021';
const spec = JSON.parse(readFileSync(join(ROOT, 'src/psylo-vocal.json'), 'utf8'));
const OUT = join(ROOT, 'public/audio/psylo/vocal');
mkdirSync(OUT, { recursive: true });

const LEAD = 0.8; // seconds of silence before bar 1 beat 1 (the first note must be a rest; consonants need room)
const TAIL = 1.0;
const VOWELS = new Set(['a', 'i', 'u', 'e', 'o', 'A', 'I', 'U', 'E', 'O', 'N']);
const SILENT = new Set(['pau', 'cl', 'sil']);

async function api(path, body) {
  const res = await fetch(`${URL_BASE}${path}`, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${await res.text()}`);
  return res;
}

const manifestInfo = await (await api('/engine_manifest')).json();
const version = await (await api('/version')).json();
const fps = manifestInfo.frame_rate; // 93.75
const spb = 60 / spec.bpm;
const frameAt = (sec) => Math.round((LEAD + sec) * fps);

/** score → VOICEVOX Score. Boundaries are rounded from absolute time, so rounding never accumulates. */
function toScore(notes, transpose) {
  const out = [{ key: null, frame_length: frameAt(notes[0].start * spb), lyric: '' }];
  let cursor = notes[0].start * spb;
  notes.forEach((n, i) => {
    const s = n.start * spb;
    const e = (n.start + n.dur) * spb;
    if (s > cursor + 1e-9) out.push({ key: null, frame_length: frameAt(s) - frameAt(cursor), lyric: '' });
    out.push({ id: `n${i}`, key: n.midi + transpose, frame_length: frameAt(e) - frameAt(s), lyric: n.lyric });
    cursor = e;
  });
  out.push({ key: null, frame_length: Math.round(TAIL * fps), lyric: '' });
  return { notes: out };
}

/** frame ranges of every note's phonemes, from the query */
function noteFrames(query) {
  const map = new Map();
  let f = 0;
  query.phonemes.forEach((p, k) => {
    const id = p.note_id;
    if (id) {
      const m = map.get(id) ?? { phonemes: [], start: f, vowelStart: -1, end: f };
      m.phonemes.push({ k, phoneme: p.phoneme, from: f, len: p.frame_length });
      if (VOWELS.has(p.phoneme) && m.vowelStart < 0) m.vowelStart = f;
      m.end = f + p.frame_length;
      map.set(id, m);
    }
    f += p.frame_length;
  });
  return map;
}

const semis = (s) => Math.pow(2, s / 12);

function applyStyle(query, style, notes) {
  const q = structuredClone(query);
  const frames = noteFrames(q);
  const restAfter = (i) => i === notes.length - 1 || notes[i + 1].start - (notes[i].start + notes[i].dur) >= 0.25;
  if (style === 'ROCK') {
    // consonants ~30 % longer (taken from the phoneme before them, so the timeline does not move) and pushed +3 dB
    q.phonemes.forEach((p, k) => {
      if (k === 0 || VOWELS.has(p.phoneme) || SILENT.has(p.phoneme)) return;
      const prev = q.phonemes[k - 1];
      const add = Math.min(Math.max(1, Math.round(p.frame_length * 0.3)), prev.frame_length - 2);
      if (add <= 0) return;
      prev.frame_length -= add;
      p.frame_length += add;
    });
    const fr = noteFrames(q);
    notes.forEach((n, i) => {
      const m = fr.get(`n${i}`);
      if (!m) return;
      for (let f = m.start; f < Math.min(m.end, (m.vowelStart < 0 ? m.start : m.vowelStart) + 4); f++) q.volume[f] *= 1.41;
      if (n.dur <= 0.5 && m.vowelStart >= 0) {
        // short notes: cut the tail so they bounce
        const len = m.end - m.vowelStart;
        for (let f = m.end - Math.round(len * 0.3); f < m.end; f++) q.volume[f] *= 0.35 + 0.65 * ((m.end - f) / (len * 0.3));
      }
    });
  }
  if (style === 'WILD') {
    notes.forEach((n, i) => {
      const m = frames.get(`n${i}`);
      if (!m || m.vowelStart < 0) return;
      const v0 = m.vowelStart;
      // scoop up into the note: −1.5 semitones → 0 over 6 frames (64 ms)
      for (let k = 0; k < 6 && v0 + k < m.end; k++) if (q.f0[v0 + k] > 0) q.f0[v0 + k] *= semis(-1.5 * (1 - k / 6));
      // vibrato on long notes, starting after 150 ms, ±35 cents at 5.6 Hz
      if (n.dur >= 1) for (let f = v0 + 14; f < m.end; f++) if (q.f0[f] > 0) q.f0[f] *= Math.pow(2, (35 / 1200) * Math.sin((2 * Math.PI * 5.6 * (f - v0)) / fps) * Math.min(1, (f - v0 - 14) / 12));
      // phrase ends fall away (−2 semitones over the last 120 ms) and are cut
      if (restAfter(i)) {
        const k0 = Math.max(v0, m.end - 11);
        for (let f = k0; f < m.end; f++) {
          const u = (f - k0) / (m.end - k0);
          if (q.f0[f] > 0) q.f0[f] *= semis(-2 * u * u);
          q.volume[f] *= 1 - 0.7 * u;
        }
      }
      // accents on the first beat of a bar
      if (n.start % 4 === 0) for (let f = v0; f < Math.min(m.end, v0 + 8); f++) q.volume[f] *= 1.25;
    });
  }
  return q;
}

const takes = [];
const t0 = Date.now();
for (const [voiceId, voice] of Object.entries(spec.voices)) {
  for (const [versionId, ver] of Object.entries(spec.versions)) {
    const score = toScore(ver.notes, voice.transpose);
    const query = await (await api(`/sing_frame_audio_query?speaker=${spec.queryStyle.id}`, score)).json();
    const fr = noteFrames(query);
    const timing = ver.notes.map((n, i) => {
      const m = fr.get(`n${i}`);
      const vowelSec = m && m.vowelStart >= 0 ? m.vowelStart / fps - LEAD : null;
      return { i, lyric: n.lyric, phonemes: m ? m.phonemes.map((p) => p.phoneme).join(' ') : '', vowelOnsetSec: vowelSec === null ? null : Math.round(vowelSec * 10000) / 10000, gridSec: Math.round(n.start * spb * 10000) / 10000 };
    });
    for (const style of Object.keys(spec.styles)) {
      const q = applyStyle(query, style, ver.notes);
      const wav = new Uint8Array(await (await api(`/frame_synthesis?speaker=${voice.synthStyle}`, q)).arrayBuffer());
      const file = `${voiceId}-${versionId}-${style}.wav`;
      writeFileSync(join(OUT, file), wav);
      takes.push({ voice: voiceId, version: versionId, style, file: `audio/psylo/vocal/${file}`, bytes: wav.length });
      console.log(`${file}  ${(wav.length / 1024).toFixed(0)} KB`);
    }
    writeFileSync(join(OUT, `timing-${voiceId}-${versionId}.json`), JSON.stringify({ voice: voiceId, version: versionId, timing }, null, 1));
  }
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({
  generated_by: 'tools/psylo-vocal.mjs',
  engine: `VOICEVOX Engine ${version} (CPU)`,
  frame_rate: fps,
  lead_seconds: frameAt(0) / fps,
  bpm: spec.bpm,
  query_style: spec.queryStyle,
  credits: Object.values(spec.voices).map((v) => v.credit),
  takes,
}, null, 1));
console.log(`${takes.length} takes in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
