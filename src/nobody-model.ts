/** Data and small helpers for the NOBODY ON AIR listening page (audio and data come from SONOVA, see songs/NOBODY-ON-AIR). */
import manifest from '../songs/NOBODY-ON-AIR/demos.json';

export type DemoId = 'A' | 'B' | 'C';
export type Demo = (typeof manifest.demos)[number];
export const demos = manifest.demos as Demo[];
export const nobody = manifest;

export const demoById = (id: DemoId): Demo => demos.find((d) => d.id === id)!;

/** 12.34 → "0:12.3" */
export function clock(sec: number): string {
  const s = Math.max(0, sec);
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
}

/** the section playing at `t` seconds */
export function sectionAt(d: Demo, t: number): Demo['sections'][number] | null {
  return d.sections.find((s) => t >= s.start && t < s.end) ?? null;
}

/** the sung note (lead part) at `t`, with its index, for the lyric display */
export function sungAt(d: Demo, t: number): { lyric: string; index: number } | null {
  const notes = d.vocals[0].notes;
  for (let i = 0; i < notes.length; i++) if (t >= notes[i].time && t < notes[i].time + notes[i].duration) return { lyric: notes[i].lyric, index: i };
  return null;
}

export const MIDI_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const midiName = (m: number) => `${MIDI_NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;

export interface Memo {
  id: DemoId;
  text: string;
  savedAt: string;
}
const KEY = 'psyence.nobody-on-air.memos';
export function loadMemos(): Partial<Record<DemoId, Memo>> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}
export function saveMemo(m: Memo): boolean {
  try {
    const all = loadMemos();
    all[m.id] = m;
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}
