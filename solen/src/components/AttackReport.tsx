"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, FluentProvider, Spinner, webLightTheme } from "@fluentui/react-components";
import { ArrowClockwise20Regular, CheckmarkCircle20Filled, ChevronDown16Regular, DismissCircle20Filled } from "@fluentui/react-icons";
import type { Verdict } from "@/lib/checks";
import { useLang } from "@/i18n/lang";
import { translateFinding, translateInfobar } from "@/i18n/result";
import { useStrings } from "@/i18n/useStrings";
import { CASE_TITLES_EN } from "@/redteam/cases.en";
import { LangSwitch } from "./LangSwitch";
import { SolenLogo } from "./SolenLogo";
import portal from "./portal.module.css";
import styles from "./attacks.module.css";

export type AttackRow = {
  id: string;
  family: string;
  attack: string;
  expected: Verdict;
  obtained: Verdict;
  stopped: boolean;
  decisive?: string;
  infobar: string;
  mail: { from: string; subject: string; body: string; attachments: string[] };
};

type Props = { companyName: string; rows: AttackRow[] | null; durationMs?: number; ranAt?: string };

const GENUINE = "Fausse alerte";
const VERDICT_CLASS: Record<Verdict, string> = { fiable: styles.vFiable, suspect: styles.vSuspect, fraude: styles.vFraude };
// Délai entre deux lignes révélées : assez lent pour voir les coches tomber, assez rapide pour ne pas faire attendre.
const REVEAL_MS = 70;

const VerdictBadge = ({ verdict }: { verdict: Verdict }) => {
  const t = useStrings();
  return <span className={`${styles.verdict} ${VERDICT_CLASS[verdict]}`}>{t.attacks.verdict[verdict]}</span>;
};

// Révèle les lignes une à une après chaque rejeu. Mouvement réduit : tout s'affiche d'un coup.
const useReveal = (count: number, runKey: string | undefined) => {
  const [progress, setProgress] = useState<{ key?: string; shown: number }>({ shown: 0 });
  useEffect(() => {
    if (!runKey) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let shown = 0;
    const timer = setInterval(
      () => {
        shown = reduce ? count : shown + 1;
        setProgress({ key: runKey, shown });
        if (shown >= count) clearInterval(timer);
      },
      reduce ? 0 : REVEAL_MS,
    );
    return () => clearInterval(timer);
  }, [count, runKey]);
  // Un nouveau rejeu repart de zéro tant que l'animation n'a pas commencé.
  return progress.key === runKey ? progress.shown : 0;
};

