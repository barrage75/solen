import {Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring} from "remotion";
import type {CSSProperties, ReactNode} from "react";
import {COLORS, BrandArcs, DeckLogo, StoryLabel} from "./brand";
import {COPY, type PitchLang} from "./copy";

type StorySceneProps = {
  id: string;
  durationFrames: number;
  lang: PitchLang;
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

type ClaireAsset = "sleep" | "stretch" | "desk" | "phone" | "base";

const ClaireArt = ({name, style}: {name: ClaireAsset; style: CSSProperties}) => (
  <Img src={staticFile(`images/claire/${name}.png`)} alt="" style={{display: "block", ...style}} />
);

const AlarmScene = ({frame, durationFrames, lang}: {frame: number; durationFrames: number; lang: PitchLang}) => {
  const copy = COPY[lang].story.alarm;
  const fps = useVideoConfig().fps;
  const stretchFrame = 22;
  const stretching = frame >= stretchFrame;
  const stretchPop = spring({frame: frame - stretchFrame, fps, config: {mass: 0.55, damping: 14, stiffness: 170}});
  const cameraPush = interpolate(frame, [stretchFrame + 6, durationFrames], [0, 0.035], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const imageScale = stretching
    ? (0.94 + 0.06 * stretchPop) * (1 + cameraPush)
    : 1 + 0.005 * (1 + Math.sin(frame * 0.32));
  const imageY = stretching ? 20 * (1 - stretchPop) - 4 * Math.sin((frame - stretchFrame) * 0.45) * (1 - stretchPop) : 0;
  const sunrise = interpolate(frame, [0, durationFrames * 0.85], [174, 116], {
    extrapolateRight: "clamp",
  });
  const alarmShake = frame >= 7 && frame < stretchFrame ? Math.sin(frame * 2.4) * 5 : 0;
  const alarmPulse = 0.98 + 0.02 * Math.sin(frame * 0.75);
  const flashOpacity = interpolate(frame, [stretchFrame - 2, stretchFrame, stretchFrame + 2], [0, 0.5, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const whipOpacity = interpolate(frame, [stretchFrame - 3, stretchFrame, stretchFrame + 3], [0, 0.9, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const whipX = interpolate(frame, [stretchFrame - 3, stretchFrame + 3], [-650, 1920], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>{copy.chapter}</StoryLabel>
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
        {copy.day}
        <br />
        <span style={{color: COLORS.yellow}}>{copy.time}</span>
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
        {copy.job}
        <br />
        {copy.company}
      </div>
      <svg
        viewBox="0 0 1000 830"
        style={{position: "absolute", width: 1000, height: 830, right: 80, top: 135}}
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
        <rect x="82" y="606" width="224" height="142" rx="18" fill="#4A3A32" />
        <g transform={`translate(${alarmShake} 0) translate(194 678) scale(${alarmPulse}) translate(-194 -678)`}>
          <rect x="102" y="628" width="186" height="108" rx="12" fill="#60493A" />
          <rect x="140" y="650" width="108" height="68" rx="14" fill="#0A0F20" stroke={COLORS.yellow} strokeWidth="4" />
          <text x="194" y="678" textAnchor="middle" fill={COLORS.cream} fontFamily="JetBrainsDeck, monospace" fontSize="15">{copy.clockDay}</text>
          <text x="194" y="705" textAnchor="middle" fill={COLORS.yellow} fontFamily="JetBrainsDeck, monospace" fontSize="25" fontWeight="700">7:02</text>
          <path d="M129 645c-24-17-26-43-8-60m140 60c24-17 26-43 8-60" fill="none" stroke={COLORS.yellow} strokeWidth="4" strokeLinecap="round" opacity=".8" />
        </g>
      </svg>
      <div style={{position: "absolute", right: 240, top: 200, width: 720, height: 480, overflow: "hidden", borderRadius: 28, backgroundColor: COLORS.navy, border: "1px solid #2C3443", boxShadow: "0 24px 70px rgba(0,0,0,.32)"}}>
        <ClaireArt
          key={stretching ? "stretch" : "sleep"}
          name={stretching ? "stretch" : "sleep"}
          style={{position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `translateY(${imageY}px) scale(${imageScale})`, transformOrigin: "50% 75%"}}
        />
      </div>
      {whipOpacity > 0 && <div style={{position: "absolute", top: -110, bottom: -110, left: whipX, width: 520, transform: "skewX(-17deg)", background: `linear-gradient(90deg, transparent, ${COLORS.yellow}, ${COLORS.cream}, transparent)`, opacity: whipOpacity, zIndex: 9, pointerEvents: "none"}} />}
      {flashOpacity > 0 && <div style={{position: "absolute", inset: 0, backgroundColor: COLORS.cream, opacity: flashOpacity, zIndex: 10, pointerEvents: "none"}} />}
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

const RoutineScene = ({frame, durationFrames, lang}: {frame: number; durationFrames: number; lang: PitchLang}) => {
  const fps = useVideoConfig().fps;
  const copy = COPY[lang].story.routine;
  const cutFrames = Math.min(Math.round(fps), Math.floor(durationFrames / 3));
  const index = Math.min(2, Math.floor(frame / cutFrames));
  const items = copy.items.map((item, itemIndex) => ({number: `0${itemIndex + 1}`, ...item}));
  const current = items[index];
  const localFrame = frame - cutFrames * index;
  const portraitIn = spring({frame: localFrame - 3, fps, config: {mass: 0.65, damping: 16, stiffness: 150}});
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>{copy.chapter}</StoryLabel>
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
          right: 220,
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
      <div style={{position: "absolute", left: 790, top: 640, width: 180, height: 180, overflow: "hidden", borderRadius: "50%", border: `3px solid ${COLORS.yellow}`, backgroundColor: COLORS.panel, boxShadow: "0 16px 36px rgba(0,0,0,.3)", opacity: interpolate(localFrame, [0, 8], [0, 1], {extrapolateRight: "clamp"}), transform: `translateX(${(1 - portraitIn) * 54}px) scale(${0.92 + portraitIn * 0.08})`}}>
        <ClaireArt name="base" style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 32%"}} />
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
        {copy.footer[0]} <span style={{color: COLORS.yellow}}>→</span> {copy.footer[1]}{" "}
        <span style={{color: COLORS.yellow}}>→</span> {copy.footer[2]}
      </div>
    </Shell>
  );
};

const MailScene = ({frame, durationFrames, lang}: {frame: number; durationFrames: number; lang: PitchLang}) => {
  const fps = useVideoConfig().fps;
  const copy = COPY[lang].story.mail;
  const glitchX = frame < 22 ? Math.sin(frame * 3.1) * (22 - frame) * 1.2 : 0;
  const appear = spring({
    frame: frame - 9,
    fps,
    config: {damping: 18, stiffness: 110},
  });
  const bodyLines = copy.body;
  const lineStart = durationFrames * 0.2;
  const lineStep = durationFrames * 0.17;
  const mailHeadline = (
    <>
      {copy.headlines.map((headline, index) => (
        <div key={headline} style={{whiteSpace: "nowrap", color: index === 2 ? COLORS.yellow : COLORS.cream}}>
          {headline}
        </div>
      ))}
    </>
  );
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>{copy.chapter}</StoryLabel>
      {lang === "en" ? (
        <div style={{position: "absolute", left: 160, top: 238, width: 520, display: "flex", flexDirection: "column", gap: 24, ...enterStyle(frame, fps)}}>
          <div style={{...displayStyle, fontSize: 58, lineHeight: 1.02}}>{mailHeadline}</div>
          <div style={{width: 500, color: COLORS.muted, fontFamily: "ManropeDeck, sans-serif", fontSize: 27, lineHeight: 1.4}}>
            {copy.subheading}
          </div>
        </div>
      ) : (
        <>
          <div style={{position: "absolute", left: 160, top: 238, width: 520, ...displayStyle, fontSize: 70, ...enterStyle(frame, fps)}}>
            {copy.headlines[0]}
            <br />
            {copy.headlines[1]}
            <br />
            <span style={{color: COLORS.yellow}}>{copy.headlines[2]}</span>
          </div>
          <div style={{position: "absolute", left: 160, top: 558, width: 475, color: COLORS.muted, fontFamily: "ManropeDeck, sans-serif", fontSize: 27, lineHeight: 1.4}}>
            {copy.subheading}
          </div>
        </>
      )}
      <div
        style={{
          position: "absolute",
          left: 694,
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
          <div style={{marginLeft: "auto", fontFamily: "JetBrainsDeck, monospace", fontSize: 20, color: "#4A5260"}}>{copy.dayAndTime}</div>
        </div>
        <div style={{padding: "38px 50px"}}>
          <div style={{display: "flex", alignItems: "center", gap: 20, marginBottom: 26}}>
            <div style={{width: 56, height: 56, borderRadius: "50%", backgroundColor: "#203D60", color: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ManropeDeck, sans-serif", fontSize: 24, fontWeight: 800}}>JD</div>
            <div>
              <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 27, fontWeight: 800}}>{copy.sender}</div>
              <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 21, color: "#4F5967"}}>&lt;{copy.email}&gt;</div>
            </div>
            <div style={{marginLeft: "auto", color: "#657080", fontFamily: "JetBrainsDeck, monospace", fontSize: 18}}>9:31</div>
          </div>
          <div style={{fontFamily: "ArchivoDeck, sans-serif", fontSize: 39, fontWeight: 800, letterSpacing: -0.5, marginBottom: 26}}>{copy.subject}</div>
          <div style={{height: 1, backgroundColor: "#C8CBD0", marginBottom: 25}} />
          {bodyLines.map((line, index) => {
            const revealAt = lineStart + lineStep * index;
            const opacity = interpolate(frame, [revealAt, revealAt + 12], [0, 1], {extrapolateRight: "clamp"});
            return (
              <div
                key={"text" in line ? line.text : line.emphasis}
                style={{
                  opacity,
                  transform: `translateY(${(1 - opacity) * 16}px)`,
                  fontFamily: "ManropeDeck, sans-serif",
                  fontSize: lang === "en" ? 25 : index === 1 ? 30 : 29,
                  lineHeight: 1.3,
                  marginBottom: 18,
                  fontWeight: index === 1 ? 700 : 500,
                }}
              >
                {"text" in line
                  ? line.text
                  : <>{line.before}<mark style={{background:COLORS.yellow,color:COLORS.navy,padding:"0 4px"}}>{line.emphasis}</mark>{line.after}</>}
              </div>
            );
          })}
          <div style={{marginTop: 10, paddingTop: 18, borderTop: "1px solid #C8CBD0", fontFamily: "JetBrainsDeck, monospace", fontSize: 16, letterSpacing: 1, color: "#77808C"}}>
            {copy.footer}
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
        {copy.notification}
      </div>
    </Shell>
  );
};

const ClickScene = ({frame, durationFrames, lang}: {frame: number; durationFrames: number; lang: PitchLang}) => {
  const fps = useVideoConfig().fps;
  const copy = COPY[lang].story.click;
  const clickFrame = Math.round(durationFrames * 0.68);
  const clicked = frame >= clickFrame;
  const clickShake = frame >= clickFrame && frame < clickFrame + 12
    ? Math.sin((frame - clickFrame) * 2.4) * 5 * (1 - (frame - clickFrame) / 12)
    : 0;
  const deskZoom = interpolate(frame, [0, durationFrames], [1, 1.035], {extrapolateRight: "clamp"});
  const pointerX = interpolate(frame, [0, clickFrame - 8, clickFrame], [966, 1330, 1330], {extrapolateRight: "clamp"});
  const pointerY = interpolate(frame, [0, clickFrame - 8, clickFrame], [782, 680, 680], {extrapolateRight: "clamp"});
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>{copy.chapter}</StoryLabel>
      <div style={{position: "absolute", left: 160, top: 202, width: 950, ...displayStyle, fontSize: 58, ...enterStyle(frame, fps)}}>
        {copy.headline}
        <br />
        <span style={{color: COLORS.yellow}}>{copy.approve}</span>
      </div>
      <ClaireArt name="desk" style={{position: "absolute", left: 150, top: 390, width: 900, height: 600, objectFit: "contain", transform: `translateX(${clickShake}px) scale(${deskZoom})`, transformOrigin: "bottom left", filter: "drop-shadow(0 16px 20px rgba(0,0,0,.22))"}} />
      <div style={{position: "absolute", right: 230, top: 180, width: 690, height: 670, borderRadius: 24, backgroundColor: COLORS.panel, boxShadow: "0 24px 70px rgba(0,0,0,.28)", padding: 40, transform: `translateX(${clickShake}px)`}}>
        <div style={{fontFamily: "JetBrainsDeck, monospace", color: COLORS.yellow, fontSize: 18, letterSpacing: 1.5}}>{copy.transfer}</div>
        <div style={{fontFamily: "ArchivoDeck, sans-serif", fontWeight: 800, fontSize: lang === "en" ? 30 : 33, marginTop: 24}}>{copy.beneficiary}</div>
        <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 20, color: COLORS.muted, marginTop: 12}}>{copy.purpose}</div>
        <div style={{fontFamily: "JetBrainsDeck, monospace", fontSize: 16, color: COLORS.muted, marginTop: 13}}>{copy.iban}</div>
        <div style={{height: 1, backgroundColor: "#384153", margin: "24px 0"}} />
        <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 20, color: COLORS.muted}}>{copy.amountLabel}</div>
        <div style={{fontFamily: "ArchivoDeck, sans-serif", fontSize: 76, fontWeight: 800, color: COLORS.cream, marginTop: 5}}>{copy.amount}</div>
        <div style={{display: "flex", gap: 14, marginTop: 32}}>
          <div style={{height: 66, padding: "0 25px", display: "flex", alignItems: "center", border: "1px solid #525C6D", borderRadius: 12, color: COLORS.cream, fontFamily: "ManropeDeck, sans-serif", fontSize: 21}}>{copy.cancel}</div>
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
            {clicked ? copy.sent : copy.action}
          </div>
        </div>
        <div style={{position: "absolute", bottom: 26, right: 35, fontFamily: "JetBrainsDeck, monospace", color: COLORS.muted, fontSize: 16}}>{copy.irreversible}</div>
      </div>
      <svg
        viewBox="0 0 55 72"
        width={44}
        height={58}
        style={{
          position: "absolute",
          left: pointerX + clickShake,
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
            left: pointerX + clickShake - 28,
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

const LossScene = ({frame, durationFrames, lang}: {frame: number; durationFrames: number; lang: PitchLang}) => {
  const fps = useVideoConfig().fps;
  const copy = COPY[lang].story.loss;
  const countEndFrame = Math.max(1, durationFrames - Math.round(fps * 1.5));
  const moneyProgress = interpolate(frame, [durationFrames * 0.08, countEndFrame], [0, 35000], {extrapolateRight: "clamp"});
  const money = Math.floor(moneyProgress / 250) * 250;
  const formatted = money.toLocaleString(lang === "en" ? "en-US" : "fr-FR").replace(/\u202f/g, "\u00a0");
  const callRevealFrame = Math.round(durationFrames * (lang === "en" ? 0.1 : 0.52));
  const questionFrame = Math.round(durationFrames * (lang === "en" ? 0.64 : 0.61));
  const callOpacity = lang === "en"
    ? interpolate(frame, [callRevealFrame, callRevealFrame + 12], [0, 1], {extrapolateRight: "clamp"})
    : interpolate(frame, [callRevealFrame, durationFrames * 0.63], [0, 1], {extrapolateRight: "clamp"});
  const callPop = spring({frame: frame - callRevealFrame, fps, config: {mass: 0.6, damping: 15, stiffness: 150}});
  const questionPop = spring({frame: frame - questionFrame, fps, config: {mass: 0.48, damping: 13, stiffness: 180}});
  const questionShake = frame >= questionFrame && frame < questionFrame + 10
    ? Math.sin((frame - questionFrame) * 2.8) * 5 * (1 - (frame - questionFrame) / 10)
    : 0;
  const phoneShake = frame >= callRevealFrame && frame < callRevealFrame + 12
    ? Math.sin((frame - callRevealFrame) * 2.2) * 4 * (1 - (frame - callRevealFrame) / 12)
    : 0;
  const bills = Array.from({length: 9}, (_, index) => {
    const start = (index * 37) % durationFrames;
    const t = (frame + start) / Math.max(durationFrames, 1);
    return {
      x: 975 + ((index * 97) % 560) + (frame / Math.max(durationFrames, 1)) * 80,
      y: 300 + ((index * 47) % 110) + Math.sin(t * Math.PI * 2) * 24,
      rotate: Math.sin(t * Math.PI * 2) * 26 + (index % 2 ? 16 : -16),
    };
  });
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>{copy.chapter}</StoryLabel>
      <div style={{position: "absolute", left: 150, top: 188, color: COLORS.muted, fontFamily: "JetBrainsDeck, monospace", fontSize: 21, letterSpacing: 2}}>
        {copy.eyebrow}
      </div>
      {lang === "en" ? (
        <div style={{position: "absolute", left: 150, top: 248, display: "flex", flexDirection: "column", gap: 24, ...enterStyle(frame, fps)}}>
          <div style={{...displayStyle, fontSize: 58, color: COLORS.red}}>{typeof copy.headline === "string" ? copy.headline : copy.headline(formatted)}</div>
          <div style={{width: 950, fontFamily: "ManropeDeck, sans-serif", color: COLORS.muted, fontSize: 24}}>{copy.subheading}</div>
        </div>
      ) : (
        <>
          <div style={{position: "absolute", left: 150, top: 248, ...displayStyle, fontSize: 58, width: 1000, ...enterStyle(frame, fps)}}>
            <span style={{color: COLORS.red}}>{`${formatted} €`}</span>{typeof copy.headline === "function" ? copy.headline(formatted) : copy.headline}
          </div>
          <div style={{position: "absolute", left: 150, top: 358, width: 950, fontFamily: "ManropeDeck, sans-serif", color: COLORS.muted, fontSize: 24}}>{copy.subheading}</div>
        </>
      )}
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
          {copy.billAmount}
        </div>
      ))}
      <ClaireArt name="phone" style={{position: "absolute", right: 240, top: 150, width: 420, height: 420, objectFit: "contain", opacity: callOpacity, transform: `translateX(${phoneShake}px) scale(${0.96 + callPop * 0.04 + interpolate(frame, [callRevealFrame, durationFrames], [0, 0.025], {extrapolateRight: "clamp"})})`, transformOrigin: "center"}} />
      <div style={{position: "absolute", left: 150 + questionShake, top: 635, width: 790, color: COLORS.red, fontFamily: "ArchivoDeck, sans-serif", fontWeight: 800, fontSize: 112, letterSpacing: lang === "en" ? 0 : -4}}>
        {copy.counter(formatted)}
      </div>
      <div
        style={{
          position: "absolute",
          right: 240,
          top: 600,
          width: 780,
          padding: "26px 30px",
          borderRadius: 20,
          backgroundColor: COLORS.cream,
          color: COLORS.navy,
          opacity: callOpacity,
          transform: `translate(${questionShake}px, ${(1 - callOpacity) * 26}px) scale(${0.96 + callPop * 0.04})`,
          transformOrigin: "left center",
          boxShadow: "0 20px 60px rgba(0,0,0,.3)",
        }}
      >
        <div style={{display: "flex", alignItems: "center", gap: 19}}>
          <div style={{width: 58, height: 58, borderRadius: "50%", backgroundColor: "#213B5B", color: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ManropeDeck, sans-serif", fontSize: 21, fontWeight: 800}}>JP</div>
          <div>
            <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 24, fontWeight: 800}}>{copy.caller}</div>
            <div style={{fontFamily: "JetBrainsDeck, monospace", fontSize: 16, color: "#687080"}}>{copy.callState}</div>
          </div>
        </div>
        <div style={{marginTop: 20, fontFamily: "ArchivoDeck, sans-serif", fontSize: 39, fontWeight: 800, transform: `scale(${1 + questionPop * 0.12})`, transformOrigin: "left center"}}>{copy.question}</div>
      </div>
    </Shell>
  );
};

const CostScene = ({frame, durationFrames, lang}: {frame: number; durationFrames: number; lang: PitchLang}) => {
  const fps = useVideoConfig().fps;
  const copy = COPY[lang].story.cost;
  const amount = Math.round(interpolate(frame, [6, 48], [0, 516], {extrapolateRight: "clamp"}));
  const growth = interpolate(frame, [34, 64], [0, 1], {extrapolateRight: "clamp"});
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>{copy.chapter}</StoryLabel>
      <div style={{position: "absolute", left: 160, top: 193, ...displayStyle, fontSize: 130, color: COLORS.yellow, ...enterStyle(frame, fps)}}>
        {copy.amount}
      </div>
      <div style={{position: "absolute", left: 160, top: 345, color: COLORS.cream, fontFamily: "JetBrainsDeck, monospace", fontSize: 21, letterSpacing: 2}}>
        {copy.label}
      </div>
      <div style={{position: "absolute", left: 190, top: 420, width: 730, height: 2, backgroundColor: "#485162"}} />
      <div style={{position: "absolute", left: 190, top: 489, color: COLORS.muted, fontFamily: "ManropeDeck, sans-serif", fontSize: 27, lineHeight: 1.35}}>
        {copy.explanation[0]}
        <br />
        {copy.explanation[1]}
      </div>
      <div style={{position: "absolute", right: 210, top: 220, width: 780, height: 540, padding: 50, borderRadius: 24, backgroundColor: COLORS.panel, opacity: growth, transform: `translateY(${(1 - growth) * 40}px)`}}>
        <div style={{fontFamily: "JetBrainsDeck, monospace", color: COLORS.yellow, fontSize: 18, letterSpacing: 2}}>{copy.regionAndYear}</div>
        <div style={{marginTop: 34, display: "flex", alignItems: "baseline", gap: 18}}>
          <div style={{fontFamily: "ArchivoDeck, sans-serif", fontSize: lang === "en" ? 92 : 105, fontWeight: 800, color: COLORS.cream}}>{copy.nationalAmount(amount)}</div>
          <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 26, color: COLORS.muted}}>{copy.nationalLabel}</div>
        </div>
        <div style={{height: 1, width: "100%", backgroundColor: "#465064", margin: "35px 0"}} />
        <div style={{display: "flex", alignItems: "center", gap: 28}}>
          <div style={{fontFamily: "ArchivoDeck, sans-serif", fontWeight: 800, color: COLORS.yellow, fontSize: 84}}>{copy.growth}</div>
          <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 28, color: COLORS.cream}}>{copy.growthLabel}</div>
        </div>
        <div style={{position: "absolute", bottom: 32, right: 44, color: COLORS.muted, fontFamily: "JetBrainsDeck, monospace", fontSize: 17, letterSpacing: 0.7}}>
          {copy.source}
        </div>
      </div>
    </Shell>
  );
};

