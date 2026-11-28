import {Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {BrandArcs, COLORS, DeckLogo, FontFaces} from "./brand";
import {COPY, type PitchLang} from "./copy";
import {HowScene} from "./how-scenes";
import {getDemoVideo} from "./demo-timeline";
import {getPitchSchedule, toFrames, type DemoScene, type PitchSchedule, type VoiceLine} from "./schedule";
import {StoryScene} from "./story-scenes";

type Cue = {frame: number; sound: string; volume: number; duration: number};

const getCues = (schedule: PitchSchedule) => {
  const storyCues: Cue[] = schedule.storySchedule.flatMap((line) => {
    const startFrame = line.startFrame;
    const id = line.id;
    const cues: Cue[] = [];
    if (id === "story-01-alarm") cues.push({frame: startFrame + 7, sound: "alarm.wav", volume: .07, duration: toFrames(1.2)});
    if (id === "story-02-routine") cues.push(
      {frame: startFrame + 30, sound: "whoosh.wav", volume: .035, duration: toFrames(.45)},
      {frame: startFrame + 60, sound: "whoosh.wav", volume: .035, duration: toFrames(.45)},
      {frame: startFrame + 63, sound: "keyboard.wav", volume: .035, duration: toFrames(.46)},
    );
    if (id === "story-03-mail") cues.push(
      {frame: startFrame + 32, sound: "mail-ding.wav", volume: .06, duration: toFrames(.6)},
      {frame: startFrame + 48, sound: "glitch.wav", volume: .035, duration: toFrames(.34)},
    );
    if (id === "story-04-click") {
      const clickFrame = startFrame + Math.round(line.durationFrames * .68);
      cues.push(
        {frame: clickFrame, sound: "click.wav", volume: .065, duration: toFrames(.15)},
        {frame: Math.max(startFrame, clickFrame - 18), sound: "glitch.wav", volume: .035, duration: toFrames(.34)},
        ...[0, 1, 2, 3, 4].map((i) => ({frame: startFrame + 18 + i * 16, sound: "tick.wav", volume: .025, duration: toFrames(.08)})),
      );
    }
    if (id === "story-05-loss") cues.push({frame: startFrame, sound: "boom.wav", volume: .075, duration: toFrames(.8)});
    if (id === "story-06-cost") cues.push(
      {frame: startFrame + 10, sound: "pop.wav", volume: .035, duration: toFrames(.16)},
      ...[0, 1, 2, 3, 4, 5].map((i) => ({frame: startFrame + 14 + i * 5, sound: "tick.wav", volume: .024, duration: toFrames(.07)})),
    );
    if (id === "story-07-rewind") cues.push(
      {frame: startFrame, sound: "rewind.wav", volume: .07, duration: toFrames(.9)},
      {frame: startFrame + 35, sound: "shine.wav", volume: .055, duration: toFrames(.8)},
    );
    return cues;
  });
  const howCues: Cue[] = schedule.howSchedule.flatMap((line) => [
    {frame: line.startFrame, sound: "whoosh.wav", volume: .04, duration: toFrames(.5)},
    ...(line.id === "how-01-profile" ? [12, 28, 44, 60].map((f) => ({frame: line.startFrame + f, sound: "pop.wav", volume: .03, duration: toFrames(.16)})) : []),
    ...(line.id === "how-02-history" ? Array.from({length: 22}, (_, i) => ({frame: line.startFrame + 12 + i * 4, sound: "tick.wav", volume: .022, duration: toFrames(.06)})) : []),
    ...(line.id === "how-02-history" ? [{frame: line.startFrame + 103, sound: "glitch.wav", volume: .035, duration: toFrames(.34)}] : []),
    ...(line.id === "how-03-code" ? [12, 27, 42].map((f) => ({frame: line.startFrame + f, sound: "tick.wav", volume: .03, duration: toFrames(.08)})) : []),
    ...(line.id === "how-04-ai" ? [48, 64, 80].map((f) => ({frame: line.startFrame + f, sound: "pop.wav", volume: .035, duration: toFrames(.16)})) : []),
  ]);
  const demoCues = schedule.demoSchedule.map((scene) => ({
    frame: scene.startFrame,
    sound: "whoosh.wav",
    volume: .04,
    duration: toFrames(.5),
  }));
  return [
    ...storyCues,
    ...schedule.storySchedule.slice(1).map((line) => ({frame: line.startFrame, sound: "whoosh.wav", volume: .045, duration: toFrames(.55)})),
    {frame: 0, sound: "glitch.wav", volume: .035, duration: toFrames(.34)},
    ...howCues,
    ...demoCues,
    {frame: schedule.endCardStartFrame + 12, sound: "shine.wav", volume: .06, duration: toFrames(.8)},
  ];
};

const Track = ({cue}: {cue: Cue}) => <Sequence from={cue.frame} durationInFrames={cue.duration}><Audio src={staticFile(`audio/sfx/${cue.sound}`)} volume={cue.volume}/></Sequence>;
const Voice = ({line}: {line: VoiceLine}) => <Audio src={staticFile(line.file)}/>;

const Story = ({schedule, lang}: {schedule: PitchSchedule; lang: PitchLang}) => (
  <>
    {schedule.storySchedule.map((line) => (
      <Sequence key={line.id} from={line.startFrame} durationInFrames={line.durationFrames}>
        <StoryScene id={line.id} durationFrames={line.durationFrames} lang={lang}/>
        <Voice line={line}/>
      </Sequence>
    ))}
  </>
);

const How = ({schedule, lang}: {schedule: PitchSchedule; lang: PitchLang}) => (
  <>
    {schedule.howSchedule.map((line) => (
      <Sequence key={line.id} from={line.startFrame} durationInFrames={line.durationFrames}>
        <HowScene line={line} durationFrames={line.durationFrames} lang={lang}/>
        <Voice line={line}/>
      </Sequence>
    ))}
  </>
);

type FocusBox = {x: number; y: number; w: number; h: number};
type DemoFocus = {center: [number, number]; zoom: number; regions: FocusBox[]};

const FOCUS: Record<PitchLang, Record<string, DemoFocus>> = {
  fr: {
    "nuvio-infobar": {center: [.60,.36], zoom: 2, regions: [{x:.455,y:.315,w:.295,h:.09}]},
    "nuvio-verdict-reasons": {center: [.88,.62], zoom: 2.05, regions: [{x:.775,y:.585,w:.21,h:.075}]},
    "nuvio-callback": {center: [.87,.59], zoom: 2.05, regions: [{x:.775,y:.52,w:.21,h:.135}]},
    "pdg-mail-verdict": {center: [.71,.45], zoom: 1.8, regions: [{x:.48,y:.20,w:.20,h:.09},{x:.77,y:.29,w:.21,h:.43}]},
    "pdg-techniques": {center: [.70,.72], zoom: 2.1, regions: [{x:.77,y:.812,w:.05,h:.03},{x:.815,y:.812,w:.045,h:.03},{x:.77,y:.84,w:.14,h:.03}]},
    "daf-verdict": {center: [.88,.37], zoom: 2, regions: [{x:.775,y:.325,w:.21,h:.09}]},
    "attack-summary": {center: [.50,.287], zoom: 1.22, regions: [{x:.099,y:.242,w:.263,h:.085},{x:.382,y:.242,w:.249,h:.085},{x:.638,y:.242,w:.262,h:.085}]},
    "try-lookalike-example": {center: [.75,.56], zoom: 2, regions: [{x:.625,y:.52,w:.25,h:.09}]},
  },
  en: {
    "nuvio-infobar": {center: [.60,.36], zoom: 2, regions: [{x:.4556,y:.3156,w:.2875,h:.0822}]},
    "nuvio-verdict-reasons": {center: [.88,.50], zoom: 1.8, regions: [{x:.775,y:.3122,w:.2097,h:.3839}]},
    "nuvio-callback": {center: [.88,.57], zoom: 1.8, regions: [{x:.775,y:.5033,w:.2097,h:.1428}]},
    "pdg-mail-verdict": {center: [.71,.45], zoom: 1.28, regions: [{x:.4417,y:.1933,w:.5431,h:.5189}]},
    "pdg-techniques": {center: [.88,.76], zoom: 2, regions: [{x:.775,y:.7394,w:.2097,h:.0522}]},
    "daf-verdict": {center: [.88,.34], zoom: 2, regions: [{x:.775,y:.3122,w:.2097,h:.0489}]},
    "attack-summary": {center: [.50,.242], zoom: 1.15, regions: [{x:.1,y:.1356,w:.8,h:.211}]},
    "try-lookalike-example": {center: [.75,.45], zoom: 1.8, regions: [{x:.6319,y:.3433,w:.2306,h:.2083}]},
  },
};

const DemoScene = ({scene, lang}: {scene: DemoScene; lang: PitchLang}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const focus = FOCUS[lang][scene.sceneId];
  if (!focus) {
    throw new Error(`Missing ${lang} demo focus target for ${scene.sceneId}`);
  }
  const techniques = scene.sceneId === "pdg-techniques";
  const attacks = scene.sceneId === "attack-summary";
  const focusCenterX = techniques
    ? interpolate(frame,[3,28,48,60,104],[.70,.735,.76,.75,.70],{extrapolateRight:"clamp"})
    : focus.center[0];
  const focusCenterY = techniques
    ? interpolate(frame,[3,28,48,60,104],[.70,.72,.74,.73,.70],{extrapolateRight:"clamp"})
    : attacks ? (lang === "en" ? .5 : .55) : focus.center[1];
  const width = 1450;
  const height = 906;
  const zoom = spring({frame: frame - 12, fps, config: {mass: .65, damping: 24, stiffness: 300}});
  const scale = 1.06 + (focus.zoom - 1.06) * zoom;
  const driftProgress = interpolate(frame,[24,scene.durationFrames-8],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const driftX = attacks ? (lang === "en" ? 60 * driftProgress : 0) : (focusCenterX < .5 ? -1 : 1) * 80 * driftProgress;
  const driftY = attacks ? (lang === "en" ? -35 : 140) * driftProgress : (focusCenterY < .5 ? -1 : 1) * 50 * driftProgress;
  const whip = attacks ? 0 : interpolate(frame,[0,8,scene.durationFrames-8,scene.durationFrames-1],[72,0,0,-86],{extrapolateRight:"clamp"});
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const bounds = focus.regions.reduce((result, region) => ({
    left: Math.min(result.left, region.x),
    top: Math.min(result.top, region.y),
    right: Math.max(result.right, region.x + region.w),
    bottom: Math.max(result.bottom, region.y + region.h),
  }), {left: 1, top: 1, right: 0, bottom: 0});
  const inset = .005;
  const minX = Math.max(width * (1 - scale), -Math.max(0, bounds.left - inset) * width * scale);
  const maxX = Math.min(0, width * (1 - Math.min(1, bounds.right + inset) * scale));
  const minY = Math.max(height * (1 - scale), -Math.max(0, bounds.top - inset) * height * scale);
  const maxY = Math.min(0, height * (1 - Math.min(1, bounds.bottom + inset) * scale));
  const translateX = clamp(width / 2 - focusCenterX * width * scale + driftX + whip, minX, maxX);
  const translateY = clamp(height / 2 - focusCenterY * height * scale + driftY, minY, maxY);
  const sourceDuration = scene.sourceSegments.reduce((total, segment) => total + segment.endFrame - segment.startFrame, 0);
  let segmentOffset = 0;
  return (
    <div style={{position:"absolute",inset:0,background:COLORS.navy,overflow:"hidden"}}>
      <BrandArcs opacity={.17}/>
        <div style={{position:"absolute",left:278,top:112,width,height,borderRadius:22,background:"#11192B",border:"2px solid #30384A",overflow:"hidden",boxShadow:"0 28px 80px rgba(0,0,0,.48)"}}>
          <div style={{position:"absolute",inset:0,overflow:"hidden",transform:`translate(${translateX}px,${translateY}px) scale(${scale})`,transformOrigin:"0 0"}}>
          {scene.sourceSegments.map((segment,index) => {
            const sourceFrames = segment.endFrame - segment.startFrame;
            const segmentFrames = index === scene.sourceSegments.length - 1
              ? scene.durationFrames - segmentOffset
              : Math.round(scene.durationFrames * sourceFrames / sourceDuration);
            const from = segmentOffset;
            segmentOffset += segmentFrames;
            return (
              <Sequence key={`${segment.startFrame}-${segment.endFrame}`} from={from} durationInFrames={segmentFrames}>
                <OffthreadVideo src={staticFile(getDemoVideo(lang))} startFrom={segment.startFrame} endAt={segment.endFrame} playbackRate={sourceFrames / segmentFrames} volume={0} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"fill"}}/>
              </Sequence>
            );
          })}
          </div>
        </div>
      <div style={{position:"absolute",left:278,top:76,color:COLORS.yellow,fontFamily:"JetBrainsDeck, monospace",fontSize:19,letterSpacing:2}}>{COPY[lang].demoHud}</div>
    </div>
  );
};

