import voiceManifest from "./voice-manifest.json";
import {FPS} from "./demo-timeline";

export type VoiceLine = {
  id: string;
  section: "story" | "how" | "demo" | "end";
  text: string;
  file: string;
  durationSeconds: number;
  scene?: string;
  wordBoundaries?: {text: string; startSeconds: number; endSeconds: number}[];
};
export const VOICE_LINES = voiceManifest.lines as unknown as VoiceLine[];
export const VOICE_RATE = voiceManifest.rate;
export const VOICE_NAME = voiceManifest.voice;
export const FRAME_GAP = 0;
export const END_CARD_FADE_FRAMES = 30;
export const toFrames = (seconds: number) => Math.ceil(seconds * FPS);

const linesById = new Map(VOICE_LINES.map((line) => [line.id, line]));
export const getVoiceLine = (id: string) => {
  const line = linesById.get(id);
  if (!line) throw new Error(`Missing voice line: ${id}`);
  return line;
};

const schedule = (lines: VoiceLine[]) => {
  let cursor = 0;
  return lines.map((line) => {
    const startFrame = cursor;
    const voiceFrames = toFrames(line.durationSeconds);
    const sceneFrames = voiceFrames;
    cursor += sceneFrames + FRAME_GAP;
    return {line, startFrame, voiceFrames, sceneFrames, endFrame: cursor};
  });
};

export const STORY_SCHEDULE = schedule(VOICE_LINES.filter((line) => line.section === "story"));
export const STORY_DURATION_FRAMES = STORY_SCHEDULE.at(-1)?.endFrame ?? 0;
export const HOW_SCHEDULE = schedule(VOICE_LINES.filter((line) => line.section === "how"));
export const HOW_START_FRAME = STORY_DURATION_FRAMES;
export const HOW_DURATION_FRAMES = HOW_SCHEDULE.at(-1)?.endFrame ?? 0;

export const DEMO_SOURCE_SCENES = [
  ["nuvio-infobar", 4.82, 8.218],
  ["nuvio-verdict-reasons", 8.271, 11.657],
  ["nuvio-callback", 12.009, 15.323],
  ["pdg-mail-verdict", 17.89, 21.487],
  ["pdg-techniques", 21.523, 24.952],
  ["daf-verdict", 27.356, 30.866],
  ["attack-summary", 35.464, 42.557],
  ["try-lookalike-example", 48.429, 51.806],
] as const;

export const DEMO_START_FRAME = HOW_START_FRAME + HOW_DURATION_FRAMES;
export const DEMO_SCHEDULE = DEMO_SOURCE_SCENES.map(([sceneId, sourceStart, sourceEnd]) => {
  const line = VOICE_LINES.find((candidate) => candidate.section === "demo" && candidate.scene === sceneId);
  if (!line) throw new Error(`Missing voice for demo scene ${sceneId}`);
  const voiceFrames = toFrames(line.durationSeconds);
  const sourceStartFrame = toFrames(sourceStart);
  const sourceEndFrame = toFrames(sourceEnd);
  const sourceFrames = sourceEndFrame - sourceStartFrame;
  const sceneFrames = voiceFrames;
  return {
    sceneId,
    line,
    sourceStartFrame,
    sourceEndFrame,
    sourceFrames,
    voiceFrames,
    sceneFrames,
    playbackRate: sourceFrames / sceneFrames,
  };
});
export const DEMO_END_FRAME = DEMO_START_FRAME + DEMO_SCHEDULE.reduce((sum, scene) => sum + scene.sceneFrames, 0);
export const END_CARD_LINE = getVoiceLine("end");
export const END_CARD_START_FRAME = DEMO_END_FRAME;
export const END_CARD_VOICE_FRAMES = toFrames(END_CARD_LINE.durationSeconds);
export const END_CARD_DURATION_FRAMES = END_CARD_VOICE_FRAMES + END_CARD_FADE_FRAMES;
export const PITCH_DURATION_FRAMES = END_CARD_START_FRAME + END_CARD_DURATION_FRAMES;
