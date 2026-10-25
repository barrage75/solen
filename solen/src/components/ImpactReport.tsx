"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { CheckmarkCircle16Filled, ErrorCircle16Filled, Warning16Filled } from "@fluentui/react-icons";
import type { Verdict } from "@/lib/checks";
import type { Impact, ImpactMail } from "@/impact/compute";
import { SolenLogo } from "./SolenLogo";
import portal from "./portal.module.css";
import styles from "./impact.module.css";

export type RedTeamSummary = { stopped: number; attacks: number; falseAlarms: number; genuine: number };

type Props = { companyName: string; impact: Impact; redTeam: RedTeamSummary };

const euros = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;

// Sources vérifiées le 25 octobre 2026 sur les documents d'origine.
const FBI = {
  url: "https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf",
  source: "FBI, Internet Crime Report 2025, page 26",
  // Pertes déclarées pour la compromission de messagerie d'entreprise (BEC), en dollars.
  years: [
    { year: "2023", value: 2_946_830_270 },
    { year: "2024", value: 2_770_151_146 },
    { year: "2025", value: 3_046_598_558 },
  ],
};
const ALLIANZ = {
  url: "https://www.allianz-trade.fr/actualites/etude-fraude-2026.html",
  source: "Allianz Trade et Odoxa, étude fraude publiée le 16 juin 2026 (315 dirigeants et directeurs financiers en France)",
  figures: [
    { value: "85 %", label: "des ETI et grandes entreprises ont subi au moins une tentative de fraude l'an dernier" },
    { value: "60 %", label: "des PME ont subi au moins une tentative de fraude l'an dernier" },
    { value: "40 %", label: "des entreprises concernées : au moins une tentative a abouti à une fraude avérée" },
    { value: "88 %", label: "des fraudes externes sont menées par des tiers qui usurpent une identité" },
  ],
};

const billions = (n: number) => `${(n / 1e9).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Md$`;

const VERDICT_UI: Record<Verdict, { label: string; className: string; Icon: typeof CheckmarkCircle16Filled }> = {
  fraude: { label: "Fraude probable", className: styles.vFraude, Icon: ErrorCircle16Filled },
  suspect: { label: "Inhabituel", className: styles.vSuspect, Icon: Warning16Filled },
  fiable: { label: "Aucune alerte", className: styles.vFiable, Icon: CheckmarkCircle16Filled },
};

// Le statut porte toujours une icône et un libellé : jamais la couleur seule.
const VerdictBadge = ({ verdict }: { verdict: Verdict }) => {
  const ui = VERDICT_UI[verdict];
  return (
    <span className={`${styles.badge} ${ui.className}`}>
      <ui.Icon aria-hidden="true" /> {ui.label}
    </span>
  );
};

type Tip = { x: number; y: number; value: string; label: string; detail?: string };

// Infobulle partagée : au survol comme au focus clavier, positionnée dans le cadre du graphique.
const useTooltip = () => {
  const frame = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const place = (target: Element, clientX: number | null, content: Omit<Tip, "x" | "y">) => {
    const box = frame.current?.getBoundingClientRect();
    const mark = target.getBoundingClientRect();
    if (!box) return;
    const x = (clientX ?? mark.left + mark.width / 2) - box.left;
    setTip({ ...content, x: Math.min(Math.max(x, 90), box.width - 90), y: mark.top - box.top });
  };
  const bind = (content: Omit<Tip, "x" | "y">) => ({
    tabIndex: 0,
    onPointerMove: (e: React.PointerEvent) => place(e.currentTarget, e.clientX, content),
    onFocus: (e: React.FocusEvent) => place(e.currentTarget, null, content),
    onPointerLeave: () => setTip(null),
    onBlur: () => setTip(null),
  });
  const layer = tip && (
    <div className={styles.tooltip} style={{ left: tip.x, top: tip.y }} role="status">
      <strong>{tip.value}</strong>
      <span>{tip.label}</span>
      {tip.detail && <span className={styles.tipDetail}>{tip.detail}</span>}
    </div>
  );
  return { frame, bind, layer };
};

const DataTable = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <details className={styles.dataView}>
    <summary>Voir les données en tableau</summary>
    <table>
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </details>
);

