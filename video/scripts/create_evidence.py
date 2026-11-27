import json
import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
OUTPUT_VIDEO = REPO / "solen" / "docs" / "solen-pitch-fr.mp4"
TIMELINE_PATH = REPO / "solen" / "docs" / "demo-solen.timeline.json"
VOICE_MANIFEST_PATH = ROOT / "src" / "voice-manifest.json"
FPS = 30
FRAME_GAP = 6
DEMO_START_SOURCE_SECONDS = 4.5
DEMO_END_CARD_SECONDS = 3

DEMO_LINES = [
    ("demo-01-nuvio-infobar", "nuvio-infobar"),
    ("demo-02-iban", "nuvio-verdict-reasons"),
    ("demo-03-callback", "nuvio-callback"),
    ("demo-04-pdg", "pdg-mail-verdict"),
    ("demo-05-techniques", "pdg-techniques"),
    ("demo-06-daf", "daf-verdict"),
    ("demo-07-attacks", "attack-summary"),
    ("demo-08-lookalike", "try-lookalike-example"),
]


def frames(seconds):
    return math.ceil(seconds * FPS)


def rounded_frames(seconds):
    return math.floor(seconds * FPS + 0.5)


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
    timeline = json.loads(TIMELINE_PATH.read_text(encoding="utf-8"))
    voice_by_id = {line["id"]: line for line in manifest["lines"]}
    out = Path.home() / "profil" / "video-check" / "pitch2"
    frames_dir = out / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    line_timings = []
    shot_frames = []
    story_cursor = 0
    for index, line in enumerate(
        line for line in manifest["lines"] if line["section"] == "story"
    ):
        voice_frames = frames(line["durationSeconds"])
        start_frame = story_cursor
        scene_frames = voice_frames + FRAME_GAP
        shot_frames.append(
            (
                f"fr-story-{index + 1:02d}-{line['id'].removeprefix('story-0' + str(index + 1) + '-')}.png",
                start_frame + scene_frames // 2,
            )
        )
        if line["id"] == "story-01-alarm":
            shot_frames.extend(
                [
                    ("fr-story-01-alarm-lying.png", start_frame + 12),
                    ("fr-story-01-alarm-sitting.png", start_frame + 75),
                ]
            )
        if line["id"] == "story-02-routine":
            shot_frames.extend(
                [
                    (f"fr-story-02-routine-cut-{cut + 1:02d}.png", start_frame + 15 + cut * FPS)
                    for cut in range(3)
                ]
            )
        if line["id"] == "story-05-loss":
            shot_frames.append(
                (
                    "fr-story-05-loss-counter-hold.png",
                    start_frame + scene_frames - math.ceil(FPS * 1.25),
                )
            )
        line_timings.append(
            {
                "id": line["id"],
                "text": line["text"],
                "startSeconds": round(start_frame / FPS, 3),
                "endSeconds": round(start_frame / FPS + line["durationSeconds"], 3),
                "durationSeconds": line["durationSeconds"],
            }
        )
        story_cursor += scene_frames

    start_frames = {
        scene["id"]: rounded_frames(scene["start"]) for scene in timeline["scenes"]
    }
    title_frames = rounded_frames(DEMO_START_SOURCE_SECONDS)
    pre_roll_frames = start_frames[DEMO_LINES[0][1]] - title_frames
    cursor = pre_roll_frames
    end_card_source_frame = rounded_frames(
        timeline["durationSeconds"] - DEMO_END_CARD_SECONDS
    )

    for index, (line_id, scene_id) in enumerate(DEMO_LINES):
        source_start = start_frames[scene_id]
        source_end = (
            start_frames[DEMO_LINES[index + 1][1]]
            if index + 1 < len(DEMO_LINES)
            else end_card_source_frame
        )
        line = voice_by_id[line_id]
        voice_frames = frames(line["durationSeconds"])
        source_frames = source_end - source_start
        scene_frames = max(source_frames, voice_frames + FRAME_GAP)
        start_frame = story_cursor + cursor
        shot_frames.append(
            (
                f"fr-demo-{index + 1:02d}-{scene_id}.png",
                start_frame + voice_frames // 2,
            )
        )
        line_timings.append(
            {
                "id": line_id,
                "text": line["text"],
                "startSeconds": round(start_frame / FPS, 3),
                "endSeconds": round(start_frame / FPS + line["durationSeconds"], 3),
                "durationSeconds": line["durationSeconds"],
            }
        )
        cursor += scene_frames

    end_card_start = story_cursor + cursor
    end_card = voice_by_id["end-card"]
    end_card_frames = frames(end_card["durationSeconds"])
    line_timings.append(
        {
            "id": "end-card",
            "text": end_card["text"],
            "startSeconds": round(end_card_start / FPS, 3),
            "endSeconds": round(end_card_start / FPS + end_card["durationSeconds"], 3),
            "durationSeconds": end_card["durationSeconds"],
        }
    )
    shot_frames.append(
        (
            "fr-end-card.png",
            end_card_start + end_card_frames // 2,
        )
    )

    for filename, frame in shot_frames:
        extract_frame(frame, frames_dir / filename)

    timing_report = {
        "voice": manifest["voice"],
        "rate": manifest["rate"],
        "fps": FPS,
        "storySeconds": round(story_cursor / FPS, 3),
        "demoStartSeconds": round(story_cursor / FPS, 3),
        "firstDemoVoiceOffsetSeconds": round(pre_roll_frames / FPS, 3),
        "durationSeconds": round(
            (end_card_start + end_card_frames + 36) / FPS, 3
        ),
        "lines": line_timings,
    }
    (out / "vo-timing.json").write_text(
        json.dumps(timing_report, ensure_ascii=False, indent=2) + "\n",
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
            "-i",
            str(OUTPUT_VIDEO),
            "-vf",
            "fps=1/8,scale=480:270,tile=4x4:padding=12:margin=12:color=0x0A0F20",
            "-frames:v",
            "1",
            str(contact_sheet),
        ],
        check=True,
    )

    print(f"Contact sheet: {contact_sheet}")
    print(f"Stills: {frames_dir}")
    print(f"Timing JSON: {out / 'vo-timing.json'}")
    print(f"Story: {timing_report['storySeconds']:.3f}s")
    print(f"Total: {timing_report['durationSeconds']:.3f}s")
    for line in line_timings:
        print(
            f"{line['id']}: {line['startSeconds']:.3f}–"
            f"{line['endSeconds']:.3f}s"
        )


if __name__ == "__main__":
    main()
