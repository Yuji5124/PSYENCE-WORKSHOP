# ZIG SOUND ENGINE — Research Notes

Checked 2026-10-23. This note distinguishes software licenses from the license of each sound bank/model. A repository's license is not evidence that separately downloaded samples, voicebanks, or trained weights share it.

## Findings and decision

| Candidate | Free / licensing / redistribution | Activity and CPU / Windows | TypeScript/Vite route | Phase 1A decision |
|---|---|---|---|---|
| FreePats Clean Electric Guitar | The official page could not be reached under this environment's current egress policy. CC0, commercial use, and redistribution therefore remain **unverified**. | Not assessed from primary source. | A browser would need a separately licensed sample bank and Web Audio playback. | **Not adopted pending primary-source verification.** No claim that it is CC0. |
| sfizz | BSD-2-Clause software license permits use and redistribution subject to its notice/disclaimer. A soundfont's license remains independent. | C++ SFZ synthesizer; GitHub marked archived; latest release shown as 1.2.3 (2024-01-14), with Windows binaries. The source engine can run on CPU. | Native C/C++ library; Vite integration would need a maintained WASM build/bindings and licensed SFZ assets. | Not adopted: unnecessary runtime and WASM port for this browser experiment. |
| Neural Amp Modeler (NAM) | Repository code is MIT; trained `.nam` model rights are separate and need a model-specific license check. | Python training/export repository; active (latest checked release v0.13.0, 2026-06-02). Real-time plugin is a separate project; CPU-capable native plugins exist, but inference performance depends on model and host. Windows setup is heavier than static samples. | Not a TypeScript library. A browser port would require a compatible WASM/runtime model and separately cleared weights. | Not adopted: model licensing/runtime adds cost and complexity without a suitable cleared model. |
| Karoryfer / SFZ Instruments — Emilyguitar | Selected bank `Karoryfer Emilyguitar v1.001` has an included CC0-1.0 license. CC0 permits commercial use and redistribution; preserve the included license/source notice as provenance. The catalog is not blanket-licensed: each instrument has its own terms. | Source is a pre-recorded multisample instrument; CPU playback is lightweight. Windows use is straightforward in SFZ-compatible players, but the Phase 1A browser runtime is self-contained. | Curated samples are delivered as OGG and decoded/played with Web Audio; no SFZ engine dependency. | **Adopted**. 13 sampled roots, four velocity layers and three round robins (156 OGG files; about 4.8 MB). Notes outside sample roots are pitch-shifted to the nearest mapped root. |
| VOICEVOX ENGINE / VOICEVOX Song | Engine repository provides LGPL v3 and documents an alternative license by contacting the maintainer. Voice library/character terms are separate. Engine metadata for the tested singer directs users to `VOICEVOX:波音リツ` credit and the singer's terms. | CPU-only Windows packages and CPU Docker image are published. Tested image reports engine 0.26.0; CPU generation succeeded. | Local HTTP engine API can be called from a local app, but default CORS does not authorize arbitrary GitHub Pages origins; no remote paid API is required. | **Song API verified**; not embedded in the public app. Tested original lyric phrase and generated a 6.165 s WAV with the Song/frame APIs. Character attribution/terms must accompany any distribution. |
| OpenUtau | MIT editor software; each voicebank and resampler has its own terms and may restrict commercial use or redistribution. | Active; Windows arm64/x64 releases; desktop editor and external voicebank/resampler workflow. CPU use depends on chosen resampler and voicebank. | Desktop render/export can be brought into a web app as a WAV, but it is not an in-browser TS library. | Not selected for app embedding; viable manual composition fallback after voicebank clearance. |
| DiffSinger | Apache-2.0 code; trained model checkpoints and datasets have separate licenses. No suitable Japanese singing model/license was verified for this task. | Python >=3.10 and PyTorch setup; active source. CPU-only inference is not promised by the checked setup docs; Windows installation is comparatively involved and model-dependent. | Python inference service or a substantial converted runtime/model would be needed; no direct Vite API. | Not adopted: model/voice permissions and practical CPU inference remain unverified. |

## Primary sources

