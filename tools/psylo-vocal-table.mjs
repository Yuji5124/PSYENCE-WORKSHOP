#!/usr/bin/env node
/** Writes songs/PSYLO/vocal/notes.md — the lyric ↔ note table (with the phonemes VOICEVOX used) from src/psylo-vocal.json. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(readFileSync(join(ROOT, 'src/psylo-vocal.json'), 'utf8'));
const name = (m) => `${['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][m % 12]}${Math.floor(m / 12) - 1}`;
const pos = (b) => `${Math.floor(b / 4) + 1}小節 ${(b % 4) + 1}拍`;
let md = `# PSYLO A — 歌詞と音符の対応表\n\n自動生成: \`node tools/psylo-vocal-table.mjs\` (元データ \`src/psylo-vocal.json\`)。${spec.bpm} BPM、1拍 = 4分音符、MIDI は C4 = 60。音素は VOICEVOX が実際に使ったもの (\`public/audio/psylo/vocal/timing-RITSU-*.json\`)。\n\n`;
md += `## 原案メロディ (Phase 0 の仮メロディ、各小節の1〜4拍)\n\n| 小節 | 1 | 2 | 3 | 4 |\n|---|---|---|---|---|\n${spec.guideBefore.map((bar, i) => `| ${i + 1} | ${[0, 1, 2, 3].map((k) => (bar[k] ? name(bar[k]) : '—')).join(' | ')} |`).join('\n')}\n\n`;
for (const [id, v] of Object.entries(spec.versions)) {
  const tf = join(ROOT, `public/audio/psylo/vocal/timing-RITSU-${id}.json`);
  const timing = existsSync(tf) ? JSON.parse(readFileSync(tf, 'utf8')).timing : [];
  md += `## ${v.title}\n\n> ${v.lyric.replace(/\n/g, '<br>')}\n\n${v.omitted}\n\n| # | 歌詞 | 読み | 音素 | 音高 | MIDI | 開始 | 開始(拍) | 長さ(拍) | 強さ | 原案の音 | 母音の位置のずれ |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
  v.notes.forEach((n, i) => {
    const before = Number.isInteger(n.start) ? spec.guideBefore[Math.floor(n.start / 4)]?.[n.start % 4] : null;
    const t = timing[i];
    const err = t && t.vowelOnsetSec !== null ? `${((t.vowelOnsetSec - t.gridSec) * 1000).toFixed(1)} ms` : '';
    md += `| ${i + 1} | ${n.hook ? `**${n.lyric}**` : n.lyric} | ${n.reading} | ${t?.phonemes ?? ''} | ${name(n.midi)} | ${n.midi} | ${pos(n.start)} | ${n.start} | ${n.dur} | ${n.vel} | ${before ? (before === n.midi ? `${name(before)} (同じ)` : `${name(before)} → ${name(n.midi)}`) : '—'} | ${err} |\n`;
  });
  md += '\n';
}
mkdirSync(join(ROOT, 'songs/PSYLO/vocal'), { recursive: true });
writeFileSync(join(ROOT, 'songs/PSYLO/vocal/notes.md'), md);
console.log('songs/PSYLO/vocal/notes.md');
