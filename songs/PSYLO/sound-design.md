# Sound design — Phase 0

The production should feel like a small band interrupted by feelings that brought their own toys. Keep the hook readable; put the surprise in the entrances, articulation, and timing details.

## Shared palette

- **Guitar:** existing FreePats Clean Electric Guitar CC0 recordings through the browser sample engine. Keep pick attack and note decay audible. No guitar sample from a reference recording is used.
- **Drums:** Web Audio synthesized kick, snare, and hat. A solid kick/snare frame anchors the song; small hat syncopations can feel more programmed.
- **Bass:** a muted triangle/low-pass tone doubles the chord roots in the preview. Replace it with a recorded or more expressive bass instrument after the chorus direction is chosen.
- **Electronic color:** a narrow, pitched guide tone can act like a toy light or stage cue. Use brief bleeps and leave space for guitar rather than adding a busy layer.
- **Vocal:** no singer is rendered in this Phase 0 page. The preview uses an original synthetic note guide only; it neither reads lyrics nor imitates a person's voice. The existing separate VOICEVOX Song research and licensed test are documented in `docs/ZIG-SOUND-RESEARCH.md`.

## Three guitar starting points

These are song-specific mappings onto the existing DRIVE / TONE / SPACE controls, not additional low-level controls.

| Working preset | Preview mapping | Intended role |
|---|---|---|
| CLEAN POP | DRIVE 17, TONE 82, SPACE 19 | Bright short notes and a little room around Pattern B |
| CRUNCH ROCK | DRIVE 39, TONE 64, SPACE 7 | Pick attack and body without burying Pattern A's pitch |
| FUZZ CHAOS | DRIVE 72, TONE 90, SPACE 7 | A bounded rough edge for Pattern C's final entrance; reduce if the hook loses definition |

In the live sketch, A, B, and C use those control values respectively. They share the same sample bank and arrangement engine so the comparison stays useful.

## Arrangement map

- **A:** full guitar and 8-beat drums from bar 1. The last bar opens a longer vowel over a rising phrase.
- **B:** lighter, syncopated guitar and extra offbeat hats. Keep the bass part simple so repeated words do the memorable work.
- **C:** bars 1–2 use the electronic pitch guide and bass without guitar; the guitar joins at bar 3. The final high guide notes stand in for a short shout.

No export or final mix is implied by these sketches. First settle pronunciation, melodic contour, and whether the chorus wants a long or clipped ending.