const RewindScene = ({frame, durationFrames, lang}: {frame: number; durationFrames: number; lang: PitchLang}) => {
  const copy = COPY[lang].story.rewind;
  const mail = COPY[lang].story.mail;
  const fps = useVideoConfig().fps;
  const revealAt = 30;
  const reveal = interpolate(frame, [revealAt, revealAt + 22], [0, 1], {extrapolateRight: "clamp"});
  const flicker = frame < revealAt ? 0.55 + (frame % 4) * 0.035 : 0.2;
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <StoryLabel>{copy.chapter}</StoryLabel>
      {frame < revealAt && (
        <>
          <div style={{position: "absolute", left: 344, top: 180, width: 1232, height: 590, border: `2px solid ${COLORS.yellow}`, borderRadius: 18, backgroundColor: COLORS.panel, overflow: "hidden", transform: `scaleX(${frame % 8 < 4 ? -1 : 1})`, opacity: flicker}}>
            <div style={{height: 68, backgroundColor: "#20293B", padding: "22px 34px", fontFamily: "JetBrainsDeck, monospace", color: COLORS.yellow, fontSize: 19}}>↶ REWIND · 09:31</div>
            <div style={{padding: "45px 68px", fontFamily: "ArchivoDeck, sans-serif", color: COLORS.cream, fontSize: 48, fontWeight: 800}}>
              {mail.subject}
              <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 27, fontWeight: 500, marginTop: 35, lineHeight: 1.5}}>
                {mail.sender} &lt;{mail.email}&gt;
                <br />
                {mail.preview}
              </div>
            </div>
            <div style={{position: "absolute", inset: 0, background: "repeating-linear-gradient(to bottom, rgba(0,0,0,.10) 0px, rgba(0,0,0,.10) 2px, transparent 2px, transparent 6px)", pointerEvents: "none"}} />
          </div>
          <div style={{position: "absolute", left: 835, bottom: 142, fontFamily: "JetBrainsDeck, monospace", fontSize: 23, color: COLORS.yellow, letterSpacing: 2}}>{copy.rewind}</div>
          <div style={{position: "absolute", left: 900, bottom: 96, width: 120, height: 4, backgroundColor: COLORS.yellow, transform: `scaleX(${1 - frame / revealAt})`, transformOrigin: "right"}} />
        </>
      )}
      <div style={{position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: reveal, transform: `scale(${0.92 + reveal * 0.08})`}}>
        <DeckLogo page={1} style={{width: 560, height: 210, marginBottom: 35}} />
        <div style={{fontFamily: "ArchivoDeck, sans-serif", fontWeight: 800, fontStretch: "125%", fontSize: 58, lineHeight: 1.05, color: COLORS.cream, textAlign: "center", maxWidth: 1200, ...enterStyle(Math.max(0, frame - revealAt), fps)}}>
          {copy.headline}
          <br />
          <span style={{color: COLORS.yellow}}>{copy.tagline}</span>
        </div>
        <div style={{marginTop: 34, color: COLORS.yellow, fontFamily: "JetBrainsDeck, monospace", fontSize: 18, letterSpacing: 2}}>{copy.footer}</div>
      </div>
      <div style={{position: "absolute", inset: 0, background: "repeating-linear-gradient(to bottom, rgba(0,0,0,.035) 0px, rgba(0,0,0,.035) 1px, transparent 1px, transparent 5px)", pointerEvents: "none", opacity: frame < revealAt ? 0.8 : 0}} />
    </Shell>
  );
};

