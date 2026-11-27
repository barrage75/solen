import {Audio, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame, interpolate} from "remotion";
import {COLORS, DeckLogo, FontFaces, BrandArcs, AccentLine} from "./brand";
import {
  DEMO_START_FRAME,
  DEMO_SCHEDULE,
  END_CARD_DURATION_FRAMES,
  END_CARD_FADE_FRAMES,
  END_CARD_LINE,
  END_CARD_START_FRAME,
  END_CARD_VOICE_FRAMES,
  STORY_SCHEDULE,
  toFrames,
  DEMO_PRE_ROLL_FRAMES,
} from "./schedule";
import {
  FPS,
  DEMO_START_SOURCE_SECONDS,
  DEMO_VIDEO,
} from "./demo-timeline";
import {StoryScene} from "./story-scenes";

type SoundCue = {
  frame: number;
  sound: string;
  volume: number;
  duration: number;
};

const STORY_CUES: Record<string, {offset: number; sound: string; volume: number; duration: number}[]> = {
  "story-01-alarm": [{offset: 10, sound: "alarm.wav", volume: 0.105, duration: 1.8}],
  "story-02-routine": [
    {offset: 0, sound: "whoosh.wav", volume: 0.075, duration: 0.72},
    {offset: 49, sound: "whoosh.wav", volume: 0.075, duration: 0.72},
    {offset: 98, sound: "keyboard.wav", volume: 0.08, duration: 0.46},
  ],
  "story-03-mail": [{offset: 43, sound: "mail-ding.wav", volume: 0.11, duration: 0.8}],
  "story-04-click": [
    {offset: 19, sound: "tick.wav", volume: 0.085, duration: 0.09},
    {offset: 40, sound: "tick.wav", volume: 0.085, duration: 0.09},
    {offset: 61, sound: "tick.wav", volume: 0.085, duration: 0.09},
    {offset: 123, sound: "click.wav", volume: 0.11, duration: 0.11},
  ],
  "story-05-loss": [
    {offset: 12, sound: "whoosh.wav", volume: 0.075, duration: 0.72},
    {offset: 54, sound: "boom.wav", volume: 0.11, duration: 1.15},
  ],
  "story-06-cost": [
    {offset: 35, sound: "pop.wav", volume: 0.085, duration: 0.16},
    {offset: 72, sound: "pop.wav", volume: 0.085, duration: 0.16},
  ],
  "story-07-rewind": [
    {offset: 0, sound: "rewind.wav", volume: 0.1, duration: 1},
    {offset: 39, sound: "shine.wav", volume: 0.08, duration: 1},
  ],
};

const storySounds: SoundCue[] = STORY_SCHEDULE.flatMap((entry) =>
  (STORY_CUES[entry.line.id] ?? []).map((cue) => ({
    frame: entry.startFrame + cue.offset,
    sound: cue.sound,
    volume: cue.volume,
    duration: toFrames(cue.duration),
  })),
);

const demoSounds: SoundCue[] = [
  {
    frame: DEMO_START_FRAME,
    sound: "whoosh.wav",
    volume: 0.065,
    duration: toFrames(0.72),
  },
  ...DEMO_SCHEDULE.slice(1).map((scene) => ({
    frame: DEMO_START_FRAME + scene.startFrame,
    sound: "whoosh.wav",
    volume: 0.065,
    duration: toFrames(0.72),
  })),
];

const soundEvents: SoundCue[] = [
  ...storySounds,
  ...demoSounds,
  {
    frame: END_CARD_START_FRAME + 12,
    sound: "shine.wav",
    volume: 0.08,
    duration: toFrames(1),
  },
  {
    frame: END_CARD_START_FRAME + END_CARD_VOICE_FRAMES + 18,
    sound: "whoosh.wav",
    volume: 0.075,
    duration: toFrames(0.72),
  },
];

const VoiceTrack = ({
  file,
  frames,
}: {
  file: string;
  frames: number;
}) => (
  <Sequence durationInFrames={frames}>
    <Audio src={staticFile(file)} />
  </Sequence>
);

const SoundTrack = ({cue}: {cue: SoundCue}) => (
  <Sequence from={cue.frame} durationInFrames={cue.duration}>
    <Audio src={staticFile(`audio/sfx/${cue.sound}`)} volume={cue.volume} />
  </Sequence>
);

