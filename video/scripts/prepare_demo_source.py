import argparse
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_WORK = Path.home() / "profil" / "solen-video-work"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--work", type=Path, default=DEFAULT_WORK)
    parser.add_argument("--lang", choices=("fr", "en"), default="fr")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    prefix = f"demo-solen-{args.lang}"
    output = args.output or ROOT / "public" / f"{prefix}-clean.mp4"
    timeline = json.loads((args.work / f"{prefix}.timeline.json").read_text())
    duration = timeline["sourceDurationSeconds"] - timeline["trimStartSeconds"]
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-nostdin",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(args.work / f"{prefix}.ffconcat"),
            "-ss",
            str(timeline["trimStartSeconds"]),
            "-t",
            f"{duration:.6f}",
            "-vf",
            "fps=30,scale=1920:1200:flags=lanczos,setsar=1",
            "-vsync",
            "cfr",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "slow",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(output),
        ],
        check=True,
    )


if __name__ == "__main__":
    main()
