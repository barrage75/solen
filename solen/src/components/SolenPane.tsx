"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Spinner, Tooltip } from "@fluentui/react-components";
import {
  BuildingMultiple16Regular,
  Call20Regular,
  Checkmark16Filled,
  CheckmarkCircle20Filled,
  Dismiss20Regular,
  ErrorCircle20Filled,
  Flag20Regular,
  Info16Regular,
  PersonAlert20Regular,
  Pin20Filled,
  ShieldCheckmark16Filled,
  Warning16Filled,
  Warning20Filled,
} from "@fluentui/react-icons";
import type { Mail } from "@/data/mails";
import type { Strings } from "@/i18n/ui";
import { useStrings } from "@/i18n/useStrings";
import type { AnalysisResult } from "@/lib/analyze";
import type { Verdict } from "@/lib/checks";
import styles from "./outlook.module.css";
import { SolenLogo } from "./SolenLogo";
import { BADGES, level, POINTS_PER_LEVEL, type Reflex, type VigilanceState } from "./vigilance";

const STEP_DELAY_MS = 450;

const stepsFor = (mail: Mail, t: Strings) => [
  t.pane.stepAuth,
  ...(mail.attachments.length ? [t.pane.stepRead(mail.attachments[0].name)] : []),
  t.pane.stepSupplier,
  t.pane.stepAi,
];

const VERDICT_UI: Record<Verdict, { className: string; Icon: typeof ErrorCircle20Filled }> = {
  fraude: { className: styles.verdictFraude, Icon: ErrorCircle20Filled },
  suspect: { className: styles.verdictSuspect, Icon: Warning20Filled },
  fiable: { className: styles.verdictFiable, Icon: CheckmarkCircle20Filled },
};

type Props = {
  mail: Mail;
  result?: AnalysisResult;
  error?: string;
  onClose: () => void;
  vigilance: VigilanceState;
  onReflex: (reflex: Reflex) => void;
  // Un module ne peut rien dessiner hors de son volet : la notification de badge s'affiche ici.
  notice?: string;
};

export const SolenPane = ({ mail, result, error, onClose, vigilance, onReflex, notice }: Props) => {
  const t = useStrings();
  const steps = stepsFor(mail, t);
  const stepCount = steps.length;
  const [shownSteps, setShownSteps] = useState(0);
  const isDone = (reflex: Reflex) => vigilance.done.includes(`${mail.id}:${reflex}`);

  // Rejoue les étapes à chaque mail (le parent remonte ce composant par mail) : la vraie analyse tourne pendant ce temps.
  useEffect(() => {
    const timers = Array.from({ length: stepCount }, (_, i) => setTimeout(() => setShownSteps(i + 1), (i + 1) * STEP_DELAY_MS));
    return () => timers.forEach(clearTimeout);
  }, [stepCount]);

  const done = Boolean(result) && shownSteps >= steps.length;
  // La dernière étape (l'IA) ne se coche qu'à l'arrivée du vrai résultat.
  const checked = result ? shownSteps : Math.min(shownSteps, steps.length - 1);

  return (
    <aside className={styles.addinPane} aria-label="Solen" data-tour="pane" data-mail={mail.id}>
      <header className={styles.addinHeader}>
        <span className={styles.addinTitle}>
          <SolenLogo /> Solen
        </span>
        <span className={styles.addinHeaderActions}>
          <Link href="/fournisseurs" className={styles.paneSuppliersLink}>
            <BuildingMultiple16Regular /> {t.common.suppliers}
          </Link>
          <Tooltip content={t.pane.pinnedTip} relationship="description">
            <Button appearance="subtle" size="small" icon={<Pin20Filled />} aria-label={t.pane.unpin} onClick={onClose} />
          </Tooltip>
          <Tooltip content={t.pane.close} relationship="label">
            <Button appearance="subtle" size="small" icon={<Dismiss20Regular />} onClick={onClose} />
          </Tooltip>
        </span>
      </header>

      <div className={styles.addinBody}>
        {notice && (
          <div className={styles.notice} role="status">
            <ShieldCheckmark16Filled />
            <span>
              <strong>{t.pane.reflexEarned}</strong> {notice}
            </span>
          </div>
        )}
        <VigilanceCard vigilance={vigilance} />

        {!done && !error && (
          <ol className={styles.steps}>
            {steps.map((label, i) => (
              <li key={label} className={i < checked ? styles.stepDone : styles.stepPending}>
                {i < checked ? (
                  <Checkmark16Filled className={styles.stepCheck} />
                ) : i === checked ? (
                  <Spinner size="extra-tiny" />
                ) : (
                  <span className={styles.stepDot} />
                )}
                {label}
              </li>
            ))}
          </ol>
        )}

        {error && <p className={styles.paneError}>{t.pane.error}</p>}

        {done && result && <Verdict result={result} isDone={isDone} onReflex={onReflex} />}
      </div>
    </aside>
  );
};

