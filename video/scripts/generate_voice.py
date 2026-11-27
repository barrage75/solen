import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
LINES = ROOT / "src" / "voice-lines.json"
MANIFEST = ROOT / "src" / "voice-manifest.json"
OUTPUT = ROOT / "public" / "audio" / "voice"


def duration_seconds(path):
    value = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    )
    return round(float(value.strip()), 3)


async def main():
    config = json.loads(LINES.read_text(encoding="utf-8"))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    lines = []
    for line in config["lines"]:
        path = OUTPUT / f'{line["id"]}.mp3'
        last_error = None
        for attempt in range(3):
            try:
                communicate = edge_tts.Communicate(
                    line["text"], config["voice"], rate=config["rate"]
                )
                await communicate.save(str(path))
                break
            except Exception as error:
                last_error = error
                if attempt == 2:
                    raise
                await asyncio.sleep(1 + attempt)
        lines.append(
            {
                **line,
                "file": path.relative_to(ROOT / "public").as_posix(),
                "durationSeconds": duration_seconds(path),
            }
        )
        print(f'{line["id"]}: {lines[-1]["durationSeconds"]:.3f}s')
    MANIFEST.write_text(
        json.dumps(
            {
                "voice": config["voice"],
                "rate": config["rate"],
                "lines": lines,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    asyncio.run(main())
