import voiceManifest from "./voice-manifest.json";
import {
  DEMO_END_CARD_START_FRAME,
  DEMO_SCHEDULE_SCENES,
  DEMO_SOURCE_DURATION_FRAMES,
  DEMO_TITLE_SECONDS,
  FPS,
} from "./demo-timeline";

export type VoiceLine = (typeof voiceManifest.lines)[number];

export const VOICE_LINES = voiceManifest.lines as VoiceLine[];
export const VOICE_RATE = voiceManifest.rate;
export const VOICE_NAME = voiceManifest.voice;

export const FRAME_GAP = 9;
export const END_CARD_HOLD_FRAMES = 36;
export const END_CARD_FADE_FRAMES = 18;

export const toFrames = (seconds: number) => Math.ceil(seconds * FPS);

const linesById = new Map(VOICE_LINES.map((line) => [line.id, line]));

export const getVoiceLine = (id: string) => {
  const line = linesById.get(id);
  if (!line) {
    throw new Error(`Missing voice line: ${id}`);
  }
  return line;
};

export const STORY_SCHEDULE = (() => {
  let cursor = 0;
  return VOICE_LINES.filter((line) => line.section === "story").map((line) => {
    const startFrame = cursor;
    const voiceFrames = toFrames(line.durationSeconds);
    const endFrame = startFrame + voiceFrames;
    cursor = endFrame + FRAME_GAP;
    return { line, startFrame, voiceFrames, endFrame, sceneFrames: cursor - startFrame };
  });
})();

export const STORY_DURATION_FRAMES =
  STORY_SCHEDULE[STORY_SCHEDULE.length - 1].startFrame +
  STORY_SCHEDULE[STORY_SCHEDULE.length - 1].sceneFrames;

export const DEMO_PRE_ROLL_FRAMES =
  DEMO_SCHEDULE_SCENES[0].sourceStartFrame -
  Math.round(DEMO_TITLE_SECONDS * FPS);

export const DEMO_SCHEDULE = (() => {
  let cursor = DEMO_PRE_ROLL_FRAMES;
  return DEMO_SCHEDULE_SCENES.map((scene, index) => {
    const nextScene = DEMO_SCHEDULE_SCENES[index + 1];
    const sourceEndFrame =
      nextScene?.sourceStartFrame ?? DEMO_END_CARD_START_FRAME;
    const sourceFrames = sourceEndFrame - scene.sourceStartFrame;
    const line = getVoiceLine(scene.lineId);
    const voiceFrames = toFrames(line.durationSeconds);
    const sceneFrames = Math.max(sourceFrames, voiceFrames + FRAME_GAP);
    const holdFrames = sceneFrames - sourceFrames;
    const startFrame = cursor;
    cursor += sceneFrames;
    return {
      ...scene,
      line,
      startFrame,
      sourceEndFrame,
      sourceFrames,
      voiceFrames,
      sceneFrames,
      holdFrames,
      endFrame: cursor,
    };
  });
})();

export const DEMO_SECTION_START_FRAME = STORY_DURATION_FRAMES;
export const DEMO_START_FRAME = DEMO_SECTION_START_FRAME;
export const DEMO_SCHEDULE_START_FRAME =
  DEMO_START_FRAME + DEMO_PRE_ROLL_FRAMES;
export const DEMO_END_FRAME =
  DEMO_START_FRAME +
  DEMO_PRE_ROLL_FRAMES +
  DEMO_SCHEDULE.reduce((total, scene) => total + scene.sceneFrames, 0);

export const END_CARD_LINE = getVoiceLine("end-card");
export const END_CARD_START_FRAME = DEMO_END_FRAME;
export const END_CARD_VOICE_FRAMES = toFrames(END_CARD_LINE.durationSeconds);
export const END_CARD_DURATION_FRAMES =
  END_CARD_VOICE_FRAMES + END_CARD_HOLD_FRAMES;
export const PITCH_DURATION_FRAMES =
  END_CARD_START_FRAME + END_CARD_DURATION_FRAMES;

export const STORY_BY_ID = new Map(
  STORY_SCHEDULE.map((entry) => [entry.line.id, entry]),
);
