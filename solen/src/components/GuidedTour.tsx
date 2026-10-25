"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Spinner } from "@fluentui/react-components";
import { LockClosed16Regular, Shield20Filled } from "@fluentui/react-icons";
import styles from "./tour.module.css";

// Texte d'accueil de la visite.
export const WELCOME = {
  title: "Bienvenue dans la démo Solen",
  intro:
    "Solen s'ajoute à votre boîte mail et traite tous les types d'arnaques par mail : faux changement de RIB, fraude au président, faux conseiller bancaire, hameçonnage, domaines sosies, mais aussi faux colis, faux remboursement, faux support informatique, liens et QR codes piégés, pièces jointes dangereuses. Le code tranche dès que de l'argent est en jeu, et l'IA explique la fraude en clair.",
  privacy:
    "Solen supprime automatiquement tous les mails qu'il a lus : rien n'est conservé, c'est plus sûr pour vos données et conforme au RGPD.",
};

export type TourStep = {
  id: string;
  title: string;
  body: ReactNode;
  // Zone à éclairer : valeur de l'attribut data-tour. Sans zone, la bulle est centrée.
  target?: string;
  // Mail à ouvrir avant l'étape ; la zone est cherchée dans ce mail seulement.
  mail?: string;
  // Épingle le volet Solen (et réinstalle Solen s'il a été retiré).
  pane?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "accueil",
    title: WELCOME.title,
    body: (
      <>
        <p>{WELCOME.intro}</p>
        <p className={styles.privacy}>
          <LockClosed16Regular />
          <span>{WELCOME.privacy}</span>
        </p>
      </>
    ),
  },
  {
    id: "rib",
    title: "Un faux changement de RIB",
    body: "Nuvio Cloud, un vrai fournisseur, demande de payer sur un nouveau compte. Solen affiche ce bandeau rouge directement dans le mail.",
    target: "infobar",
    mail: "nuvio",
    pane: true,
  },
  {
    id: "volet",
    title: "Le volet Solen explique pourquoi",
    body: "Le verdict, le montant en jeu et les raisons. « Règle » signale ce que le code a décidé, « IA » ce que Mistral explique, sans jamais pouvoir adoucir le verdict.",
    target: "pane",
    mail: "nuvio",
    pane: true,
  },
  {
    id: "appel",
    title: "Toujours une vérification par téléphone",
    body: "Solen indique qui rappeler, au numéro enregistré et jamais à celui du mail. Cette section reste là même quand Solen ne détecte rien.",
    target: "callback",
    mail: "nuvio",
    pane: true,
  },
  {
    id: "daf",
    title: "Le vrai mail urgent du DAF : aucune alerte",
    body: "Urgent et avec un montant, mais authentifié, interne et vers un fournisseur connu payé sur son compte habituel. Solen ne crie pas au loup.",
    target: "verdict",
    mail: "daf",
    pane: true,
  },
  {
    id: "president",
    title: "La fraude au président",
    body: "Le nom du PDG, mais une adresse Gmail, 35 000 € et l'ordre de n'en parler à personne. Solen conclut à une fraude, même sans IBAN dans le mail.",
    target: "mail",
    mail: "pdg",
    pane: true,
  },
  {
    id: "fournisseurs",
    title: "Les profils fournisseurs",
    body: "Les IBAN de référence viennent des paiements passés, jamais d'un mail. Un mail ne peut jamais modifier un profil.",
    target: "suppliers",
  },
  {
    id: "fin",
    title: "À vous de jouer",
    body: (
      <>
        <p>Ouvrez n&apos;importe quel mail et regardez ce que Solen en pense.</p>
        <ul className={styles.keys}>
          <li>
            <kbd>S</kbd> ouvre ou ferme le volet Solen
          </li>
          <li>
            <kbd>A</kbd> avant / après Solen
          </li>
          <li>
            <kbd>V</kbd> relance la visite, comme le bouton <kbd>?</kbd> en haut à droite
          </li>
        </ul>
      </>
    ),
  },
];

type Rect = { top: number; left: number; width: number; height: number };
type Side = "right" | "left" | "bottom" | "top" | "center" | "overlay";

// Marge autour de la zone éclairée, écart entre la zone et la bulle, marge au bord de l'écran.
const PAD = 6;
const GAP = 14;
const EDGE = 12;
const ARROW_MIN = 18;
// Au-delà, on renonce à attendre la zone (analyse trop lente) et on affiche l'étape au centre.
const WAIT_MS = 8000;
// Une zone absente pendant moins longtemps ne fait pas revenir le projecteur au centre (évite les clignements).
const MISSING_MS = 150;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

const sameRect = (a: Rect, b: Rect) =>
  Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;

