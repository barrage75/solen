import {useCurrentFrame, useVideoConfig, interpolate, spring} from "remotion";
import type {CSSProperties, ReactNode} from "react";
import {COLORS, BrandArcs, DeckLogo, StoryLabel} from "./brand";

type StorySceneProps = {
  id: string;
  durationFrames: number;
};

const shellStyle: CSSProperties = {
  backgroundColor: COLORS.navy,
  color: COLORS.cream,
  overflow: "hidden",
};

const displayStyle: CSSProperties = {
  fontFamily: "ArchivoDeck, ManropeDeck, sans-serif",
  fontWeight: 800,
  fontStretch: "125%",
  letterSpacing: -2,
  lineHeight: 0.98,
};

const bodyStyle: React.CSSProperties = {
  fontFamily: "ManropeDeck, sans-serif",
  fontWeight: 500,
};

const enterStyle = (frame: number, fps: number) => {
  const value = spring({
    frame: frame - 4,
    fps,
    config: {damping: 21, stiffness: 110, mass: 0.85},
  });
  return {
    opacity: interpolate(frame, [0, 12], [0, 1], {
      extrapolateRight: "clamp",
    }),
    transform: `translateY(${(1 - value) * 36}px) scale(${0.985 + value * 0.015})`,
  };
};

const Shell = ({children, frame, durationFrames}: {children: ReactNode; frame: number; durationFrames: number}) => {
  const push = interpolate(frame, [0, durationFrames], [1, 1.055], {extrapolateRight: "clamp"});
  const drift = interpolate(frame, [0, durationFrames], [32, 12], {extrapolateRight: "clamp"});
  return (
  <div style={{...shellStyle, position: "absolute", inset: 0}}>
    <div style={{position: "absolute", inset: -46, overflow: "hidden", transform: `translateX(${drift}px) scale(${push})`, transformOrigin: "center"}}>
      <BrandArcs />
      {children}
    </div>
  </div>
  );
};

type ClairePose = "wake" | "concerned" | "neutral";