const HookScene = ({frame, durationFrames, lang}: {frame: number; durationFrames: number; lang: PitchLang}) => {
  const copy = COPY[lang].story.hook;
  const shake = frame < 18 ? Math.sin(frame * 2.7) * (18 - frame) * 0.9 : 0;
  const slam = spring({frame: frame - 3, fps: 30, config: {damping: 10, stiffness: 170}});
  const rewind = interpolate(frame, [durationFrames - 23, durationFrames - 1], [0, 1], {extrapolateLeft: "clamp"});
  return (
    <Shell frame={frame} durationFrames={durationFrames}>
      <div style={{position:"absolute",inset:0,background:`linear-gradient(112deg, ${COLORS.navy} 0 53%, #151F32 53% 100%)`,transform:`translateX(${rewind*180}px)`}} />
      <div style={{position:"absolute",left:160,top:170,color:COLORS.red,fontFamily:"JetBrainsDeck, monospace",fontSize:24,letterSpacing:4,opacity:.8}}>{copy.eyebrow}</div>
      <div style={{position:"absolute",left:142,top:300,width:1200,fontFamily:"ArchivoDeck, sans-serif",fontWeight:800,fontSize:154,color:COLORS.cream,letterSpacing:-7,transform:`translate(${shake}px,${(1-slam)*90}px) scale(${.72+slam*.28}) rotate(${shake*.025}deg)`,textShadow:frame<18?"5px 0 #EE6D6A, -5px 0 #58B8E5":"none"}}>
        {copy.amount}
      </div>
      <div style={{position:"absolute",left:160,top:520,fontFamily:"ArchivoDeck, sans-serif",fontSize:58,fontWeight:800,color:COLORS.yellow,opacity:interpolate(frame,[18,30],[0,1],{extrapolateRight:"clamp"})}}>{copy.headline}</div>
      <div style={{position:"absolute",right:155,top:710,width:430,height:170,borderRadius:24,background:COLORS.cream,color:COLORS.navy,padding:28,transform:`translateX(${interpolate(frame,[20,45],[600,0],{extrapolateRight:"clamp"})}px)`}}>
        <div style={{fontFamily:"JetBrainsDeck, monospace",fontSize:18}}>{copy.transfer}</div>
        <div style={{marginTop:25,height:58,borderRadius:12,background:COLORS.yellow,display:"grid",placeItems:"center",fontFamily:"ManropeDeck, sans-serif",fontSize:22,fontWeight:800}}>{copy.action}</div>
      </div>
      <div style={{position:"absolute",left:0,right:0,bottom:0,height:150,background:COLORS.yellow,transform:`translateY(${(1-rewind)*180}px) skewY(-5deg)`,display:"flex",alignItems:"center",paddingLeft:140,color:COLORS.navy,fontFamily:"JetBrainsDeck, monospace",fontSize:28,letterSpacing:3}}>
        {copy.rewind}
      </div>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:frame<18?.17:0,background:"repeating-linear-gradient(to bottom, transparent 0 5px, rgba(255,255,255,.55) 6px 7px)"}}/>
    </Shell>
  );
};

export const StoryScene = ({id, durationFrames, lang}: StorySceneProps) => {
  const frame = useCurrentFrame();
  switch (id) {
    case "hook-01":
      return <HookScene frame={frame} durationFrames={durationFrames} lang={lang} />;
    case "story-01-alarm":
      return <AlarmScene frame={frame} durationFrames={durationFrames} lang={lang} />;
    case "story-02-routine":
      return <RoutineScene frame={frame} durationFrames={durationFrames} lang={lang} />;
    case "story-03-mail":
      return <MailScene frame={frame} durationFrames={durationFrames} lang={lang} />;
    case "story-04-click":
      return <ClickScene frame={frame} durationFrames={durationFrames} lang={lang} />;
    case "story-05-loss":
      return <LossScene frame={frame} durationFrames={durationFrames} lang={lang} />;
    case "story-06-cost":
      return <CostScene frame={frame} durationFrames={durationFrames} lang={lang} />;
    case "story-07-rewind":
      return <RewindScene frame={frame} durationFrames={durationFrames} lang={lang} />;
    default:
      return null;
  }
};