const findTarget = (step: TourStep): HTMLElement | null => {
  if (!step.target) return null;
  const zone = `[data-tour="${step.target}"]`;
  const selector = step.mail ? `[data-mail="${step.mail}"] ${zone}, [data-mail="${step.mail}"]${zone}` : zone;
  return (
    [...document.querySelectorAll<HTMLElement>(selector)].find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }) ?? null
  );
};

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Place la bulle à côté de la zone éclairée, du côté où elle tient, avec la flèche pointée vers la zone.
// vb : bas utilisable de l'écran, au-dessus de la mention de démonstration toujours affichée.
const place = (spot: Rect | null, pw: number, ph: number, vw: number, vb: number) => {
  if (!spot) return { side: "center" as Side, top: Math.max(EDGE, (vb - ph) / 2), left: (vw - pw) / 2, arrow: 0 };
  const cx = spot.left + spot.width / 2;
  const cy = spot.top + spot.height / 2;
  const nearTop = spot.top < vb * 0.2 && spot.height < vb * 0.3;
  const sides: Side[] = vw < 700 ? ["bottom", "top"] : nearTop ? ["bottom", "right", "left", "top"] : ["right", "left", "bottom", "top"];
  for (const side of sides) {
    if (side === "right" && spot.left + spot.width + GAP + pw <= vw - EDGE) {
      const top = clamp(cy - ph / 2, EDGE, vb - ph - EDGE);
      return { side, top, left: spot.left + spot.width + GAP, arrow: clamp(cy - top, ARROW_MIN, ph - ARROW_MIN) };
    }
    if (side === "left" && spot.left - GAP - pw >= EDGE) {
      const top = clamp(cy - ph / 2, EDGE, vb - ph - EDGE);
      return { side, top, left: spot.left - GAP - pw, arrow: clamp(cy - top, ARROW_MIN, ph - ARROW_MIN) };
    }
    if (side === "bottom" && spot.top + spot.height + GAP + ph <= vb - EDGE) {
      const left = clamp(cx - pw / 2, EDGE, vw - pw - EDGE);
      return { side, top: spot.top + spot.height + GAP, left, arrow: clamp(cx - left, ARROW_MIN, pw - ARROW_MIN) };
    }
    if (side === "top" && spot.top - GAP - ph >= EDGE) {
      const left = clamp(cx - pw / 2, EDGE, vw - pw - EDGE);
      return { side, top: spot.top - GAP - ph, left, arrow: clamp(cx - left, ARROW_MIN, pw - ARROW_MIN) };
    }
  }
  // Zone trop grande pour poser la bulle à côté : elle se pose en bas de l'écran, par-dessus.
  return { side: "overlay" as Side, top: Math.max(EDGE, vb - ph - EDGE), left: (vw - pw) / 2, arrow: 0 };
};

type Props = {
  steps: TourStep[];
  // Ouvre le bon mail et épingle le volet quand l'étape le demande.
  onEnterStep: (step: TourStep) => void;
  onClose: () => void;
};

