import { describe, expect, it } from 'vitest';
import { clock, demos, happy, lyricLines, sectionAt, stemFile, stems, sungIndex } from './happy-tears-model';

const audio = import.meta.glob('../public/audio/happy-tears/*.mp3', { query: '?url', import: 'default', eager: true });
const has = (f: string) => Object.keys(audio).some((k) => k.endsWith(`/${f}`));

describe('HAPPY TEARS — three 30-second demos', () => {
  it('has A, B and C at 160 / 156 / 158 BPM, about 30 s, with all six stems and the mix on disk', () => {
    expect(demos.map((d) => [d.id, d.bpm])).toEqual([['A', 160], ['B', 156], ['C', 158]]);
    for (const d of demos) {
      expect(d.durationSec).toBeGreaterThan(29.5);
      expect(d.durationSec).toBeLessThan(31.5);
      expect(has(d.files.mix)).toBe(true);
      for (const s of stems) expect(has(stemFile(d, s.id))).toBe(true);
    }
  });
  it('all demos pass verification at the same loudness', () => {
    for (const d of demos) {
      expect(d.verification.ok).toBe(true);
      expect(Math.abs(d.verification.lufs - happy.targetLufs)).toBeLessThanOrEqual(0.5);
      expect(d.verification.peakDbfs).toBeLessThanOrEqual(-0.9);
    }
  });
  it('every demo sings the same hook: ハ ピ ティ ア ア ズ, with ズ sung as its consonant only', () => {
    const hook = (d: (typeof demos)[number]) => d.vocals[0].notes.map((n) => n.lyric).join('');
    for (const d of demos) {
      expect(hook(d)).toContain('ハピティアアズ');
      expect(hook(d)).toContain('アリガトウ');
      const zu = d.vocals[0].notes.map((n, i) => (n.lyric === 'ズ' ? i : -1)).filter((i) => i >= 0);
      expect(d.vocals[0].consonantOnly).toEqual(zu);
    }
    // the same melody (pitches and lyrics) in all three
    const shape = (d: (typeof demos)[number]) => d.vocals[0].notes.map((n) => `${n.lyric}${n.midi}`).join(' ');
    expect(new Set(demos.map(shape)).size).toBe(1);
  });
  it('the accompaniments differ: different progressions and riffs; HAPPY and TEARS instruments in each', () => {
    expect(new Set(demos.map((d) => d.chords.map((c) => c.chords).join('|'))).size).toBe(3);
    expect(new Set(demos.map((d) => d.riffs[0].name)).size).toBe(3);
    for (const d of demos) {
      expect(d.instrumentation.happy.length).toBeGreaterThan(1);
      expect(d.instrumentation.tears.length).toBeGreaterThan(1);
    }
  });
  it('keeps the adopted lyric draft verbatim', () => {
    expect(happy.lyrics.original['サビ｜二つの時間が重なる'][0]).toBe('HAPPY〜！ TEAR〜S！');
    expect(happy.lyrics.original['ラスト｜ありがとう'].at(-1)).toBe('ありがとう　こんなに楽しい音楽を');
  });
  it('helpers', () => {
    expect(clock(30.93)).toBe('0:30.9');
    const a = demos[0];
    expect(sectionAt(a, 0)?.name).toBe('イントロ');
    expect(sungIndex(a, a.vocals[0].notes[0].time + 0.01)).toBe(0);
    const lines = lyricLines(a);
    expect(lines.filter((l) => l.hook === 'HAPPY〜!').length).toBe(3);
    expect(lines.filter((l) => l.hook === 'TEAR〜S!').map((l) => l.notes.map((n) => n.lyric).join(''))).toEqual(['ティアアズ', 'ティアアズ', 'ティアアズ']);
  });
});