// Barres horizontales : une seule série, valeur à la pointe, une marge à droite pour que l'étiquette tienne toujours.
const AmountsChart = ({ mails }: { mails: ImpactMail[] }) => {
  const { frame, bind, layer } = useTooltip();
  const rows = mails.filter((m) => m.amount !== undefined).sort((a, b) => b.amount! - a.amount!);
  const max = Math.max(...rows.map((m) => m.amount!)) * 1.25;
  return (
    <>
      <div className={styles.chartFrame} ref={frame}>
        <ul className={styles.hbars}>
          {rows.map((m) => (
            <li
              key={m.id}
              className={styles.hbarRow}
              aria-label={`${m.label} : ${euros(m.amount!)}`}
              {...bind({ value: euros(m.amount!), label: m.label, detail: m.decisive })}
            >
              <span className={styles.hbarLabel}>{m.label}</span>
              <span className={styles.hbarTrack}>
                <span className={styles.hbar} style={{ width: `${(m.amount! / max) * 100}%` }} />
                <span className={styles.hbarValue}>{euros(m.amount!)}</span>
              </span>
            </li>
          ))}
        </ul>
        {layer}
      </div>
      <DataTable
        head={["Mail", "Montant en jeu", "Constat du code"]}
        rows={rows.map((m) => [m.label, euros(m.amount!), m.decisive ?? ""])}
      />
    </>
  );
};

