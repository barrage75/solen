"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, FluentProvider, webLightTheme } from "@fluentui/react-components";
import { ArrowSync20Regular, ShieldCheckmark16Filled } from "@fluentui/react-icons";
import { useStrings } from "@/i18n/useStrings";
import { LangSwitch } from "./LangSwitch";
import { SolenLogo } from "./SolenLogo";
import styles from "./portal.module.css";

export type SupplierRow = {
  id: string;
  name: string;
  domain: string;
  maskedIban: string;
  phone: string;
  usualMin: number;
  usualMax: number;
  trust: "confirmé" | "nouveau";
  payments: number;
  since: string;
};

export const SupplierPortal = ({ companyName, rows }: { companyName: string; rows: SupplierRow[] }) => {
  const t = useStrings();
  // Démo : la synchronisation avec le logiciel comptable est simulée (V2).
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const sync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncedAt(new Date().toLocaleTimeString(t.locale, { hour: "2-digit", minute: "2-digit" }));
    }, 1200);
  };

  return (
    <FluentProvider theme={webLightTheme} className={styles.root}>
      <header className={styles.header}>
        <span className={styles.brand}>
          <SolenLogo /> Solen
        </span>
        <span className={styles.company}>
          {companyName} · {t.suppliers.company}
        </span>
        <span className={styles.headerEnd}>
          <LangSwitch />
        </span>
      </header>
      <main className={styles.main}>
        <Link href="/" className={styles.backLink}>
          <span aria-hidden="true">←</span> {t.common.backToMailbox}
        </Link>
        <div className={styles.titleRow}>
          <div>
            <h1>{t.suppliers.title}</h1>
            <p>{t.suppliers.intro}</p>
          </div>
          <div className={styles.sync}>
            <Button icon={<ArrowSync20Regular />} onClick={sync} disabled={syncing}>
              {syncing ? t.suppliers.syncing : t.suppliers.sync}
            </Button>
            {syncedAt && <span>{t.suppliers.syncedAt(syncedAt)}</span>}
          </div>
        </div>
        <div className={styles.tableBox}>
          <table>
            <thead>
              <tr>
                {t.suppliers.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={styles.name}>{r.name}</td>
                  <td className={styles.mono}>{r.domain}</td>
                  <td className={styles.mono}>{r.maskedIban}</td>
                  <td className={styles.mono}>{r.phone}</td>
                  <td>{t.suppliers.usualAmount(t.euros(r.usualMin), t.euros(r.usualMax))}</td>
                  <td>
                    <span className={r.trust === "confirmé" ? styles.trustOk : styles.trustNew}>
                      {r.trust === "confirmé" && <ShieldCheckmark16Filled />}
                      {r.trust === "confirmé" ? t.suppliers.confirmed : t.suppliers.newTrust}
                    </span>
                    <span className={styles.learned}>{t.suppliers.learnedFrom(r.payments, r.since)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </FluentProvider>
  );
};