const VigilanceCard = ({ vigilance }: { vigilance: VigilanceState }) => {
  const t = useStrings();
  const [open, setOpen] = useState(false);
  const stopped = Object.keys(vigilance.protectedAmounts).length;
  const saved = Object.values(vigilance.protectedAmounts).reduce((a, b) => a + b, 0);
  return (
    <section className={styles.vigilance}>
      <button type="button" className={styles.vigilanceHead} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>
          <strong>{t.pane.vigilance}</strong> · {t.pane.level(level(vigilance.points))} · {t.pane.points(vigilance.points)}
        </span>
        <span className={styles.muted}>
          {t.pane.reflexes} {vigilance.badges.length}/{BADGES.length}
        </span>
      </button>
      <div className={styles.progress}>
        <span style={{ transform: `scaleX(${(vigilance.points % POINTS_PER_LEVEL) / POINTS_PER_LEVEL})` }} />
      </div>
      <p className={styles.muted}>
        {stopped === 0
          ? t.pane.vigilanceHint
          : t.pane.stopped(stopped, t.euros(saved))}
      </p>
      {open && (
        <ul className={styles.badges}>
          {BADGES.map((b) => {
            const unlocked = vigilance.badges.includes(b.id);
            return (
              <li key={b.id} className={unlocked ? styles.badgeOn : styles.badgeOff}>
                {unlocked ? <Checkmark16Filled /> : <span className={styles.stepDot} />}
                <span>
                  {t.badges[b.id].label}
                  {!unlocked && <span className={styles.badgeHint}>{t.badges[b.id].hint}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

const Verdict = ({
  result,
  isDone,
  onReflex,
}: {
  result: AnalysisResult;
  isDone: (reflex: Reflex) => boolean;
  onReflex: (reflex: Reflex) => void;
}) => {
  const t = useStrings();
  const ui = VERDICT_UI[result.verdict];
  const alert = result.verdict !== "fiable";
  return (
    <div className={styles.verdictWrap}>
      <section className={`${styles.verdictCard} ${ui.className}`} data-tour="verdict">
        <ui.Icon />
        <div>
          <strong>{t.pane.verdict[result.verdict]}</strong>
          {alert && result.amount !== undefined && <span className={styles.amount}>{t.pane.atStake(t.euros(result.amount))}</span>}
        </div>
      </section>

      <section className={styles.paneSection}>
        <h3>{t.pane.sender}</h3>
        <p className={styles.senderLine}>
          {result.sender.verified ? (
            <span className={styles.badgeVerified}>
              <ShieldCheckmark16Filled /> {t.pane.verified}
            </span>
          ) : (
            <span className={styles.badgeUnverified}>{t.pane.unverified}</span>
          )}
          {result.sender.label}
        </p>
        {result.sender.lookalike && (
          <div className={styles.lookalike}>
            <span className={styles.lookalikeAddress}>
              {result.sender.lookalike.local}@
              {result.sender.lookalike.segments.map((s, i) => (s.odd ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>))}
            </span>
            <span className={styles.muted}>
              {t.pane.imitates} <span className={styles.lookalikeAddress}>{result.sender.lookalike.imitates}</span>
            </span>
          </div>
        )}
      </section>

      {result.demande && (
        <section className={styles.paneSection}>
          <h3>{t.pane.request}</h3>
          <p>{result.demande}</p>
          {result.langue && !/^(fran|french)/i.test(result.langue) && (
            <p className={styles.muted}>{t.pane.otherLanguage(result.langue)}</p>
          )}
        </section>
      )}

      {result.reasons.length > 0 && (
        <section className={styles.paneSection}>
          <h3>{alert ? t.pane.why : t.pane.checked}</h3>
          <ul className={styles.reasons}>
            {result.reasons.map((r) => (
              <li key={r.text}>
                {r.severity === "fiable" ? (
                  <Checkmark16Filled className={styles.okIcon} />
                ) : r.severity === "fraude" ? (
                  <Warning16Filled className={styles.badIcon} />
                ) : (
                  <Info16Regular className={styles.warnIcon} />
                )}
                <span>
                  {r.text} <span className={styles.provenance}>{r.source === "code" ? t.pane.sourceCode : t.pane.sourceAi}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.techniques.length > 0 && (
        <section className={styles.paneSection}>
          <h3>{t.pane.techniques}</h3>
          <div className={styles.tags}>
            {result.techniques.map((t) => (
              <span key={t} className={styles.tag}>
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Section d'appel toujours présente : l'IA peut juger fiable un mail frauduleux. */}
      {alert ? (
        <section className={styles.paneSection} data-tour="callback">
          <h3>{t.pane.whatToDo}</h3>
          <p>
            {result.amount !== undefined ? t.pane.dontPay : t.pane.dontClick} {t.pane.call} <strong>{result.callback.who}</strong>{" "}
            {t.pane.at} <strong className={styles.phone}>{result.callback.phone}</strong> {t.pane.knownNumber}
          </p>
          <CallbackQuestions questions={result.callback.questions} />
          <div className={styles.paneActions}>
            <Button appearance="primary" icon={<Call20Regular />} onClick={() => onReflex("contre-appel")} disabled={isDone("contre-appel")}>
              {isDone("contre-appel") ? t.pane.callDone : t.pane.callAction}
            </Button>
            <Button icon={<PersonAlert20Regular />} onClick={() => onReflex("daf")} disabled={isDone("daf")}>
              {isDone("daf") ? t.pane.cfoDone : t.pane.cfoAction}
            </Button>
          </div>
          {isDone("daf") && <p className={styles.muted}>{t.pane.cfoSent}</p>}
        </section>
      ) : (
        <section className={`${styles.paneSection} ${styles.doubt}`} data-tour="callback">
          <h3>{t.pane.doubt}</h3>
          <p className={styles.muted}>{t.pane.nothingFound}</p>
          <p className={styles.doubtNumber}>
            {t.pane.registeredNumber} <strong>{result.callback.who}</strong>, <span className={styles.phone}>{result.callback.phone}</span>
          </p>
          <CallbackQuestions questions={result.callback.questions} />
          <div className={styles.paneActions}>
            <Button size="small" icon={<Call20Regular />} onClick={() => onReflex("contre-appel")} disabled={isDone("contre-appel")}>
              {isDone("contre-appel") ? t.pane.callDone : t.pane.callAction}
            </Button>
            <Button size="small" icon={<Flag20Regular />} onClick={() => onReflex("signalement")} disabled={isDone("signalement")}>
              {isDone("signalement") ? t.pane.reportDone : t.pane.reportAction}
            </Button>
          </div>
          {isDone("signalement") && (
            <p className={styles.muted}>{t.pane.reportThanks}</p>
          )}
        </section>
      )}

      <footer className={styles.paneFooter}>
        {t.pane.footer} <Link href="/fournisseurs">{t.common.suppliers}</Link>
      </footer>
    </div>
  );
};

const CallbackQuestions = ({ questions }: { questions: string[] }) => {
  const t = useStrings();
  return questions.length > 0 ? (
    <details className={styles.questionsBox}>
      <summary>{t.pane.questions(questions.length)}</summary>
      <ol className={styles.questions}>
        {questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>
    </details>
  ) : null;
};
