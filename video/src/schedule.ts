import voiceManifestFr from "./voice-manifest.json";
import voiceManifestEn from "./voice-manifest.en.json";
import type {PitchLang} from "./copy";

export const FPS = 30;
export const FRAME_GAP = 0;
export const END_CARD_FADE_FRAMES = 30;

export const toFrames = (seconds: number) => Math.round(seconds * FPS);
const toVoiceFrames = (seconds: number, lang: PitchLang) =>
  lang === "fr" ? Math.ceil(seconds * FPS) : toFrames(seconds);

export type VoiceLine = {
  id: string;
  section: "story" | "how" | "demo" | "end";
  text: string;
  durationSeconds: number;
  file: string;
  wordBoundaries: {text: string; startSeconds: number; endSeconds: number}[];
};

export type ScheduledLine = VoiceLine & {
  startFrame: number;
  durationFrames: number;
};

export type DemoScene = ScheduledLine & {
  sceneId: string;
  sourceSegments: {startFrame: number; endFrame: number}[];
};

export type PitchSchedule = {
  voiceLines: VoiceLine[];
  storySchedule: ScheduledLine[];
  howSchedule: ScheduledLine[];
  demoSchedule: DemoScene[];
  endCardLine: ScheduledLine;
  endCardStartFrame: number;
  durationFrames: number;
  demoDurationFrames: number;
};

const manifests = {
  fr: voiceManifestFr,
  en: voiceManifestEn,
};

type SourceScene = {id: string; startSeconds: number; endSeconds: number; segments?: [number, number][]};

const sourceScenes: Record<PitchLang, SourceScene[]> = {
  fr: [
    {id: "nuvio-infobar", startSeconds: .773, endSeconds: 4.171},
    {id: "nuvio-verdict-reasons", startSeconds: 4.224, endSeconds: 7.610},
    {id: "nuvio-callback", startSeconds: 7.962, endSeconds: 11.276},
    {id: "pdg-mail-verdict", startSeconds: 13.843, endSeconds: 17.440},
    {id: "pdg-techniques", startSeconds: 17.476, endSeconds: 20.905},
    {id: "daf-verdict", startSeconds: 23.309, endSeconds: 26.819},
    {id: "attack-summary", startSeconds: 31.417, endSeconds: 38.510, segments: [[31.417, 34.518], [35.566, 38.510]]},
    {id: "try-lookalike-example", startSeconds: 44.382, endSeconds: 47.759},
  ],
  en: [
    {id: "nuvio-infobar", startSeconds: 3.0, endSeconds: 5.4},
    {id: "nuvio-verdict-reasons", startSeconds: 3.215, endSeconds: 6.578},
    {id: "nuvio-callback", startSeconds: 6.919, endSeconds: 10.286},
    {id: "pdg-mail-verdict", startSeconds: 12.787, endSeconds: 16.192},
    {id: "pdg-techniques", startSeconds: 16.241, endSeconds: 19.623},
    {id: "daf-verdict", startSeconds: 22.037, endSeconds: 25.476},
    {id: "attack-summary", startSeconds: 35.0, endSeconds: 40.0},
    {id: "try-lookalike-example", startSeconds: 47.0, endSeconds: 51.2},
  ],
};

export const getPitchSchedule = (lang: PitchLang): PitchSchedule => {
  const manifest = manifests[lang] as typeof voiceManifestFr;
  const voiceLines = manifest.lines as VoiceLine[];
  const storyLines = voiceLines.filter((line) => line.section === "story");
  const howLines = voiceLines.filter((line) => line.section === "how");
  const demoLines = voiceLines.filter((line) => line.section === "demo");
  const endCard = voiceLines.find((line) => line.section === "end");
  if (!endCard || demoLines.length !== sourceScenes[lang].length) {
    throw new Error(`Invalid ${lang} pitch voice schedule`);
  }

  let cursor = 0;
  const schedule = (lines: VoiceLine[]) =>
    lines.map((line) => {
      const durationFrames = toVoiceFrames(line.durationSeconds, lang);
      const result = {...line, startFrame: cursor, durationFrames};
      cursor += durationFrames + FRAME_GAP;
      return result;
    });

  const storySchedule = schedule(storyLines);
  const howSchedule = schedule(howLines);
  const demoStartFrame = cursor;
  const demoSchedule = sourceScenes[lang].map((scene, index) => {
    const line = demoLines[index];
    if (!line) {
      throw new Error(`Missing demo narration for ${scene.id}`);
    }
    const durationFrames = toVoiceFrames(line.durationSeconds, lang);
    const result: DemoScene = {
      ...line,
      sceneId: scene.id,
      startFrame: cursor,
      durationFrames,
      sourceSegments: (scene.segments ?? [[scene.startSeconds, scene.endSeconds]]).map(([start, end]) => ({
        startFrame: toFrames(start),
        endFrame: toFrames(end),
      })),
    };
    cursor += durationFrames + FRAME_GAP;
    return result;
  });
  const demoDurationFrames = cursor - demoStartFrame;
  const endCardStartFrame = cursor;
  const endCardLine = {
    ...endCard,
    startFrame: cursor,
    durationFrames: toVoiceFrames(endCard.durationSeconds, lang),
  };
  const durationFrames = endCardStartFrame + endCardLine.durationFrames + END_CARD_FADE_FRAMES;

  return {
    voiceLines,
    storySchedule,
    howSchedule,
    demoSchedule,
    endCardLine,
    endCardStartFrame,
    durationFrames,
    demoDurationFrames,
  };
};
