import { clock, demoById, demos, loadMemos, midiName, nobody, saveMemo, sectionAt, sungAt, type Demo, type DemoId } from './nobody-model';
import './nobody.css';

const app = document.querySelector<HTMLDivElement>('#nobody-app')!;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const COLOR: Record<DemoId, string> = { A: 'a', B: 'b', C: 'c' };

let current: DemoId = 'A';
let vocalOn = true;
let ctx: AudioContext | null = null;
const buffers = new Map<string, AudioBuffer>();
let playing: { mix: AudioBufferSourceNode; inst: AudioBufferSourceNode; mixGain: GainNode; instGain: GainNode; startAt: number; id: DemoId } | null = null;

async function buffer(url: string): Promise<AudioBuffer> {
  const hit = buffers.get(url);
  if (hit) return hit;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const b = await ctx!.decodeAudioData(await res.arrayBuffer());
  buffers.set(url, b);
  return b;
}

function stop() {
  if (!playing) return;
  try {
    playing.mix.stop();
    playing.inst.stop();
  } catch {
    /* already ended */
  }
  playing = null;
  render();
}

async function play(id: DemoId) {
  stop();
  ctx ??= new AudioContext();
  await ctx.resume();
  const d = demoById(id);
  setStatus('読み込み中…');
  // both files are decoded before either starts, then started on the same clock tick (sample-aligned)
  const [mixBuf, instBuf] = await Promise.all([buffer(`./audio/nobody/${d.files.mix}`), buffer(`./audio/nobody/${d.files.inst}`)]);
  const mk = (b: AudioBuffer, on: boolean) => {
    const src = ctx!.createBufferSource();
    src.buffer = b;
    const g = ctx!.createGain();
    g.gain.value = on ? 1 : 0;
    src.connect(g).connect(ctx!.destination);
    return { src, g };
  };
  const m = mk(mixBuf, vocalOn);
  const n = mk(instBuf, !vocalOn);
  const startAt = ctx.currentTime + 0.08;
  m.src.start(startAt);
  n.src.start(startAt);
  playing = { mix: m.src, inst: n.src, mixGain: m.g, instGain: n.g, startAt, id };
  m.src.onended = () => playing?.mix === m.src && stop();
  setStatus('');
  render();
  tick();
}

function setVocal(on: boolean) {
  vocalOn = on;
  if (playing && ctx) {
    const t = ctx.currentTime;
    // a 25 ms crossfade between the two aligned files
    playing.mixGain.gain.setTargetAtTime(on ? 1 : 0, t, 0.008);
    playing.instGain.gain.setTargetAtTime(on ? 0 : 1, t, 0.008);
  }
  render();
}

function setStatus(s: string) {
  const el = document.querySelector<HTMLElement>('#status');
  if (el) el.textContent = s;
}

function tick() {
  if (!playing || !ctx) return;
  const d = demoById(playing.id);
  const t = Math.max(0, ctx.currentTime - playing.startAt);
  const time = document.querySelector('#time');
  if (time) time.textContent = `${clock(t)} / ${clock(d.durationSec)}`;
  const bar = document.querySelector<HTMLElement>('#playhead');
  if (bar) bar.style.left = `${Math.min(100, (t / d.durationSec) * 100)}%`;
  const sec = sectionAt(d, t);
  document.querySelectorAll('.sec').forEach((el) => el.classList.toggle('now', !!sec && el.getAttribute('data-name') === sec.name));
  const sung = vocalOn ? sungAt(d, t) : null;
  document.querySelectorAll('.kana').forEach((el, i) => el.classList.toggle('now', !!sung && sung.index === i));
  requestAnimationFrame(tick);
}

