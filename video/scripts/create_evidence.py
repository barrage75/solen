import argparse
import json
import math
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
OUTPUT_VIDEO = REPO / "solen" / "docs" / "solen-pitch-fr.mp4"
VOICE_MANIFEST_PATH = ROOT / "src" / "voice-manifest.json"
FPS = 30
AUDIT_FPS = 2
AUDIT_WIDTH = 480
AUDIT_HEIGHT = 270


def safe_area_audit(out):
    command = [
        "ffmpeg",
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(OUTPUT_VIDEO),
        "-vf",
        f"fps={AUDIT_FPS},scale={AUDIT_WIDTH}:{AUDIT_HEIGHT},format=rgb24",
        "-an",
        "-f",
        "rawvideo",
        "pipe:1",
    ]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    frame_bytes = AUDIT_WIDTH * AUDIT_HEIGHT * 3
    edge = 15
    hits = []
    frame_index = 0
    while True:
        raw = bytearray()
        while len(raw) < frame_bytes:
            chunk = process.stdout.read(frame_bytes - len(raw))
            if not chunk:
                break
            raw.extend(chunk)
        if not raw:
            break
        if len(raw) != frame_bytes:
            raise RuntimeError("Incomplete frame from safe-area sample stream")
        pixels = np.frombuffer(raw, dtype=np.uint8).reshape(
            AUDIT_HEIGHT, AUDIT_WIDTH, 3
        )
        corners = np.stack(
            (
                pixels[:20, :20],
                pixels[:20, -20:],
                pixels[-20:, :20],
                pixels[-20:, -20:],
            )
        )
        background = np.empty_like(pixels, dtype=np.float32)
        middle_x = AUDIT_WIDTH // 2
        middle_y = AUDIT_HEIGHT // 2
        for y_slice, x_slice, corner in (
            (slice(0, middle_y), slice(0, middle_x), corners[0]),
            (slice(0, middle_y), slice(middle_x, AUDIT_WIDTH), corners[1]),
            (slice(middle_y, AUDIT_HEIGHT), slice(0, middle_x), corners[2]),
            (slice(middle_y, AUDIT_HEIGHT), slice(middle_x, AUDIT_WIDTH), corners[3]),
        ):
            background[y_slice, x_slice] = np.median(corner.reshape(-1, 3), axis=0)
        foreground = np.max(
            np.abs(pixels.astype(np.int16) - background.astype(np.int16)), axis=2
        ) > 8
        top_edge = foreground[:edge, :]
        if frame_index / AUDIT_FPS <= 4.0:
            top_edge = top_edge.copy()
            top_edge[:, 238:345] = False
        checks = (
            ("top", top_edge, 0, 0),
            ("left", foreground[:, :edge], 0, 0),
            # The concentric brand arcs intentionally touch the lower-right edge.
            ("right", foreground[:130, -edge:], AUDIT_WIDTH - edge, 0),
        )
        for name, region, x_offset, y_offset in checks:
            ys, xs = np.nonzero(region)
            if len(xs):
                hits.append(
                    {
                        "timeSeconds": round(frame_index / AUDIT_FPS, 2),
                        "edge": name,
                        "pixelCount": int(len(xs)),
                        "bboxAt480x270": [
                            int(xs.min() + x_offset),
                            int(ys.min() + y_offset),
                            int(xs.max() + x_offset),
                            int(ys.max() + y_offset),
                        ],
                    }
                )
        frame_index += 1
    stderr = process.stderr.read()
    if process.wait() != 0:
        raise RuntimeError(stderr.decode("utf-8", errors="replace"))
    report = {
        "sampleIntervalSeconds": 1 / AUDIT_FPS,
        "edgeWidthPixelsAt1920x1080": edge * 4,
        "backgroundReference": "median of the four 20x20 frame corners",
        "excludedRegion": "right edge below y=520 px for intentional concentric arcs; hook backdrop at x=952–1380 px and y=0–56 px through 4.0 seconds",
        "hits": hits,
    }
    path = out / "safe-area-audit.json"
    path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Safe-area audit: {len(hits)} hits → {path}")
    for hit in hits:
        print(
            f"{hit['timeSeconds']:.2f}s {hit['edge']}: "
            f"{hit['pixelCount']} pixels at {hit['bboxAt480x270']}"
        )


def frames(seconds, lang="en"):
    return math.ceil(seconds * FPS) if lang == "fr" else round(seconds * FPS)


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
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=("fr", "en"), default="fr")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    global OUTPUT_VIDEO, VOICE_MANIFEST_PATH
    suffix = ".en" if args.lang == "en" else ""
    OUTPUT_VIDEO = REPO / "solen" / "docs" / f"solen-pitch-{args.lang}.mp4"
    VOICE_MANIFEST_PATH = ROOT / "src" / f"voice-manifest{suffix}.json"
    manifest = json.loads(VOICE_MANIFEST_PATH.read_text(encoding="utf-8"))
    out = args.output.expanduser() if args.output else Path.home() / "profil" / "video-check" / f"pitch-{args.lang}1"
    frames_dir = out / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    timings = []
    line_frames = []
    frame_by_id = {}
    cursor = 0
    section_frames = {}
    for index, line in enumerate(manifest["lines"]):
        voice_frames = frames(line["durationSeconds"], args.lang)
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
            demo_index = int(line["id"].split("-")[1])
            for percentage in (30, 70):
                line_frames.append(
                    (
                        f"demo-{demo_index:02d}-{line['id']}-p{percentage:02d}.png",
                        min(end - 1, start + round(voice_frames * percentage / 100)),
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
    moment("story-01-alarm", 8, "claire-sleep")
    moment("story-01-alarm", 20, "claire-before-whip")
    moment("story-01-alarm", 22, "claire-flash-cut")
    moment("story-01-alarm", 25, "claire-stretch-pop")
    moment("story-01-alarm", 54, "claire-stretch-push")
    moment("story-01-alarm", 92, "claire-stretch-hold")
    moment("story-02-routine", 18, "claire-routine-cafe")
    moment("story-02-routine", 48, "claire-routine-metro")
    moment("story-02-routine", 78, "claire-routine-mail")
    moment("story-03-mail", 70, "fake-mail-arrives")
    moment("story-04-click", 8, "claire-click-start")
    moment("story-04-click", 40, "claire-click-desk")
    moment("story-04-click", 66, "claire-click-before")
    moment("story-04-click", 68, "claire-click-impact")
    moment("story-04-click", 78, "claire-click-hold")
    moment("story-05-loss", 50, "claire-phone-before-call")
    moment("story-05-loss", 56, "claire-phone-call")
    moment("story-05-loss", 62, "claire-quel-virement-punch")
    moment("story-05-loss", 78, "claire-quel-virement-hold")
    moment("story-05-loss", frames(3.0), "loss-counter-hold")
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

    claire_contact_sheet = out / "claire-contact-sheet.png"
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
            str(frames_dir / "key-claire-*.png"),
            "-vf",
            "scale=480:270,tile=5x4:padding=12:margin=12:color=0x0A0F20",
            "-frames:v",
            "1",
            str(claire_contact_sheet),
        ],
        check=True,
    )

    demo_contact_sheet = out / "demo-samples-contact-sheet.png"
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
            str(frames_dir / "demo-*-p*.png"),
            "-vf",
            "scale=480:270,tile=4x4:padding=12:margin=12:color=0x0A0F20",
            "-frames:v",
            "1",
            str(demo_contact_sheet),
        ],
        check=True,
    )

    safe_area_audit(out)

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
