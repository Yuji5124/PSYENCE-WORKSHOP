/** Data and helpers for the HAPPY TEARS listening page (audio and data are rendered by SONOVA, see songs/HAPPY-TEARS). */
import manifest from '../songs/HAPPY-TEARS/demos.json';

export type DemoId = 'A' | 'B' | 'C';
export type Demo = (typeof manifest.demos)[number];
export type StemId = 'vocal' | 'drums' | 'bass' | 'guitar' | 'happy' | 'tears';
export const happy = manifest;
export const demos = manifest.demos as Demo[];
export const stems = manifest.stems as Array<{ id: StemId; label: string }>;
export const stemFile = (d: Demo, id: StemId): string => (d.files.stems as Record<StemId, { file: string }>)[id].file;
export const demoById = (id: DemoId): Demo => demos.find((d) => d.id === id)!;

/** 12.34 → "0:12.3" */
export function clock(sec: number): string {
  const s = Math.max(0, sec);
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
}
export function sectionAt(d: Demo, t: number): Demo['sections'][number] | null {
  return d.sections.find((s) => t >= s.start && t < s.end) ?? null;
}
/** the lead note sounding at `t` (index into the lead part) */
export function sungIndex(d: Demo, t: number): number {
  const n = d.vocals[0].notes;
  for (let i = 0; i < n.length; i++) if (t >= n[i].time && t < n[i].time + n[i].duration) return i;
  return -1;
}
/** group the lead notes into lyric lines: a rest of ≥ 0.9 beat, or the hook words HAPPY (ハ…) / TEARS (ティ…ズ), start a line */
export function lyricLines(d: Demo): Array<{ hook: 'HAPPY〜!' | 'TEAR〜S!' | null; notes: Array<{ lyric: string; index: number }> }> {
  const beat = 60 / d.bpm;
  const lines: Array<{ hook: 'HAPPY〜!' | 'TEAR〜S!' | null; notes: Array<{ lyric: string; index: number }> }> = [];
  d.vocals[0].notes.forEach((n, i, a) => {
    const prev = a[i - 1];
    const brk = !prev || n.time - (prev.time + prev.duration) >= beat * 0.9 || n.lyric === 'ハ' || n.lyric === 'ティ' || prev.lyric === 'ズ';
    if (brk) lines.push({ hook: n.lyric === 'ハ' ? 'HAPPY〜!' : n.lyric === 'ティ' ? 'TEAR〜S!' : null, notes: [] });
    lines[lines.length - 1].notes.push({ lyric: n.lyric, index: i });
  });
  return lines;
}

export interface Rating {
  again: number;
  together: number;
  hook: number;
}
export interface Evaluation {
  id: DemoId;
  memo: string;
  rating: Rating;
  savedAt: string;
}
const KEY = 'psyence.happy-tears.evaluations';
export function loadEvaluations(): Partial<Record<DemoId, Evaluation>> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}
export function saveEvaluation(e: Evaluation): boolean {
  try {
    const all = loadEvaluations();
    all[e.id] = e;
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}
