import './style.css';
import { LiveAudioEngine, renderWav } from './audio';
import { experimentStore } from './experiment-store';
import { cloneExperiment, createRandomSeed, DEFAULT_EXPERIMENT, fromDocument, midiLabel, mutateExperiment, toDocument, type Experiment, type RiffStep } from './model';

const ROOT = document.querySelector<HTMLDivElement>('#app');
if (!ROOT) throw new Error('Application root was not found.');

const engine = new LiveAudioEngine();
const NOTES = Array.from({ length: 37 }, (_, index) => index + 36);
let experiment = cloneExperiment(DEFAULT_EXPERIMENT);
let riffHistory: RiffStep[][] = [];
let playing = false;
let animationFrame = 0;

try {
  const saved = experimentStore.load();
  if (saved) experiment = fromDocument(saved);
} catch {
  // Continue with the factory pattern when storage is unavailable or invalid.
}

ROOT.innerHTML = `
  <div class="shell">
    <header class="topbar">
      <a class="wordmark" href="#top" aria-label="PSYENCE WORKSHOP home"><span class="wordmark-symbol">P</span><span>PSYENCE<br>WORKSHOP</span></a>
      <div class="top-meta"><span class="live-mark"><i></i> EXPERIMENTAL AUDIO LAB</span><span class="top-index">FIELD NOTE / 001</span></div>
      <div class="artist-tag"><span class="artist-label">VIRTUAL ARTIST</span><strong>ZIG</strong></div><a class="song-lab-link" href="./psylo.html">PSYLO CHORUS STUDY ↗</a>
    </header>

    <main id="top">
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow"><span>EXP-001</span><span class="eyebrow-line"></span><span>PHASE 0 / RIFF STUDY</span></div>
          <h1>PINK<br><em>NOISE</em></h1>
          <p class="hero-description">意図と偶然のあいだで、8つの音を転がす。<br>Make a small noise. Let it become something.</p>
        </div>
        <div class="scope-card">
          <div class="scope-top"><span>LIVE SIGNAL / MONO SOURCE</span><span class="scope-readout" id="scope-readout">WAITING FOR INPUT</span></div>
          <canvas id="waveform" aria-label="Live audio waveform visualization"></canvas>
          <div class="scope-footer"><span>00:08 LOOP STUDY</span><span class="scope-frequency">440 <small>HZ REF</small></span></div>
          <div class="scope-corner">PW<span>01</span></div>
        </div>
      </section>

      <section class="transport panel" aria-label="Experiment controls">
        <div class="transport-main">
          <button class="play-button" id="play-button" type="button"><span class="play-icon">▶</span><span>PLAY</span></button>
          <div class="transport-state"><span class="state-led" id="state-led"></span><strong id="transport-status">READY TO EXPERIMENT</strong><small>EDITED CHANGES APPLY NEXT LOOP</small></div>
        </div>
        <div class="control-row">
          <label class="range-control bpm-control" for="bpm-control"><span class="control-name">TEMPO <small>BPM</small></span><output id="bpm-value">120</output><input id="bpm-control" type="range" min="60" max="180" value="120" /></label>
          <label class="range-control" for="drive-control"><span class="control-name">DRIVE</span><output id="drive-value">32%</output><input id="drive-control" type="range" min="0" max="100" value="32" /></label>
          <label class="range-control" for="tone-control"><span class="control-name">TONE</span><output id="tone-value">66%</output><input id="tone-control" type="range" min="0" max="100" value="66" /></label>
          <label class="range-control" for="space-control"><span class="control-name">SPACE</span><output id="space-value">12%</output><input id="space-control" type="range" min="0" max="100" value="12" /></label>
        </div>
        <div class="action-row">
          <div class="mutation-actions"><button class="button button-pink" id="mutate-button" type="button"><span class="button-spark">✳</span> MUTATE</button><button class="button button-quiet" id="undo-button" type="button" disabled>↶ UNDO</button><label class="seed-control">SEED <input id="seed-control" type="text" maxlength="32" value="ZIG-001" aria-label="Random seed" /><button id="random-seed-button" class="icon-button" type="button" aria-label="Generate random seed" title="Generate random seed">⤨</button></label></div>
          <div class="file-actions"><button class="button button-green" id="save-button" type="button">SAVE EXPERIMENT <span>↓</span></button><button class="button button-outline" id="wav-button" type="button"><span class="wav-icon">◖</span> EXPORT 20S WAV</button><button class="button button-quiet load-button" id="load-button" type="button">LOAD JSON <span>↗</span></button><input id="json-file" type="file" accept="application/json,.json" hidden /></div>
        </div>
        <div id="status-message" class="status-message" role="status" aria-live="polite">最初のパターンを読み込みました。</div>
      </section>

      <div class="labs-heading"><div><span class="eyebrow-label">01 — COMPOSE</span><h2>THE WORKBENCH</h2></div><span class="labs-heading-note">TWO LOOPS. ONE HAPPY ACCIDENT.</span></div>

      <section class="lab-grid">
        <article class="panel lab-panel riff-panel">
          <div class="panel-heading"><div class="panel-title-wrap"><span class="lab-icon riff-icon">〰</span><div><span class="eyebrow-label">GUITAR / 8 STEPS</span><h3>RIFF LAB</h3></div></div><div class="panel-tag"><select id="guitar-preset" aria-label="Guitar preset"><option>ZIG DRIVE</option><option>ZIG STRANGE</option><option>ZIG CYBER</option></select> <button class="button button-quiet" id="ab-button" type="button">A/B: SAMPLE</button></div></div>
          <p class="panel-intro">音程、長さ、アクセントを並べて、まだ名前のないリフを探す。</p>
          <div id="riff-grid" class="riff-grid" aria-label="Eight-step riff sequencer"></div>
          <div class="grid-legend"><span><i class="legend-dot pink-dot"></i> NOTE / CLICK TO EDIT</span><span><i class="legend-dot green-dot"></i> ACCENT</span><span>REST = SILENCE, ALSO MUSIC</span></div>
        </article>

        <article class="panel lab-panel beat-panel">
          <div class="panel-heading"><div class="panel-title-wrap"><span class="lab-icon beat-icon">▥</span><div><span class="eyebrow-label">DRUM MACHINE / 16 STEPS</span><h3>BEAT LAB</h3></div></div><div class="panel-tag">SYNTH DRUMS <span>02</span></div></div>
          <p class="panel-intro">キック、スネア、ハイハット。クリックでリズムを組み替える。</p>
          <div class="beat-grid" id="beat-grid" aria-label="Sixteen-step drum sequencer"></div>
          <div class="beat-legend"><span><i class="legend-dot kick-dot"></i> KICK</span><span><i class="legend-dot snare-dot"></i> SNARE</span><span><i class="legend-dot hat-dot"></i> HI-HAT</span><span class="sync-note">SYNC / 1 BAR</span></div>
        </article>
      </section>

      <section class="manifesto panel">
        <div class="manifesto-mark">Z.</div><div><span class="eyebrow-label">A NOTE FROM THE WORKSHOP</span><p>ZIG is a changing point of view, not a reconstruction. We carry forward questions about contrast, speed, play, and surprise—then make new sounds for now.</p><small>この工房は特定のアーティストや録音を再現しません。ZIGの記録は、実験と問いを更新していくためのものです。</small></div><div class="manifesto-stamp">SOUND<br>IN PROGRESS</div>
      </section>
    </main>
    <footer><span>PSYENCE WORKSHOP <b>©</b> 2026</span><span>CC0 GUITAR SAMPLES + LOCAL WEB AUDIO / NO PAID API</span><span>EXP-001 / <b>PINK NOISE</b></span></footer>
  </div>`;

