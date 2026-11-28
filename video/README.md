# Solen pitch video

Standalone bilingual Remotion composition for the Solen story, supplier/AI explainer, and real-app demo. French and English use their own narration manifests, localized on-screen copy, schedules, and clean app captures. It reuses the pitch deck palette, local Archivo/Manrope/JetBrains Mono fonts, and solid logo crops. Every voice, music, and SFX asset is local; music and SFX are synthesized with NumPy.

## Inputs

- `public/demo-solen-fr-clean.mp4` is a 30 fps, 1920×1200 intermediate rebuilt from the DPR2 capture in `~/profil/solen-video-work/demo-solen-fr.ffconcat` and its timestamped JPEG frames. The source timeline is `demo-solen-fr.timeline.json`; its 4.047 s trim offset is applied before the scene timestamps. Those scene times were checked against the original frames.
- `public/demo-solen-en-clean.mp4` is the English 30 fps intermediate, prepared from `~/profil/solen-video-work/demo-solen-en.ffconcat` and `demo-solen-en.timeline.json` with `--lang en`.
- `public/images/supplier-nuvio-live.png` is the DPR2 screenshot of the live `/fournisseurs` page; `supplier-nuvio-table.png` is its table crop used for the animated profile card.
- `public/images/supplier-nuvio-live-en.png` and `supplier-nuvio-table-en.png` are the English-mode supplier screenshot and table crop.
- `src/voice-lines.json` and `src/voice-lines.en.json` are the authoritative French and English narration sources. Run `scripts/generate_voice.py --lang fr|en` to create the language-specific manifest and MP3s with Edge TTS word boundaries. The voices are `fr-FR-HenriNeural` at +15% and `en-US-ChristopherNeural` at +10%.
- Supplier values and fallback analysis come from the Solen app data. The Nuvio attachment IBAN is read from `solen/public/attachments/Nouveau_RIB_Nuvio_Cloud.pdf`; only its app-style mask appears in the video.
- `public/images/claire/` contains AI-generated Claire illustrations with transparent cutouts for the story scenes.

## Rebuild assets

Run from `video/`:

```sh
npm ci
python3 -m pip install --user edge-tts numpy
python3 scripts/generate_voice.py --lang fr
python3 scripts/generate_voice.py --lang en
python3 scripts/generate_sfx.py
python3 scripts/generate_music.py
python3 scripts/prepare_demo_source.py --lang fr --work ~/profil/solen-video-work
python3 scripts/prepare_demo_source.py --lang en --work ~/profil/solen-video-work
npm run typecheck
npm run render
npm run render:en
python3 scripts/create_evidence.py
python3 scripts/create_evidence.py --lang en --output ~/profil/video-check/pitch-en1
```

The generated source intermediate and audio assets are committed so the composition renders without the capture work directory or network access. The four scripts can be rerun when their source material changes.

`npm run render` (alias for `render:fr`) writes `../solen/docs/solen-pitch-fr.mp4`; `npm run render:en` writes `../solen/docs/solen-pitch-en.mp4`. Both are 1920×1080 H.264 with AAC at 192 kb/s, then normalized to −16 LUFS / −1.5 dBTP. The shared music bed covers both schedules. These commands do not alter the README demo MP4/GIFs or Next.js source.

The evidence script accepts `--lang fr|en` and `--output <directory>`. It writes mid-line stills, wake-up, routine, click, and phone-reveal stills with a Claire contact sheet, 30/70%-through demo stills and their contact sheet, a stills grid sampled every two seconds, VO timings, and a 0.5-second edge safe-area audit. The audit reports non-background pixels within 60 px of the top and side edges, excluding the intentional hook backdrop and lower-right concentric arcs.
