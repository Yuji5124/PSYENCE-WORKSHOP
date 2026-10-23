# PSYENCE WORKSHOP

**EXP-001 — PINK NOISE** is a small browser based music experiment by the evolving virtual artist ZIG. It pairs an eight step guitar like synth riff with a synchronized sixteen step drum machine. Every sound is synthesized locally with the Web Audio API; no audio samples, AI service, or account are required.

ZIG is a changing point of view, not a recreation of hide. The workshop takes forward broad questions about contrast, speed, play, and surprise, then develops new sounds for the present. It does not copy existing melodies, signature riffs, recordings, or vocals. This project does not modify or connect to SOUNDVAULT. Experiment storage is behind the `ExperimentStore` interface so a future adapter can be designed after SOUNDVAULT's requirements are known.

ZIG's notes can grow over time. Future research should cite its sources and keep documented facts, attributed statements, and the workshop's own interpretation clearly distinct.

## Run locally

Requires Node.js 20 or newer and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Press **PLAY** once to unlock audio in Safari and other browsers that require a user gesture. The first run works without any setup beyond installing the npm dependencies.

## Make an experiment

- **PLAY / STOP** starts and stops a one bar loop. The eight riff steps play on eighth notes while the drum grid plays sixteenth notes at the same tempo.
- In **RIFF LAB**, choose a note or REST, choose a short, normal, or long gate, and toggle ACC for each step.
- In **BEAT LAB**, tap the 16 pads to toggle kick, snare, and hi hat.
- Adjust **TEMPO**, **DISTORTION**, and **FILTER** while listening. Edits are queued and take effect at the next loop boundary.
- **MUTATE** changes one to three riff pitches. The operation is repeatable from the visible seed and current riff. **UNDO** restores the previous riff edit.
- Edit the seed directly or use the shuffle control. A seed also determines the synthesized drum noise.
- **SAVE EXPERIMENT** stores the JSON in browser storage when available and downloads `EXP-001_PINK-NOISE.json`. **LOAD JSON** restores a compatible version 1 experiment.
- **EXPORT WAV** renders four bars (about eight seconds at 120 BPM) as `EXP-001_PINK-NOISE.wav`.

The JSON records the experiment ID, title, artist, BPM, seed, riff and drum steps, tone parameters, creation time, and schema version. Loading the same JSON restores the same notes, drum pattern, and seeded noise. Browser oscillator output can vary slightly across browser and audio hardware implementations.

## Checks

```sh
npm test
npm run build
npm run preview
```

## GitHub Pages

The `.github/workflows/pages.yml` workflow tests and builds on pushes to `main`, then deploys the `dist` folder with GitHub Pages. In repository **Settings → Pages**, select **GitHub Actions** as the build and deployment source. A workflow run on `main` is required before the public preview URL is available. Pull request builds do not publish the site.

## Current limits

- This is an experiment sequencer, not a full DAW: there is no multitrack recording, arrangement editor, microphone input, or export mastering chain.
- Web Audio must be enabled by a user gesture. For WAV export, use a current desktop browser or iPhone Safari with `OfflineAudioContext` support.
- The local save uses this browser's storage. Keep the downloaded JSON as a portable backup.
- SOUNDVAULT is not implemented or changed. Its destination can be added through `ExperimentStore` after its supported format and write flow are reviewed.