const Claire = ({style, pose = "neutral"}: {style?: CSSProperties; pose?: ClairePose}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const waking = pose === "wake";
  const concerned = pose === "concerned";
  const rise = waking
    ? spring({frame: frame - 28, fps, config: {mass: 0.9, damping: 22, stiffness: 100}})
    : 1;
  const stretchIn = waking
    ? spring({frame: frame - 12, fps, config: {mass: 0.55, damping: 17, stiffness: 140}})
    : 0;
  const stretchOut = waking
    ? spring({frame: frame - 52, fps, config: {mass: 0.7, damping: 20, stiffness: 100}})
    : 0;
  const stretch = Math.max(0, Math.min(1, stretchIn * (1 - stretchOut)));
  const lean = concerned
    ? spring({frame: frame - 10, fps, config: {mass: 0.7, damping: 18, stiffness: 130}})
    : 0;
  const torsoRotation = waking ? -8 * (1 - rise) : -2.5 * lean;
  const torsoLift = waking ? -180 * rise : 0;
  const leftMix = waking ? stretch : 0;
  const rightMix = waking ? stretch : concerned ? lean : 0;
  const armMix = (from: number, to: number, progress: number) => from + (to - from) * progress;
  const leftElbow = {x: armMix(210, 145, leftMix), y: armMix(580, 365, leftMix)};
  const leftWrist = {x: armMix(260, 230, leftMix), y: armMix(650, 246, leftMix)};
  const rightElbow = concerned
    ? {x: armMix(512, 568, rightMix), y: armMix(570, 548, rightMix)}
    : {x: armMix(490, 555, rightMix), y: armMix(580, 365, rightMix)};
  const rightWrist = concerned
    ? {x: armMix(522, 648, rightMix), y: armMix(657, 615, rightMix)}
    : {x: armMix(440, 470, rightMix), y: armMix(650, 246, rightMix)};
  const leftUpper = `M225 505 Q${(225 + leftElbow.x) / 2 - 20} ${(505 + leftElbow.y) / 2} ${leftElbow.x} ${leftElbow.y}`;
  const leftForearm = `M${leftElbow.x} ${leftElbow.y} Q${(leftElbow.x + leftWrist.x) / 2 - 12} ${(leftElbow.y + leftWrist.y) / 2} ${leftWrist.x} ${leftWrist.y}`;
  const rightUpper = `M475 505 Q${(475 + rightElbow.x) / 2 + 20} ${(505 + rightElbow.y) / 2} ${rightElbow.x} ${rightElbow.y}`;
  const rightForearm = `M${rightElbow.x} ${rightElbow.y} Q${(rightElbow.x + rightWrist.x) / 2 + 12} ${(rightElbow.y + rightWrist.y) / 2} ${rightWrist.x} ${rightWrist.y}`;
  const eyeOpenBase = waking
    ? interpolate(frame, [0, 16, 29], [0.03, 0.03, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
    : 1;
  const blink = (waking && frame >= 61 && frame <= 63) || (concerned && frame >= 47 && frame <= 49) ? 0.08 : 1;
  const eyeOpen = eyeOpenBase * blink;
  const headRotation = waking ? -torsoRotation : -4 * lean;
  const headShiftY = waking ? 0 : 1.5 * lean;
  const leftBrow = concerned ? "M288 220 Q316 202 344 220" : "M288 223 Q316 208 344 223";
  const rightBrow = concerned ? "M357 220 Q384 202 412 220" : "M357 223 Q384 208 412 223";
  const mouth = concerned ? "M326 346 Q350 339 374 346" : "M326 341 Q350 360 374 341";
  const hand = (x: number, y: number, side: "left" | "right") => (
    <g key={side} transform={`translate(${x} ${y}) rotate(${side === "left" ? -18 : 18})`}>
      <ellipse rx="20" ry="15" fill="#E4AD8E" />
      <path d="M-12-9l-7-12m13 10-3-15m9 15 2-15m5 17 7-12" fill="none" stroke="#E4AD8E" strokeWidth="6" strokeLinecap="round" />
    </g>
  );
  const leftArmRotation = waking ? -8 * stretch : 0;
  const rightArmRotation = waking ? 8 * stretch : concerned ? -5 * lean : 0;
  return (
    <svg viewBox="0 0 700 760" style={{display: "block", overflow: "visible", ...style}} aria-hidden>
      <g transform={`translate(0 ${torsoLift}) rotate(${torsoRotation} 400 650)`}>
        <g transform={`rotate(${leftArmRotation} 225 505)`}>
          <path d={leftUpper} fill="none" stroke="#294563" strokeWidth="50" strokeLinecap="round" />
          <path d={leftForearm} fill="none" stroke="#E4AD8E" strokeWidth="29" strokeLinecap="round" />
        </g>
        <g transform={`rotate(${rightArmRotation} 475 505)`}>
          <path d={rightUpper} fill="none" stroke="#294563" strokeWidth="50" strokeLinecap="round" />
          <path d={rightForearm} fill="none" stroke="#E4AD8E" strokeWidth="29" strokeLinecap="round" />
        </g>
        <path d="M155 760c8-135 37-238 137-278l58 42 58-42c102 40 129 143 137 278H155Z" fill="#213B5B" />
        <path d="M302 476l48 48 48-48 42 53-28 231H286l-28-231Z" fill={COLORS.cream} />
        <path d="m302 476 48 48-57 62-30-57Zm96 0-48 48 57 62 30-57Z" fill="#D8D7D0" />
        <path d="M212 565c21 13 43 21 67 24m142-24c-21 13-43 21-67 24" fill="none" stroke="#38577A" strokeWidth="5" strokeLinecap="round" />
        <circle cx="422" cy="635" r="9" fill={COLORS.yellow} />
        <g transform={`translate(0 ${headShiftY}) rotate(${headRotation} 350 265)`}>
          <path d="M244 240c-27-101 6-174 75-200 77-29 165 4 191 83 18 56 2 130-4 199-5 54-33 103-66 120l-16-136H270l-9 136c-37-15-57-61-56-110 1-42 24-69 39-92Z" fill="#593B31" />
          <path d="M314 382h72v108q-36 33-72 0Z" fill="#D99F80" />
          <path d="M350 111c-62 0-100 44-100 118v37c0 78 41 138 100 138s100-60 100-138v-37c0-74-38-118-100-118Z" fill="#E9B89A" />
          <path d="M250 243c1-101 47-155 123-160 58-4 100 27 113 80-45-19-83-21-118-5-35 17-68 54-118 85Z" fill="#593B31" />
          <path d="M250 242c-18 29-20 76-6 110 13 32 29 48 44 52l-6-141Zm200 0c18 29 20 76 6 110-13 32-29 48-44 52l6-141Z" fill="#593B31" />
          <path d="M270 282c22-20 52-19 75 1-22 26-52 26-75-1Zm85 1c23-20 53-21 76-1-23 27-53 27-76 1Z" fill="#FFF8F0" />
          <g transform={`translate(0 282) scale(1 ${eyeOpen}) translate(0 -282)`}>
            <ellipse cx="307" cy="282" rx="11" ry="14" fill="#76513F" />
            <ellipse cx="389" cy="282" rx="11" ry="14" fill="#76513F" />
            <ellipse cx={concerned ? 313 : 307} cy="283" rx="5.5" ry="8" fill="#20202A" />
            <ellipse cx={concerned ? 395 : 389} cy="283" rx="5.5" ry="8" fill="#20202A" />
            <circle cx={concerned ? 315 : 309} cy="279" r="2.4" fill="#FFF8F0" />
            <circle cx={concerned ? 397 : 391} cy="279" r="2.4" fill="#FFF8F0" />
          </g>
          <g opacity={1 - eyeOpen}>
            <path d="M278 283q29 13 58 0m24 0q29 13 58 0" fill="none" stroke="#392A2B" strokeWidth="5" strokeLinecap="round" />
          </g>
          <path d="M270 282q37-31 76 0m9 0q37-31 76 0" fill="none" stroke="#392A2B" strokeWidth="5" strokeLinecap="round" />
          <path d="m280 265-8-7m18 1-3-10m118 16 8-7m-18 1 3-10" fill="none" stroke="#392A2B" strokeWidth="3" strokeLinecap="round" />
          <path d={leftBrow} fill="none" stroke="#51352E" strokeWidth="7" strokeLinecap="round" />
          <path d={rightBrow} fill="none" stroke="#51352E" strokeWidth="7" strokeLinecap="round" />
          <circle cx="278" cy="326" r="16" fill="#D98980" opacity=".19" />
          <circle cx="422" cy="326" r="16" fill="#D98980" opacity=".19" />
          <path d="M350 292c-5 15-10 27-4 33 4 4 10 5 15 2" fill="none" stroke="#C7896D" strokeWidth="4" strokeLinecap="round" />
          <path d={mouth} fill="none" stroke="#985C5A" strokeWidth="5" strokeLinecap="round" />
          <path d="M248 226c17-77 72-132 134-141-26 22-41 52-52 75-21 29-48 51-82 66Z" fill="#68483A" />
          <path d="M265 115c27-32 61-49 96-54" fill="none" stroke="#9B7258" strokeWidth="8" strokeLinecap="round" opacity=".72" />
          <path d="M462 159c22 54 16 115 7 163" fill="none" stroke="#8D644D" strokeWidth="7" strokeLinecap="round" opacity=".58" />
        </g>
        {(!waking || stretch > 0.08) && (
          <>
            <g transform={`rotate(${leftArmRotation} 225 505)`}>{hand(leftWrist.x, leftWrist.y, "left")}</g>
            <g transform={`rotate(${rightArmRotation} 475 505)`}>{hand(rightWrist.x, rightWrist.y, "right")}</g>
          </>
        )}
      </g>
    </svg>
  );
};

const AlarmScene = ({frame, durationFrames}: {frame: number; durationFrames: number}) => {
  const fps = useVideoConfig().fps;
  const sunrise = interpolate(frame, [0, durationFrames * 0.85], [174, 116], {
    extrapolateRight: "clamp",
  });
  const alarmPulse = 0.92 + 0.08 * Math.sin(frame * 0.75);
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>01 — RÉVEIL</StoryLabel>
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 190,
          width: 640,
          ...displayStyle,
          fontSize: 84,
          ...enterStyle(frame, fps),
        }}
      >
        Lundi,
        <br />
        <span style={{color: COLORS.yellow}}>7 h 02.</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 510,
          color: COLORS.muted,
          fontFamily: "ManropeDeck, sans-serif",
          fontSize: 26,
          letterSpacing: 1,
        }}
      >
        ASSISTANTE DE DIRECTION
        <br />
        ARKOS SYSTEMS
      </div>
      <svg
        viewBox="0 0 1000 830"
        style={{position: "absolute", width: 1000, height: 830, right: 10, top: 110}}
        aria-hidden
      >
        <rect x="132" y="47" width="697" height="364" rx="22" fill={COLORS.panel} stroke="#2C3443" strokeWidth="3" />
        <rect x="158" y="72" width="645" height="314" rx="12" fill="#17233A" />
        <circle cx="680" cy={sunrise} r="72" fill={COLORS.yellow} />
        <path d="M168 310c150-89 248-74 357-15 118 63 178 41 276-10v101H168V310Z" fill="#24344B" />
        <path d="M168 344c150-37 239-8 344 29 104 37 188 26 289-24v37H168v-42Z" fill="#354456" />
        <rect x="171" y="102" width="4" height="276" fill="#4A5668" />
        <rect x="800" y="102" width="4" height="276" fill="#4A5668" />
        <rect x="478" y="74" width="5" height="310" fill="#4A5668" />
        <rect x="186" y="408" width="590" height="17" rx="8" fill="#313B4C" />
        <rect x="0" y="670" width="998" height="165" rx="20" fill="#182034" />
        <rect x="350" y="480" width="300" height="74" rx="34" fill={COLORS.cream} opacity=".95" />
        <path d="M345 524q128-54 310 0v69H345Z" fill="#D4D3D0" opacity=".7" />
        <rect x="82" y="606" width="224" height="142" rx="18" fill="#4A3A32" />
        <g transform={`translate(194 678) scale(${alarmPulse}) translate(-194 -678)`}>
          <rect x="102" y="628" width="186" height="108" rx="12" fill="#60493A" />
          <rect x="140" y="650" width="108" height="68" rx="14" fill="#0A0F20" stroke={COLORS.yellow} strokeWidth="4" />
          <text x="194" y="678" textAnchor="middle" fill={COLORS.cream} fontFamily="JetBrainsDeck, monospace" fontSize="15">LUNDI</text>
          <text x="194" y="705" textAnchor="middle" fill={COLORS.yellow} fontFamily="JetBrainsDeck, monospace" fontSize="25" fontWeight="700">7:02</text>
          <path d="M129 645c-24-17-26-43-8-60m140 60c24-17 26-43 8-60" fill="none" stroke={COLORS.yellow} strokeWidth="4" strokeLinecap="round" opacity=".8" />
        </g>
      </svg>
      <Claire pose="wake" style={{position: "absolute", left: 1100, top: 280, width: 700, height: 760}} />
      <svg viewBox="0 0 1000 830" style={{position: "absolute", width: 1000, height: 830, right: 10, top: 110, pointerEvents: "none"}} aria-hidden>
        <path d="M300 704c94-64 195-61 292-20 108-49 238-32 406 17v134H300Z" fill="#E1DED6" />
        <path d="M305 706c100-53 184-46 284-5 112-43 230-29 399 18" fill="none" stroke="#C8C6C0" strokeWidth="5" opacity=".72" />
      </svg>
    </Shell>
  );
};

