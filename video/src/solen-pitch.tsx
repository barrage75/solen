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

const KineticWords=({line,bottom=20}:{line:VoiceLine;bottom?:number})=>{
 const frame=useCurrentFrame(); const words=line.wordBoundaries??[];
 return <div style={{position:"absolute",left:70,right:70,bottom,minHeight:48,padding:"8px 18px",display:"flex",flexWrap:"wrap",justifyContent:"center",gap:"4px 10px",fontFamily:"JetBrainsDeck, monospace",fontSize:19,color:COLORS.cream,textShadow:"0 2px 16px rgba(0,0,0,.8)"}}>
  {words.map((w,i)=>{const start=Math.round(w.startSeconds*30);const p=interpolate(frame,[start,start+5],[0,1],{extrapolateRight:"clamp"});const token=w.text.toLocaleLowerCase("fr").replace(/[.,!?;:«»]/g,"");const focus=["trente-cinq","mille","euros","clic","claire","valide","pdg","urgent","personne","perdus","france","cinq","cent","seize","millions","vingt-deux","historique","iban","profil","fournisseur","code","contrôle","ia","jamais","piège","fraude","bloquées","zéro","alerte","sosie","solen"].includes(token);return <span key={`${w.text}-${i}`} style={{display:"inline-block",marginRight:"0.22em",opacity:p,color:focus?COLORS.yellow:COLORS.cream,fontWeight:focus?800:500,transform:`translateY(${(1-p)*8}px) scale(${(focus?1.16:1)*(.8+p*.2)})`}}>{w.text.trim()}</span>})}
 </div>;
};
const Track=({cue}:{cue:Cue})=><Sequence from={cue.frame} durationInFrames={cue.duration}><Audio src={staticFile(`audio/sfx/${cue.sound}`)} volume={cue.volume}/></Sequence>;
const Voice=({line}:{line:VoiceLine})=><Audio src={staticFile(line.file)}/>;

const Story=()=> <>{STORY_SCHEDULE.map(x=><Sequence key={x.line.id} from={x.startFrame} durationInFrames={x.sceneFrames}><StoryScene id={x.line.id} durationFrames={x.sceneFrames}/><Voice line={x.line}/><KineticWords line={x.line}/></Sequence>)}</>;
const How=()=> <>{HOW_SCHEDULE.map(x=><Sequence key={x.line.id} from={HOW_START_FRAME+x.startFrame} durationInFrames={x.sceneFrames}><HowScene line={x.line} durationFrames={x.sceneFrames}/><Voice line={x.line}/><KineticWords line={x.line}/></Sequence>)}</>;

const overlayBoxes:Record<string,[number,number,number,number,string]>={
 "nuvio-infobar":[.42,.23,.40,.18,"ALERTE À L’OUVERTURE"],
 "nuvio-verdict-reasons":[.72,.24,.25,.50,"IBAN DIFFÉRENT"],
 "nuvio-callback":[.72,.48,.25,.20,"NUMÉRO CONNU"],
 "pdg-mail-verdict":[.35,.18,.48,.55,"FAUX PDG · GMAIL"],
 "pdg-techniques":[.72,.65,.25,.16,"AUTORITÉ · SECRET"],
 "daf-verdict":[.72,.25,.25,.22,"AUCUNE ANOMALIE"],
 "attack-summary":[.12,.20,.75,.34,"26/26 BLOQUÉES · 0 FAUSSE ALERTE"],
 "try-lookalike-example":[.55,.18,.40,.55,"DOMAINE SOSIE · REPÉRÉ"],
};
const DemoScene=({scene}:{scene:(typeof DEMO_SCHEDULE)[number]})=>{
 const frame=useCurrentFrame();const [x,y,w,h,label]=overlayBoxes[scene.sceneId];
 const scale=interpolate(frame,[0,scene.sceneFrames],[1,1.13],{extrapolateRight:"clamp"});
 const pan=interpolate(frame,[0,scene.sceneFrames],[0,-18],{extrapolateRight:"clamp"});
 return <Sequence durationInFrames={scene.sceneFrames}>
  <div style={{position:"absolute",inset:0,background:COLORS.navy,overflow:"hidden"}}>
   <BrandArcs opacity={.17}/>
   <div style={{position:"absolute",left:278,top:84,width:1450,height:906,borderRadius:22,background:"#11192B",border:`3px solid ${COLORS.yellow}`,overflow:"hidden",boxShadow:"0 28px 80px rgba(0,0,0,.48)"}}>
    <OffthreadVideo src={staticFile(DEMO_VIDEO)} startFrom={scene.sourceStartFrame} endAt={scene.sourceEndFrame} playbackRate={scene.playbackRate} volume={0} style={{width:"100%",height:"100%",objectFit:"fill",transform:`scale(${scale}) translate(${pan}px,0px)`,transformOrigin:`${Math.round((x+w/2)*100)}% ${Math.round((y+h/2)*100)}%`}}/>
    <div style={{position:"absolute",left:`${x*100}%`,top:`${y*100}%`,width:`${w*100}%`,height:`${h*100}%`,border:`3px solid ${COLORS.yellow}`,boxShadow:"0 0 24px rgba(255,207,51,.56)",borderRadius:8,pointerEvents:"none"}}/>
    <div style={{position:"absolute",left:18,top:18,padding:"9px 14px",background:COLORS.yellow,color:COLORS.navy,fontFamily:"JetBrainsDeck, monospace",fontSize:17,fontWeight:700}}>{label}</div>
    <svg viewBox="0 0 1000 625" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
      <path d={`M150 80 L${Math.round((x+w/2)*1000)} ${Math.round((y+h/2)*625)}`} stroke={COLORS.yellow} strokeWidth="3" fill="none"/>
      <circle cx={Math.round((x+w/2)*1000)} cy={Math.round((y+h/2)*625)} r="8" fill={COLORS.yellow}/>
    </svg>
   </div>
   <div style={{position:"absolute",left:74,top:96,color:COLORS.yellow,fontFamily:"JetBrainsDeck, monospace",fontSize:19,letterSpacing:2}}>SOLEN · EN DIRECT</div>
  </div>
 </Sequence>;
};
const Demo=()=> <Sequence from={DEMO_START_FRAME} durationInFrames={DEMO_SCHEDULE.reduce((a,s)=>a+s.sceneFrames,0)}>{DEMO_SCHEDULE.map((s,i)=><Sequence key={s.sceneId} from={DEMO_SCHEDULE.slice(0,i).reduce((n,x)=>n+x.sceneFrames,0)} durationInFrames={s.sceneFrames}><DemoScene scene={s}/><Voice line={s.line}/><KineticWords line={s.line}/></Sequence>)}</Sequence>;

