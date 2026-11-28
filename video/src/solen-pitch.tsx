import {Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {BrandArcs, COLORS, DeckLogo, FontFaces} from "./brand";
import {HowScene} from "./how-scenes";
import {DEMO_VIDEO} from "./demo-timeline";
import {
  DEMO_SCHEDULE, DEMO_START_FRAME, END_CARD_DURATION_FRAMES, END_CARD_FADE_FRAMES,
  END_CARD_LINE, END_CARD_START_FRAME, HOW_SCHEDULE, HOW_START_FRAME, PITCH_DURATION_FRAMES,
  STORY_SCHEDULE, toFrames, type VoiceLine,
} from "./schedule";
import {StoryScene} from "./story-scenes";

type Cue={frame:number;sound:string;volume:number;duration:number};
const storyCues:Cue[]=STORY_SCHEDULE.flatMap(({line,startFrame,voiceFrames})=>{
 const id=line.id;
 const scheduled:Cue[]=[];
 if(id==="story-01-alarm") scheduled.push({frame:startFrame+7,sound:"alarm.wav",volume:.07,duration:toFrames(1.2)});
 if(id==="story-02-routine") scheduled.push(
  {frame:startFrame+30,sound:"whoosh.wav",volume:.035,duration:toFrames(.45)},
  {frame:startFrame+60,sound:"whoosh.wav",volume:.035,duration:toFrames(.45)},
  {frame:startFrame+63,sound:"keyboard.wav",volume:.035,duration:toFrames(.46)},
 );
 if(id==="story-03-mail") scheduled.push(
  {frame:startFrame+32,sound:"mail-ding.wav",volume:.06,duration:toFrames(.6)},
  {frame:startFrame+48,sound:"glitch.wav",volume:.035,duration:toFrames(.34)},
 );
 if(id==="story-04-click"){
  const clickFrame=startFrame+Math.round(voiceFrames*.68);
  scheduled.push(
   {frame:clickFrame,sound:"click.wav",volume:.065,duration:toFrames(.15)},
   {frame:Math.max(startFrame,clickFrame-18),sound:"glitch.wav",volume:.035,duration:toFrames(.34)},
   ...[0,1,2,3,4].map(i=>({frame:startFrame+18+i*16,sound:"tick.wav",volume:.025,duration:toFrames(.08)})),
  );
 }
 if(id==="story-05-loss") scheduled.push({frame:startFrame,sound:"boom.wav",volume:.075,duration:toFrames(.8)});
 if(id==="story-06-cost") scheduled.push(
  {frame:startFrame+10,sound:"pop.wav",volume:.035,duration:toFrames(.16)},
  ...[0,1,2,3,4,5].map(i=>({frame:startFrame+14+i*5,sound:"tick.wav",volume:.024,duration:toFrames(.07)})),
 );
 if(id==="story-07-rewind") scheduled.push(
  {frame:startFrame,sound:"rewind.wav",volume:.07,duration:toFrames(.9)},
  {frame:startFrame+35,sound:"shine.wav",volume:.055,duration:toFrames(.8)},
 );
 return scheduled;
});
const cues:Cue[]=[
  ...STORY_SCHEDULE.slice(1).map(x=>({frame:x.startFrame,sound:"whoosh.wav",volume:.045,duration:toFrames(.55)})),
  {frame:0,sound:"glitch.wav",volume:.035,duration:toFrames(.34)},
  ...storyCues,
  ...HOW_SCHEDULE.flatMap(x=>[
    {frame:HOW_START_FRAME+x.startFrame,sound:"whoosh.wav",volume:.04,duration:toFrames(.5)},
    ...(x.line.id==="how-01-profile"?[12,28,44,60].map(f=>({frame:HOW_START_FRAME+x.startFrame+f,sound:"pop.wav",volume:.03,duration:toFrames(.16)})):[]),
    ...(x.line.id==="how-02-history"?Array.from({length:22},(_,i)=>({frame:HOW_START_FRAME+x.startFrame+12+i*4,sound:"tick.wav",volume:.022,duration:toFrames(.06)})):[]),
    ...(x.line.id==="how-02-history"?[{frame:HOW_START_FRAME+x.startFrame+103,sound:"glitch.wav",volume:.035,duration:toFrames(.34)}]:[]),
    ...(x.line.id==="how-03-code"?[12,27,42].map(f=>({frame:HOW_START_FRAME+x.startFrame+f,sound:"tick.wav",volume:.03,duration:toFrames(.08)})):[]),
    ...(x.line.id==="how-04-ai"?[48,64,80].map(f=>({frame:HOW_START_FRAME+x.startFrame+f,sound:"pop.wav",volume:.035,duration:toFrames(.16)})):[]),
  ]),
  ...DEMO_SCHEDULE.map((x,i)=>({frame:DEMO_START_FRAME+DEMO_SCHEDULE.slice(0,i).reduce((n,s)=>n+s.sceneFrames,0),sound:"whoosh.wav",volume:.04,duration:toFrames(.5)})),
  {frame:END_CARD_START_FRAME+12,sound:"shine.wav",volume:.06,duration:toFrames(.8)},
];

const Track=({cue}:{cue:Cue})=><Sequence from={cue.frame} durationInFrames={cue.duration}><Audio src={staticFile(`audio/sfx/${cue.sound}`)} volume={cue.volume}/></Sequence>;
const Voice=({line}:{line:VoiceLine})=><Audio src={staticFile(line.file)}/>;

const Story=()=> <>{STORY_SCHEDULE.map(x=><Sequence key={x.line.id} from={x.startFrame} durationInFrames={x.sceneFrames}><StoryScene id={x.line.id} durationFrames={x.sceneFrames}/><Voice line={x.line}/></Sequence>)}</>;
const How=()=> <>{HOW_SCHEDULE.map(x=><Sequence key={x.line.id} from={HOW_START_FRAME+x.startFrame} durationInFrames={x.sceneFrames}><HowScene line={x.line} durationFrames={x.sceneFrames}/><Voice line={x.line}/></Sequence>)}</>;

type FocusBox = {x:number;y:number;w:number;h:number};
type DemoFocus = {center:[number,number];zoom:number;regions:FocusBox[]};
const demoFocus:Record<string,DemoFocus>={
 "nuvio-infobar":{center:[.60,.36],zoom:2,regions:[{x:.455,y:.315,w:.295,h:.09}]},
 "nuvio-verdict-reasons":{center:[.88,.62],zoom:2.05,regions:[{x:.775,y:.585,w:.21,h:.075}]},
 "nuvio-callback":{center:[.87,.59],zoom:2.05,regions:[{x:.775,y:.52,w:.21,h:.135}]},
 "pdg-mail-verdict":{center:[.71,.45],zoom:1.8,regions:[{x:.48,y:.20,w:.20,h:.09},{x:.77,y:.29,w:.21,h:.43}]},
 "pdg-techniques":{center:[.70,.72],zoom:2.1,regions:[{x:.77,y:.812,w:.05,h:.03},{x:.815,y:.812,w:.045,h:.03},{x:.77,y:.84,w:.14,h:.03}]},
 "daf-verdict":{center:[.88,.37],zoom:2,regions:[{x:.775,y:.325,w:.21,h:.09}]},
 "attack-summary":{center:[.50,.287],zoom:1.22,regions:[{x:.099,y:.242,w:.263,h:.085},{x:.382,y:.242,w:.249,h:.085},{x:.638,y:.242,w:.262,h:.085}]},
 "try-lookalike-example":{center:[.75,.56],zoom:2,regions:[{x:.625,y:.52,w:.25,h:.09}]},
};
const DemoScene=({scene}:{scene:(typeof DEMO_SCHEDULE)[number]})=>{
 const frame=useCurrentFrame();
 const {fps}=useVideoConfig();
 const focus=demoFocus[scene.sceneId];
 const techniques=scene.sceneId==="pdg-techniques";
 const attacks=scene.sceneId==="attack-summary";
 const focusCenterX=techniques?interpolate(frame,[3,28,48,60,104],[.70,.735,.76,.75,.70],{extrapolateRight:"clamp"}):focus.center[0];
 const focusCenterY=techniques?interpolate(frame,[3,28,48,60,104],[.70,.72,.74,.73,.70],{extrapolateRight:"clamp"}):attacks?.55:focus.center[1];
 const width=1450;
 const height=906;
 const zoom=spring({frame:frame-12,fps,config:{mass:.65,damping:24,stiffness:300}});
 const scale=1.06+(focus.zoom-1.06)*zoom;
 const driftProgress=interpolate(frame,[24,scene.sceneFrames-8],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
 const driftX=attacks?0:(focusCenterX<.5?-1:1)*80*driftProgress;
 const driftY=attacks?140*driftProgress:(focusCenterY<.5?-1:1)*50*driftProgress;
 const whip=attacks?0:interpolate(frame,[0,8,scene.sceneFrames-8,scene.sceneFrames-1],[72,0,0,-86],{extrapolateRight:"clamp"});
 const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
 const bounds=focus.regions.reduce((result,region)=>({
  left:Math.min(result.left,region.x),
  top:Math.min(result.top,region.y),
  right:Math.max(result.right,region.x+region.w),
  bottom:Math.max(result.bottom,region.y+region.h),
 }),{left:1,top:1,right:0,bottom:0});
 const inset=.005;
 const minX=Math.max(width*(1-scale),-Math.max(0,bounds.left-inset)*width*scale);
 const maxX=Math.min(0,width*(1-Math.min(1,bounds.right+inset)*scale));
 const minY=Math.max(height*(1-scale),-Math.max(0,bounds.top-inset)*height*scale);
 const maxY=Math.min(0,height*(1-Math.min(1,bounds.bottom+inset)*scale));
 const translateX=clamp(width/2-focusCenterX*width*scale+driftX+whip,minX,maxX);
 const translateY=clamp(height/2-focusCenterY*height*scale+driftY,minY,maxY);
 return <Sequence durationInFrames={scene.sceneFrames}>
  <div style={{position:"absolute",inset:0,background:COLORS.navy,overflow:"hidden"}}>
   <BrandArcs opacity={.17}/>
   <div style={{position:"absolute",left:278,top:84,width,height,borderRadius:22,background:"#11192B",border:"2px solid #30384A",overflow:"hidden",boxShadow:"0 28px 80px rgba(0,0,0,.48)"}}>
    <div style={{position:"absolute",inset:0,overflow:"hidden",transform:`translate(${translateX}px,${translateY}px) scale(${scale})`,transformOrigin:"0 0"}}>
     <OffthreadVideo src={staticFile(DEMO_VIDEO)} startFrom={scene.sourceStartFrame} endAt={scene.sourceEndFrame} playbackRate={scene.playbackRate} volume={0} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"fill"}}/>
    </div>
   </div>
   <div style={{position:"absolute",left:278,top:36,color:COLORS.yellow,fontFamily:"JetBrainsDeck, monospace",fontSize:19,letterSpacing:2}}>SOLEN · EN DIRECT</div>
  </div>
 </Sequence>;
};
const Demo=()=> <Sequence from={DEMO_START_FRAME} durationInFrames={DEMO_SCHEDULE.reduce((a,s)=>a+s.sceneFrames,0)}>{DEMO_SCHEDULE.map((s,i)=><Sequence key={s.sceneId} from={DEMO_SCHEDULE.slice(0,i).reduce((n,x)=>n+x.sceneFrames,0)} durationInFrames={s.sceneFrames}><DemoScene scene={s}/><Voice line={s.line}/></Sequence>)}</Sequence>;