const $ = <T extends HTMLElement>(id: string) => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
};

const riffGrid = $<HTMLDivElement>('riff-grid');
const beatGrid = $<HTMLDivElement>('beat-grid');
const statusMessage = $<HTMLDivElement>('status-message');

function showStatus(message: string, error = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('is-error', error);
}

function queuePatternUpdate() {
  if (playing) {
    engine.update(experiment);
    $<HTMLSpanElement>('scope-readout').textContent = 'NEXT LOOP QUEUED';
  }
}

function updateTransportControls() {
  $<HTMLButtonElement>('undo-button').disabled = riffHistory.length === 0;
  $<HTMLButtonElement>('play-button').classList.toggle('is-playing', playing);
  $<HTMLButtonElement>('play-button').innerHTML = playing ? '<span class="play-icon">■</span><span>STOP</span>' : '<span class="play-icon">▶</span><span>PLAY</span>';
  $<HTMLSpanElement>('state-led').classList.toggle('is-live', playing);
  $<HTMLElement>('transport-status').textContent = playing ? 'SIGNAL IS LIVE' : 'READY TO EXPERIMENT';
  $<HTMLSpanElement>('scope-readout').textContent = playing ? `SIGNAL LOCKED / ${experiment.bpm} BPM` : 'WAITING FOR INPUT';
}