const EndTagline=()=>{const frame=useCurrentFrame();return <div style={{position:"absolute",left:110,top:590,fontFamily:"ManropeDeck, sans-serif",fontSize:43,fontWeight:700,color:COLORS.cream}}>{(END_CARD_LINE.wordBoundaries??[]).map((word,i)=>{const start=Math.round(word.startSeconds*30);const progress=interpolate(frame,[start,start+5],[0,1],{extrapolateRight:"clamp"});const focus=word.text.toLocaleLowerCase("fr").replace(/[.,!?;:]/g,"")==="source";return <span key={`${word.text}-${i}`} style={{display:"inline-block",marginRight:"0.2em",opacity:progress,color:focus?COLORS.yellow:COLORS.cream,transform:`translateY(${(1-progress)*12}px) scale(${.9+progress*.1})`}}>{word.text.trim()}</span>})}</div>};

const EndCard=()=>{const frame=useCurrentFrame();const fps=useVideoConfig().fps;const opacity=interpolate(frame,[END_CARD_DURATION_FRAMES-END_CARD_FADE_FRAMES,END_CARD_DURATION_FRAMES-1],[1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});const reveal=spring({frame:frame-6,fps,config:{damping:14,stiffness:140}});const push=interpolate(frame,[0,END_CARD_DURATION_FRAMES],[1,1.05],{extrapolateRight:"clamp"});const drift=interpolate(frame,[0,END_CARD_DURATION_FRAMES],[20,8],{extrapolateRight:"clamp"});return <div style={{position:"absolute",inset:0,opacity,background:COLORS.navy,color:COLORS.cream,overflow:"hidden",transform:`translateX(${drift}px) scale(${push})`,transformOrigin:"center"}}><BrandArcs opacity={.35}/><div style={{position:"absolute",left:100,top:80,opacity:reveal,transform:`translateY(${(1-reveal)*24}px)`}}><DeckLogo page={1} style={{width:380,height:150}}/></div><div style={{position:"absolute",left:110,top:320,color:COLORS.yellow,fontFamily:"JetBrainsDeck, monospace",fontSize:25,letterSpacing:3,opacity:reveal}}>ESSAYEZ-LA</div><div style={{position:"absolute",left:100,top:410,fontFamily:"ArchivoDeck, sans-serif",fontSize:108,fontWeight:800,whiteSpace:"nowrap",opacity:reveal,transform:`translateY(${(1-reveal)*30}px)`}}>solen-demo.vercel.app</div><EndTagline/><div style={{position:"absolute",left:110,bottom:80,fontFamily:"JetBrainsDeck, monospace",fontSize:20,color:COLORS.muted}}>HACKATHON FINAXYS · BUILD WHAT’S NEXT</div><Voice line={END_CARD_LINE}/></div>};

const Music=()=>{const frame=useCurrentFrame();const click=STORY_SCHEDULE.find(x=>x.line.id==="story-04-click");const loss=STORY_SCHEDULE.find(x=>x.line.id==="story-05-loss");const blackout=click&&loss&&frame>=click.startFrame+click.voiceFrames-5&&frame<loss.startFrame+10;return <Audio src={staticFile("audio/music-bed.wav")} volume={blackout?0:1}/>};

export const SolenPitch=()=> <div style={{position:"absolute",inset:0,background:"#000"}}><FontFaces/><Story/><How/><Demo/><Sequence from={END_CARD_START_FRAME} durationInFrames={END_CARD_DURATION_FRAMES}><EndCard/></Sequence><Music/>{cues.map((cue,i)=><Track key={`${cue.sound}-${cue.frame}-${i}`} cue={cue}/>)}</div>;
