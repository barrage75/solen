import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "audio" / "sfx"
RATE = 48_000


def envelope(length, decay=5.0):
    time = np.arange(length, dtype=np.float64) / RATE
    duration = max(len(time) / RATE, 0.001)
    return np.exp(-decay * time / duration)


def sweep(length, start, end):
    time = np.arange(length, dtype=np.float64) / RATE
    duration = max(length / RATE, 0.001)
    phase = 2 * np.pi * (start * time + (end - start) * time**2 / (2 * duration))
    return np.sin(phase)


def noise(length, seed):
    return np.random.default_rng(seed).standard_normal(length)


def save(name, samples):
    samples = np.asarray(samples, dtype=np.float64)
    peak = max(float(np.max(np.abs(samples))), 1e-8)
    pcm = (samples * (0.9 / peak) * 32767).astype("<i2")
    with wave.open(str(OUTPUT / name), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm.tobytes())


def alarm():
    length = RATE * 1.8
    time = np.arange(length) / RATE
    gate = ((time % 0.52) < 0.34).astype(np.float64)
    tones = np.where((time % 1.04) < 0.52, 740, 880)
    return 0.8 * np.sin(2 * np.pi * tones * time) * gate * (0.75 + 0.25 * np.sin(np.pi * time / 1.8))


def whoosh():
    length = int(RATE * 0.72)
    time = np.arange(length) / RATE
    fade = np.sin(np.pi * time / (length / RATE)) ** 2
    return fade * (0.65 * noise(length, 120) + 0.35 * sweep(length, 110, 420))


def pop():
    length = int(RATE * 0.16)
    return 0.8 * sweep(length, 720, 260) * envelope(length, 7.0)


def keyboard():
    length = int(RATE * 0.46)
    audio = np.zeros(length)
    for index, start in enumerate([0.02, 0.13, 0.24, 0.35]):
        offset = int(start * RATE)
        duration = int(RATE * 0.045)
        audio[offset : offset + duration] += 0.45 * noise(duration, 240 + index) * envelope(duration, 12)
    return audio


def mail_ding():
    length = int(RATE * 0.8)
    time = np.arange(length) / RATE
    return (
        0.7 * np.sin(2 * np.pi * 880 * time) * np.exp(-5 * time)
        + 0.45 * np.sin(2 * np.pi * 1320 * time) * np.exp(-7 * time)
        + 0.25 * np.sin(2 * np.pi * 1760 * time) * np.exp(-9 * time)
    )


def tick():
    length = int(RATE * 0.09)
    time = np.arange(length) / RATE
    return 0.55 * np.sin(2 * np.pi * 1500 * time) * envelope(length, 13) + 0.2 * noise(length, 801) * envelope(length, 14)


def click():
    length = int(RATE * 0.11)
    time = np.arange(length) / RATE
    return 0.45 * noise(length, 991) * envelope(length, 16) + 0.2 * np.sin(2 * np.pi * 210 * time) * envelope(length, 12)


def boom():
    length = int(RATE * 1.15)
    time = np.arange(length) / RATE
    rumble = sweep(length, 105, 42) * np.exp(-4.2 * time)
    impact = noise(length, 4001) * np.exp(-8 * time)
    return 0.8 * rumble + 0.35 * impact


def rewind():
    length = int(RATE * 1.0)
    time = np.arange(length) / RATE
    modulated = noise(length, 501) * (0.3 + 0.7 * np.sin(2 * np.pi * 17 * time) ** 2)
    return (modulated + 0.35 * sweep(length, 1700, 400)) * np.linspace(0.95, 0.2, length)


def shine():
    length = int(RATE * 1.0)
    time = np.arange(length) / RATE
    tone = sweep(length, 720, 2200)
    bell = np.sin(2 * np.pi * 1568 * time) * np.exp(-4.5 * time)
    return 0.6 * tone * np.exp(-2.8 * time) + 0.35 * bell


def glitch():
    length = int(RATE * 0.34)
    time = np.arange(length) / RATE
    chopped = (np.sin(2 * np.pi * 27 * time) > 0).astype(np.float64)
    static = noise(length, 9451) * np.exp(-time * 5)
    sweep_tone = sweep(length, 1800, 260) * np.exp(-time * 4)
    return chopped * (0.5 * static + 0.5 * sweep_tone)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    sounds = {
        "alarm.wav": alarm(),
        "whoosh.wav": whoosh(),
        "pop.wav": pop(),
        "keyboard.wav": keyboard(),
        "mail-ding.wav": mail_ding(),
        "tick.wav": tick(),
        "click.wav": click(),
        "boom.wav": boom(),
        "rewind.wav": rewind(),
        "shine.wav": shine(),
        "glitch.wav": glitch(),
    }
    for name, samples in sounds.items():
        save(name, samples)
        print(f"{OUTPUT / name}: {len(samples) / RATE:.2f}s")


if __name__ == "__main__":
    main()