// Visite guidée animée : l'écran s'assombrit, seule la zone expliquée reste éclairée, et une bulle la commente.
export const SpotlightTour = ({ steps, onEnterStep, onClose }: Props) => {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight, reserve: 0 }));
  const [size, setSize] = useState({ w: 360, h: 220 });
  const [gaveUp, setGaveUp] = useState(false);
  const popNode = useRef<HTMLDivElement | null>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const enterStep = useRef(onEnterStep);
  const step = steps[index];
  const last = index === steps.length - 1;

  useEffect(() => {
    enterStep.current = onEnterStep;
  });

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= steps.length) return;
      setGaveUp(false);
      setIndex(next);
    },
    [steps.length],
  );

  // Chaque étape prépare l'écran : bon mail ouvert, volet Solen épinglé.
  useEffect(() => {
    enterStep.current(step);
    const timer = setTimeout(() => setGaveUp(true), WAIT_MS);
    return () => clearTimeout(timer);
  }, [step]);

  // Suit la zone à chaque image : elle peut apparaître après l'analyse, bouger au défilement ou au redimensionnement.
  useEffect(() => {
    let frame = 0;
    let missingSince = 0;
    let scrolled = false;
    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // La mention de démonstration et l'aide des raccourcis restent au premier plan : la bulle ne passe jamais dessous.
      const tops = [...document.querySelectorAll(".demo-disclaimer, [data-shortcuts-help]")]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.height > 0)
        .map((r) => r.top);
      const reserve = tops.length ? Math.max(0, Math.round(vh - Math.min(...tops))) : 0;
      setViewport((v) => (v.w === vw && v.h === vh && v.reserve === reserve ? v : { w: vw, h: vh, reserve }));
      const el = findTarget(step);
      if (el) {
        missingSince = 0;
        let r = el.getBoundingClientRect();
        if (!scrolled) {
          scrolled = true;
          if (r.top < EDGE || r.bottom > vh - EDGE) {
            el.scrollIntoView({ block: r.height > vh * 0.6 ? "start" : "center", behavior: reducedMotion() ? "auto" : "smooth" });
            r = el.getBoundingClientRect();
          }
        }
        const next = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
        setRect((prev) => (prev && sameRect(prev, next) ? prev : next));
      } else if (step.target) {
        missingSince ||= performance.now();
        if (performance.now() - missingSince > MISSING_MS) setRect(null);
      } else {
        setRect(null);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step]);

  // Clavier : flèches pour avancer ou reculer, Échap pour quitter, Tab reste dans la bulle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "Tab" && popNode.current) {
        const focusable = [...popNode.current.querySelectorAll<HTMLElement>("button:not([disabled])")];
        if (!focusable.length) return;
        const first = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === popNode.current)) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && (active === lastEl || !popNode.current.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [go, index, onClose]);

  // Rend le focus là où il était avant la visite.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    return () => {
      if (before?.isConnected) before.focus({ preventScroll: true });
    };
  }, []);

  // Mesure la bulle pour la placer, et lui donne le focus à chaque étape.
  const popRef = useCallback((node: HTMLDivElement | null) => {
    observer.current?.disconnect();
    popNode.current = node;
    if (!node) return;
    observer.current = new ResizeObserver(() =>
      setSize((s) => (s.w === node.offsetWidth && s.h === node.offsetHeight ? s : { w: node.offsetWidth, h: node.offsetHeight })),
    );
    observer.current.observe(node);
    node.focus({ preventScroll: true });
  }, []);

  const { w: vw, h: vh } = viewport;
  const vb = vh - viewport.reserve;
  const waiting = Boolean(step.target) && !rect && !gaveUp;

  // Zone éclairée limitée à l'écran ; sur téléphone, elle s'arrête au-dessus de la bulle si la zone est très haute.
  let spot: Rect | null = null;
  if (rect) {
    const top = Math.max(rect.top, EDGE / 2);
    const left = Math.max(rect.left, EDGE / 2);
    const bottom = Math.min(rect.top + rect.height, vh - EDGE / 2);
    const right = Math.min(rect.left + rect.width, vw - EDGE / 2);
    spot = { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
    const maxBottom = vb - size.h - GAP - EDGE;
    if (vw < 700 && spot.top + spot.height > maxBottom && maxBottom - spot.top > 60) spot.height = maxBottom - spot.top;
  }
  const pos = place(spot, size.w, size.h, vw, vb);
  const centered = pos.side === "center";
  const spotStyle = spot
    ? { top: spot.top, left: spot.left, width: spot.width, height: spot.height }
    : { top: vb / 2, left: vw / 2, width: 0, height: 0 };
  const arrowStyle =
    pos.side === "right" || pos.side === "left"
      ? { top: pos.arrow }
      : pos.side === "bottom" || pos.side === "top"
        ? { left: pos.arrow }
        : undefined;

  return (
    <div className={styles.tour}>
      {/* Bloque les clics sur la boîte mail pendant la visite. */}
      <div className={styles.blocker} />
      <div className={`${styles.spot} ${spot ? styles.spotLit : ""}`} style={spotStyle} aria-hidden="true" />
      <div
        key={`${index}-${centered}`}
        ref={popRef}
        className={`${styles.popover} ${centered ? styles.popoverCentered : ""}`}
        style={{ top: pos.top, left: pos.left }}
        data-side={pos.side}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
      >
        {arrowStyle && <span className={styles.arrow} style={arrowStyle} aria-hidden="true" />}
        <div className={styles.progress}>
          <ol className={styles.dots} aria-hidden="true">
            {steps.map((s, i) => (
              <li key={s.id} className={i === index ? styles.dotActive : i < index ? styles.dotDone : undefined} />
            ))}
          </ol>
          <span>
            <span className={styles.srOnly}>Étape </span>
            {index + 1}/{steps.length}
          </span>
        </div>
        <h2 id="tour-title" className={styles.title}>
          {index === 0 && <Shield20Filled className={styles.brand} />}
          {step.title}
        </h2>
        <div id="tour-body" className={styles.body}>
          {typeof step.body === "string" ? <p>{step.body}</p> : step.body}
        </div>
        {waiting && (
          <p className={styles.waiting} role="status">
            <Spinner size="extra-tiny" /> Solen analyse le mail…
          </p>
        )}
        {/* Boutons aux couleurs explicites : lisibles quel que soit le thème du navigateur. */}
        <div className={styles.actions}>
          {!last && (
            <button type="button" className={styles.skip} onClick={onClose}>
              Passer la visite
            </button>
          )}
          <span className={styles.nav}>
            {index > 0 && (
              <button type="button" className={styles.secondary} onClick={() => go(index - 1)}>
                Précédent
              </button>
            )}
            <button type="button" className={styles.primary} onClick={() => (last ? onClose() : go(index + 1))}>
              {index === 0 ? "Commencer" : last ? "Terminer" : "Suivant"}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};
