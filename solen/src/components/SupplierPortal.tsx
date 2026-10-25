"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, FluentProvider, webLightTheme } from "@fluentui/react-components";
import { ArrowSync20Regular, Shield20Filled, ShieldCheckmark16Filled } from "@fluentui/react-icons";
import { PendingChange, type Approvers, type PendingChangeData } from "./PendingChange";
import styles from "./portal.module.css";

export type SupplierRow = {
  id: string;
  name: string;
  domain: string;
  maskedIban: string;
  phone: string;
  usualAmount: string;
  trust: "confirmé" | "nouveau";
  learnedFrom: string;
};

type Props = {
  companyName: string;
  rows: SupplierRow[];
  pendingChange: PendingChangeData;
  approvers: Approvers;
};

export const SupplierPortal = ({ companyName, rows: initialRows, pendingChange, approvers }: Props) => {
  const [rows, setRows] = useState(initialRows);
  // Démo : la synchronisation avec le logiciel comptable est simulée (V2).
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const sync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    }, 1200);
  };

  // Après les deux validations, le profil prend le nouvel IBAN, qui repart de zéro paiement.
  const onApproved = (supplierId: string, maskedIban: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === supplierId ? { ...r, maskedIban, trust: "nouveau", learnedFrom: "Validé par 2 personnes aujourd'hui, 0 paiement" } : r,
      ),
    );

  return (
    <FluentProvider theme={webLightTheme} className={styles.root}>
      <header className={styles.header}>
        <span className={styles.brand}>
          <Shield20Filled /> Solen
        </span>
        <span className={styles.company}>{companyName} · Espace entreprise</span>
      </header>
      <main className={styles.main}>
        <Link href="/" className={styles.backLink}>
          <span aria-hidden="true">←</span> Retour à la boîte mail
        </Link>
        <div className={styles.titleRow}>
          <div>
            <h1>Profils fournisseurs</h1>
            <p>Appris à partir des paiements déjà enregistrés dans votre logiciel comptable.</p>
          </div>
          <div className={styles.sync}>
            <Button icon={<ArrowSync20Regular />} onClick={sync} disabled={syncing}>
              {syncing ? "Synchronisation…" : "Synchroniser avec le logiciel comptable"}
            </Button>
            {syncedAt && <span>Synchronisé à {syncedAt}</span>}
          </div>
        </div>
        <PendingChange change={pendingChange} approvers={approvers} onApproved={onApproved} />
        <div className={styles.tableBox}>
          <table>
            <thead>
              <tr>
                <th>Fournisseur</th>
                <th>Domaine</th>
                <th>IBAN de référence</th>
                <th>Téléphone</th>
                <th>Montant habituel</th>
                <th>Confiance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={styles.name}>{r.name}</td>
                  <td className={styles.mono}>{r.domain}</td>
                  <td className={styles.mono}>{r.maskedIban}</td>
                  <td className={styles.mono}>{r.phone}</td>
                  <td>{r.usualAmount}</td>
                  <td>
                    <span className={r.trust === "confirmé" ? styles.trustOk : styles.trustNew}>
                      {r.trust === "confirmé" && <ShieldCheckmark16Filled />}
                      {r.trust === "confirmé" ? "Confirmé" : "Nouveau"}
                    </span>
                    <span className={styles.learned}>{r.learnedFrom}</span>
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