// Colonnes : trois années d'une même mesure, échelle depuis zéro, valeur sur le chapeau.
const FbiChart = () => {
  const { frame, bind, layer } = useTooltip();
  const max = 4e9;
  const ticks = [0, 1e9, 2e9, 3e9, 4e9];
  return (
    <>
      <div className={styles.chartFrame} ref={frame}>
        <div className={styles.columns}>
          <div className={styles.grid} aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} style={{ bottom: `${(t / max) * 100}%` }}>
                {t === 0 ? "0" : `${t / 1e9} Md$`}
              </span>
            ))}
          </div>
          {FBI.years.map((y) => (
            <div
              key={y.year}
              className={styles.column}
              aria-label={`${y.year} : ${billions(y.value)}`}
              {...bind({ value: billions(y.value), label: `Pertes déclarées en ${y.year}` })}
            >
              <span className={styles.columnValue} style={{ bottom: `${(y.value / max) * 100}%` }}>
                {billions(y.value)}
              </span>
              <span className={styles.columnBar} style={{ height: `${(y.value / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className={styles.columnAxis} aria-hidden="true">
          {FBI.years.map((y) => (
            <span key={y.year}>{y.year}</span>
          ))}
        </div>
        {layer}
      </div>
      <DataTable
        head={["Année", "Pertes déclarées (dollars)"]}
        rows={FBI.years.map((y) => [y.year, `${y.value.toLocaleString("fr-FR")} $`])}
      />
    </>
  );
};

export const ImpactReport = ({ companyName, impact, redTeam }: Props) => {
  const raisedByAi = impact.mails.filter((m) => m.withAi === "fraude" && m.codeOnly === "suspect").length;
  return (
    // Classe sur un conteneur intérieur : Fluent recopie la classe du fournisseur sur ses couches flottantes.
    <FluentProvider theme={webLightTheme}>
      <div className={portal.root}>
        <header className={portal.header}>
          <span className={portal.brand}>
            <SolenLogo /> Solen
          </span>
          <span className={portal.company}>{companyName} · Impact</span>
        </header>
        <main className={`${portal.main} ${styles.main}`}>
          <Link href="/" className={portal.backLink}>
            <span aria-hidden="true">←</span> Retour à la boîte mail
          </Link>

          <div className={portal.titleRow}>
            <div>
              <h1>L&apos;impact de Solen, en chiffres</h1>
              <p className={styles.lead}>
                Les chiffres de la démo sont calculés en direct par le code de Solen, à chaque ouverture de la page. Les
                chiffres du marché viennent des sources citées sous chaque graphique.
              </p>
            </div>
          </div>

          <section className={styles.hero}>
            <span className={styles.heroValue}>{euros(impact.blockedAmount)}</span>
            <span className={styles.heroLabel}>de virements frauduleux bloqués dans la boîte de démonstration</span>
            <span className={styles.heroSub}>
              {impact.blockedPayments} demandes de paiement piégées, toutes signalées avant le paiement, avec le numéro à
              rappeler.
            </span>
          </section>

          <section className={styles.kpis} aria-label="Indicateurs clés">
            <div className={styles.kpi}>
              <span className={styles.kpiValue}>
                {impact.fraudsFlagged}/{impact.frauds}
              </span>
              <span className={styles.kpiLabel}>fraudes de la démo signalées</span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiValue}>{impact.falseAlarms}</span>
              <span className={styles.kpiLabel}>fausse alerte sur {impact.genuine} vrais mails</span>
            </div>
            <Link href="/attaques" className={`${styles.kpi} ${styles.kpiLink}`}>
              <span className={styles.kpiValue}>
                {redTeam.stopped}/{redTeam.attacks}
              </span>
              <span className={styles.kpiLabel}>attaques piégées arrêtées par le code seul →</span>
            </Link>
            <div className={styles.kpi}>
              <span className={styles.kpiValue}>
                {impact.codeMsPerMail < 1 ? "< 1" : Math.round(impact.codeMsPerMail)} ms
              </span>
              <span className={styles.kpiLabel}>de contrôles du code par mail, mesurés sur ce serveur</span>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Montant en jeu par fraude bloquée</h2>
            <p className={styles.cardSub}>En euros, pour chaque demande de paiement piégée de la démo.</p>
            <AmountsChart mails={impact.mails.filter((m) => m.truth === "fraude")} />
          </section>

          <section className={styles.card}>
            <h2>Le code décide, même quand l&apos;IA est trompée</h2>
            <p className={styles.cardSub}>
              Avec une IA piégée qui répond toujours « fiable », le code signale encore {impact.fraudsFlaggedByCodeOnly} fraudes
              sur {impact.frauds}. L&apos;IA ne peut qu&apos;aggraver un verdict : ici, elle en fait passer {raisedByAi} de
              « inhabituel » à « fraude probable ».
            </p>
            <div className={styles.tableBox}>
              <table className={styles.matrix}>
                <thead>
                  <tr>
                    <th>Mail de la démo</th>
                    <th>En réalité</th>
                    <th>Code seul, IA trompée</th>
                    <th>Code et IA</th>
                  </tr>
                </thead>
                <tbody>
                  {impact.mails.map((m) => (
                    <tr key={m.id}>
                      <td className={styles.mailCell}>{m.label}</td>
                      <td data-label="En réalité">{m.truth === "fraude" ? "Fraude" : "Vrai mail"}</td>
                      <td data-label="Code seul, IA trompée">
                        <VerdictBadge verdict={m.codeOnly} />
                      </td>
                      <td data-label="Code et IA">
                        <VerdictBadge verdict={m.withAi} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <h2 className={styles.sectionTitle}>Pourquoi c&apos;est important</h2>
          <div className={styles.context}>
            <section className={styles.card}>
              <h2>Aux États-Unis, plus de 3 milliards de dollars perdus en 2025</h2>
              <p className={styles.cardSub}>
                Pertes déclarées au FBI pour la compromission de messagerie d&apos;entreprise : faux fournisseurs, faux
                dirigeants, changements de RIB.
              </p>
              <FbiChart />
              <p className={styles.source}>
                Source :{" "}
                <a href={FBI.url} target="_blank" rel="noreferrer">
                  {FBI.source}
                </a>
              </p>
            </section>
            <section className={styles.card}>
              <h2>En France, la fraude touche la majorité des entreprises</h2>
              <ul className={styles.facts}>
                {ALLIANZ.figures.map((f) => (
                  <li key={f.value + f.label}>
                    <span className={styles.factValue}>{f.value}</span>
                    <span className={styles.factLabel}>{f.label}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.source}>
                Source :{" "}
                <a href={ALLIANZ.url} target="_blank" rel="noreferrer">
                  {ALLIANZ.source}
                </a>
              </p>
            </section>
          </div>

          <p className={styles.footnote}>
            Méthode : la démo contient {impact.mails.length} mails fictifs, dont {impact.frauds} frauduleux par construction, et
            les tests rejouent {redTeam.attacks + redTeam.genuine} mails piégés ou légitimes. Ces chiffres montrent que la
            logique fonctionne sur des cas choisis. Ils ne mesurent pas un taux de détection en conditions réelles.
          </p>
        </main>
      </div>
    </FluentProvider>
  );
};
