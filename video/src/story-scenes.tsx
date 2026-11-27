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

const Shell = ({children}: {children: ReactNode}) => (
  <div style={{...shellStyle, position: "absolute", inset: 0}}>
    <BrandArcs />
    {children}
  </div>
);

const Claire = ({
  style,
  waking = false,
}: {
  style?: CSSProperties;
  waking?: boolean;
}) => (
  <svg
    viewBox="0 0 460 560"
    style={{display: "block", ...style}}
    aria-hidden
  >
    <ellipse cx="235" cy="535" rx="174" ry="20" fill="#050915" opacity="0.42" />
    <path
      d="M70 548c9-100 53-171 164-183 115-12 171 65 176 183H70Z"
      fill={COLORS.yellow}
    />
    <path d="M160 409c20-37 41-53 75-53 37 0 61 17 80 53l-80 91-75-91Z" fill={COLORS.cream} />
    <path
      d="M160 227c0-79 43-132 106-132 67 0 109 53 109 132v72c0 74-48 128-109 128-63 0-106-55-106-128v-72Z"
      fill="#E8B995"
    />
    <path
      d="M148 259c-22-120 21-201 125-201 96 0 137 78 113 201-10-44-37-65-74-79-35-13-65-35-79-69-13 60-42 96-85 110Z"
      fill="#201925"
    />
    <path
      d="M149 257c-27 26-26 74 3 93l18-80-21-13Zm223 4c26 27 24 75-5 92l-15-82 20-10Z"
      fill="#201925"
    />
    <path d="M198 286c10-7 21-7 31-1" fill="none" stroke="#35272A" strokeWidth="7" strokeLinecap="round" />
    <path d="M291 285c10-6 21-6 31 1" fill="none" stroke="#35272A" strokeWidth="7" strokeLinecap="round" />
    <ellipse cx="216" cy="309" rx="6" ry="8" fill="#0A0F20" />
    <ellipse cx="307" cy="309" rx="6" ry="8" fill="#0A0F20" />
    <path d="M249 320c-5 17-7 31 6 34" fill="none" stroke="#BC826F" strokeWidth="5" strokeLinecap="round" />
    <path
      d={waking ? "M237 370c12 13 28 13 41 0" : "M239 372c12 6 26 6 38 0"}
      fill="none"
      stroke="#8D4D53"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <path d="M162 412c-19 30-28 68-31 109h208c-5-42-19-80-38-109l-66 77-73-77Z" fill="#F2F1E9" />
    <path d="m232 488 20 20 19-20" fill="none" stroke={COLORS.yellow} strokeWidth="7" />
  </svg>
);

