import json
import wave
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
RATE = 48_000
FPS = 30
BPM = 122


def main():
    ranges_by_language = {}
    word_ranges_by_language = {}
    duration_frames = 0
    for language in ("fr", "en"):
        suffix = ".en" if language == "en" else ""
        manifest = json.loads((ROOT / "src" / f"voice-manifest{suffix}.json").read_text())
        cursor = 0
        ranges = {}
        word_ranges = []
        for line in manifest["lines"]:
            frames = int(np.ceil(line["durationSeconds"] * FPS))
            ranges[line["id"]] = (cursor / FPS, (cursor + frames) / FPS)
            line_start = cursor / FPS
            boundaries = line.get("wordBoundaries", [])
            if boundaries:
                word_ranges.extend(
                    (
                        max(0, line_start + word["startSeconds"] - 0.04),
                        line_start + word["endSeconds"] + 0.06,
                    )
                    for word in boundaries
                )
            else:
                word_ranges.append((line_start, line_start + line["durationSeconds"]))
            cursor += frames
        ranges_by_language[language] = ranges
        word_ranges_by_language[language] = word_ranges
        duration_frames = max(duration_frames, cursor)
    duration = duration_frames / FPS + 1.1
    samples = int(duration * RATE)
    t = np.arange(samples, dtype=np.float32) / RATE
    music = np.zeros(samples, dtype=np.float32)
    beat = 60 / BPM
    reveal = max(ranges["story-07-rewind"][0] for ranges in ranges_by_language.values()) + 1.0

    for n in range(int(duration / beat) + 1):
        start = n * beat
        i = int(start * RATE)
        if i >= samples:
            continue
        length = min(int(0.42 * RATE), samples - i)
        local = np.arange(length, dtype=np.float32) / RATE
        # Soft kick and tight closed hats, entirely synthesized.
        kick = np.sin(2 * np.pi * (47 - 20 * local) * local) * np.exp(-local * 20) * 0.26
        music[i:i + length] += kick
        if n % 2:
            noise = np.random.default_rng(n).standard_normal(length).astype(np.float32)
            music[i:i + length] += noise * np.exp(-local * 85) * 0.025
        major = start >= reveal
        notes = [174.61, 220.00, 261.63, 329.63, 392.00] if major else [146.83, 174.61, 220.00, 261.63]
        bass = (73.42 if n % 4 in (0, 2) else 55.0) if not major else (87.31 if n % 4 in (0, 2) else 65.41)
        bass_wave = np.sin(2 * np.pi * bass * local) * np.exp(-local * 3.3) * 0.13
        music[i:i + length] += bass_wave
        for step in (0.12, 0.25):
            j = i + int(step * RATE)
            if j >= samples:
                continue
            end = min(j + int(0.19 * RATE), samples)
            arp_t = np.arange(end - j, dtype=np.float32) / RATE
            note = notes[(n + int(step * 8)) % len(notes)]
            music[j:end] += np.sin(2 * np.pi * note * arp_t) * np.exp(-arp_t * 11) * 0.045

    # Reverse swell into the reveal, then a clean, brighter groove.
    swell_start = max(0, int((reveal - 1.1) * RATE))
    swell_end = min(samples, int(reveal * RATE))
    if swell_end > swell_start:
        rt = np.linspace(0, 1, swell_end - swell_start, dtype=np.float32)
        music[swell_start:swell_end] += np.sin(2 * np.pi * (95 + rt * 1200) * rt) * rt**2 * 0.09

    for ranges in ranges_by_language.values():
        hit_start = int(ranges["end"][0] * RATE)
        hit_length = min(int(0.65 * RATE), samples - hit_start)
        hit_t = np.arange(hit_length, dtype=np.float32) / RATE
        hit = sum(np.sin(2 * np.pi * f * hit_t) for f in (261.63, 329.63, 392.0))
        music[hit_start:hit_start + hit_length] += hit * np.exp(-hit_t * 4.2) * 0.12

    time = np.arange(samples, dtype=np.float32) / RATE
    music += 0.008 * (
        np.sin(2 * np.pi * 55 * time)
        + np.sin(2 * np.pi * 110 * time)
        + np.sin(2 * np.pi * 165 * time)
    )
    envelope = np.full(samples, 10 ** (-14 / 20), dtype=np.float32)
    voiced = np.zeros(samples, dtype=bool)
    for word_ranges in word_ranges_by_language.values():
        for start, end in word_ranges:
            voiced[int(start * RATE):min(samples, int(end * RATE))] = True
    envelope[~voiced] = 10 ** (-8 / 20)
    music *= envelope
    music *= np.minimum(1, np.arange(samples, dtype=np.float32) / (RATE * 0.12))
    music *= np.minimum(1, np.arange(samples - 1, -1, -1, dtype=np.float32) / (RATE * 1.0))
    music = np.clip(music * 0.48, -0.98, 0.98)
    stereo = np.stack((music, music), axis=1)
    output = ROOT / "public" / "audio" / "music-bed.wav"
    output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        handle.writeframes((stereo * 32767).astype("<i2").tobytes())
    print(f"music {duration:.3f}s · {BPM} BPM · {output}")


if __name__ == "__main__":
    main()
