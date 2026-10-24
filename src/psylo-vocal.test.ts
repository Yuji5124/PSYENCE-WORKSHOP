import { describe, expect, it } from 'vitest';
import spec from './psylo-vocal.json';
import { hookWindow, noteAt, vocalNotes, type VocalVersion } from './psylo-vocal';

const versions = Object.keys(spec.versions) as VocalVersion[];

describe('PSYLO vocal score', () => {
  it.each(versions)('%s: every note has lyric, reading, pitch, start, length and velocity inside the eight bars', (v) => {
    const notes = vocalNotes(v);
    for (const n of notes) {
      expect(n.lyric.length).toBeGreaterThan(0);
      expect(n.reading.length).toBeGreaterThan(0);
      expect(n.midi).toBeGreaterThanOrEqual(55);
      expect(n.midi).toBeLessThanOrEqual(78);
      expect(n.dur).toBeGreaterThan(0);
      expect(n.vel).toBeGreaterThan(0);
      expect(n.vel).toBeLessThanOrEqual(1);
      expect(n.start + n.dur).toBeLessThanOrEqual(32 + 1e-9);
    }
    // monophonic, in order
    notes.forEach((n, i) => i > 0 && expect(n.start).toBeGreaterThanOrEqual(notes[i - 1].start + notes[i - 1].dur - 1e-9));
    // the engine accepts single kana morae only: no long-vowel mark
    expect(notes.some((n) => n.lyric.includes('ー'))).toBe(false);
  });

  it.each(versions)('%s: the fixed hook — サ bar 7 beat 3, イ bar 7 beat 4 for ~3 beats, ロ (F#5) bar 8 beat 3 for 2 beats', (v) => {
    const n = vocalNotes(v);
    const sa = n.find((x) => x.hook === 'sa')!;
    const i = n.find((x) => x.hook === 'i')!;
    const ro = n.find((x) => x.hook === 'ro')!;
    expect([sa.lyric, i.lyric, ro.lyric]).toEqual(['サ', 'イ', 'ロ']);
    expect(sa.start).toBe(26);
    expect(i.start).toBe(27);
    expect(i.dur).toBe(3);
    expect(ro.start).toBe(30);
    expect(ro.dur).toBe(2);
    expect(ro.midi).toBe(78);
    expect(sa.midi).toBeLessThan(i.midi);
    expect(i.midi).toBeLessThan(ro.midi); // rising into ロー
    const h = hookWindow(v, 160);
    expect(h.ro).toBeCloseTo(11.25, 6);
    expect(h.end).toBeCloseTo(12, 6);
    expect(vocalNotes(v)[noteAt(v, 11.6)].hook).toBe('ro');
  });

  it('the rendered takes listed in the manifest exist, and the lead-in is frame-exact', () => {
    const wavs = Object.keys(import.meta.glob('../public/audio/psylo/vocal/*.wav')).map((k) => k.replace('../public/', ''));
    const json = import.meta.glob<{ default: unknown }>('../public/audio/psylo/vocal/*.json', { eager: true });
    const m = json['../public/audio/psylo/vocal/manifest.json'].default as { takes: Array<{ file: string }>; lead_seconds: number; frame_rate: number };
    expect(m.takes.length).toBe(Object.keys(spec.voices).length * versions.length * Object.keys(spec.styles).length);
    for (const t of m.takes) expect(wavs).toContain(t.file);
    expect(Math.round(m.lead_seconds * m.frame_rate)).toBeCloseTo(m.lead_seconds * m.frame_rate, 9);
    // every vowel lands within 6 ms of its beat (frame quantisation, never accumulating)
    for (const v of versions) {
      const t = json[`../public/audio/psylo/vocal/timing-RITSU-${v}.json`].default as { timing: Array<{ vowelOnsetSec: number | null; gridSec: number }> };
      for (const n of t.timing) if (n.vowelOnsetSec !== null) expect(Math.abs(n.vowelOnsetSec - n.gridSec)).toBeLessThan(0.006);
    }
  });
});