export const AttackReport = ({ companyName, rows, durationMs, ranAt }: Props) => {
  const router = useRouter();
  const lang = useLang();
  const t = useStrings();
  const familyLabel = (f: string) => t.attacks.families[f] ?? f;
  // En anglais : titre, règle et bandeau traduits ; le mail piégé reste dans sa langue d'origine.
  const attackTitle = (row: AttackRow) => (lang === "en" ? (CASE_TITLES_EN[row.id] ?? row.attack) : row.attack);
  const ruleText = (text: string) => (lang === "en" ? (translateFinding(text) ?? text) : text);
  const infobarText = (text: string) => (lang === "en" ? (translateInfobar(text) ?? text) : text);
  const [replaying, startReplay] = useTransition();
  const [family, setFamily] = useState<string | null>(null);
  const all = useMemo(() => rows ?? [], [rows]);
  const revealed = useReveal(all.length, ranAt);
  const done = rows !== null && revealed >= all.length && !replaying;

  const attacks = all.filter((r) => r.family !== GENUINE);
  const genuine = all.filter((r) => r.family === GENUINE);
  const stopped = attacks.filter((r) => r.stopped).length;
  const falseAlarms = genuine.filter((r) => !r.stopped).length;

  const families = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of all) counts.set(r.family, (counts.get(r.family) ?? 0) + 1);
    return [...counts];
  }, [all]);
  const visible = all.map((row, index) => ({ row, index })).filter(({ row }) => !family || row.family === family);
  const time = ranAt ? new Date(ranAt).toLocaleTimeString(t.locale) : "";

  return (
    // Classe sur un conteneur intérieur : Fluent recopie la classe du fournisseur sur ses couches flottantes
    // (info-bulles), qui couvriraient alors tout l'écran.
    <FluentProvider theme={webLightTheme}>
      <div className={portal.root}>
      <header className={portal.header}>
        <span className={portal.brand}>
          <SolenLogo /> Solen
        </span>
        <span className={portal.company}>
          {companyName} · {t.attacks.company}
        </span>
        <span className={portal.headerEnd}>
          <LangSwitch />
        </span>
      </header>
      <main className={portal.main}>
        <Link href="/" className={portal.backLink}>
          <span aria-hidden="true">←</span> {t.common.backToMailbox}
        </Link>

        <div className={portal.titleRow}>
          <div>
            <h1>{t.attacks.title(all.length || 28)}</h1>
            <p className={styles.lead}>
              {t.attacks.leadStart}
              <strong>{t.attacks.leadFooled}</strong>
              {t.attacks.leadEnd}
            </p>
          </div>
          <Button
            icon={<ArrowClockwise20Regular />}
            disabled={rows === null || replaying}
            onClick={() => startReplay(() => router.refresh())}
          >
            {replaying ? t.attacks.replaying : t.attacks.replay}
          </Button>
        </div>

        <section className={styles.summary} aria-live="polite">
          <div className={styles.stat}>
            <span className={styles.statValue}>{done ? `${stopped}/${attacks.length}` : "…"}</span>
            <span className={styles.statLabel}>{t.attacks.stopped}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{done ? falseAlarms : "…"}</span>
            <span className={styles.statLabel}>{t.attacks.falseAlarms(genuine.length || 2)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{done && durationMs ? `${durationMs} ms` : "…"}</span>
            <span className={styles.statLabel}>{done ? t.attacks.duration(time) : t.attacks.running}</span>
          </div>
        </section>

        <div className={styles.filters} role="group" aria-label={t.attacks.filter}>
          <button type="button" className={family === null ? styles.chipOn : styles.chip} onClick={() => setFamily(null)}>
            {t.attacks.all} <span>{all.length}</span>
          </button>
          {families.map(([f, n]) => (
            <button
              key={f}
              type="button"
              className={family === f ? styles.chipOn : styles.chip}
              onClick={() => setFamily(family === f ? null : f)}
            >
              {familyLabel(f)} <span>{n}</span>
            </button>
          ))}
        </div>

        {rows === null ? (
          <div className={styles.loading}>
            <Spinner size="small" /> {t.attacks.loading}
          </div>
        ) : (
          <ol className={styles.list}>
            {visible.map(({ row, index }) => {
              const pending = index >= revealed || replaying;
              return (
                <li key={row.id} className={styles.item}>
                  <details>
                    <summary className={styles.row}>
                      <span className={styles.status}>
                        {pending ? (
                          <Spinner size="tiny" aria-label={t.attacks.pending} />
                        ) : row.stopped ? (
                          <CheckmarkCircle20Filled className={styles.ok} aria-label={t.attacks.passed} />
                        ) : (
                          <DismissCircle20Filled className={styles.ko} aria-label={t.attacks.failed} />
                        )}
                      </span>
                      <span className={styles.text}>
                        <span className={styles.family}>{familyLabel(row.family)}</span>
                        <span className={styles.attack}>{attackTitle(row)}</span>
                        {!pending && row.decisive && (
                          <span className={styles.rule}>
                            {t.attacks.rule} {ruleText(row.decisive)}
                          </span>
                        )}
                        {!pending && !row.decisive && row.family === GENUINE && (
                          <span className={styles.rule}>{t.attacks.noAlert}</span>
                        )}
                      </span>
                      <span className={styles.verdicts}>
                        <span className={styles.verdictLine}>
                          <span className={styles.verdictCaption}>{t.attacks.expected}</span>
                          <VerdictBadge verdict={row.expected} />
                        </span>
                        <span className={styles.verdictLine}>
                          <span className={styles.verdictCaption}>{t.attacks.obtained}</span>
                          {pending ? <span className={styles.verdictPending}>…</span> : <VerdictBadge verdict={row.obtained} />}
                        </span>
                      </span>
                      <ChevronDown16Regular className={styles.chevron} aria-hidden="true" />
                    </summary>
                    <div className={styles.detail}>
                      <p className={styles.detailTitle}>{t.attacks.userSees}</p>
                      <p className={`${styles.infobar} ${VERDICT_CLASS[row.obtained]}`}>{infobarText(row.infobar)}</p>
                      <p className={styles.detailTitle}>{t.attacks.trappedMail}</p>
                      {t.attacks.mailNote && <p className={styles.mailNote}>{t.attacks.mailNote}</p>}
                      <dl className={styles.mail}>
                        <dt>{t.attacks.from}</dt>
                        <dd>{row.mail.from}</dd>
                        <dt>{t.attacks.subject}</dt>
                        <dd>{row.mail.subject}</dd>
                        {row.mail.attachments.length > 0 && (
                          <>
                            <dt>{t.attacks.attachments}</dt>
                            <dd>{row.mail.attachments.join(", ")}</dd>
                          </>
                        )}
                      </dl>
                      <pre className={styles.body}>{row.mail.body}</pre>
                    </div>
                  </details>
                </li>
              );
            })}
          </ol>
        )}

        <p className={styles.footnote}>{t.attacks.footnote}</p>
      </main>
      </div>
    </FluentProvider>
  );
};