const StoryShot = ({
  id,
  durationFrames,
}: {
  id: string;
  durationFrames: number;
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [durationFrames - 10, durationFrames - 1],
    [1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
  return (
    <div style={{position: "absolute", inset: 0, opacity}}>
      <StoryScene id={id} durationFrames={durationFrames} />
    </div>
  );
};

const DemoPlayback = () => {
  const videoSource = staticFile(DEMO_VIDEO);
  const demoStartFrame = Math.round(DEMO_START_SOURCE_SECONDS * FPS);
  const firstSceneFrame = DEMO_SCHEDULE[0].sourceStartFrame;
  const demoDuration = DEMO_PRE_ROLL_FRAMES + DEMO_SCHEDULE.reduce(
    (total, scene) => total + scene.sceneFrames,
    0,
  );
  return (
    <Sequence
      from={DEMO_START_FRAME}
      durationInFrames={demoDuration}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: COLORS.navy,
          overflow: "hidden",
        }}
      >
        <Sequence durationInFrames={DEMO_PRE_ROLL_FRAMES}>
          <OffthreadVideo
            src={videoSource}
            startFrom={demoStartFrame}
            endAt={firstSceneFrame}
            volume={0}
            style={{width: "100%", height: "100%", objectFit: "contain"}}
          />
        </Sequence>
        {DEMO_SCHEDULE.map((scene) => (
          <div key={scene.sceneId}>
            <Sequence
              from={scene.startFrame}
              durationInFrames={scene.sourceFrames}
            >
              <OffthreadVideo
                src={videoSource}
                startFrom={scene.sourceStartFrame}
                endAt={scene.sourceEndFrame}
                volume={0}
                style={{width: "100%", height: "100%", objectFit: "contain"}}
              />
            </Sequence>
            {scene.holdFrames > 0 && (
              <Sequence
                from={scene.startFrame + scene.sourceFrames}
                durationInFrames={scene.holdFrames}
              >
                <Freeze frame={scene.sourceFrames - 1}>
                  <OffthreadVideo
                    src={videoSource}
                    startFrom={scene.sourceStartFrame}
                    endAt={scene.sourceEndFrame}
                    volume={0}
                    style={{width: "100%", height: "100%", objectFit: "contain"}}
                  />
                </Freeze>
              </Sequence>
            )}
          </div>
        ))}
      </div>
    </Sequence>
  );
};

const EndCard = () => {
  const frame = useCurrentFrame();
  const fadeOutAt = END_CARD_DURATION_FRAMES - END_CARD_FADE_FRAMES;
  const opacity = interpolate(
    frame,
    [fadeOutAt, END_CARD_DURATION_FRAMES - 1],
    [1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        backgroundColor: COLORS.navy,
        color: COLORS.cream,
        overflow: "hidden",
      }}
    >
      <BrandArcs opacity={0.34} />
      <div style={{position: "absolute", left: 120, top: 85}}>
        <DeckLogo page={1} style={{width: 410, height: 165}} />
      </div>
      <div style={{position: "absolute", left: 128, top: 340, color: COLORS.yellow, fontFamily: "JetBrainsDeck, monospace", fontSize: 23, fontWeight: 700, letterSpacing: 2}}>
        ESSAYEZ-LA
      </div>
      <AccentLine style={{position: "absolute", left: 128, top: 404, width: 120, height: 5}} />
      <div style={{position: "absolute", left: 120, right: 100, top: 452, color: COLORS.cream, fontFamily: "ArchivoDeck, sans-serif", fontWeight: 800, fontStretch: "125%", fontSize: 119, letterSpacing: -3, whiteSpace: "nowrap"}}>
        solen-demo.vercel.app
      </div>
      <div style={{position: "absolute", left: 128, bottom: 75, color: COLORS.muted, fontFamily: "JetBrainsDeck, monospace", fontSize: 19, letterSpacing: 1.4}}>
        HACKATHON FINAXYS · BUILD WHAT’S NEXT
      </div>
      <div style={{position: "absolute", left: 126, top: 630, width: 930, fontFamily: "ManropeDeck, sans-serif", fontSize: 29, lineHeight: 1.35, color: COLORS.cream, opacity: 0.88}}>
        Bloquer l'arnaque par mail à la source.
      </div>
    </div>
  );
};

export const SolenPitch = () => {
  const voiceTracks = [
    ...STORY_SCHEDULE.map((entry) => ({
      key: entry.line.id,
      start: entry.startFrame,
      line: entry.line,
      duration: entry.voiceFrames,
    })),
    ...DEMO_SCHEDULE.map((entry) => ({
      key: entry.line.id,
      start: DEMO_START_FRAME + entry.startFrame,
      line: entry.line,
      duration: entry.voiceFrames,
    })),
    {
      key: END_CARD_LINE.id,
      start: END_CARD_START_FRAME,
      line: END_CARD_LINE,
      duration: END_CARD_VOICE_FRAMES,
    },
  ];

  return (
    <div style={{position: "absolute", inset: 0, backgroundColor: COLORS.navy}}>
      <FontFaces />
      {STORY_SCHEDULE.map((entry) => (
        <Sequence
          key={entry.line.id}
          from={entry.startFrame}
          durationInFrames={entry.sceneFrames}
        >
          <StoryShot
            id={entry.line.id}
            durationFrames={entry.sceneFrames}
          />
          <VoiceTrack file={entry.line.file} frames={entry.voiceFrames} />
        </Sequence>
      ))}
      <DemoPlayback />
      {voiceTracks
        .filter((track) => track.line.section !== "story")
        .map((track) => (
          <Sequence
            key={track.key}
            from={track.start}
            durationInFrames={track.duration}
          >
            <Audio src={staticFile(track.line.file)} />
          </Sequence>
        ))}
      <Sequence
        from={END_CARD_START_FRAME}
        durationInFrames={END_CARD_DURATION_FRAMES}
      >
        <EndCard />
      </Sequence>
      {soundEvents.map((cue, index) => (
        <SoundTrack key={`${cue.sound}-${cue.frame}-${index}`} cue={cue} />
      ))}
    </div>
  );
};
