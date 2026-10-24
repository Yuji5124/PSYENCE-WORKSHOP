import { describe, expect, it } from 'vitest';
import { clock, demos, nobody, sectionAt, sungAt } from './nobody-model';

const audio = import.meta.glob('../public/audio/nobody/*.mp3', { query: '?url', import: 'default', eager: true });

describe('NOBODY ON AIR — three 30-second demos', () => {
  it('has A, B and C, each 30 s, with a mix and an instrumental file that exist', () => {
    expect(demos.map((d) => d.id)).toEqual(['A', 'B', 'C']);
    for (const d of demos) {
      expect(d.durationSec).toBe(30);
      for (const f of [d.files.mix, d.files.inst]) expect(Object.keys(audio).some((k) => k.endsWith(`/${f}`))).toBe(true);
    }
  });
  it('renders passed verification and every mix sits at the same loudness (−14 LUFS ± 0.5)', () => {
    for (const d of demos) {
      expect(d.verification.mix.ok).toBe(true);
      expect(d.verification.inst.ok).toBe(true);
      expect(Math.abs(d.verification.mix.lufs - nobody.targetLufs)).toBeLessThanOrEqual(0.5);
      expect(d.verification.mix.peakDbfs).toBeLessThanOrEqual(-0.9);
    }
  });
  it('the three are different songs: tempo, key and chorus progression all differ', () => {
    expect(new Set(demos.map((d) => d.bpm)).size).toBe(3);
    expect(new Set(demos.map((d) => d.key)).size).toBe(3);
    expect(new Set(demos.map((d) => d.chords.map((c) => c.chords).join('|'))).size).toBe(3);
  });
  it('every demo sings the hook NO-BO-DY … ON AIR, and the band parts are all there', () => {
    for (const d of demos) {
      const kana = d.vocals[0].notes.map((n) => n.lyric).join('');
      expect(kana).toContain('ノバディノバディ');
      expect(kana).toContain('オンエア');
      for (const part of ['guitarL', 'guitarR', 'bass', 'drums']) expect(Object.keys(d.stems)).toContain(part);
      // monophonic lead, in order, inside 30 s
      d.vocals[0].notes.forEach((n, i, a) => {
        if (i) expect(n.time).toBeGreaterThanOrEqual(a[i - 1].time + a[i - 1].duration - 2e-3);
        expect(n.time + n.duration).toBeLessThanOrEqual(30);
      });
    }
  });
  it('A holds the last AIR for several seconds', () => {
    const a = demos[0].vocals[0].notes;
    const longest = Math.max(...a.filter((n) => n.lyric === 'ア').map((n) => n.duration));
    expect(longest).toBeGreaterThan(4);
  });
  it('C keeps its FREAKTION seed and every candidate it tried', () => {
    expect(nobody.freaktion.candidates.length).toBeGreaterThanOrEqual(8);
    expect(nobody.freaktion.candidates[0].seed).toBe(nobody.freaktion.chosen);
  });
  it('helpers: clock, section and sung note at a time', () => {
    expect(clock(12.34)).toBe('0:12.3');
    expect(clock(30)).toBe('0:30.0');
    const a = demos[0];
    expect(sectionAt(a, 0.1)?.name).toBe(a.sections[0].name);
    const first = a.vocals[0].notes[0];
    expect(sungAt(a, first.time + 0.01)?.lyric).toBe(first.lyric);
  });
});
