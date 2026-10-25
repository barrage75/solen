"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, FluentProvider, Spinner, webLightTheme } from "@fluentui/react-components";
import { ArrowClockwise20Regular, CheckmarkCircle20Filled, ChevronDown16Regular, DismissCircle20Filled } from "@fluentui/react-icons";
import type { Verdict } from "@/lib/checks";
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
const VERDICT_LABEL: Record<Verdict, string> = { fiable: "Fiable", suspect: "Suspect", fraude: "Fraude" };
const VERDICT_CLASS: Record<Verdict, string> = { fiable: styles.vFiable, suspect: styles.vSuspect, fraude: styles.vFraude };
// Délai entre deux lignes révélées : assez lent pour voir les coches tomber, assez rapide pour ne pas faire attendre.
const REVEAL_MS = 70;

const familyLabel = (family: string) => (family === GENUINE ? "Vrai mail" : family);

const VerdictBadge = ({ verdict }: { verdict: Verdict }) => (
  <span className={`${styles.verdict} ${VERDICT_CLASS[verdict]}`}>{VERDICT_LABEL[verdict]}</span>
);

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
  const time = ranAt ? new Date(ranAt).toLocaleTimeString("fr-FR") : "";

  return (
    <FluentProvider theme={webLightTheme} className={portal.root}>
      <header className={portal.header}>
        <span className={portal.brand}>
          <SolenLogo /> Solen
        </span>
        <span className={portal.company}>{companyName} · Tests de sécurité</span>
      </header>
      <main className={portal.main}>
        <Link href="/" className={portal.backLink}>
          <span aria-hidden="true">←</span> Retour à la boîte mail
        </Link>

        <div className={portal.titleRow}>
          <div>
            <h1>{all.length || 28} mails piégés, rejoués en direct</h1>
            <p className={styles.lead}>
              À chaque ouverture de cette page, le serveur rejoue tous les cas avec une <strong>IA piégée</strong> qui répond
              toujours « fiable ». Une attaque compte comme arrêtée seulement si le code seul la bloque, avec la règle prévue.
            </p>
          </div>
          <Button
            icon={<ArrowClockwise20Regular />}
            disabled={rows === null || replaying}
            onClick={() => startReplay(() => router.refresh())}
          >
            {replaying ? "Rejeu en cours…" : "Rejouer les attaques"}
          </Button>
        </div>

        <section className={styles.summary} aria-live="polite">
          <div className={styles.stat}>
            <span className={styles.statValue}>{done ? `${stopped}/${attacks.length}` : "…"}</span>
            <span className={styles.statLabel}>attaques arrêtées par le code</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{done ? falseAlarms : "…"}</span>
            <span className={styles.statLabel}>fausse alerte sur {genuine.length || 2} vrais mails</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{done && durationMs ? `${durationMs} ms` : "…"}</span>
            <span className={styles.statLabel}>{done ? `pour tout rejouer, à ${time}` : "rejeu en cours sur le serveur"}</span>
          </div>
        </section>

        <div className={styles.filters} role="group" aria-label="Filtrer par famille">
          <button type="button" className={family === null ? styles.chipOn : styles.chip} onClick={() => setFamily(null)}>
            Tous <span>{all.length}</span>
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
            <Spinner size="small" /> Le serveur rejoue les mails piégés…
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
                          <Spinner size="tiny" aria-label="En cours" />
                        ) : row.stopped ? (
                          <CheckmarkCircle20Filled className={styles.ok} aria-label="Réussi" />
                        ) : (
                          <DismissCircle20Filled className={styles.ko} aria-label="Échec" />
                        )}
                      </span>
                      <span className={styles.text}>
                        <span className={styles.family}>{familyLabel(row.family)}</span>
                        <span className={styles.attack}>{row.attack}</span>
                        {!pending && row.decisive && <span className={styles.rule}>Règle : {row.decisive}</span>}
                        {!pending && !row.decisive && row.family === GENUINE && (
                          <span className={styles.rule}>Aucune alerte : c&apos;est le résultat attendu.</span>
                        )}
                      </span>
                      <span className={styles.verdicts}>
                        <span className={styles.verdictLine}>
                          <span className={styles.verdictCaption}>Attendu</span>
                          <VerdictBadge verdict={row.expected} />
                        </span>
                        <span className={styles.verdictLine}>
                          <span className={styles.verdictCaption}>Obtenu</span>
                          {pending ? <span className={styles.verdictPending}>…</span> : <VerdictBadge verdict={row.obtained} />}
                        </span>
                      </span>
                      <ChevronDown16Regular className={styles.chevron} aria-hidden="true" />
                    </summary>
                    <div className={styles.detail}>
                      <p className={styles.detailTitle}>Ce que voit l&apos;utilisateur</p>
                      <p className={`${styles.infobar} ${VERDICT_CLASS[row.obtained]}`}>{row.infobar}</p>
                      <p className={styles.detailTitle}>Le mail piégé</p>
                      <dl className={styles.mail}>
                        <dt>De</dt>
                        <dd>{row.mail.from}</dd>
                        <dt>Objet</dt>
                        <dd>{row.mail.subject}</dd>
                        {row.mail.attachments.length > 0 && (
                          <>
                            <dt>Pièces jointes</dt>
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

        <p className={styles.footnote}>
          Les mêmes vérifications tournent dans les tests automatiques à chaque push, dans le fichier
          src/redteam/redteam.test.ts. Toutes les données sont fictives.
        </p>
      </main>
    </FluentProvider>
  );
};
