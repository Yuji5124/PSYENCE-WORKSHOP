# PSYLO — Phase 0

**Artist:** ZIG  
**Reading:** サイロ  
**Working etymology:** PSYche × GLOW  
**Form under study:** three original eight-bar chorus sketches  
**Status:** Pattern A selected; **Phase 1: a Japanese singing vocal (VOICEVOX) sings the eight bars with the band** — see [vocal/README.md](vocal/README.md)

## Selected direction

Pattern A — **疾走型 / LONG O** is the current working direction, selected by the project owner on 2026-10-24. Keep the 160 BPM drive, rising hook, and sustained final **ロー** as the testable core. This is a direction choice, not a lock on the final melody or words. Patterns B and C remain archived alternatives in the browser and study notes.

PSYLO begins with an inner show that escapes through music. The protagonist stays complicated: fear, anger, delight, and sadness remain in the room and become part of the performance. The next show has already started before this one ends.

## Listen in the browser

Run `npm ci` and `npm run dev`, then open `/psylo.html`. In **VOCAL HOOK**, choose RUN or DROP, then select one of six **STRANGE CIRCUITS** and press **LISTEN** on A. The middle **イ** holds for about three beats across the bar line; **ロー** enters on beat 3 of bar 8. RUN keeps the syncopated guitar moving, while DROP leaves space from the start of the long **イ** until **ロー**. The six electronic sounds are generated in-browser from fixed seeds with Bfxr2; they are not voice performances or bundled recordings. Choose B or C to hear the retained alternatives. The guide is a synthetic pitch cue, not singing or voice cloning.

The listening note is saved to this browser's local storage. It is not uploaded. Record comparisons and decisions in [experiment-log.md](experiment-log.md) as well, so they travel with the project.

## Phase 1 — vocal

In `/psylo.html`, the **VOCAL** panel plays Pattern A with a pre-rendered Japanese singing voice (VOICEVOX Engine song API): vocal on/off, styles A STRAIGHT / B ROCK / C WILD, lyric versions FULL / SHORT, voices 波音リツ / 玄野武宏, the original or sung melody guide, part levels, and the live lyric and **サイロー** window. Regenerate with `npm run vocal:render` while a VOICEVOX Engine runs locally. Credit when shared: **VOICEVOX:波音リツ / VOICEVOX:玄野武宏**.

## Study files

- [Story premise](story.md)
- [Three chorus lyric drafts](lyrics-draft.md)
- [Melody and pronunciation patterns](melody-patterns.md)
- [Arrangement and sound design](sound-design.md)
- [Hide research and listening worksheet](research-notes.md)
- [Experiment log](experiment-log.md)
- [Phase 1 vocal implementation](vocal/README.md) and [lyric ↔ note table](vocal/notes.md)

All words, melodies, riffs, and arrangements in these drafts are original. Hide's work is a study reference for broad creative questions, never source material to trace or reproduce. Factual biographical claims are kept out until they can be checked against primary sources; interpretation and listening hypotheses are labeled as such.
