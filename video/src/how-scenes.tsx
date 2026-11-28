import {interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {CSSProperties, ReactNode} from "react";
import {COLORS, BrandArcs, StoryLabel} from "./brand";
import type {VoiceLine} from "./schedule";

const panel: CSSProperties = {
  position: "absolute",
  borderRadius: 24,
  background: "#151F32",
  border: "1px solid #3A4558",
  boxShadow: "0 24px 60px rgba(0,0,0,.3)",
};

const Pop = ({frame, children}: {frame: number; children: ReactNode}) => {
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - 5, fps, config: {damping: 14, stiffness: 150}});
  return <div style={{opacity: interpolate(frame, [0, 8], [0, 1], {extrapolateRight: "clamp"}), transform: `translateY(${(1-p)*24}px) scale(${.92+p*.08})`}}>{children}</div>;
};

const Profile = ({frame}: {frame: number}) => {
  const y = interpolate(frame, [0, 80], [22, -16], {extrapolateRight: "clamp"});
  const zoom = interpolate(frame, [24, 70], [1, 1.16], {extrapolateRight: "clamp"});
  const rowOpacity = interpolate(frame, [28, 42], [0, 1], {extrapolateRight: "clamp"});
  return (
    <>
      <StoryLabel>PROFIL FOURNISSEUR · NUVIO CLOUD</StoryLabel>
      <div style={{...panel, left: 150, top: 190, width: 950, height: 232, overflow: "hidden", transform: `translateY(${y}px) scale(1.04)`}}>
        <div style={{position:"relative",width:950,height:160,overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,transform:`scale(${zoom})`,transformOrigin:"center 112px"}}>
            <img alt="Capture réelle du profil fournisseur Nuvio Cloud" src={staticFile("images/supplier-nuvio-table.png")} style={{position:"absolute",inset:0,width:950,height:160,objectFit:"fill"}} />
            <div style={{position:"absolute",left:4,top:97,width:942,height:58,border:`3px solid ${COLORS.yellow}`,borderRadius:8,boxShadow:"0 0 22px rgba(255,207,51,.56)",background:"rgba(255,207,51,.06)",opacity:rowOpacity}}/>
          </div>
        </div>
        <div style={{position: "absolute", left: 16, right: 16, bottom: 12, display: "flex", gap: 10}}>
          {["nuvio-cloud.fr", "FR03 •••• •••• 5530", "04 72 18 52 30"].map((value, i) => <Pop key={value} frame={frame-i*8}><span style={{display:"block",padding:"12px 14px",background:COLORS.navy,border:`1px solid ${COLORS.yellow}`,borderRadius:12,fontFamily:"JetBrainsDeck, monospace",fontSize:16,color:COLORS.cream}}>{value}</span></Pop>)}
        </div>
      </div>
      <div style={{position:"absolute",right:220,top:260,width:660,...panel,padding:34}}>
        <div style={{color:COLORS.yellow,fontFamily:"JetBrainsDeck, monospace",fontSize:20}}>UN PROFIL CONSTRUIT PAR LES PAIEMENTS</div>
        <div style={{fontFamily:"ArchivoDeck, sans-serif",fontSize:54,fontWeight:800,marginTop:24}}>Nuvio Cloud</div>
        <div style={{fontFamily:"ManropeDeck, sans-serif",fontSize:23,lineHeight:1.8,marginTop:24,whiteSpace:"nowrap"}}><div style={{display:"flex",justifyContent:"space-between",gap:12}}><span>IBAN de référence</span><b style={{color:COLORS.yellow}}>FR03 •••• •••• 5530</b></div><div style={{display:"flex",justifyContent:"space-between",gap:12}}><span>Téléphone</span><b>04 72 18 52 30</b></div><div style={{display:"flex",justifyContent:"space-between",gap:12}}><span>Habituel</span><b>15 000 €–20 000 €</b></div></div>
        <div style={{marginTop:24,color:"#72D49A",fontFamily:"JetBrainsDeck, monospace",fontSize:25}}>● CONFIRMÉ · 22 PAIEMENTS</div>
      </div>
      <BrandArcs/>
    </>
  );
};