function compareTable(): string {
  const rows: Array<[string, (d: Demo) => string]> = [
    ['方向', (d) => d.concept],
    ['BPM / キー', (d) => `${d.bpm} BPM · ${d.key}`],
    ['サビの進行', (d) => d.chords.find((c) => c.bars.includes('サビ'))?.chords ?? d.chords.at(-1)!.chords],
    ['歌', (d) => [...new Set(d.vocals.map((v) => v.voice))].join(' / ')],
  ];
  return `<table class="compare"><thead><tr><th></th>${demos.map((d) => `<th class="${COLOR[d.id as DemoId]}">${d.id} · ${esc(d.title)}</th>`).join('')}</tr></thead><tbody>${rows
    .map(([k, f]) => `<tr><th>${k}</th>${demos.map((d) => `<td>${esc(f(d))}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

function render() {
  const d = demoById(current);
  const isPlaying = playing?.id === current;
  const memos = loadMemos();
  const lead = d.vocals[0];
  app.innerHTML = `
  <div class="nb-shell">
    <header><a class="back" href="./index.html">← PSYENCE WORKSHOP</a><span class="artist">ZIG · FREAKTION SONG 001</span></header>
    <section class="hero">
      <div class="kicker">FREAK × REACTION — 30 秒デモ × 3 案</div>
      <h1>NOBODY <span>ON AIR</span></h1>
      <p class="reading">ノーバディ・オンエア</p>
    </section>
    <nav class="tabs">${demos.map((x) => `<button class="tab ${COLOR[x.id as DemoId]} ${x.id === current ? 'active' : ''}" data-demo="${x.id}"><b>${x.id}</b>${esc(x.title)}<small>${x.bpm} BPM</small></button>`).join('')}</nav>
    <section class="player ${COLOR[current]}">
      <div class="transport">
        <button id="play" class="play">${isPlaying ? '■ 停止' : '▶ 再生'}</button>
        <button id="vocal" class="toggle ${vocalOn ? 'on' : ''}">ボーカル ${vocalOn ? 'ON' : 'OFF'}</button>
        <span id="time" class="time">${clock(0)} / ${clock(d.durationSec)}</span>
        <span id="status" class="status"></span>
      </div>
      <div class="timeline">${d.sections.map((s) => `<div class="sec" data-name="${esc(s.name)}" style="left:${(s.start / d.durationSec) * 100}%;width:${((s.end - s.start) / d.durationSec) * 100}%"><b>${esc(s.name)}</b><span>${s.start.toFixed(1)}s</span></div>`).join('')}<div id="playhead" class="playhead"></div></div>
      <div class="lyrics">${lead.notes.map((n) => `<span class="kana" title="${midiName(n.midi)}">${esc(n.lyric)}</span>`).join('')}</div>
    </section>
    <section class="detail">
      <div>
        <h2>${d.id} — ${esc(d.title)}</h2>
        <p class="concept">${esc(d.concept)}</p>
        <ol class="sections">${d.sections.map((s) => `<li><b>${s.start.toFixed(1)}–${s.end.toFixed(1)}s ${esc(s.name)}</b> ${esc(s.text)}</li>`).join('')}</ol>
      </div>
      <div>
        <h3>コード進行</h3>
        <ul class="chords">${d.chords.map((c) => `<li><span>${esc(c.bars)}</span>${esc(c.chords)}</li>`).join('')}</ul>
        <h3>リフ</h3><p class="mono">${esc(d.riff)}</p>
        <h3>歌詞</h3><pre class="lyric-text">${esc(d.lyrics.join('\n'))}</pre>
      </div>
    </section>
    <section class="layers"><h3>音の中身</h3><ul>${d.layers.map((l) => `<li>${esc(l)}</li>`).join('')}</ul><p class="credit">歌: ${esc(d.credits.join(' / '))} (VOICEVOX 歌唱機能・CPU)</p></section>
    ${current === 'C' ? `<section class="freaktion"><h3>FREAKTION — 偶然の音を探す</h3><p>電子音の種を ${nobody.freaktion.candidates.length} 通り試し、${esc(nobody.freaktion.rule)}。選んだ種: <b>${esc(nobody.freaktion.chosen)}</b></p><table><thead><tr><th>種</th><th>点</th><th>拍からのずれ</th><th>粗さ</th><th>突然変異</th></tr></thead><tbody>${nobody.freaktion.candidates.map((c) => `<tr class="${c.seed === nobody.freaktion.chosen ? 'chosen' : ''}"><td>${esc(c.seed)}</td><td>${c.score}</td><td>${c.offGrid}</td><td>${c.roughness}</td><td>${c.mutation.transpose > 0 ? '+' : ''}${c.mutation.transpose} 半音${c.mutation.reverse ? '・逆順' : ''}${c.mutation.halfTime ? '・半速' : ''}・${esc(c.mutation.material)}</td></tr>`).join('')}</tbody></table></section>` : ''}
    <section class="compare-wrap"><h3>3案の違い</h3>${compareTable()}</section>
    <section class="memo">
      <label for="memo">試聴メモ (${d.id})</label>
      <textarea id="memo" rows="3" placeholder="どこでもう一度聴きたくなったか、気になった音…">${esc(memos[current]?.text ?? '')}</textarea>
      <div><button id="save">メモを保存</button><button id="export">全メモを書き出す</button><span id="saved">${memos[current] ? `保存: ${new Date(memos[current]!.savedAt).toLocaleString('ja-JP')}` : ''}</span></div>
    </section>
    <footer>${nobody.licenses.map((l) => `<p>${esc(l)}</p>`).join('')}<p>各案の音量は −14 LUFS にそろえている (ボーカル OFF は同じ音量設定から声だけを抜いたもの)。</p></footer>
  </div>`;
  app.querySelectorAll<HTMLButtonElement>('.tab').forEach((b) =>
    b.addEventListener('click', () => {
      const wasPlaying = !!playing;
      current = b.dataset.demo as DemoId;
      if (wasPlaying) void play(current);
      else render();
    }),
  );
  app.querySelector('#play')!.addEventListener('click', () => (playing?.id === current ? stop() : void play(current).catch((e) => setStatus(String(e)))));
  app.querySelector('#vocal')!.addEventListener('click', () => setVocal(!vocalOn));
  app.querySelector('#save')!.addEventListener('click', () => {
    const ok = saveMemo({ id: current, text: (app.querySelector('#memo') as HTMLTextAreaElement).value, savedAt: new Date().toISOString() });
    app.querySelector('#saved')!.textContent = ok ? `保存しました (${new Date().toLocaleTimeString('ja-JP')})` : 'このブラウザでは保存できません';
  });
  app.querySelector('#export')!.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ song: 'NOBODY ON AIR', exportedAt: new Date().toISOString(), memos: loadMemos() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nobody-on-air-memos.json';
    a.click();
  });
  if (playing) tick();
}

render();