const AlarmScene = ({frame, durationFrames}: {frame: number; durationFrames: number}) => {
  const fps = useVideoConfig().fps;
  const sunrise = interpolate(frame, [0, durationFrames * 0.85], [174, 116], {
    extrapolateRight: "clamp",
  });
  const waking = frame > durationFrames * 0.35;
  return (
    <Shell>
      <StoryLabel>01 — LUNDI · 7:02</StoryLabel>
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 190,
          width: 640,
          ...displayStyle,
          fontSize: 82,
          ...enterStyle(frame, fps),
        }}
      >
        Une journée
        <br />
        comme les
        <br />
        autres<span style={{color: COLORS.yellow}}>.</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 510,
          color: COLORS.muted,
          fontFamily: "ManropeDeck, sans-serif",
          fontSize: 26,
          letterSpacing: 1,
        }}
      >
        CLAIRE BERNARD · COMPTABLE
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
        <rect x="82" y="606" width="224" height="142" rx="18" fill="#4A3A32" />
        <rect x="102" y="628" width="186" height="108" rx="12" fill="#60493A" />
        <rect x="140" y="650" width="108" height="68" rx="14" fill="#0A0F20" stroke={COLORS.yellow} strokeWidth="4" />
        <text x="194" y="678" textAnchor="middle" fill={COLORS.cream} fontFamily="JetBrainsDeck, monospace" fontSize="15">LUNDI</text>
        <text x="194" y="705" textAnchor="middle" fill={COLORS.yellow} fontFamily="JetBrainsDeck, monospace" fontSize="25" fontWeight="700">7:02</text>
        <path d="M129 645c-24-17-26-43-8-60m140 60c24-17 26-43 8-60" fill="none" stroke={COLORS.yellow} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
        <path d="M440 742c52-40 106-42 157 0" fill="none" stroke="#E8B995" strokeWidth="19" strokeLinecap="round" />
      </svg>
      <Claire
        waking={waking}
        style={{
          position: "absolute",
          width: 470,
          height: 570,
          right: 180,
          top: 355,
          transform: `translateY(${interpolate(frame, [0, durationFrames * 0.5], [34, 0], {extrapolateRight: "clamp"})}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 139,
          bottom: 76,
          color: COLORS.yellow,
          fontFamily: "JetBrainsDeck, monospace",
          fontSize: 20,
          letterSpacing: 2,
        }}
      >
        07:02 · ARKOS
      </div>
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
  const index = Math.min(2, Math.floor((frame / durationFrames) * 3));
  const items = [
    {number: "01", title: "Café", label: "LE RÉVEIL"},
    {number: "02", title: "Métro", label: "LE TRAJET"},
    {number: "03", title: "Ordinateur", label: "AU BUREAU"},
  ];
  const current = items[index];
  const localFrame = frame - Math.floor((durationFrames / 3) * index);
  return (
    <Shell>
      <StoryLabel>02 — ROUTINE</StoryLabel>
      <div
        style={{
          position: "absolute",
          left: 104,
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
          left: 116,
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
          left: 120,
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
          left: 118,
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
    <Shell>
      <StoryLabel>03 — LE MESSAGE · 9:31</StoryLabel>
      <div style={{position: "absolute", left: 103, top: 238, width: 520, ...displayStyle, fontSize: 70, ...enterStyle(frame, fps)}}>
        L'urgence.
        <br />
        Le secret.
        <br />
        <span style={{color: COLORS.yellow}}>35 000 €.</span>
      </div>
      <div style={{position: "absolute", left: 107, top: 558, width: 475, color: COLORS.muted, fontFamily: "ManropeDeck, sans-serif", fontSize: 27, lineHeight: 1.4}}>
        Un mail qui semble venir du PDG.
      </div>
      <div
        style={{
          position: "absolute",
          left: 704,
          top: 126,
          width: 1100,
          height: 822,
          backgroundColor: COLORS.cream,
          borderRadius: 24,
          boxShadow: "0 28px 70px rgba(0,0,0,.36)",
          overflow: "hidden",
          color: COLORS.navy,
          transform: `translateY(${(1 - appear) * 40}px) scale(${0.97 + appear * 0.03})`,
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
                {line}
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
          top: 70,
          right: 114,
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
  const pointerX = interpolate(frame, [0, clickFrame - 8, clickFrame], [810, 1330, 1330], {extrapolateRight: "clamp"});
  const pointerY = interpolate(frame, [0, clickFrame - 8, clickFrame], [625, 680, 680], {extrapolateRight: "clamp"});
  return (
    <Shell>
      <StoryLabel>04 — LE CLIC</StoryLabel>
      <div style={{position: "absolute", left: 100, top: 202, width: 560, ...displayStyle, fontSize: 72, ...enterStyle(frame, fps)}}>
        Claire hésite.
        <br />
        <span style={{color: COLORS.yellow}}>Elle valide.</span>
      </div>
      <div style={{position: "absolute", left: 105, top: 385, width: 490, color: COLORS.muted, fontFamily: "JetBrainsDeck, monospace", fontSize: 21, letterSpacing: 1.4}}>
        LE PATRON EST PRESSÉ.
      </div>
      <Claire style={{position: "absolute", left: 610, top: 415, width: 360, height: 440}} />
      <div style={{position: "absolute", right: 126, top: 180, width: 690, height: 670, borderRadius: 24, backgroundColor: COLORS.panel, boxShadow: "0 24px 70px rgba(0,0,0,.28)", padding: 40}}>
        <div style={{fontFamily: "JetBrainsDeck, monospace", color: COLORS.yellow, fontSize: 18, letterSpacing: 1.5}}>VIREMENT À EXÉCUTER</div>
        <div style={{fontFamily: "ArchivoDeck, sans-serif", fontWeight: 800, fontSize: 49, marginTop: 32}}>Arkos Systems</div>
        <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 23, color: COLORS.muted, marginTop: 14}}>Bénéficiaire · Compte confidentiel</div>
        <div style={{height: 1, backgroundColor: "#384153", margin: "32px 0"}} />
        <div style={{fontFamily: "ManropeDeck, sans-serif", fontSize: 20, color: COLORS.muted}}>MONTANT</div>
        <div style={{fontFamily: "ArchivoDeck, sans-serif", fontSize: 76, fontWeight: 800, color: COLORS.cream, marginTop: 5}}>35 000 €</div>
        <div style={{display: "flex", gap: 14, marginTop: 42}}>
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
  const moneyProgress = interpolate(frame, [durationFrames * 0.08, durationFrames * 0.55], [0, 35000], {extrapolateRight: "clamp"});
  const money = Math.floor(moneyProgress / 250) * 250;
  const formatted = money.toLocaleString("fr-FR").replace(/\u202f/g, "\u00a0");
  const callOpacity = interpolate(frame, [durationFrames * 0.52, durationFrames * 0.63], [0, 1], {extrapolateRight: "clamp"});
  const bills = Array.from({length: 9}, (_, index) => {
    const start = (index * 37) % durationFrames;
    const t = (frame + start) / Math.max(durationFrames, 1);
    return {
      x: 180 + ((index * 173) % 1470),
      y: 300 + ((index * 89) % 510) + Math.sin(t * Math.PI * 2) * 34,
      rotate: Math.sin(t * Math.PI * 2) * 26 + (index % 2 ? 16 : -16),
    };
  });
  return (
    <Shell>
      <StoryLabel>05 — LE LENDEMAIN</StoryLabel>
      <div style={{position: "absolute", left: 104, top: 165, color: COLORS.muted, fontFamily: "JetBrainsDeck, monospace", fontSize: 21, letterSpacing: 2}}>
        LE VRAI PDG APPELLE
      </div>
      <div style={{position: "absolute", left: 100, top: 228, ...displayStyle, fontSize: 64, width: 820, ...enterStyle(frame, fps)}}>
        Les trente-cinq mille euros
        <br />
        sont partis<span style={{color: COLORS.red}}>.</span>
      </div>
      <div style={{position: "absolute", left: 105, top: 445, fontFamily: "ManropeDeck, sans-serif", color: COLORS.muted, fontSize: 24}}>Pour de bon.</div>
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
            opacity: 0.35,
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
      <div style={{position: "absolute", left: 115, bottom: 95, color: COLORS.red, fontFamily: "ArchivoDeck, sans-serif", fontWeight: 800, fontSize: 104, letterSpacing: -3}}>
        −{formatted} €
      </div>
      <div
        style={{
          position: "absolute",
          right: 130,
          top: 500,
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
    <Shell>
      <StoryLabel>06 — LE COÛT</StoryLabel>
      <div style={{position: "absolute", left: 102, top: 193, ...displayStyle, fontSize: 130, color: COLORS.yellow, ...enterStyle(frame, fps)}}>
        35 000 €
      </div>
      <div style={{position: "absolute", left: 108, top: 345, color: COLORS.cream, fontFamily: "JetBrainsDeck, monospace", fontSize: 21, letterSpacing: 2}}>
        COÛT POUR ARKOS SYSTEMS
      </div>
      <div style={{position: "absolute", left: 104, top: 420, width: 730, height: 2, backgroundColor: "#485162"}} />
      <div style={{position: "absolute", left: 104, top: 489, color: COLORS.muted, fontFamily: "ManropeDeck, sans-serif", fontSize: 27, lineHeight: 1.35}}>
        En France, la fraude par
        <br />
        manipulation explose.
      </div>
      <div style={{position: "absolute", right: 130, top: 220, width: 780, height: 540, padding: 50, borderRadius: 24, backgroundColor: COLORS.panel, opacity: growth, transform: `translateY(${(1 - growth) * 40}px)`}}>
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
        <div style={{position: "absolute", bottom: 32, right: 44, color: COLORS.muted, fontFamily: "JetBrainsDeck, monospace", fontSize: 15, letterSpacing: 0.7}}>
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
    <Shell>
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

export const StoryScene = ({id, durationFrames}: StorySceneProps) => {
  const frame = useCurrentFrame();
  switch (id) {
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
