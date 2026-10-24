# Experiment log

Use this log for audible results, including directions that do not work. A listening note saved in the browser is local to that device; copy useful decisions here.

## 2026-10-24 — Phase 1: Japanese singing vocal (VOICEVOX)

- **Engine:** VOICEVOX Engine 0.26.0 (CPU only) song API. Pitch, timing and phonemes come from the only singing style, 波音リツ (`6000`); the voice is rendered with 波音リツ ノーマル (`3009`) or 玄野武宏 ノーマル (`3011`, one octave down). OpenUtau (no documented CLI) and DiffSinger (CUDA-oriented setup, no Japanese model listed) were researched but not adopted. Details: [vocal/README.md](vocal/README.md).
- **Score:** `src/psylo-vocal.json` — FULL (48 notes, nearly every word of the new draft) and SHORT (30 notes, room to breathe). The hook is fixed in both: サ D5 bar 7 beat 3 → イ E5 bar 7 beat 4 for 3 beats → ロ F#5 bar 8 beat 3 for 2 beats. Table with phonemes: [vocal/notes.md](vocal/notes.md).
- **Styles:** A STRAIGHT (engine output), B ROCK (longer, louder consonants; clipped short notes), C WILD (scoops, vibrato on long notes, falling phrase ends, bar-one accents). All edits are to the engine's own query (f0, volume, phoneme length); no effects.
- **Browser:** `/psylo.html` VOCAL panel — vocal on/off, A/B/C, FULL/SHORT, voice, guide (off / original / sung melody), level sliders, syllable-by-syllable lyric highlight, the サイロー window, WAV export of the exact mix. Notes save the vocal settings.
- **Mix changes:** vocal chain (HP 110 Hz, light compression, 3 kHz presence, slap); guitar −2 dB from サ and −3 dB under ロー; bass ducks 90 ms on each kick; a fast master limiter (the vocal mix previously peaked at 0.0 dBFS).
- **Measured:** sung pitches within ±0.3 semitones; every vowel within ±5 ms of its beat; vocal over band in 1–4 kHz +2.7 dB (bars 1–6), +3.9 dB on ロー, −1.3 dB on the long イ; peak −1.4 dBFS.
- **Not yet judged by ear:** whether the hook makes you want to sing along, FULL vs SHORT, and which style/voice. The agent that built this cannot listen.
- **Credit required when shared:** VOICEVOX:波音リツ / VOICEVOX:玄野武宏.

## 2026-10-24 — Direction selected

- **Decision:** the project owner chose Pattern A (160 BPM, 疾走型, sustained final **ロー**) as the direction to develop.
- **Carry forward:** the rising hook, full-band momentum, and open final vowel. Keep the CRUNCH ROCK starting point while refining the vocal phrasing.
- **Still open:** exact lyric-to-note alignment, melody contour, guitar articulation, and whether the final held note lasts as long as the current preview. This is a direction selection, not approval of a finished chorus or mix.
- **Outcome:** made a lyric-aware A variation with a clearer syllable rhythm for **サイロー！**; the comparison is recorded below.

## 2026-10-24 — Irregular A hook and six electronic colors

- **Hook:** A remains eight bars at 160 BPM. The **イ** begins on bar 7 beat 4 and sustains for about three beats across the bar line; **ロー** begins on bar 8 beat 3 at F#5 and sustains about two beats.
- **RUN:** the syncopated guitar continues through the held **イ** and **ロー**.
- **DROP:** guitar leaves space from the onset of **イ** to the entrance of **ロー**.
- **Rhythm:** guitar and drum accents now use displaced/offbeat hits and asymmetric gaps in both versions.
- **Electronic palette:** six seeded Bfxr2 sources are available in the browser: Signlr / alien_handshake, Glitchr / buffer_skip, Zappr / power_short, Riftr / reality_glitch, Choirr / robot_choir, and Crittr / alien_purr. Each has a distinct offbeat event map.
- **Source/license:** `increpare/bfxr2`, revision `43c6c3b15e76407e9863b999741340999225e21f`; MIT project license, Apache-2.0 Sfxr-derived DSP, CC0 waveform data. No prerecorded SFX were copied. Upstream does not separately state a license for rendered audio; these generated effects remain inside the original music study.
- **Question for listening:** which of the six colors makes the chorus stranger without burying **サイーー、ロー**? Does guitar-through or DROP create the better lopsided lift?
- **Limit:** this is still a synthetic pitch guide, not a sung performance. The long vowel fit and F#5 comfort remain unverified with a singer.
- **Smoke check:** Chromium generated and started all six seeded effects in the A arrangement, switched to DROP, and saved the selected effect and seed in its local listening note. No page runtime or network errors occurred. `npm run build` succeeded; `npm test` passed (5 tests).

## 2026-10-23 — First chorus comparison

- **Setup:** three original eight-bar Web Audio arrangements; A 160 BPM, B 136 BPM, C 148 BPM.
- **Guitar:** existing FreePats CC0 sampled guitar. A starts at CRUNCH ROCK, B at CLEAN POP, C at FUZZ CHAOS. Presets share three familiar DRIVE/TONE/SPACE controls.
- **Other parts:** synthesized kick/snare/hat, triangle bass, and a pitched synthetic melody guide. No lyric singing is rendered.
- **Initial design rationale:** A tests a long final O, B tests two short repeated calls, C tests a texture switch and clipped shout.
- **Automated browser smoke:** Chromium loaded the PSYLO page, decoded the needed guitar samples, and entered PLAYING for B and C; A played through all eight bars to completion. No browser runtime exceptions were reported. This confirms the preview path, not a human musical judgment.
- **Implementation catch:** sharp-note sample filenames contained `#`, which a URL treated as a fragment. Renaming those bundled assets to URL-safe `sharp` names fixed browser retrieval. Sample decoding is queued to reduce concurrent decoder pressure on mobile browsers.
- **Not yet recorded:** a listening judgment on A1 versus A2, the final lyric, human vocal fit, and mix revisions. The owner selected A's direction; this does not yet settle those details.
- **Accidental discoveries:** none logged yet.
- **Rejected ideas:** none logged yet.
