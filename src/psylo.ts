import { GuitarSampleBank } from './guitar-samples';
import './psylo.css';

type Sketch = {
  id: 'A' | 'B' | 'C'; title: string; bpm: number; lyric: string; note: string;
  riff: Array<Array<number | null>>; melody: Array<Array<number | null>>;
  roots: number[]; style: 'drive' | 'bounce' | 'change';
};

type BfxrApi = {
  preset: (synth: string, preset: string, seed: string) => unknown;
  render: (sound: unknown) => Float32Array;
  sampleRate: number;
};

declare global { interface Window { bfxr?: BfxrApi } }

type FxPattern = { name: string; synth: string; preset: string; seed: string; description: string; steps: number[]; gain: number; rate: number };

const fxPatterns: FxPattern[] = [
  { name: 'ALIEN HANDSHAKE', synth: 'Signlr', preset: 'alien_handshake', seed: 'psylo-fx-01', description: '宇宙無線の応答が、拍の隙間に点滅', steps: [13, 46, 79, 111], gain: .19, rate: .88 },
  { name: 'BUFFER SKIP', synth: 'Glitchr', preset: 'buffer_skip', seed: 'psylo-fx-02', description: '細切れのデジタル欠落。中盤で二連発', steps: [25, 27, 58, 89, 91, 121], gain: .24, rate: 1.08 },
  { name: 'POWER SHORT', synth: 'Zappr', preset: 'power_short', seed: 'psylo-fx-03', description: 'ギターの裏で火花が飛ぶ', steps: [7, 39, 71, 103], gain: .18, rate: .93 },
  { name: 'REALITY GLITCH', synth: 'Riftr', preset: 'reality_glitch', seed: 'psylo-fx-04', description: '時間がよじれる下降音。出る位置もずらす', steps: [2, 33, 52, 82, 117], gain: .15, rate: .82 },
  { name: 'ROBOT CHOIR', synth: 'Choirr', preset: 'robot_choir', seed: 'psylo-fx-05', description: '中間の伸ばしにロボットの合唱が重なる', steps: [48, 75, 109], gain: .11, rate: .9 },
  { name: 'ALIEN PURR', synth: 'Crittr', preset: 'alien_purr', seed: 'psylo-fx-06', description: '生き物とも機械ともつかない低い鳴き声', steps: [31, 63, 94, 126], gain: .12, rate: .76 },
];

const sketches: Sketch[] = [
  {
    id: 'A', title: '疾走型 / LONG O', bpm: 160,
    lyric: 'ポケットで\n宇宙がはねる\n知らない色を\n靴音に着て\n胸の奥で\nショーが目覚める\nさあ サイーー\nロー——！',
    note: '7小節目4拍目から「イ」を約3拍またいで伸ばし、8小節目3拍目の最高音F#5で「ロー」へ。RUN / DROPどちらも変則ギター。',
    riff: [[50, null, null, 57, 55, null, 59, null], [47, null, 54, null, null, 55, null, 57], [43, null, 50, 52, null, 50, 52, null], [45, null, null, 52, 50, null, 54, 57], [50, null, 50, null, 55, 57, null, 59], [47, 54, null, 54, 52, null, 55, null], [43, null, 50, null, 48, 50, null, 52], [45, null, 52, 54, 57, null, 62, 62]],
    melody: [[62, 62, 66, 66], [66, 69, 69, 66], [64, 66, 69, 69], [66, 69, 71, 69], [67, 67, 69, 71], [69, 71, 74, 71], [69, 71, 74, 76], [null, null, 78]],
    roots: [38, 35, 31, 33, 38, 35, 31, 33], style: 'drive',
  },
  {
    id: 'B', title: 'ポップ型 / DOUBLE HOOK', bpm: 136,
    lyric: '鏡の中で　紙吹雪が踊る\n似合わない色　今日は似合う\nサイロ、サイロ！　口笛みたいに\nPSYLO! PSYLO!　まだ帰らない',
    note: '「サイロ」を2回、同じリズムで反復。3拍目の裏を少し遅らせ、跳ねる感じを確認する。',
    riff: [[50, null, 57, null, 55, 57, 59, null], [47, null, 54, null, 52, 54, 55, null], [43, null, 50, 52, 48, null, 50, 52], [45, null, 52, null, 50, 52, 54, null], [50, null, 57, null, 55, 57, 59, null], [47, null, 54, null, 52, 54, 55, null], [43, null, 50, 52, 48, null, 50, 52], [45, null, 52, 54, 57, null, 54, 57]],
    melody: [[69, 71, 74, 71], [69, 71, 74], [72, 71, 69], [67, 69, 71], [69, 71, 74, 71], [69, 71, 74], [72, 71, 69], [67, 69, 74, 74]],
    roots: [38, 35, 31, 33, 38, 35, 31, 33], style: 'bounce',
  },
  {
    id: 'C', title: '変異型 / SWITCH & SHOUT', bpm: 148,
    lyric: '感情たちが　勝手に点呼\n青いバグから　赤い弦へ\n不安も怒りも　音にして\nPSY——LO!　次のショーが始まる',
    note: '前半2小節は電子音とベースだけ。3小節目からギターが入り、最後の「PSY-LO」を高く短く叫ぶ設計。',
    riff: [[null, null, 62, null, null, 62, 65, null], [null, 62, null, 65, 67, null, 65, 62], [50, null, 57, 59, 55, null, 57, 59], [47, null, 54, 55, 52, 54, 55, null], [43, null, 50, null, 48, 50, 52, 50], [45, null, 52, 54, 50, null, 52, 54], [50, 50, null, 57, 55, null, 59, 62], [45, null, 52, 57, 62, null, 69, 74]],
    melody: [[74, 71, 74], [76, 74, 71, 74], [69, 71, 74], [67, 69, 74], [69, 71, 74], [71, 74, 76], [74, 76, 79], [81, 78, 81]],
    roots: [38, 35, 31, 33, 38, 35, 31, 33], style: 'change',
  },
];

