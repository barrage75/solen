# Solen pitch video

This standalone Remotion project produces the French Claire story and app demo. It reuses the pitch deck’s local font and logo assets; all sound effects are synthesized locally. `public/demo-solen-v4.mp4` is an unchanged render input copied from `../solen/docs/demo-solen.mp4`.

```sh
npm ci
python3 -m pip install --user edge-tts numpy
python3 scripts/generate_voice.py
python3 scripts/generate_sfx.py
npm run typecheck
npm run render
```

`npm run render` renders the composition, then normalizes the AAC mix to −16 LUFS and writes `../solen/docs/solen-pitch-fr.mp4`. The original demo media remains unchanged.
