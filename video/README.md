# Solen pitch video

Standalone Remotion composition for the French Solen story, supplier/AI explainer, and real-app demo. It reuses the pitch deck palette, local Archivo/Manrope/JetBrains Mono fonts, and solid logo crops. Every voice, music, and SFX asset is local; music and SFX are synthesized with NumPy.

## Inputs

- `public/demo-solen-fr-clean.mp4` is a 30 fps, 1920×1200 intermediate rebuilt from the DPR2 capture in `~/profil/solen-video-work/demo-solen-fr.ffconcat` and its timestamped JPEG frames. The source timeline is `demo-solen-fr.timeline.json`; its 4.047 s trim offset is applied before the scene timestamps. Those scene times were checked against the original frames.
- `public/images/supplier-nuvio-live.png` is the DPR2 screenshot of the live `/fournisseurs` page; `supplier-nuvio-table.png` is its table crop used for the animated profile card.
- `src/voice-lines.json` is the narration source. `scripts/generate_voice.py` uses `fr-FR-HenriNeural` at +15% and stores Edge TTS word boundaries with each clip in `src/voice-manifest.json`.
- Supplier values and fallback analysis come from the Solen app data. The Nuvio attachment IBAN is read from `solen/public/attachments/Nouveau_RIB_Nuvio_Cloud.pdf`; only its app-style mask appears in the video.

## Rebuild assets

Run from `video/`:

```sh
npm ci
python3 -m pip install --user edge-tts numpy
python3 scripts/generate_voice.py
python3 scripts/generate_sfx.py
python3 scripts/generate_music.py
python3 scripts/prepare_demo_source.py --work ~/profil/solen-video-work
npm run typecheck
npm run render
python3 scripts/create_evidence.py
```

The generated source intermediate and audio assets are committed so the composition renders without the capture work directory or network access. The four scripts can be rerun when their source material changes.

`npm run render` writes `../solen/docs/solen-pitch-fr.mp4` as 1920×1080 H.264 with AAC at 192 kb/s, then normalizes the mix to −16 LUFS / −1.5 dBTP. It does not alter the README demo MP4/GIFs or Next.js source.

The evidence script writes mid-line stills, 70%-through demo stills, a contact sheet, a stills grid sampled every two seconds, VO timings, and a 0.5-second edge safe-area audit to `~/profil/video-check/pitch6/`. The audit reports non-background pixels within 40 px of the top and side edges; the intentional concentric arcs at the lower-right edge are excluded.