const root = document.querySelector<HTMLDivElement>('#psylo-app');
if (!root) throw new Error('PSYLO app root missing');
root.innerHTML = `
  <main class="psylo-shell">
    <header><a href="./" class="back">← WORKSHOP</a><div class="brand">PSYENCE<br>WORKSHOP</div><span class="artist">ZIG / SONG 001</span></header>
    <section class="hero"><div><span class="kicker">PHASE 0 — CHORUS STUDY</span><h1>PSY<span>LO</span></h1><p class="reading">サイロ　/　PSYche × GLOW</p><p class="lead">心の中で勝手に続いていたショーが、音楽になって外へ飛び出す。</p></div><div class="signal"><span>INNER SHOW // OUTSIDE</span><div class="signal-bars">▂ ▅ ▃ ▇ ▄ ▆ ▂ ▇ ▃ ▅ ▂ ▆</div><span>8 BARS / ORIGINAL SKETCH</span></div></section>
    <section class="controls"><div class="play-controls"><button id="play" class="play">▶　PLAY CHORUS</button><label>TEMPO <input id="tempo" type="range" min="125" max="165" value="160"><output id="tempo-value">160 BPM</output></label></div><p id="status" aria-live="polite">Aを選んでサビの仮メロディを試聴</p></section>
    <section class="hook-lab"><div><span class="kicker">VOCAL HOOK / IRREGULAR TAKE</span><h2>「イーー」をまたいで、「ロー」へ</h2><p>160 BPMのまま、中間の「イ」を約3拍に拡張。7小節目4拍目で「イ」、8小節目3拍目に最高音F#5の「ロー」。どちらも変則ギターです。</p></div><div class="hook-options"><button class="hook-option active" data-hook="run" aria-pressed="true"><b>01 / RUN</b><span>伸ばす間もギターが食い込む</span></button><button class="hook-option" data-hook="drop" aria-pressed="false"><b>02 / DROP</b><span>長い「イ」の間でギターが抜け、「ロー」で戻る</span></button></div></section>
    <section class="fx-lab"><div class="fx-intro"><span class="kicker">SIX STRANGE CIRCUITS / BFXR2</span><h2>電子音の変な回路を選ぶ</h2><p>GitHubのオープンソース音響エンジンで毎回同じSeedから生成。選んだ音が8小節の隙間に不規則に割り込みます。</p></div><div id="fx-options" class="fx-options"></div></section>
    <section class="patterns" id="patterns"></section>
    <section class="guide"><div><span class="kicker">VOCAL GUIDE</span><h2>歌声ではなく、歌える音域の仮メロディ</h2><p>明るい電子音が音程を示します。歌唱合成はまだ使っていません。ここでは言葉の乗り方、母音の伸び、サビの記憶しやすさを比較します。</p></div><div class="mini-legend"><b>GUITAR</b> CC0 FreePats sample<br><b>BEAT / BASS</b> Web Audio synthesis<br><b>VOICE</b> original note guide only</div></section>
    <section class="log"><label for="decision">試聴メモ / どこをもう一度聴きたい？</label><textarea id="decision" rows="3" placeholder="例：Bのサイロ反復が残る。最後の母音は短く切る案も聴きたい。"></textarea><button id="save-note">SAVE LISTENING NOTE</button><span id="saved-note"></span></section>
    <footer>架空の少年の物語から生まれたオリジナル案。既存曲の旋律・歌詞・録音は使っていません。<br><a href="./">PSYENCE WORKSHOP — PINK NOISE</a></footer>
  </main>`;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const patterns = $('patterns');