const History = ({frame}: {frame: number}) => (
  <>
    <StoryLabel>HISTORIQUE · 2019—2026</StoryLabel>
    <div style={{position:"absolute",left:120,top:210,width:1680,...panel,padding:34}}>
      <div style={{display:"flex",justifyContent:"space-between",fontFamily:"JetBrainsDeck, monospace",fontSize:21,color:COLORS.yellow}}>{Array.from({length:8},(_,i)=><span key={i}>{2019+i}</span>)}</div>
      <div style={{height:8,background:"#3A4558",margin:"34px 6px",position:"relative"}}>{Array.from({length:22},(_,i)=><span key={i} style={{position:"absolute",left:`${(i/21)*100}%`,top:-8,width:22,height:22,borderRadius:"50%",background:i<Math.floor(frame/4)?COLORS.yellow:"#657186",boxShadow:i<Math.floor(frame/4)?`0 0 22px ${COLORS.yellow}`:"none"}}/>)}</div>
      <div style={{fontFamily:"ArchivoDeck, sans-serif",fontSize:52,fontWeight:800}}>22 paiements <span style={{color:COLORS.yellow}}>depuis 2019</span></div>
      <div style={{fontFamily:"JetBrainsDeck, monospace",fontSize:25,marginTop:16}}>FR03 •••• •••• 5530 · UN SEUL IBAN DE RÉFÉRENCE</div>
    </div>
    <div style={{position:"absolute",left:145,top:525,fontFamily:"ArchivoDeck, sans-serif",fontSize:48,fontWeight:800,color:COLORS.cream}}>Un mail ne peut jamais modifier un profil.</div>
    <div style={{...panel,right:112,top:660,width:780,padding:28,transform:`translateX(${interpolate(frame,[88,108],[900,0],{extrapolateRight:"clamp"})}px)`,borderColor:frame>108?COLORS.red:COLORS.yellow,boxShadow:frame>108?"0 0 32px rgba(239,93,93,.75)":panel.boxShadow}}>
      <div style={{fontFamily:"JetBrainsDeck, monospace",fontSize:18,color:COLORS.red}}>NOUVEAU RIB · PIÈCE JOINTE</div>
      <div style={{fontFamily:"ManropeDeck, sans-serif",fontSize:24,marginTop:10}}>Changement de coordonnées bancaires</div>
      <div style={{fontFamily:"ManropeDeck, sans-serif",fontSize:30,marginTop:18}}>FR78 •••• •••• 8213</div>
      <div style={{color:COLORS.red,fontFamily:"ArchivoDeck, sans-serif",fontSize:32,fontWeight:800,marginTop:14}}>IBAN DIFFÉRENT · ALERTE</div>
    </div>
    <BrandArcs/>
  </>
);

const CodeChecks = ({frame}: {frame: number}) => {
  const rows=[["EXPÉDITEUR","Domaine authentique de Nuvio Cloud","✓",COLORS.yellow],["IBAN","Différent du profil","✕ · FRAUDE",COLORS.red],["MONTANT","18 400 € · habituel","✓","#72D49A"]];
  return <><StoryLabel>LE CODE VÉRIFIE · À CHAQUE MAIL</StoryLabel><div style={{position:"absolute",left:180,top:190,width:1560,...panel,padding:38}}>{rows.map((r,i)=><div key={r[0]} style={{display:"flex",alignItems:"center",height:166,borderBottom:i<2?"1px solid #3A4558":"none",opacity:frame>i*14?.95:.18,transform:`translateX(${frame>i*14?0:80}px)`}}><span style={{width:270,fontFamily:"JetBrainsDeck, monospace",fontSize:22,color:COLORS.yellow}}>{r[0]}</span><span style={{flex:1,fontFamily:"ManropeDeck, sans-serif",fontSize:34}}>{r[1]}</span><b style={{fontFamily:"ArchivoDeck, sans-serif",fontSize:38,color:r[3]}}>{r[2]}</b></div>)}</div><BrandArcs/></>;
};