function renderRiff() {
  riffGrid.innerHTML = experiment.riff.map((step, index) => `
    <div class="riff-step" data-riff-play="${index}">
      <div class="riff-step-top"><span>0${index + 1}</span><i class="step-active-mark"></i></div>
      <label class="sr-only" for="note-${index}">Step ${index + 1} note</label>
      <select id="note-${index}" class="note-select" data-riff-field="pitch" data-index="${index}">
        <option value="" ${step.pitch === null ? 'selected' : ''}>REST</option>
        ${NOTES.map((note) => `<option value="${note}" ${step.pitch === note ? 'selected' : ''}>${midiLabel(note)}</option>`).join('')}
      </select>
      <label class="length-label" for="length-${index}">GATE</label>
      <select id="length-${index}" class="length-select" data-riff-field="length" data-index="${index}" aria-label="Step ${index + 1} length">
        <option value="0.5" ${step.length === 0.5 ? 'selected' : ''}>SHORT</option>
        <option value="1" ${step.length === 1 ? 'selected' : ''}>NORM</option>
        <option value="1.5" ${step.length === 1.5 ? 'selected' : ''}>LONG</option>
      </select>
      <button class="accent-toggle ${step.accent ? 'is-on' : ''}" type="button" data-accent="${index}" aria-pressed="${step.accent}" aria-label="${step.accent ? 'Disable' : 'Enable'} accent for step ${index + 1}"><span>ACC</span><i></i></button>
      <button class="mute-toggle ${step.palmMute ? 'is-on' : ''}" type="button" data-mute="${index}" aria-pressed="${step.palmMute}" aria-label="Toggle palm mute for step ${index + 1}">MUTE</button>
    </div>`).join('');
}

function renderBeats() {
  const rows: Array<{ key: 'kick' | 'snare' | 'hat'; label: string; icon: string }> = [
    { key: 'kick', label: 'KICK', icon: '●' },
    { key: 'snare', label: 'SNARE', icon: '×' },
    { key: 'hat', label: 'HAT', icon: '＋' },
  ];
  beatGrid.innerHTML = rows.map((row) => `
    <div class="drum-row drum-${row.key}"><span class="drum-label"><i>${row.icon}</i>${row.label}</span><div class="drum-pads">${experiment.drums.map((step, index) => `<button type="button" class="drum-pad ${step[row.key] ? 'is-on' : ''} ${index % 4 === 0 ? 'bar-start' : ''}" data-drum="${row.key}" data-index="${index}" data-drum-play="${index}" aria-label="${row.label}, step ${index + 1}" aria-pressed="${step[row.key]}"><span>${index + 1}</span></button>`).join('')}</div></div>`).join('');
}

function renderState() {
  renderRiff();
  renderBeats();
  const bpm = $<HTMLInputElement>('bpm-control');
  bpm.value = String(experiment.bpm);
  $<HTMLOutputElement>('bpm-value').value = String(experiment.bpm);
  for (const parameter of ['drive', 'tone', 'space'] as const) {
    $<HTMLInputElement>(`${parameter}-control`).value = String(Math.round(experiment.guitar[parameter] * (parameter === 'tone' || parameter === 'space' ? 100 : 1)));
    $<HTMLOutputElement>(`${parameter}-value`).value = `${Math.round(experiment.guitar[parameter] * (parameter === 'tone' || parameter === 'space' ? 100 : 1))}%`;
  }
  $<HTMLSelectElement>('guitar-preset').value = experiment.guitar.preset;
  $<HTMLButtonElement>('ab-button').textContent = `A/B: ${experiment.guitar.engine === 'samples' ? 'SAMPLE' : 'SYNTH'}`;
  $<HTMLInputElement>('seed-control').value = experiment.seed;
  updateTransportControls();
}

function rememberRiff() {
  riffHistory.push(experiment.riff.map((step) => ({ ...step })));
  if (riffHistory.length > 50) riffHistory.shift();
}

function commitRiff(riff: RiffStep[]) {
  experiment = { ...experiment, riff };
  queuePatternUpdate();
  renderRiff();
  updateTransportControls();
}

riffGrid.addEventListener('change', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) return;
  const field = target.dataset.riffField;
  const index = Number(target.dataset.index);
  if (field !== 'pitch' && field !== 'length') return;
  rememberRiff();
  const riff = experiment.riff.map((step) => ({ ...step }));
  if (field === 'pitch') riff[index].pitch = target.value === '' ? null : Number(target.value);
  else riff[index].length = Number(target.value) as RiffStep['length'];
  commitRiff(riff);
});