const RoutineVisual = ({kind}: {kind: number}) => {
  if (kind === 0) {
    return (
      <svg viewBox="0 0 620 420" width="620" height="420" aria-hidden>
        <path d="M175 196c-60-40-18-74 0-99m95 99c-58-43-15-76 4-104m92 104c-57-40-15-75 5-101" fill="none" stroke={COLORS.cream} strokeWidth="10" strokeLinecap="round" opacity="0.55" />
        <path d="M168 189h258l-28 167H199l-31-167Z" fill="#F2F1E9" />
        <path d="M426 220h44c48 0 49 81 0 81h-54" fill="none" stroke={COLORS.cream} strokeWidth="24" strokeLinecap="round" />
        <path d="M195 357h228" stroke={COLORS.yellow} strokeWidth="11" strokeLinecap="round" />
        <circle cx="299" cy="274" r="18" fill={COLORS.yellow} />
      </svg>
    );
  }
  if (kind === 1) {
    return (
      <svg viewBox="0 0 620 420" width="620" height="420" aria-hidden>
        <rect x="78" y="95" width="465" height="252" rx="42" fill={COLORS.cream} />
        <rect x="115" y="134" width="112" height="105" rx="14" fill="#8798A9" />
        <rect x="249" y="134" width="112" height="105" rx="14" fill="#8798A9" />
        <rect x="383" y="134" width="112" height="105" rx="14" fill="#8798A9" />
        <rect x="117" y="260" width="112" height="60" rx="12" fill="#D3D1C7" />
        <rect x="250" y="260" width="111" height="60" rx="12" fill="#D3D1C7" />
        <rect x="384" y="260" width="110" height="60" rx="12" fill="#D3D1C7" />
        <circle cx="157" cy="305" r="22" fill={COLORS.navy} />
        <circle cx="460" cy="305" r="22" fill={COLORS.navy} />
        <path d="M48 364h524" stroke={COLORS.yellow} strokeWidth="10" strokeLinecap="round" />
        <path d="M30 120v145m560-145v145" stroke={COLORS.yellow} strokeWidth="9" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 620 420" width="620" height="420" aria-hidden>
      <path d="M105 92h407c16 0 28 13 28 28v229H78V120c0-16 12-28 27-28Z" fill={COLORS.cream} />
      <rect x="104" y="122" width="410" height="182" rx="12" fill="#17233A" />
      <path d="m46 352 76-31h382l74 31c10 4 8 20-4 20H50c-11 0-14-15-4-20Z" fill="#8A919D" />
      <rect x="207" y="331" width="209" height="11" rx="5" fill={COLORS.navy} />
      <rect x="140" y="157" width="208" height="16" rx="8" fill={COLORS.yellow} opacity="0.9" />
      <rect x="140" y="189" width="320" height="9" rx="4" fill={COLORS.cream} opacity="0.6" />
      <rect x="140" y="214" width="270" height="9" rx="4" fill={COLORS.cream} opacity="0.36" />
      <rect x="140" y="244" width="113" height="29" rx="14" fill={COLORS.yellow} />
    </svg>
  );
};

const RoutineScene = ({frame, durationFrames}: {frame: number; durationFrames: number}) => {
  const fps = useVideoConfig().fps;
  const cutFrames = Math.min(Math.round(fps), Math.floor(durationFrames / 3));
  const index = Math.min(2, Math.floor(frame / cutFrames));
  const items = [
    {number: "01", title: "Café", label: "LE RÉVEIL"},
    {number: "02", title: "Métro", label: "LE TRAJET"},
    {number: "03", title: "Boîte mail", label: "AU BUREAU"},
  ];
  const current = items[index];
  const localFrame = frame - cutFrames * index;
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>02 — ROUTINE</StoryLabel>
      <div
        style={{
          position: "absolute",
          left: 180,
          top: 202,
          color: COLORS.yellow,
          fontFamily: "ArchivoDeck, sans-serif",
          fontWeight: 800,
          fontSize: 220,
          opacity: 0.16,
        }}
      >
        {current.number}
      </div>
      <div
        style={{
          position: "absolute",
          left: 180,
          top: 445,
          ...displayStyle,
          fontSize: 88,
          ...enterStyle(localFrame, fps),
        }}
      >
        {current.title}
        <span style={{color: COLORS.yellow}}>·</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 180,
          top: 555,
          color: COLORS.muted,
          fontFamily: "JetBrainsDeck, monospace",
          fontSize: 20,
          letterSpacing: 2,
        }}
      >
        {current.label}
      </div>
      <div
        style={{
          position: "absolute",
          right: 150,
          top: 230,
          width: 760,
          height: 600,
          borderRadius: 34,
          backgroundColor: COLORS.panel,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateX(${interpolate(localFrame, [0, 12], [100, 0], {extrapolateRight: "clamp"})}px)`,
        }}
      >
        <RoutineVisual kind={index} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 82,
          left: 180,
          color: COLORS.cream,
          fontFamily: "ManropeDeck, sans-serif",
          fontSize: 27,
          opacity: 0.74,
        }}
      >
        Café <span style={{color: COLORS.yellow}}>→</span> métro{" "}
        <span style={{color: COLORS.yellow}}>→</span> ordinateur
      </div>
    </Shell>
  );
};

const MailScene = ({frame, durationFrames}: {frame: number; durationFrames: number}) => {
  const fps = useVideoConfig().fps;
  const glitchX = frame < 22 ? Math.sin(frame * 3.1) * (22 - frame) * 1.2 : 0;
  const appear = spring({
    frame: frame - 9,
    fps,
    config: {damping: 18, stiffness: 110},
  });
  const bodyLines = [
    "Je suis en réunion avec nos avocats",
    "j'ai besoin que tu passes un virement de 35 000 € aujourd'hui",
    "n'en parle à personne, même pas à Marc",
  ];
  const lineStart = durationFrames * 0.2;
  const lineStep = durationFrames * 0.17;
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>03 — LE MESSAGE · 9:31</StoryLabel>
      <div style={{position: "absolute", left: 160, top: 238, width: 520, ...displayStyle, fontSize: 70, ...enterStyle(frame, fps)}}>
        L'urgence.
        <br />
        Le secret.
        <br />
        <span style={{color: COLORS.yellow}}>35 000 €.</span>
      </div>
      <div style={{position: "absolute", left: 160, top: 558, width: 475, color: COLORS.muted, fontFamily: "ManropeDeck, sans-serif", fontSize: 27, lineHeight: 1.4}}>
        Un mail qui semble venir du PDG.
      </div>
      <div
        style={{
          position: "absolute",
          left: 704,
          top: 200,
          width: 1100,
          height: 640,
          backgroundColor: COLORS.cream,
          borderRadius: 24,
          boxShadow: "0 28px 70px rgba(0,0,0,.36)",
          overflow: "hidden",
          color: COLORS.navy,
          transform: `translate(${glitchX}px,${(1 - appear) * 40}px) scale(${0.97 + appear * 0.03})`,
          opacity: interpolate(frame, [0, 14], [0, 1], {extrapolateRight: "clamp"}),
        }}
      >
        <div style={{height: 82, backgroundColor: "#E6E7E2", display: "flex", alignItems: "center", padding: "0 34px", gap: 20}}>
          <div style={{width: 24, height: 24, borderRadius: 7, backgroundColor: "#1676D2"}} />
          <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 29, fontWeight: 700}}>Outlook</div>
          <div style={{marginLeft: "auto", fontFamily: "JetBrainsDeck, monospace", fontSize: 20, color: "#4A5260"}}>LUNDI · 9:31</div>
        </div>
        <div style={{padding: "38px 50px"}}>
          <div style={{display: "flex", alignItems: "center", gap: 20, marginBottom: 26}}>
            <div style={{width: 56, height: 56, borderRadius: "50%", backgroundColor: "#203D60", color: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ManropeDeck, sans-serif", fontSize: 24, fontWeight: 800}}>JD</div>
            <div>
              <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 27, fontWeight: 800}}>Jean-Pierre Durand</div>
              <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 21, color: "#4F5967"}}>&lt;jp.durand.pdg@gmail.com&gt;</div>
            </div>
            <div style={{marginLeft: "auto", color: "#657080", fontFamily: "JetBrainsDeck, monospace", fontSize: 18}}>9:31</div>
          </div>
          <div style={{fontFamily: "ArchivoDeck, sans-serif", fontSize: 39, fontWeight: 800, letterSpacing: -0.5, marginBottom: 26}}>Virement confidentiel</div>
          <div style={{height: 1, backgroundColor: "#C8CBD0", marginBottom: 25}} />
          {bodyLines.map((line, index) => {
            const revealAt = lineStart + lineStep * index;
            const opacity = interpolate(frame, [revealAt, revealAt + 12], [0, 1], {extrapolateRight: "clamp"});
            return (
              <div
                key={line}
                style={{
                  opacity,
                  transform: `translateY(${(1 - opacity) * 16}px)`,
                  fontFamily: "ManropeDeck, sans-serif",
                  fontSize: index === 1 ? 30 : 29,
                  lineHeight: 1.35,
                  marginBottom: 24,
                  fontWeight: index === 1 ? 700 : 500,
                }}
              >
                {index === 1 ? <>j'ai besoin que tu passes un virement de <mark style={{background:COLORS.yellow,color:COLORS.navy,padding:"0 4px"}}>35 000 €</mark> aujourd'hui</> : index === 2 ? <><mark style={{background:COLORS.yellow,color:COLORS.navy,padding:"0 4px"}}>n'en parle à personne</mark>, même pas à Marc</> : line}
              </div>
            );
          })}
          <div style={{marginTop: 10, paddingTop: 18, borderTop: "1px solid #C8CBD0", fontFamily: "JetBrainsDeck, monospace", fontSize: 16, letterSpacing: 1, color: "#77808C"}}>
            CONFIDENTIEL · ACTION REQUISE AUJOURD'HUI
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 130,
          right: 220,
          padding: "13px 22px",
          borderRadius: 14,
          backgroundColor: COLORS.yellow,
          color: COLORS.navy,
          fontFamily: "ManropeDeck, sans-serif",
          fontSize: 19,
          fontWeight: 800,
          opacity: interpolate(frame, [8, 18, durationFrames * 0.22, durationFrames * 0.3], [0, 1, 1, 0], {extrapolateRight: "clamp"}),
          transform: `translateY(${interpolate(frame, [8, 18], [-18, 0], {extrapolateRight: "clamp"})}px)`,
        }}
      >
        Nouveau message · 9:31
      </div>
    </Shell>
  );
};

const ClickScene = ({frame, durationFrames}: {frame: number; durationFrames: number}) => {
  const fps = useVideoConfig().fps;
  const clickFrame = Math.round(durationFrames * 0.68);
  const clicked = frame >= clickFrame;
  const pointerX = interpolate(frame, [0, clickFrame - 8, clickFrame], [966, 1330, 1330], {extrapolateRight: "clamp"});
  const pointerY = interpolate(frame, [0, clickFrame - 8, clickFrame], [782, 680, 680], {extrapolateRight: "clamp"});
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>04 — LE CLIC</StoryLabel>
      <div style={{position: "absolute", left: 160, top: 202, width: 560, ...displayStyle, fontSize: 66, ...enterStyle(frame, fps)}}>
        Le patron est pressé.
        <br />
        <span style={{color: COLORS.yellow}}>Claire valide.</span>
      </div>
      <div style={{position: "absolute", left: 620, top: 807, width: 420, height: 12, borderRadius: 8, backgroundColor: "#293346", boxShadow: "0 10px 24px rgba(0,0,0,.22)"}} />
      <svg viewBox="0 0 96 56" width={72} height={42} style={{position: "absolute", left: 930, top: 762}} aria-hidden>
        <path d="M48 4C24 4 12 18 12 34c0 12 12 18 36 18s36-6 36-18C84 18 72 4 48 4Z" fill="#D8DDE4" stroke="#707B8A" strokeWidth="3" />
        <path d="M48 5v18m0-14c0-4 7-5 7 0" fill="none" stroke="#707B8A" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <Claire pose="concerned" style={{position: "absolute", left: 560, top: 395, width: 440, height: 478}} />
      <div style={{position: "absolute", right: 190, top: 180, width: 690, height: 670, borderRadius: 24, backgroundColor: COLORS.panel, boxShadow: "0 24px 70px rgba(0,0,0,.28)", padding: 40}}>
        <div style={{fontFamily: "JetBrainsDeck, monospace", color: COLORS.yellow, fontSize: 18, letterSpacing: 1.5}}>VIREMENT À EXÉCUTER</div>
        <div style={{fontFamily: "ArchivoDeck, sans-serif", fontWeight: 800, fontSize: 33, marginTop: 24}}>Bénéficiaire : compte inconnu</div>
        <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 20, color: COLORS.muted, marginTop: 12}}>Objet : acquisition confidentielle</div>
        <div style={{fontFamily: "JetBrainsDeck, monospace", fontSize: 16, color: COLORS.muted, marginTop: 13}}>IBAN · FR76 •••• •••• 4417</div>
        <div style={{height: 1, backgroundColor: "#384153", margin: "24px 0"}} />
        <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 20, color: COLORS.muted}}>MONTANT</div>
        <div style={{fontFamily: "ArchivoDeck, sans-serif", fontSize: 76, fontWeight: 800, color: COLORS.cream, marginTop: 5}}>35 000 €</div>
        <div style={{display: "flex", gap: 14, marginTop: 32}}>
          <div style={{height: 66, padding: "0 25px", display: "flex", alignItems: "center", border: "1px solid #525C6D", borderRadius: 12, color: COLORS.cream, fontFamily: "ManropeDeck, sans-serif", fontSize: 21}}>Annuler</div>
          <div
            style={{
              height: 66,
              minWidth: 320,
              padding: "0 25px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor: clicked ? COLORS.cream : COLORS.yellow,
              color: COLORS.navy,
              fontFamily: "ManropeDeck, sans-serif",
              fontSize: 22,
              fontWeight: 800,
              transform: clicked ? "scale(.98)" : "scale(1)",
            }}
          >
            {clicked ? "Virement envoyé ✓" : "Valider le virement"}
          </div>
        </div>
        <div style={{position: "absolute", bottom: 26, right: 35, fontFamily: "JetBrainsDeck, monospace", color: COLORS.muted, fontSize: 16}}>ACTION IRRÉVERSIBLE</div>
      </div>
      <svg
        viewBox="0 0 55 72"
        width={44}
        height={58}
        style={{
          position: "absolute",
          left: pointerX,
          top: pointerY,
          filter: "drop-shadow(0 2px 2px rgba(0,0,0,.7))",
          transform: `scale(${clicked ? 0.9 : 1})`,
        }}
        aria-hidden
      >
        <path d="M5 4v53l13-13 10 22 11-5-10-22h19L5 4Z" fill={COLORS.cream} stroke={COLORS.navy} strokeWidth="4" strokeLinejoin="round" />
      </svg>
      {clicked && (
        <div
          style={{
            position: "absolute",
            left: pointerX - 28,
            top: pointerY - 24,
            width: 88,
            height: 88,
            borderRadius: "50%",
            border: `3px solid ${COLORS.yellow}`,
            opacity: interpolate(frame, [clickFrame, clickFrame + 18], [0.9, 0], {extrapolateRight: "clamp"}),
          }}
        />
      )}
    </Shell>
  );
};

const LossScene = ({frame, durationFrames}: {frame: number; durationFrames: number}) => {
  const fps = useVideoConfig().fps;
  const countEndFrame = Math.max(1, durationFrames - Math.round(fps * 1.5));
  const moneyProgress = interpolate(frame, [durationFrames * 0.08, countEndFrame], [0, 35000], {extrapolateRight: "clamp"});
  const money = Math.floor(moneyProgress / 250) * 250;
  const formatted = money.toLocaleString("fr-FR").replace(/\u202f/g, "\u00a0");
  const callOpacity = interpolate(frame, [durationFrames * 0.52, durationFrames * 0.63], [0, 1], {extrapolateRight: "clamp"});
  const bills = Array.from({length: 9}, (_, index) => {
    const start = (index * 37) % durationFrames;
    const t = (frame + start) / Math.max(durationFrames, 1);
    return {
      x: 1120 + ((index * 101) % 650) + (frame / Math.max(durationFrames, 1)) * 210,
      y: 300 + ((index * 47) % 110) + Math.sin(t * Math.PI * 2) * 24,
      rotate: Math.sin(t * Math.PI * 2) * 26 + (index % 2 ? 16 : -16),
    };
  });
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>05 — LE LENDEMAIN</StoryLabel>
      <div style={{position: "absolute", left: 150, top: 188, color: COLORS.muted, fontFamily: "JetBrainsDeck, monospace", fontSize: 21, letterSpacing: 2}}>
        LE VRAI PDG APPELLE
      </div>
      <div style={{position: "absolute", left: 150, top: 248, ...displayStyle, fontSize: 58, width: 1000, ...enterStyle(frame, fps)}}>
        <span style={{color: COLORS.red}}>35 000 €</span> sont partis.
      </div>
      <div style={{position: "absolute", left: 150, top: 358, width: 950, fontFamily: "ManropeDeck, sans-serif", color: COLORS.muted, fontSize: 24}}>Il n'a jamais envoyé ce mail.</div>
      {bills.map((bill, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: bill.x,
            top: bill.y,
            width: 112,
            height: 54,
            border: `2px solid ${index % 2 ? COLORS.cream : COLORS.yellow}`,
            borderRadius: 6,
            opacity: 0.22,
            transform: `rotate(${bill.rotate}deg)`,
            color: COLORS.cream,
            fontFamily: "JetBrainsDeck, monospace",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          50 €
        </div>
      ))}
      <div style={{position: "absolute", left: 160, top: 600, width: 910, color: COLORS.red, fontFamily: "ArchivoDeck, sans-serif", fontWeight: 800, fontSize: 146, letterSpacing: -5}}>
        −{formatted} €
      </div>
      <div
        style={{
          position: "absolute",
          right: 240,
          top: 600,
          width: 620,
          padding: "26px 30px",
          borderRadius: 20,
          backgroundColor: COLORS.cream,
          color: COLORS.navy,
          opacity: callOpacity,
          transform: `translateY(${(1 - callOpacity) * 26}px)`,
          boxShadow: "0 20px 60px rgba(0,0,0,.3)",
        }}
      >
        <div style={{display: "flex", alignItems: "center", gap: 19}}>
          <div style={{width: 58, height: 58, borderRadius: "50%", backgroundColor: "#213B5B", color: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ManropeDeck, sans-serif", fontSize: 21, fontWeight: 800}}>JP</div>
          <div>
            <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 24, fontWeight: 800}}>Jean-Pierre Durand</div>
            <div style={{fontFamily: "JetBrainsDeck, monospace", fontSize: 16, color: "#687080"}}>APPEL ENTRANT</div>
          </div>
        </div>
        <div style={{marginTop: 20, fontFamily: "ArchivoDeck, sans-serif", fontSize: 39, fontWeight: 800}}>« Quel virement ? »</div>
      </div>
    </Shell>
  );
};

const CostScene = ({frame, durationFrames}: {frame: number; durationFrames: number}) => {
  const fps = useVideoConfig().fps;
  const amount = Math.round(interpolate(frame, [6, 48], [0, 516], {extrapolateRight: "clamp"}));
  const growth = interpolate(frame, [34, 64], [0, 1], {extrapolateRight: "clamp"});
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>06 — LE COÛT</StoryLabel>
      <div style={{position: "absolute", left: 160, top: 193, ...displayStyle, fontSize: 130, color: COLORS.yellow, ...enterStyle(frame, fps)}}>
        35 000 €
      </div>
      <div style={{position: "absolute", left: 160, top: 345, color: COLORS.cream, fontFamily: "JetBrainsDeck, monospace", fontSize: 21, letterSpacing: 2}}>
        COÛT POUR ARKOS SYSTEMS
      </div>
      <div style={{position: "absolute", left: 190, top: 420, width: 730, height: 2, backgroundColor: "#485162"}} />
      <div style={{position: "absolute", left: 190, top: 489, color: COLORS.muted, fontFamily: "ManropeDeck, sans-serif", fontSize: 27, lineHeight: 1.35}}>
        En France, la fraude par
        <br />
        manipulation explose.
      </div>
      <div style={{position: "absolute", right: 210, top: 220, width: 780, height: 540, padding: 50, borderRadius: 24, backgroundColor: COLORS.panel, opacity: growth, transform: `translateY(${(1 - growth) * 40}px)`}}>
        <div style={{fontFamily: "JetBrainsDeck, monospace", color: COLORS.yellow, fontSize: 18, letterSpacing: 2}}>FRANCE · 2025</div>
        <div style={{marginTop: 34, display: "flex", alignItems: "baseline", gap: 18}}>
          <div style={{fontFamily: "ArchivoDeck, sans-serif", fontSize: 105, fontWeight: 800, color: COLORS.cream}}>{amount} M€</div>
          <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 26, color: COLORS.muted}}>fraude par manipulation</div>
        </div>
        <div style={{height: 1, width: "100%", backgroundColor: "#465064", margin: "35px 0"}} />
        <div style={{display: "flex", alignItems: "center", gap: 28}}>
          <div style={{fontFamily: "ArchivoDeck, sans-serif", fontWeight: 800, color: COLORS.yellow, fontSize: 84}}>+34 %</div>
          <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 28, color: COLORS.cream}}>en un an</div>
        </div>
        <div style={{position: "absolute", bottom: 32, right: 44, color: COLORS.muted, fontFamily: "JetBrainsDeck, monospace", fontSize: 17, letterSpacing: 0.7}}>
          SOURCE : BANQUE DE FRANCE, RAPPORT OSMP 2025
        </div>
      </div>
    </Shell>
  );
};

const RewindScene = ({frame, durationFrames}: {frame: number; durationFrames: number}) => {
  const fps = useVideoConfig().fps;
  const revealAt = 30;
  const reveal = interpolate(frame, [revealAt, revealAt + 22], [0, 1], {extrapolateRight: "clamp"});
  const flicker = frame < revealAt ? 0.55 + (frame % 4) * 0.035 : 0.2;
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>07 — LA BONNE DÉCISION</StoryLabel>
      {frame < revealAt && (
        <>
          <div style={{position: "absolute", left: 344, top: 180, width: 1232, height: 590, border: `2px solid ${COLORS.yellow}`, borderRadius: 18, backgroundColor: COLORS.panel, overflow: "hidden", transform: `scaleX(${frame % 8 < 4 ? -1 : 1})`, opacity: flicker}}>
            <div style={{height: 68, backgroundColor: "#20293B", padding: "22px 34px", fontFamily: "JetBrainsDeck, monospace", color: COLORS.yellow, fontSize: 19}}>↶ REWIND · 09:31</div>
            <div style={{padding: "45px 68px", fontFamily: "ArchivoDeck, sans-serif", color: COLORS.cream, fontSize: 48, fontWeight: 800}}>
              Virement confidentiel
              <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 27, fontWeight: 500, marginTop: 35, lineHeight: 1.5}}>
                Jean-Pierre Durand &lt;jp.durand.pdg@gmail.com&gt;
                <br />
                Je suis en réunion avec nos avocats…
              </div>
            </div>
            <div style={{position: "absolute", inset: 0, background: "repeating-linear-gradient(to bottom, rgba(0,0,0,.10) 0px, rgba(0,0,0,.10) 2px, transparent 2px, transparent 6px)", pointerEvents: "none"}} />
          </div>
          <div style={{position: "absolute", left: 835, bottom: 142, fontFamily: "JetBrainsDeck, monospace", fontSize: 23, color: COLORS.yellow, letterSpacing: 2}}>REMBOBINER…</div>
          <div style={{position: "absolute", left: 900, bottom: 96, width: 120, height: 4, backgroundColor: COLORS.yellow, transform: `scaleX(${1 - frame / revealAt})`, transformOrigin: "right"}} />
        </>
      )}
      <div style={{position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: reveal, transform: `scale(${0.92 + reveal * 0.08})`}}>
        <DeckLogo page={1} style={{width: 560, height: 210, marginBottom: 35}} />
        <div style={{fontFamily: "ArchivoDeck, sans-serif", fontWeight: 800, fontStretch: "125%", fontSize: 58, lineHeight: 1.05, color: COLORS.cream, textAlign: "center", maxWidth: 1200, ...enterStyle(Math.max(0, frame - revealAt), fps)}}>
          On bloque l'arnaque par mail
          <br />
          à la <span style={{color: COLORS.yellow}}>source.</span>
        </div>
        <div style={{marginTop: 34, color: COLORS.yellow, fontFamily: "JetBrainsDeck, monospace", fontSize: 18, letterSpacing: 2}}>LE MAIL EST BLOQUÉ AVANT LE CLIC</div>
      </div>
      <div style={{position: "absolute", inset: 0, background: "repeating-linear-gradient(to bottom, rgba(0,0,0,.035) 0px, rgba(0,0,0,.035) 1px, transparent 1px, transparent 5px)", pointerEvents: "none", opacity: frame < revealAt ? 0.8 : 0}} />
    </Shell>
  );
};

const HookScene = ({frame, durationFrames}: {frame: number; durationFrames: number}) => {
  const shake = frame < 18 ? Math.sin(frame * 2.7) * (18 - frame) * 0.9 : 0;
  const slam = spring({frame: frame - 3, fps: 30, config: {damping: 10, stiffness: 170}});
  const rewind = interpolate(frame, [durationFrames - 23, durationFrames - 1], [0, 1], {extrapolateLeft: "clamp"});
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <div style={{position:"absolute",inset:0,background:`linear-gradient(112deg, ${COLORS.navy} 0 53%, #151F32 53% 100%)`,transform:`translateX(${rewind*180}px)`}} />
      <div style={{position:"absolute",left:160,top:170,color:COLORS.red,fontFamily:"JetBrainsDeck, monospace",fontSize:24,letterSpacing:4,opacity:.8}}>VIREMENT · ARKOS SYSTEMS</div>
      <div style={{position:"absolute",left:142,top:300,width:1200,fontFamily:"ArchivoDeck, sans-serif",fontWeight:800,fontSize:154,color:COLORS.cream,letterSpacing:-7,transform:`translate(${shake}px,${(1-slam)*90}px) scale(${.72+slam*.28}) rotate(${shake*.025}deg)`,textShadow:frame<18?"5px 0 #EE6D6A, -5px 0 #58B8E5":"none"}}>
        −35 000 €
      </div>
      <div style={{position:"absolute",left:160,top:520,fontFamily:"ArchivoDeck, sans-serif",fontSize:58,fontWeight:800,color:COLORS.yellow,opacity:interpolate(frame,[18,30],[0,1],{extrapolateRight:"clamp"})}}>PARTIS EN UN SEUL CLIC.</div>
      <div style={{position:"absolute",right:155,top:710,width:430,height:170,borderRadius:24,background:COLORS.cream,color:COLORS.navy,padding:28,transform:`translateX(${interpolate(frame,[20,45],[600,0],{extrapolateRight:"clamp"})}px)`}}>
        <div style={{fontFamily:"JetBrainsDeck, monospace",fontSize:18}}>VIREMENT CONFIDENTIEL</div>
        <div style={{marginTop:25,height:58,borderRadius:12,background:COLORS.yellow,display:"grid",placeItems:"center",fontFamily:"ManropeDeck, sans-serif",fontSize:22,fontWeight:800}}>VALIDER LE VIREMENT</div>
      </div>
      <div style={{position:"absolute",left:0,right:0,bottom:0,height:150,background:COLORS.yellow,transform:`translateY(${(1-rewind)*180}px) skewY(-5deg)`,display:"flex",alignItems:"center",paddingLeft:140,color:COLORS.navy,fontFamily:"JetBrainsDeck, monospace",fontSize:28,letterSpacing:3}}>
        RETOUR AU DÉBUT · LUNDI, 7 H 02
      </div>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:frame<18?.17:0,background:"repeating-linear-gradient(to bottom, transparent 0 5px, rgba(255,255,255,.55) 6px 7px)"}}/>
    </Shell>
  );
};

export const StoryScene = ({id, durationFrames}: StorySceneProps) => {
  const frame = useCurrentFrame();
  switch (id) {
    case "hook-01":
      return <HookScene frame={frame} durationFrames={durationFrames} />;
    case "story-01-alarm":
      return <AlarmScene frame={frame} durationFrames={durationFrames} />;
    case "story-02-routine":
      return <RoutineScene frame={frame} durationFrames={durationFrames} />;
    case "story-03-mail":
      return <MailScene frame={frame} durationFrames={durationFrames} />;
    case "story-04-click":
      return <ClickScene frame={frame} durationFrames={durationFrames} />;
    case "story-05-loss":
      return <LossScene frame={frame} durationFrames={durationFrames} />;
    case "story-06-cost":
      return <CostScene frame={frame} durationFrames={durationFrames} />;
    case "story-07-rewind":
      return <RewindScene frame={frame} durationFrames={durationFrames} />;
    default:
      return null;
  }
};
