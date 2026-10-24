import { clock, stemFile, demoById, demos, happy, loadEvaluations, lyricLines, saveEvaluation, sectionAt, stems, sungIndex, type DemoId, type Rating, type StemId } from './happy-tears-model';
import './happy-tears.css';

const app = document.querySelector<HTMLDivElement>('#happy-app')!;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

let current: DemoId = 'A';
let vocalOn = true;
const levels: Record<StemId, number> = Object.fromEntries(stems.map((s) => [s.id, 1])) as Record<StemId, number>;
let ctx: AudioContext | null = null;
const cache = new Map<string, AudioBuffer>();
let playing: { id: DemoId; startAt: number; sources: AudioBufferSourceNode[]; gains: Partial<Record<StemId, GainNode>> } | null = null;

const gainFor = (id: StemId) => (id === 'vocal' && !vocalOn ? 0 : levels[id]);

async function buffer(url: string): Promise<AudioBuffer> {
  const hit = cache.get(url);
  if (hit) return hit;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const b = await ctx!.decodeAudioData(await res.arrayBuffer());
  cache.set(url, b);
  return b;
}

function stop() {
  if (!playing) return;
  for (const s of playing.sources)
    try {
      s.stop();
    } catch {
      /* ended */
    }
  playing = null;
  render();
}

async function play(id: DemoId) {
  stop();
  ctx ??= new AudioContext();
  await ctx.resume();
  const d = demoById(id);
  status('読み込み中…');
  // all six stems are decoded first and started on the same clock tick: they add up to the mix sample for sample
  const bufs = await Promise.all(stems.map((s) => buffer(`./audio/happy-tears/${stemFile(d, s.id)}`)));
  const startAt = ctx.currentTime + 0.1;
  const sources: AudioBufferSourceNode[] = [];
  const gains: Partial<Record<StemId, GainNode>> = {};
  stems.forEach((s, k) => {
    const src = ctx!.createBufferSource();
    src.buffer = bufs[k];
    const g = ctx!.createGain();
    g.gain.value = gainFor(s.id as StemId);
    src.connect(g).connect(ctx!.destination);
    src.start(startAt);
    sources.push(src);
    gains[s.id as StemId] = g;
  });
  sources[0].onended = () => playing?.sources[0] === sources[0] && stop();
  playing = { id, startAt, sources, gains };
  status('');
  render();
  tick();
}

function applyGains() {
  if (!playing || !ctx) return;
  for (const s of stems) playing.gains[s.id as StemId]?.gain.setTargetAtTime(gainFor(s.id as StemId), ctx.currentTime, 0.01);
}

function status(s: string) {
  const el = document.querySelector('#status');
  if (el) el.textContent = s;
}

function tick() {
  if (!playing || !ctx) return;
  const d = demoById(playing.id);
  const t = Math.max(0, ctx.currentTime - playing.startAt);
  const el = document.querySelector('#time');
  if (el) el.textContent = `${clock(t)} / ${clock(d.durationSec)}`;
  const ph = document.querySelector<HTMLElement>('#playhead');
  if (ph) ph.style.left = `${Math.min(100, (t / d.durationSec) * 100)}%`;
  const sec = sectionAt(d, t);
  document.querySelectorAll('.sec').forEach((e) => e.classList.toggle('now', !!sec && e.getAttribute('data-name') === sec.name));
  const i = vocalOn ? sungIndex(d, t) : -1;
  document.querySelectorAll<HTMLElement>('.kana').forEach((e) => e.classList.toggle('now', Number(e.dataset.i) === i));
  requestAnimationFrame(tick);
}