riffGrid.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest<HTMLButtonElement>('[data-accent], [data-mute]');
  if (!button) return;
  const index = Number(button.dataset.accent ?? button.dataset.mute);
  rememberRiff();
  const riff = experiment.riff.map((step) => ({ ...step }));
  if (button.dataset.mute !== undefined) riff[index].palmMute = !riff[index].palmMute;
  else riff[index].accent = !riff[index].accent;
  commitRiff(riff);
});

beatGrid.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest<HTMLButtonElement>('[data-drum]');
  if (!button) return;
  const instrument = button.dataset.drum as 'kick' | 'snare' | 'hat';
  const index = Number(button.dataset.index);
  const drums = experiment.drums.map((step) => ({ ...step, [instrument]: step[instrument] }));
  drums[index][instrument] = !drums[index][instrument];
  experiment = { ...experiment, drums };
  queuePatternUpdate();
  renderBeats();
});

$<HTMLButtonElement>('play-button').addEventListener('click', async () => {
  if (playing) {
    await engine.stop();
    playing = false;
    clearPlayhead();
    updateTransportControls();
    $<HTMLSpanElement>('scope-readout').textContent = 'SIGNAL RELEASED';
    startWaveform();
    showStatus('ループを停止しました。');
    return;
  }
  try {
    await engine.play(experiment, highlightStep);
    playing = true;
    updateTransportControls();
    showStatus('音声を再生中。変更は次のループから反映されます。');
    startWaveform();
  } catch (error) {
    showStatus(error instanceof Error ? error.message : '音声を開始できませんでした。', true);
  }
});

$<HTMLButtonElement>('mutate-button').addEventListener('click', () => {
  rememberRiff();
  const { next, changed } = mutateExperiment(experiment);
  experiment = next;
  queuePatternUpdate();
  renderState();
  showStatus(`MUTATE — ${changed.length}箇所を変化させました${playing ? '。次のループから聴こえます。' : '。'}`);
});

$<HTMLButtonElement>('undo-button').addEventListener('click', () => {
  const previous = riffHistory.pop();
  if (!previous) return;
  experiment = { ...experiment, riff: previous };
  queuePatternUpdate();
  renderState();
  showStatus(`UNDO — ひとつ前のリフに戻しました${playing ? '。次のループから反映されます。' : '。'}`);
});

$<HTMLInputElement>('bpm-control').addEventListener('input', (event) => {
  experiment = { ...experiment, bpm: Number((event.target as HTMLInputElement).value) };
  $<HTMLOutputElement>('bpm-value').value = String(experiment.bpm);
  queuePatternUpdate();
});

for (const parameter of ['drive', 'tone', 'space'] as const) {
  $<HTMLInputElement>(`${parameter}-control`).addEventListener('input', (event) => {
    const value = Number((event.target as HTMLInputElement).value) / (parameter === 'drive' ? 1 : 100);
    experiment = { ...experiment, guitar: { ...experiment.guitar, [parameter]: value } };
    $<HTMLOutputElement>(`${parameter}-value`).value = `${Math.round(value * (parameter === 'drive' ? 1 : 100))}%`;
    queuePatternUpdate();
  });
}

$<HTMLSelectElement>('guitar-preset').addEventListener('change', (event) => {
  const preset = (event.target as HTMLSelectElement).value as Experiment['guitar']['preset'];
  const settings = {
    'ZIG DRIVE': { drive: 42, tone: 0.7, space: 0.12 },
    'ZIG STRANGE': { drive: 27, tone: 0.46, space: 0.35 },
    'ZIG CYBER': { drive: 58, tone: 0.88, space: 0.06 },
  }[preset];
  experiment = { ...experiment, guitar: { ...experiment.guitar, preset, ...settings } };
  renderState(); queuePatternUpdate(); showStatus(`${preset} guitar preset`);
});
$<HTMLButtonElement>('ab-button').addEventListener('click', () => {
  experiment = { ...experiment, guitar: { ...experiment.guitar, engine: experiment.guitar.engine === 'samples' ? 'synth' : 'samples' } };
  renderState(); queuePatternUpdate(); showStatus(`A/B — ${experiment.guitar.engine === 'samples' ? '実録音サンプル' : 'Phase 0 合成ギター'}`);
});

$<HTMLInputElement>('seed-control').addEventListener('change', (event) => {
  const value = (event.target as HTMLInputElement).value.trim().slice(0, 32) || 'ZIG-001';
  experiment = { ...experiment, seed: value };
  (event.target as HTMLInputElement).value = value;
  queuePatternUpdate();
  showStatus(`Seed set — ${value}`);
});

