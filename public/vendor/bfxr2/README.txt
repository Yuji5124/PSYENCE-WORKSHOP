PSYLO uses the standalone Bfxr2 synthesis library from:
https://github.com/increpare/bfxr2/tree/43c6c3b15e76407e9863b999741340999225e21f/lib

The bundled library contains its MIT license and third-party notices, including
SfxrSynth-derived DSP under Apache-2.0 and CC0 Adventure Kid waveform data.
This project invokes the bundled synthesizers with fixed seeds at runtime; it
does not bundle or redistribute source audio recordings from Bfxr2.

The upstream repository does not specify a separate license for audio generated
by the library. PSYLO uses the generated tones as parts of its original musical
study; it does not sell or redistribute them as a standalone sound library.
