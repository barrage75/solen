import json
import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
OUTPUT_VIDEO = REPO / "solen" / "docs" / "solen-pitch-fr.mp4"
VOICE_MANIFEST_PATH = ROOT / "src" / "voice-manifest.json"
FPS = 30


def frames(seconds):
    return math.ceil(seconds * FPS)


def extract_frame(frame, path):
    subprocess.run(
        [
            "ffmpeg",
            "-nostdin",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-ss",
            f"{frame / FPS:.6f}",
            "-i",
            str(OUTPUT_VIDEO),
            "-frames:v",
            "1",
            "-vf",
            "scale=1920:1080",
            "-an",
            str(path),
        ],
        check=True,
    )


def main():
    manifest = json.loads(VOICE_MANIFEST_PATH.read_text(encoding="utf-8"))
    out = Path.home() / "profil" / "video-check" / "pitch4"
    frames_dir = out / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    timings = []
    line_frames = []
    frame_by_id = {}
    cursor = 0
    section_frames = {}
    for index, line in enumerate(manifest["lines"]):
        voice_frames = frames(line["durationSeconds"])
        start = cursor
        end = start + voice_frames
        frame_by_id[line["id"]] = (start, end)
        section_frames[line["section"]] = section_frames.get(line["section"], 0) + voice_frames
        line_frames.append(
            (
                f"line-{index:02d}-{line['id']}.png",
                start + voice_frames // 2,
            )
        )
        if line["id"].startswith("demo-"):
            line_frames.append(
                (
                    f"demo-70-{line['id']}.png",
                    min(end - 1, start + round(voice_frames * 0.7)),
                )
            )
        boundaries = [
            {
                "text": word["text"],
                "startSeconds": round(start / FPS + word["startSeconds"], 4),
                "endSeconds": round(start / FPS + word["endSeconds"], 4),
            }
            for word in line.get("wordBoundaries", [])
        ]
        timings.append(
            {
                "id": line["id"],
                "section": line["section"],
                "text": line["text"],
                "startSeconds": round(start / FPS, 4),
                "endSeconds": round(start / FPS + line["durationSeconds"], 4),
                "durationSeconds": line["durationSeconds"],
                "wordBoundaries": boundaries,
            }
        )
        cursor = end

    def moment(line_id, offset_frames, filename):
        start, end = frame_by_id[line_id]
        frame = min(max(start + offset_frames, start), end - 1)
        line_frames.append((f"key-{filename}.png", frame))

    moment("hook-01", 12, "cold-open-slam")
    moment("story-01-alarm", 54, "claire-wakes")
    moment("story-03-mail", 70, "fake-mail-arrives")
    moment("story-04-click", frames(2.2), "transfer-click")
    moment("story-05-loss", frames(4.0), "loss-counter-hold")
    moment("story-06-cost", frames(3.2), "national-cost-stat")
    moment("story-07-rewind", 54, "solen-reveal")
    moment("how-01-profile", 90, "live-supplier-profile")
    moment("how-02-history", 116, "history-iban-mismatch")
    moment("how-04-ai", 48, "token-before-ai")
    moment("how-05-rule", frames(4.0), "monotone-verdict")
    moment("end", 12, "end-card-reveal")

    for filename, frame in line_frames:
        extract_frame(frame, frames_dir / filename)

    duration_frames = cursor + 30
    report = {
        "voice": manifest["voice"],
        "rate": manifest["rate"],
        "fps": FPS,
        "frameGap": 0,
        "sectionDurationsSeconds": {
            name: round(count / FPS, 4)
            for name, count in section_frames.items()
        },
        "durationSeconds": round(duration_frames / FPS, 4),
        "lines": timings,
    }
    (out / "vo-timing.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    contact_sheet = out / "contact-sheet.png"
    subprocess.run(
        [
            "ffmpeg",
            "-nostdin",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-framerate",
            "1",
            "-pattern_type",
            "glob",
            "-i",
            str(frames_dir / "line-*.png"),
            "-vf",
            "scale=480:270,tile=4x6:padding=12:margin=12:color=0x0A0F20",
            "-frames:v",
            "1",
            str(contact_sheet),
        ],
        check=True,
    )

    subprocess.run(
        [
            "ffmpeg",
            "-nostdin",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(OUTPUT_VIDEO),
            "-vf",
            "fps=1/2,scale=384:216,tile=5x10:padding=12:margin=12:color=0x0A0F20",
            "-frames:v",
            "1",
            str(out / "every-2s.png"),
        ],
        check=True,
    )

    print(f"Contact sheet: {contact_sheet}")
    print(f"Stills: {frames_dir}")
    print(f"Timing JSON: {out / 'vo-timing.json'}")
    print(f"Total: {report['durationSeconds']:.3f}s")
    for line in timings:
        print(f"{line['id']}: {line['startSeconds']:.3f}–{line['endSeconds']:.3f}s")


if __name__ == "__main__":
    main()