- [FreePats Clean Electric Guitar](https://freepats.zenvoid.org/ElectricGuitar/clean-electric-guitar.html) — user-designated source; page access was blocked by the current environment policy, so no license inference was made.
- [sfizz repository and license](https://github.com/sfztools/sfizz), [releases](https://github.com/sfztools/sfizz/releases).
- [NAM repository](https://github.com/sdatkinson/neural-amp-modeler), [license](https://github.com/sdatkinson/neural-amp-modeler/blob/main/LICENSE), [real-time plugin project](https://github.com/sdatkinson/NeuralAmpModelerPlugin).
- [SFZ Instruments guitar catalog](https://sfzinstruments.github.io/guitars/); [Emilyguitar source, README, and license](https://github.com/sfzinstruments/karoryfer.emilyguitar); [v1.001 release](https://github.com/sfzinstruments/karoryfer.emilyguitar/releases/tag/v1.001).
- [VOICEVOX ENGINE repository](https://github.com/VOICEVOX/voicevox_engine), [license](https://github.com/VOICEVOX/voicevox_engine/blob/master/LICENSE), [song API docs](https://github.com/VOICEVOX/voicevox_engine/blob/master/docs/song.md), [VOICEVOX speaker terms](http://canon-voice.com/kiyaku.html).
- [OpenUtau repository](https://github.com/openutau/OpenUtau), [releases](https://github.com/openutau/OpenUtau/releases), [voicebank documentation](https://github.com/openutau/OpenUtau/wiki).
- [DiffSinger repository](https://github.com/openvpi/DiffSinger), [license](https://github.com/openvpi/DiffSinger/blob/master/LICENSE), [setup documentation](https://github.com/openvpi/DiffSinger/blob/master/docs/getting_started.md).

Repository metadata (license, latest release/push date, archive status) was checked from GitHub's repository/release API. Dates and release numbers above are a snapshot, not a promise of ongoing maintenance. Any software update or model/bank download needs a fresh license/version review.

## Voice test result

Using the official CPU Docker image `voicevox/voicevox_engine:cpu-latest` (engine 0.26.0), the `/sing_frame_audio_query` and `/frame_synthesis` singing path—not the speech `/audio_query` and `/synthesis` path—generated an original Japanese phrase, **「音で未来を塗り替える」**, from supplied kana notes, MIDI pitches, note-frame lengths, BPM 120, and a 15-frame leading rest. Result: mono PCM16, 24 kHz, 6.165 seconds, 295,980 bytes. CPU synthesis took 1.52 seconds; Docker image size was about 2.18 GB and observed container memory during generation was about 478 MiB. The CPU engine log selected CPU. The metadata identified the singer as 波音リツ and asks for `VOICEVOX:波音リツ` credit; review that singer's linked terms before sharing generated audio. This does not imitate hide or another singer.

## ZIG vocal direction

- **ZIG RAW:** close, unprocessed, natural articulation; select a voicebank with explicit commercial/distribution permission.
- **ZIG EDGE:** restrained saturation and breath/grit processing applied to a licensed generated/rendered voice; no voice identity imitation.
- **ZIG CYBER:** formant-safe delay/chorus/bit reduction as post-processing; keep lyrics intelligible.

These are design targets, not three completed voice presets.

## Runtime and rights notes

The current guitar asset pack is 4,826,896 bytes across 156 mono OGG files (44.1 kHz source; 5.0 MiB including manifest and license). Only sample layers used by current riff notes are fetched/decoded, then cached in memory; each decoded 4.22-second sample occupies about 0.71 MiB in Web Audio's Float32 representation. Browser heap/audio memory depends on distinct notes and round robins actually used. Web Audio playback consumes CPU for filters, waveshaping, drum synthesis, and resampling. No external audio service is contacted. Sample round-robin selection is deterministic from experiment seed and bar/step index. This is a local browser sampler, not a complete SFZ player.

The build and unit tests pass. Source OGGs were independently decoded by FFmpeg. A Chromium headless playback check was attempted, but the managed container could not complete Chromium startup, so actual browser audition and this implementation's sample-based WAV export are not claimed as verified. Listen in a supported browser before judging the instrument balance and transient quality.

SOUNDVAULT is unchanged. Exported experiment JSON records engine/preset controls and sample identity/license; WAV and JSON remain user downloads. Attribution is retained even though CC0 does not require it.