const EndTagline=()=>{const frame=useCurrentFrame();return <div style={{position:"absolute",left:110,top:590,fontFamily:"ManropeDeck, sans-serif",fontSize:43,fontWeight:700,color:COLORS.cream}}>{(END_CARD_LINE.wordBoundaries??[]).map((word,i)=>{const start=Math.round(word.startSeconds*30);const progress=interpolate(frame,[start,start+5],[0,1],{extrapolateRight:"clamp"});const focus=word.text.toLocaleLowerCase("fr").replace(/[.,!?;:]/g,"")==="source";return <span key={`${word.text}-${i}`} style={{display:"inline-block",marginRight:"0.2em",opacity:progress,color:focus?COLORS.yellow:COLORS.cream,transform:`translateY(${(1-progress)*12}px) scale(${.9+progress*.1})`}}>{word.text.trim()}</span>})}</div>};

const EndCard=()=>{
 const frame=useCurrentFrame();const fps=useVideoConfig().fps;
 const opacity=interpolate(frame,[END_CARD_DURATION_FRAMES-END_CARD_FADE_FRAMES,END_CARD_DURATION_FRAMES-1],[1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
 const reveal=spring({frame:frame-6,fps,config:{damping:14,stiffness:140}});
 const push=interpolate(frame,[0,END_CARD_DURATION_FRAMES],[1,1.05],{extrapolateRight:"clamp"});
 const drift=interpolate(frame,[0,END_CARD_DURATION_FRAMES],[20,8],{extrapolateRight:"clamp"});
 return <div style={{position:"absolute",inset:0,opacity,background:COLORS.navy,overflow:"hidden"}}>
  <div style={{position:"absolute",inset:0,color:COLORS.cream,overflow:"hidden",transform:`translateX(${drift}px) scale(${push})`,transformOrigin:"center"}}>
   <BrandArcs opacity={.35}/>
   <div style={{position:"absolute",left:100,top:80,opacity:reveal,transform:`translateY(${(1-reveal)*24}px)`}}><DeckLogo page={1} style={{width:380,height:150}}/></div>
   <div style={{position:"absolute",left:110,top:320,color:COLORS.yellow,fontFamily:"JetBrainsDeck, monospace",fontSize:25,letterSpacing:3,opacity:reveal}}>ESSAYEZ-LA</div>
   <div style={{position:"absolute",left:100,top:410,fontFamily:"ArchivoDeck, sans-serif",fontSize:108,fontWeight:800,whiteSpace:"nowrap",opacity:reveal,transform:`translateY(${(1-reveal)*30}px)`}}>solen-demo.vercel.app</div>
   <EndTagline/>
   <div style={{position:"absolute",left:110,bottom:80,fontFamily:"JetBrainsDeck, monospace",fontSize:20,color:COLORS.muted}}>HACKATHON FINAXYS · BUILD WHAT’S NEXT</div>
   <Voice line={END_CARD_LINE}/>
  </div>
 </div>;
};

const Music=()=>{const frame=useCurrentFrame();const click=STORY_SCHEDULE.find(x=>x.line.id==="story-04-click");const loss=STORY_SCHEDULE.find(x=>x.line.id==="story-05-loss");const blackout=click&&loss&&frame>=click.startFrame+click.voiceFrames-5&&frame<loss.startFrame+10;return <Audio src={staticFile("audio/music-bed.wav")} volume={blackout?0:1}/>};

export const SolenPitch=()=> <div style={{position:"absolute",inset:0,background:"#000"}}><FontFaces/><Story/><How/><Demo/><Sequence from={END_CARD_START_FRAME} durationInFrames={END_CARD_DURATION_FRAMES}><EndCard/></Sequence><Music/>{cues.map((cue,i)=><Track key={`${cue.sound}-${cue.frame}-${i}`} cue={cue}/>)}</div>;