let selected = 0;
let hookBacking: 'run' | 'drop' = 'run';
let selectedFx = 0;
let context: AudioContext | null = null;
let active = false;
let activeGain: GainNode | null = null;
let stepTimer = 0;
let generation = 0;
const guitars = new GuitarSampleBank();
const fxBuffers = new Map<number, AudioBuffer>();
const oddKickSteps = new Set([0, 11, 16, 27, 32, 39, 46, 51, 60, 64, 73, 77, 82, 91, 96, 102, 110, 112, 122]);
const oddSnareSteps = new Set([4, 13, 21, 28, 34, 43, 54, 62, 67, 76, 84, 90, 101, 109, 116, 120, 126]);
const oddHatSteps = new Set([1, 5, 12, 17, 20, 30, 33, 37, 45, 47, 49, 55, 59, 63, 65, 69, 75, 80, 85, 89, 95, 97, 104, 107, 111, 113, 118, 124, 127]);

function renderFxOptions() {
  $('fx-options').innerHTML = fxPatterns.map((fx, index) => `<button class="fx-option ${index === selectedFx ? 'active' : ''}" data-fx="${index}" aria-pressed="${index === selectedFx}"><b>0${index + 1} / ${fx.name}</b><span>${fx.description}</span></button>`).join('');
}
renderFxOptions();
$('fx-options').addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const option = target.closest<HTMLButtonElement>('[data-fx]');
  if (!option) return;
  selectedFx = Number(option.dataset.fx);
  document.querySelectorAll<HTMLButtonElement>('[data-fx]').forEach((item, index) => {
    const isSelected = index === selectedFx;
    item.classList.toggle('active', isSelected);
    item.setAttribute('aria-pressed', String(isSelected));
  });
  $('status').textContent = `電子音パターン ${selectedFx + 1} / ${fxPatterns[selectedFx].name} を選択。PLAY CHORUSで重ねて試聴。`;
});

function renderCards() {
  patterns.innerHTML = sketches.map((s, i) => `<article class="pattern-card ${i === selected ? 'selected' : ''}" data-card="${i}"><div class="card-head"><span>OPTION ${s.id}</span><b>${s.bpm} BPM</b></div><h2>${s.title}</h2><pre>${s.lyric}</pre><p>${s.note}</p><div class="card-meta"><span>${s.style === 'drive' ? 'CRUNCH ROCK / LONG VOWEL' : s.style === 'bounce' ? 'CLEAN POP / REPEAT' : 'FUZZ CHAOS / SWITCH'}</span><button data-listen="${i}">▶ LISTEN</button></div></article>`).join('');
}
renderCards();
document.querySelectorAll<HTMLButtonElement>('[data-hook]').forEach((button) => button.addEventListener('click', () => {
  hookBacking = button.dataset.hook === 'drop' ? 'drop' : 'run';
  document.querySelectorAll<HTMLButtonElement>('[data-hook]').forEach((option) => {
    const isSelected = option === button;
    option.classList.toggle('active', isSelected);
    option.setAttribute('aria-pressed', String(isSelected));
  });
  $('status').textContent = `A案 / ${hookBacking === 'run' ? '長い「イ」の間もギターが動く' : '長い「イ」でギターが抜け、「ロー」で戻る'}`;
}));
patterns.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const listen = target.closest<HTMLButtonElement>('[data-listen]');
  const card = target.closest<HTMLElement>('[data-card]');
  const index = Number(listen?.dataset.listen ?? card?.dataset.card);
  if (!Number.isInteger(index) || index < 0 || index >= sketches.length) return;
  if (active && !listen) stop();
  selected = index; renderCards(); $<HTMLInputElement>('tempo').value = String(sketches[selected].bpm); $('tempo-value').textContent = `${sketches[selected].bpm} BPM`;
  if (listen) start();
});
$<HTMLInputElement>('tempo').addEventListener('input', (event) => { $('tempo-value').textContent = `${(event.target as HTMLInputElement).value} BPM`; });