$<HTMLButtonElement>('random-seed-button').addEventListener('click', () => {
  experiment = { ...experiment, seed: createRandomSeed() };
  $<HTMLInputElement>('seed-control').value = experiment.seed;
  queuePatternUpdate();
  showStatus(`新しいSeedを設定しました: ${experiment.seed}`);
});

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$<HTMLButtonElement>('save-button').addEventListener('click', () => {
  if (experiment.createdAt === DEFAULT_EXPERIMENT.createdAt) experiment = { ...experiment, createdAt: new Date().toISOString() };
  const documentData = toDocument(experiment);
  const json = JSON.stringify(documentData, null, 2);
  let savedLocally = false;
  try {
    experimentStore.save(documentData);
    savedLocally = true;
  } catch {
    // File export remains available when private browsing disables persistent storage.
  }
  downloadBlob(new Blob([json], { type: 'application/json' }), 'EXP-001_PINK-NOISE.json');
  showStatus(savedLocally ? '実験をこの端末に保存し、JSONを書き出しました。' : 'JSONを書き出しました。ブラウザのローカル保存は利用できません。');
});

$<HTMLButtonElement>('wav-button').addEventListener('click', async (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span> RENDERING…';
  try {
    const wav = await renderWav(experiment);
    downloadBlob(wav, 'EXP-001_PINK-NOISE-20S.wav');
    showStatus('20秒のテストWAVを書き出しました。末尾に短いフェードを入れています。');
  } catch (error) {
    showStatus(error instanceof Error ? error.message : 'WAVを書き出せませんでした。', true);
  } finally {
    button.disabled = false;
    button.innerHTML = '<span class="wav-icon">◖</span> EXPORT 20S WAV';
  }
});

$<HTMLButtonElement>('load-button').addEventListener('click', () => $<HTMLInputElement>('json-file').click());
$<HTMLInputElement>('json-file').addEventListener('change', async (event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const imported = fromDocument(JSON.parse(await file.text()));
    experiment = imported;
    riffHistory = [];
    queuePatternUpdate();
    renderState();
    showStatus(`${file.name} を読み込みました。同じSeedとパターンで再生します。`);
  } catch (error) {
    showStatus(error instanceof Error ? error.message : 'JSONを読み込めませんでした。', true);
  } finally {
    input.value = '';
  }
});

function highlightStep(step: number, _scheduledAt: number) {
  document.querySelectorAll('.is-current').forEach((element) => element.classList.remove('is-current'));
  document.querySelector(`[data-riff-play="${Math.floor(step / 2)}"]`)?.classList.add('is-current');
  document.querySelectorAll(`[data-drum-play="${step}"]`).forEach((element) => element.classList.add('is-current'));
  $<HTMLSpanElement>('scope-readout').textContent = `SIGNAL LOCKED / ${experiment.bpm} BPM`;
}

function clearPlayhead() {
  document.querySelectorAll('.is-current').forEach((element) => element.classList.remove('is-current'));
}

function startWaveform() {
  cancelAnimationFrame(animationFrame);
  const canvas = $<HTMLCanvasElement>('waveform');
  const context = canvas.getContext('2d');
  if (!context) return;
  const analyser = engine.visualizationNode;
  const data = new Uint8Array(analyser?.fftSize ?? 1024);
  const idleStartedAt = performance.now();
  const draw = () => {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(rect.width * scale) || canvas.height !== Math.round(rect.height * scale)) {
      canvas.width = Math.round(rect.width * scale);
      canvas.height = Math.round(rect.height * scale);
    }
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    if (analyser) analyser.getByteTimeDomainData(data);
    else {
      const elapsed = (performance.now() - idleStartedAt) / 1000;
      for (let index = 0; index < data.length; index += 1) {
        const phase = (index / data.length) * Math.PI * 4;
        data[index] = 128 + Math.sin(phase + elapsed * 1.8) * 38 + Math.sin(phase * 2.8 - elapsed * 1.1) * 7;
      }
    }
    const gradient = context.createLinearGradient(0, 0, rect.width, 0);
    gradient.addColorStop(0, '#fd3b9d');
    gradient.addColorStop(0.52, '#d8ff45');
    gradient.addColorStop(1, '#fd3b9d');
    context.beginPath();
    for (let index = 0; index < data.length; index += 1) {
      const x = (index / (data.length - 1)) * rect.width;
      const y = (data[index] / 255) * rect.height;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = gradient;
    context.lineWidth = 1.6;
    context.shadowColor = '#fd3b9d';
    context.shadowBlur = 9;
    context.stroke();
    context.shadowBlur = 0;
    animationFrame = requestAnimationFrame(draw);
  };
  draw();
}

renderState();
startWaveform();
window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(animationFrame);
  void engine.stop();
});
