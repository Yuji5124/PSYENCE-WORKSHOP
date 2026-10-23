# PSYENCE WORKSHOP

**EXP-001 — PINK NOISE** is a small browser music experiment by the evolving virtual artist ZIG. Phase 1A adds a real-recorded, CC0 electric-guitar sample bank alongside the original Phase 0 synth, with synchronized Web Audio drums. No paid API, account, external sound service, or installed audio plugin is required.

ZIG is a changing point of view, not a recreation of hide. This project does not copy existing melodies, signature riffs, recordings, or vocals. The source and rights research, including limitations and the VOICEVOX Song test, is in [docs/ZIG-SOUND-RESEARCH.md](docs/ZIG-SOUND-RESEARCH.md). SOUNDVAULT is not modified; experiment storage remains behind `ExperimentStore`.

## Run locally

Requires Node.js 20 or newer and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Press **PLAY** once to unlock audio in Safari and other browsers that require a user gesture. Guitar samples load on demand the first time they are needed.

## Play and edit

- **PLAY / STOP** starts and stops a one bar loop. Guitar plays on the 8 riff steps; drums play on 16 synchronized steps.
- In **RIFF LAB**, choose a note or REST, choose its gate length, and toggle **ACC** or **MUTE** (short palm-muted articulation).
- In **BEAT LAB**, tap the 16 pads to toggle kick, snare, and hi-hat.
- Choose **ZIG DRIVE**, **ZIG STRANGE**, or **ZIG CYBER**. Adjust the three guitar controls: **DRIVE**, **TONE**, and **SPACE**.
- **A/B: SAMPLE / SYNTH** switches between the sampled guitar and the original Phase 0 oscillator guitar. BPM, pattern and master balance remain shared for a direct comparison.
- **MUTATE** changes one to three riff pitches. **UNDO** restores the previous riff. Sample round robins use the seed and step/bar position deterministically.
- Edit the seed or use the shuffle control. Pattern, sound engine, preset, controls, and asset/license provenance are stored in JSON version 2. Version 1 Phase 0 JSON still loads as the original synth.
- **SAVE EXPERIMENT** saves to local browser storage when available and downloads `EXP-001_PINK-NOISE.json`. **LOAD JSON** restores a compatible experiment.
- **EXPORT 20S WAV** renders the current one-bar pattern continuously for exactly 20 seconds (10 bars at 120 BPM) as `EXP-001_PINK-NOISE-20S.wav`. A short fade at the end prevents an abrupt cut; changing BPM changes the number of bars, not the file duration.

The Live Web Audio scheduler uses a lookahead queue; pattern changes are applied at a loop boundary. WAV uses the same sample bank, sound parameters, seeded drum noise, and pattern scheduler. Tiny differences can remain across browser/audio hardware implementations.

## Checks

```sh
npm test
npm run build
npm run preview
```

## GitHub Pages

The `.github/workflows/pages.yml` workflow tests and builds on pushes to `main`, then deploys the `dist` folder with GitHub Pages. In repository **Settings → Pages**, select **GitHub Actions** as the build and deployment source. A workflow run on `main` is required before a public preview URL is available. Pull request builds do not publish the site.

## Current limits

- This is a short-loop experiment sequencer, not a full DAW. It has no multitrack recording, arrangement editor, microphone input, or mastering chain.
- The guitar uses the FreePats CC0 Fender clean bridge multisample, curated to 13 roots with up to two velocity layers and four round robins. Notes use playback-rate transposition to nearby roots, so notes outside the sampled roots can still sound less natural. It is not a full SFZ engine.
- Muted articulation uses a shortened gate and darker filter response; it is not a dedicated palm-muted recording layer. Slides and pitch bends are not implemented.
- The samples have a clean amp/effects treatment from FreePats; DRIVE adds further saturation. See the research note for the source bank, selection, and licensing.
- VOICEVOX Song was verified through a local CPU engine, but is not embedded in this app. Singer attribution and voicebank-specific terms apply to generated vocal audio.
- Use a current desktop browser or iPhone Safari with Web Audio and `OfflineAudioContext` support. On iPhone, the first PLAY press must be a user gesture.
- Browser local save is device-specific. Keep the downloaded JSON as a portable backup. SOUNDVAULT's format and write flow must be reviewed before adding a destination adapter.