function getFxBuffer(ctx: AudioContext, index: number): AudioBuffer {
  const cached = fxBuffers.get(index);
  if (cached) return cached;
  const engine = window.bfxr;
  if (!engine) throw new Error('Bfxr2音響ライブラリを読み込めません');
  const definition = fxPatterns[index];
  const rendered = engine.render(engine.preset(definition.synth, definition.preset, definition.seed));
  const buffer = ctx.createBuffer(1, rendered.length, engine.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let sample = 0; sample < rendered.length; sample++) channel[sample] = rendered[sample];
  fxBuffers.set(index, buffer);
  return buffer;
}

function scheduleFx(ctx: AudioContext, destination: AudioNode, at: number, beat: number, patternIndex: number) {
  const definition = fxPatterns[patternIndex];
  const buffer = getFxBuffer(ctx, patternIndex);
  for (const step of definition.steps) {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.playbackRate.value = definition.rate;
    gain.gain.value = definition.gain;
    source.connect(gain); gain.connect(destination);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start(at + step * beat / 4);
  }
}

function synthNote(ctx: AudioContext, destination: AudioNode, midi: number, at: number, duration: number, type: OscillatorType, gain: number, filterHz = 6000) {
  const osc = ctx.createOscillator(); const amp = ctx.createGain(); const filter = ctx.createBiquadFilter();
  osc.type = type; osc.frequency.value = 440 * 2 ** ((midi - 69) / 12); filter.type = 'lowpass'; filter.frequency.value = filterHz;
  amp.gain.setValueAtTime(0.0001, at); amp.gain.linearRampToValueAtTime(gain, at + 0.012); amp.gain.setTargetAtTime(0.0001, at + duration * .82, Math.max(.02, duration * .12));
  osc.connect(filter); filter.connect(amp); amp.connect(destination); osc.start(at); osc.stop(at + duration + .25);
}
function drum(ctx: AudioContext, out: AudioNode, kind: 'kick'|'snare'|'hat', at: number, noiseKey = 0) {
  if (kind === 'kick') { const o=ctx.createOscillator(), g=ctx.createGain(); o.type='sine'; o.frequency.setValueAtTime(145,at); o.frequency.exponentialRampToValueAtTime(43,at+.12); g.gain.setValueAtTime(.72,at); g.gain.exponentialRampToValueAtTime(.0001,at+.23); o.connect(g); g.connect(out); o.start(at); o.stop(at+.24); return; }
  const size=ctx.sampleRate*(kind==='snare'?.15:.05), buf=ctx.createBuffer(1,size,ctx.sampleRate), d=buf.getChannelData(0);
  let noiseSeed=noiseKey ^ (kind==='snare'?0x5a17:0x71ab);
  for(let i=0;i<size;i++){noiseSeed^=noiseSeed<<13;noiseSeed^=noiseSeed>>>17;noiseSeed^=noiseSeed<<5;d[i]=(noiseSeed>>>0)/0x80000000-1;}
  const src=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain(); src.buffer=buf; f.type='highpass'; f.frequency.value=kind==='hat'?6500:1200; g.gain.setValueAtTime(kind==='hat'?.055:.2,at); g.gain.exponentialRampToValueAtTime(.0001,at+(kind==='hat'?.05:.15)); src.connect(f); f.connect(g); g.connect(out); src.start(at); src.stop(at+(kind==='hat'?.05:.15));
}
async function start() {
  stop(); const run=++generation; const sketch=sketches[selected]; const bpm=Number($<HTMLInputElement>('tempo').value); const beat=60/bpm, eighth=beat/2, sixteenth=beat/4;
  try {
    const safariWindow=window as Window & {webkitAudioContext?:typeof AudioContext};
    const Ctor=window.AudioContext??safariWindow.webkitAudioContext;
    if(!Ctor)throw new Error('このブラウザはWeb Audioに対応していません');
    context ??= new Ctor(); await context.resume();
    $('status').textContent=`OPTION ${sketch.id} / ギター音源を準備中`;
    const needed=sketch.riff.flatMap((bar,barIndex)=>bar.flatMap((pitch,index)=>pitch===null||sketch.style==='change'&&barIndex<2?[]:[{pitch,accent:index===0||index===4}]));
    const ctx=context; await guitars.prepare(ctx,needed,`PSYLO-${sketch.id}`);
    if(run!==generation)return;
    const mix=ctx.createGain(); const comp=ctx.createDynamicsCompressor(); mix.gain.value=.67; comp.threshold.value=-10; comp.ratio.value=6; mix.connect(comp); comp.connect(ctx.destination); activeGain=mix;
    const startAt=ctx.currentTime+.14; const totalSteps=8*16; active=true; $('play').textContent='■　STOP'; $('status').textContent=`OPTION ${sketch.id} / ${bpm} BPM — PLAYING`;
    scheduleFx(ctx, mix, startAt, beat, selectedFx);
    for(let step=0;step<totalSteps;step++) {
      const bar=Math.floor(step/16), pos=step%16, at=startAt+bar*beat*4+pos*sixteenth;
      const oddPulse = sketch.id === 'A';
      if(oddPulse ? oddKickSteps.has(step) : pos===0||pos===8)drum(ctx,mix,'kick',at,bar*16+pos);
      if(oddPulse ? oddSnareSteps.has(step) : pos===4||pos===12)drum(ctx,mix,'snare',at,bar*16+pos);
      if(oddPulse ? oddHatSteps.has(step) : pos%2===0||sketch.style==='bounce'&&pos%4===3)drum(ctx,mix,'hat',at,bar*16+pos);
      if(pos%2===0) {
        const eighthIndex=pos/2; const pitch=sketch.riff[bar][eighthIndex];
        const riffAt=at+(sketch.style==='bounce'&&eighthIndex%2===1?beat*.055:0);
        const underLongO = sketch.id === 'A' && hookBacking === 'drop' && (bar === 6 && eighthIndex >= 6 || bar === 7 && eighthIndex < 4);
        if(pitch!==null && !underLongO && !(sketch.style==='change'&&bar<2)) void guitars.play(ctx,mix,pitch,eighthIndex===0||eighthIndex===4,eighth*.84,`PSYLO-${sketch.id}`,bar*8+eighthIndex,sketch.id==='A'?39:sketch.id==='B'?17:72,sketch.id==='A'?.64:sketch.id==='B'?.82:.9,sketch.id==='B'?.19:.07,riffAt,false);
        if(eighthIndex===0||eighthIndex===4) synthNote(ctx,mix,sketch.roots[bar],at,beat*.4,'triangle',.19,280);
      }
    }
    // A synthetic, original pitch guide: 4 notes per bar, placed on offbeats
    // where available so the vowel-length options remain audible in the phrase.
    sketch.melody.forEach((barNotes,bar)=>barNotes.forEach((pitch,index)=>{
      if (pitch === null) return;
      const slot=[0,2,4,6][index] ?? 6; const duration=sketch.id==='A'&&bar===7&&index===barNotes.length-1?beat*1.8:beat*.42;
      const at=startAt+bar*beat*4+slot*eighth;
      const heldMiddleI = sketch.id === 'A' && bar === 6 && index === 3;
      const heldFinalO = sketch.id === 'A' && bar === 7 && pitch === 78;
      synthNote(ctx,mix,pitch,at,heldMiddleI?beat*3:heldFinalO?beat*1.8:duration,'triangle',.095,2600);
    }));
    let shown=-1; stepTimer=window.setInterval(()=>{if(!context||!active)return;const s=Math.floor((context.currentTime-startAt)/sixteenth);if(s>=totalSteps){stop();$('status').textContent=`OPTION ${sketch.id} / 完了 — 同じ案をもう一度聴くにはLISTEN`;return;}if(s!==shown){shown=s;document.querySelectorAll('.pattern-card').forEach((el,i)=>el.classList.toggle('playing',i===selected));}},35);
  } catch(error) { stop(); $('status').textContent=`再生エラー: ${error instanceof Error?error.message:'音源を準備できません'}`; }
}
function stop() { generation++; active=false; window.clearInterval(stepTimer); if(activeGain&&context&&context.state!=='closed'){const g=activeGain;g.gain.cancelScheduledValues(context.currentTime);g.gain.setTargetAtTime(.0001,context.currentTime,.012);window.setTimeout(()=>{try{g.disconnect()}catch{}},120);activeGain=null;} document.querySelectorAll('.pattern-card').forEach(el=>el.classList.remove('playing')); if($('play'))$('play').textContent='▶　PLAY CHORUS'; }
$<HTMLButtonElement>('play').addEventListener('click',()=>active?stop():start());
$<HTMLButtonElement>('save-note').addEventListener('click',()=>{const fx=fxPatterns[selectedFx];const record={song:'PSYLO',saved_at:new Date().toISOString(),selected:sketches[selected].id,bpm:Number($<HTMLInputElement>('tempo').value),hookBacking,fxPattern:fx.name,fxSource:`${fx.synth}/${fx.preset}`,fxSeed:fx.seed,note:$<HTMLTextAreaElement>('decision').value};localStorage.setItem('psylo-listening-note',JSON.stringify(record));$('saved-note').textContent=`OPTION ${record.selected} / ${record.fxPattern} の試聴メモをこの端末に保存しました。`;});
window.addEventListener('pagehide',stop);
