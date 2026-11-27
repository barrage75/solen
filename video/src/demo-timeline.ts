import timeline from "../../solen/docs/demo-solen.timeline.json";

export const FPS = 30;
export const DEMO_START_SOURCE_SECONDS = 4.5;
export const DEMO_END_CARD_SECONDS = 3;
export const DEMO_VIDEO = "demo-solen-v4.mp4";

export const DEMO_VO_SCENES = [
  { lineId: "demo-01-nuvio-infobar", sceneId: "nuvio-infobar" },
  { lineId: "demo-02-iban", sceneId: "nuvio-verdict-reasons" },
  { lineId: "demo-03-callback", sceneId: "nuvio-callback" },
  { lineId: "demo-04-pdg", sceneId: "pdg-mail-verdict" },
  { lineId: "demo-05-techniques", sceneId: "pdg-techniques" },
  { lineId: "demo-06-daf", sceneId: "daf-verdict" },
  { lineId: "demo-07-attacks", sceneId: "attack-summary" },
  { lineId: "demo-08-lookalike", sceneId: "try-lookalike-example" },
] as const;

type TimelineScene = {
  id: string;
  start: number;
};

type DemoTimeline = {
  durationSeconds: number;
  scenes: TimelineScene[];
};

const sourceTimeline = timeline as DemoTimeline;

export const DEMO_END_CARD_START_FRAME = Math.round(
  (sourceTimeline.durationSeconds - DEMO_END_CARD_SECONDS) * FPS,
);

export const DEMO_SCHEDULE_SCENES = DEMO_VO_SCENES.map((scene) => {
  const timelineScene = sourceTimeline.scenes.find(
    (candidate) => candidate.id === scene.sceneId,
  );
  if (!timelineScene) {
    throw new Error(`Missing demo timeline scene: ${scene.sceneId}`);
  }
  return {
    ...scene,
    sourceStartFrame: Math.round(timelineScene.start * FPS),
  };
});

export const DEMO_SOURCE_DURATION_FRAMES = Math.round(
  sourceTimeline.durationSeconds * FPS,
);