function render() {
  const d = demoById(current);
  const ev = loadEvaluations()[current];
  const rating: Rating = ev?.rating ?? { again: 3, together: 3, hook: 3 };
  const isPlaying = playing?.id === current;
  const lines = lyricLines(d);
  app.innerHTML = `
  <div class="ht">
    <header><a href="./index.html">← PSYENCE WORKSHOP</a><span>ZIG · FREAKTION SONG 002 · PHASE 0</span></header>
    <section class="hero">
      <p class="kicker">EMOTION COLLISION × TIME CROSS</p>
      <h1>HAPPY <em>TEARS</em></h1>
      <p class="concept">${esc(happy.concept)}</p>
    </section>
    <nav class="tabs">${demos.map((x) => `<button class="tab t${x.id} ${x.id === current ? 'active' : ''}" data-demo="${x.id}"><b>${x.id}</b><span>${esc(x.title)}</span><small>${x.bpm} BPM · ${x.durationSec.toFixed(1)} 秒</small></button>`).join('')}</nav>
    <section class="player t${current}">
      <div class="transport">
        <button id="play" class="play">${isPlaying ? '■ 停止' : '▶ 再生'}</button>
        <button id="vocal" class="toggle ${vocalOn ? 'on' : ''}">ボーカル ${vocalOn ? 'ON' : 'OFF'}</button>
        <span id="time" class="time">${clock(0)} / ${clock(d.durationSec)}</span>
        <span id="status" class="status"></span>
      </div>
      <div class="timeline">${d.sections.map((s) => `<div class="sec" data-name="${esc(s.name)}" style="left:${(s.start / d.durationSec) * 100}%;width:${((s.end - s.start) / d.durationSec) * 100}%"><b>${esc(s.name)}</b><span>${s.start.toFixed(1)}s</span></div>`).join('')}<div id="playhead" class="playhead"></div></div>
      <div class="mixer">${stems.map((s) => `<label><span>${esc(s.label)}</span><input type="range" min="0" max="1.5" step="0.05" value="${levels[s.id as StemId]}" data-stem="${s.id}"><output>${Math.round(levels[s.id as StemId] * 100)}%</output></label>`).join('')}</div>
    </section>
    <section class="grid">
      <div>
        <h2>${d.id} — ${esc(d.title)}</h2>
        <p class="goal">${esc(d.goal)}</p>
        <h3>コード進行</h3>
        <ul class="chords">${d.chords.map((c) => `<li><b>${esc(c.bars)}</b> ${esc(c.chords)}${c.why ? `<small>${esc(c.why)}</small>` : ''}</li>`).join('')}</ul>
        <h3>リフ</h3>
        <ul class="riffs">${d.riffs.map((r) => `<li><b>${esc(r.name)}</b> ${esc(r.text)}</li>`).join('')}</ul>
        <h3>編成</h3>
        <p class="inst"><b class="hap">HAPPY</b> ${esc(d.instrumentation.happy.join('・'))}<br><b class="tea">TEARS</b> ${esc(d.instrumentation.tears.join('・'))}<br><b>BAND</b> ${esc(d.instrumentation.band.join('・'))}</p>
      </div>
      <div>
        <h3>歌詞 (デモで歌う部分)</h3>
        <div class="lyrics">${lines.map((l) => `<p${l.hook ? ` class="hookline${l.hook === 'TEAR〜S!' ? ' tears' : ''}"` : ''}>${l.hook ? `<i>${l.hook}</i>` : ''}${l.notes.map((k) => `<span class="kana" data-i="${k.index}">${esc(k.lyric)}</span>`).join('')}</p>`).join('')}</div>
        <p class="small">歌詞の原文: ${happy.lyrics.sungInDemos.map((s) => `${esc(s.section)} 「${s.lines.map(esc).join(' / ')}」`).join('、')}</p>
        <p class="small">HAPPY〜! = ハ (短く) ・ ピ (母音 i を伸ばす)、TEAR〜S! = ティ ・ ア (母音 a を伸ばし一段下がる) ・ ズ (子音 z だけ、母音は消す)。サビは ZIG の声を「喜び」「悲しみ」の2つの歌い方で同時に重ねている。</p>
        <h3>FREAKTION の発見</h3>
        <ul class="riffs">${d.discoveries.map((x) => `<li><b>${esc(x.name)}</b> ${esc(x.text)}</li>`).join('')}</ul>
      </div>
    </section>
    <section class="eval">
      <h3>試聴評価 (${d.id})</h3>
      <div class="ratings">
        ${(['again', 'together', 'hook'] as const).map((k) => `<label>${{ again: 'もう一度聴きたい', together: '幸福と悲しみが同時に聞こえる', hook: 'HAPPY TEARS を口ずさみたくなる' }[k]}<input type="range" min="1" max="5" step="1" value="${rating[k]}" data-rate="${k}"><output>${rating[k]}</output></label>`).join('')}
      </div>
      <textarea id="memo" rows="3" placeholder="気になった音、もう一度聴きたくなった瞬間…">${esc(ev?.memo ?? '')}</textarea>
      <div><button id="save">評価を保存</button><button id="export">全評価を書き出す</button><span id="saved">${ev ? `保存: ${new Date(ev.savedAt).toLocaleString('ja-JP')}` : ''}</span></div>
    </section>
    <footer>${happy.licenses.map((l) => `<p><b>${esc(l.what)}</b> — ${esc(l.source)} · ${esc(l.license)}</p>`).join('')}<p>歌: ${esc(d.credits.join(' / '))}。各案の音量は −${Math.abs(happy.targetLufs)} LUFS にそろえている (6つのパートの合計で)。</p></footer>
  </div>`;
  app.querySelectorAll<HTMLButtonElement>('.tab').forEach((b) =>
    b.addEventListener('click', () => {
      const was = !!playing;
      current = b.dataset.demo as DemoId;
      if (was) void play(current).catch((e) => status(String(e)));
      else render();
    }),
  );
  app.querySelector('#play')!.addEventListener('click', () => (playing?.id === current ? stop() : void play(current).catch((e) => status(String(e)))));
  app.querySelector('#vocal')!.addEventListener('click', () => {
    vocalOn = !vocalOn;
    applyGains();
    const b = app.querySelector('#vocal')!;
    b.textContent = `ボーカル ${vocalOn ? 'ON' : 'OFF'}`;
    b.classList.toggle('on', vocalOn);
  });
  app.querySelectorAll<HTMLInputElement>('[data-stem]').forEach((el) =>
    el.addEventListener('input', () => {
      levels[el.dataset.stem as StemId] = Number(el.value);
      el.nextElementSibling!.textContent = `${Math.round(Number(el.value) * 100)}%`;
      applyGains();
    }),
  );
  app.querySelectorAll<HTMLInputElement>('[data-rate]').forEach((el) => el.addEventListener('input', () => (el.nextElementSibling!.textContent = el.value)));
  app.querySelector('#save')!.addEventListener('click', () => {
    const r = Object.fromEntries([...app.querySelectorAll<HTMLInputElement>('[data-rate]')].map((el) => [el.dataset.rate, Number(el.value)])) as unknown as Rating;
    const ok = saveEvaluation({ id: current, memo: (app.querySelector('#memo') as HTMLTextAreaElement).value, rating: r, savedAt: new Date().toISOString() });
    app.querySelector('#saved')!.textContent = ok ? `保存しました (${new Date().toLocaleTimeString('ja-JP')})` : 'このブラウザでは保存できません';
  });
  app.querySelector('#export')!.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ song: 'HAPPY TEARS', phase: 0, exportedAt: new Date().toISOString(), evaluations: loadEvaluations() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'happy-tears-evaluations.json';
    a.click();
  });
  if (playing) tick();
}

render();