const Demo = ({schedule, lang}: {schedule: PitchSchedule; lang: PitchLang}) => (
  <>
    {schedule.demoSchedule.map((scene) => (
      <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames}>
        <DemoScene scene={scene} lang={lang}/>
        <Voice line={scene}/>
      </Sequence>
    ))}
  </>
);

const EndTagline = ({line, lang}: {line: VoiceLine; lang: PitchLang}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position:"absolute",left:110,top:590,fontFamily:"ManropeDeck, sans-serif",fontSize:43,fontWeight:700,color:COLORS.cream}}>
      {line.wordBoundaries.map((word,i) => {
        const start = Math.round(word.startSeconds * 30);
        const progress = interpolate(frame,[start,start+5],[0,1],{extrapolateRight:"clamp"});
        const focus = word.text.toLocaleLowerCase(lang).replace(/[.,!?;:]/g,"") === "source";
        return <span key={`${word.text}-${i}`} style={{display:"inline-block",marginRight:"0.2em",opacity:progress,color:focus?COLORS.yellow:COLORS.cream,transform:`translateY(${(1-progress)*12}px) scale(${.9+progress*.1})`}}>{word.text.trim()}</span>;
      })}
    </div>
  );
};

const EndCard = ({schedule, lang}: {schedule: PitchSchedule; lang: PitchLang}) => {
  const frame = useCurrentFrame();
  const fps = useVideoConfig().fps;
  const fadeFrames = 30;
  const duration = schedule.durationFrames - schedule.endCardStartFrame;
  const opacity = interpolate(frame,[duration-fadeFrames,duration-1],[1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const reveal = spring({frame:frame-6,fps,config:{damping:14,stiffness:140}});
  const push = interpolate(frame,[0,duration],[1,1.05],{extrapolateRight:"clamp"});
  const drift = interpolate(frame,[0,duration],[20,8],{extrapolateRight:"clamp"});
  return (
    <div style={{position:"absolute",inset:0,opacity,background:COLORS.navy,overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,color:COLORS.cream,overflow:"hidden",transform:`translateX(${drift}px) scale(${push})`,transformOrigin:"center"}}>
        <BrandArcs opacity={.35}/>
        <div style={{position:"absolute",left:100,top:80,opacity:reveal,transform:`translateY(${(1-reveal)*24}px)`}}><DeckLogo page={1} style={{width:380,height:150}}/></div>
        <div style={{position:"absolute",left:110,top:320,color:COLORS.yellow,fontFamily:"JetBrainsDeck, monospace",fontSize:25,letterSpacing:3,opacity:reveal}}>{COPY[lang].endCard.label}</div>
        <div style={{position:"absolute",left:100,top:410,fontFamily:"ArchivoDeck, sans-serif",fontSize:108,fontWeight:800,whiteSpace:"nowrap",opacity:reveal,transform:`translateY(${(1-reveal)*30}px)`}}>solen-demo.vercel.app</div>
        <EndTagline line={schedule.endCardLine} lang={lang}/>
        <div style={{position:"absolute",left:110,bottom:80,fontFamily:"JetBrainsDeck, monospace",fontSize:20,color:COLORS.muted}}>{COPY[lang].endCard.footer}</div>
      </div>
    </div>
  );
};

const Music = ({schedule}: {schedule: PitchSchedule}) => {
  const frame = useCurrentFrame();
  const click = schedule.storySchedule.find((line) => line.id === "story-04-click");
  const loss = schedule.storySchedule.find((line) => line.id === "story-05-loss");
  const blackout = Boolean(click && loss && frame >= click.startFrame + click.durationFrames - 5 && frame < loss.startFrame + 10);
  const volume = (atFrame: number) => blackout ? 0 : interpolate(atFrame,[schedule.durationFrames-30,schedule.durationFrames-1],[1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <Audio src={staticFile("audio/music-bed.wav")} volume={volume}/>;
};

export const SolenPitch = ({lang}: {lang: PitchLang}) => {
  const schedule = getPitchSchedule(lang);
  const cues = getCues(schedule);
  const endCardDurationFrames = schedule.durationFrames - schedule.endCardStartFrame;
  return (
    <div style={{position:"absolute",inset:0,background:"#000"}}>
      <FontFaces/>
      <Story schedule={schedule} lang={lang}/>
      <How schedule={schedule} lang={lang}/>
      <Demo schedule={schedule} lang={lang}/>
      <Sequence from={schedule.endCardStartFrame} durationInFrames={endCardDurationFrames}>
        <EndCard schedule={schedule} lang={lang}/>
        <Voice line={schedule.endCardLine}/>
      </Sequence>
      <Music schedule={schedule}/>
      {cues.map((cue,i)=><Track key={`${cue.sound}-${cue.frame}-${i}`} cue={cue}/>)}
    </div>
  );
};
