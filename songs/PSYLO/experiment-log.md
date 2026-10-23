# Experiment log

Use this log for audible results, including directions that do not work. A listening note saved in the browser is local to that device; copy useful decisions here.

## 2026-10-23 — First chorus comparison

- **Setup:** three original eight-bar Web Audio arrangements; A 160 BPM, B 136 BPM, C 148 BPM.
- **Guitar:** existing FreePats CC0 sampled guitar. A starts at CRUNCH ROCK, B at CLEAN POP, C at FUZZ CHAOS. Presets share three familiar DRIVE/TONE/SPACE controls.
- **Other parts:** synthesized kick/snare/hat, triangle bass, and a pitched synthetic melody guide. No lyric singing is rendered.
- **Initial design rationale:** A tests a long final O, B tests two short repeated calls, C tests a texture switch and clipped shout.
- **Automated browser smoke:** Chromium loaded the PSYLO page, decoded the needed guitar samples, and entered PLAYING for B and C; A played through all eight bars to completion. No browser runtime exceptions were reported. This confirms the preview path, not a human musical judgment.
- **Implementation catch:** sharp-note sample filenames contained `#`, which a URL treated as a fragment. Renaming those bundled assets to URL-safe `sharp` names fixed browser retrieval. Sample decoding is queued to reduce concurrent decoder pressure on mobile browsers.
- **Not yet recorded:** a human listening judgment on device/browser, preferred hook, actual lyric-to-note alignment, and mix/arrangement revisions. Do not mark any candidate as selected until auditioned.
- **Accidental discoveries:** none logged yet.
- **Rejected ideas:** none logged yet.