const Ai = ({frame}: {frame:number}) => <>
  <StoryLabel>IA · DONNÉES MINIMISÉES</StoryLabel>
  <div style={{...panel,left:120,top:190,width:700,padding:32,fontFamily:"ManropeDeck, sans-serif",fontSize:30,lineHeight:1.55}}>« Changement de coordonnées bancaires »<br/><span style={{color:COLORS.red,opacity:1-interpolate(frame,[0,22],[0,1],{extrapolateRight:"clamp"})}}>FR78 •••• •••• 8213</span><span style={{color:COLORS.yellow}}> {frame>22?"[IBAN_1]":""}</span></div>
  <svg style={{position:"absolute",left:805,top:310,width:180,height:70,overflow:"visible"}}><path d="M0 35H170m-16-16 16 16-16 16" stroke={COLORS.yellow} strokeWidth="5" fill="none" opacity={interpolate(frame,[10,25],[0,1],{extrapolateRight:"clamp"})}/></svg>
  <div style={{position:"absolute",left:interpolate(frame,[22,42],[815,960],{extrapolateRight:"clamp"}),top:345,padding:"8px 12px",background:COLORS.yellow,color:COLORS.navy,fontFamily:"JetBrainsDeck, monospace",fontSize:20}}>[IBAN_1]</div>
  <div style={{...panel,left:920,top:260,width:520,padding:40,textAlign:"center",borderColor:COLORS.yellow,opacity:interpolate(frame,[20,28],[0,1],{extrapolateRight:"clamp"})}}><div style={{fontFamily:"JetBrainsDeck, monospace",fontSize:23,color:COLORS.yellow}}>IA · MISTRAL</div><div style={{fontFamily:"ArchivoDeck, sans-serif",fontSize:43,fontWeight:800,marginTop:15}}>La demande, pas l'IBAN</div></div>
  <div style={{position:"absolute",left:220,top:510,display:"flex",alignItems:"flex-start",gap:20}}>{["prétexte d’actualité","changement de coordonnées bancaires","urgence"].map((x,i)=><Pop key={x} frame={frame-i*9}><span style={{...panel,position:"relative",display:"block",padding:18,fontFamily:"ManropeDeck, sans-serif",fontSize:25,color:COLORS.cream,whiteSpace:"nowrap"}}>{x}</span></Pop>)}</div>
  <div style={{position:"absolute",left:220,top:700,width:1460,fontFamily:"ManropeDeck, sans-serif",fontSize:30,color:COLORS.cream}}>« La réforme ne force personne à changer de banque : prétexte. »</div><BrandArcs/>
</>;

const Rule = ({frame}: {frame:number}) => {
  const cursorX=interpolate(frame,[0,105],[330,1370],{extrapolateRight:"clamp"});
  return <><StoryLabel>RÈGLE · LE VERDICT NE PEUT QUE MONTER</StoryLabel><div style={{position:"absolute",left:250,top:250,width:1420,height:420,...panel,padding:38}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-around",height:210,fontFamily:"ArchivoDeck, sans-serif",fontSize:58,fontWeight:800}}><span>FIABLE</span><span style={{color:COLORS.yellow}}>SUSPECT</span><span style={{color:COLORS.red}}>FRAUDE</span></div><div style={{position:"absolute",left:140,top:260,width:interpolate(frame,[0,105],[180,1100],{extrapolateRight:"clamp"}),height:8,background:COLORS.yellow}}/><div style={{position:"absolute",left:cursorX,top:150,fontSize:76,color:COLORS.yellow}}>↑</div><div style={{position:"absolute",right:105,bottom:35,display:"flex",alignItems:"center",gap:10,fontFamily:"JetBrainsDeck, monospace",fontSize:26,color:COLORS.cream}}><span>↓ BLOQUÉ</span><svg width="34" height="36" viewBox="0 0 34 36"><path d="M9 15V10a8 8 0 0 1 16 0v5" fill="none" stroke={COLORS.cream} strokeWidth="4"/><rect x="5" y="14" width="24" height="19" rx="4" fill="none" stroke={COLORS.cream} strokeWidth="4"/></svg></div></div><div style={{position:"absolute",left:430,top:745,fontFamily:"ArchivoDeck, sans-serif",fontWeight:800,fontSize:78,color:COLORS.yellow,transform:`scale(${spring({frame:frame-30,fps:30,config:{damping:12}})})`}}>JAMAIS DANS L’AUTRE SENS</div><BrandArcs/></>;
};

export const HowScene = ({line, durationFrames}: {line: VoiceLine; durationFrames: number}) => {
  const frame=useCurrentFrame();
  const id=line.id;
  const push=interpolate(frame,[0,durationFrames],[1,1.055],{extrapolateRight:"clamp"});
  const drift=interpolate(frame,[0,durationFrames],[32,12],{extrapolateRight:"clamp"});
  return <div style={{position:"absolute",inset:0,background:COLORS.navy,color:COLORS.cream,overflow:"hidden"}}><div style={{position:"absolute",inset:-46,overflow:"hidden",transform:`translateX(${drift}px) scale(${push})`,transformOrigin:"center"}}>{id==="how-01-profile"?<Profile frame={frame}/>:id==="how-02-history"?<History frame={frame}/>:id==="how-03-code"?<CodeChecks frame={frame}/>:id==="how-04-ai"?<Ai frame={frame}/>:<Rule frame={frame}/>}</div><div style={{position:"absolute",right:40,bottom:26,width:Math.max(0,frame/durationFrames*1840),height:3,background:COLORS.yellow,opacity:.7}}/></div>;
};
