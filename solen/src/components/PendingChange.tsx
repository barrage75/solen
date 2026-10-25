"use client";

import { useState } from "react";
import { Button } from "@fluentui/react-components";
import { Call20Regular, Checkmark20Regular, Dismiss20Regular, LockClosed16Regular } from "@fluentui/react-icons";
import styles from "./portal.module.css";

export type PendingChangeData = {
  supplierId: string;
  supplierName: string;
  fromEmail: string;
  // Heure de réception du mail, au format HH:MM:SS.
  receivedAt: string;
  attachment: string;
  currentMaskedIban: string;
  newMaskedIban: string;
  phone: string;
};

export type Approvers = { accountant: string; daf: string };

type Status = "attente" | "une-validation" | "valide" | "rejete";

type LogEntry = { time: string; who: string; text: string };

const STATUS_LABEL: Record<Status, string> = {
  attente: "En attente : profil inchangé",
  "une-validation": "1 validation sur 2 : en attente du DAF",
  valide: "Validé par 2 personnes : profil mis à jour",
  rejete: "Rejeté : profil inchangé",
};

const now = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

// Démo : tout est simulé et gardé en mémoire. En vrai, chaque personne valide depuis son propre compte.
export const PendingChange = ({
  change,
  approvers,
  onApproved,
}: {
  change: PendingChangeData;
  approvers: Approvers;
  onApproved: (supplierId: string, maskedIban: string) => void;
}) => {
  const accountant = `${approvers.accountant} (comptable)`;
  const daf = `${approvers.daf} (DAF)`;
  const [status, setStatus] = useState<Status>("attente");
  const [called, setCalled] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([
    {
      time: change.receivedAt,
      who: "Solen",
      text: `Demande reçue par mail de ${change.fromEmail} : changement mis en attente, profil inchangé.`,
    },
  ]);
  const add = (who: string, text: string) => setLog((prev) => [...prev, { time: now(), who, text }]);
  const closed = status === "valide" || status === "rejete";

  const call = () => {
    setCalled(true);
    add(accountant, `Contre-appel au ${change.phone}, le numéro du profil et non celui du mail (appel simulé).`);
  };

  // Principe des quatre yeux : la comptable valide d'abord, puis le DAF.
  const approve = () => {
    if (status === "attente") {
      setStatus("une-validation");
      add(accountant, "Première validation. Il faut maintenant celle du DAF.");
    } else if (status === "une-validation") {
      setStatus("valide");
      add(daf, `Seconde validation : nouvel IBAN ${change.newMaskedIban} enregistré dans le profil.`);
      onApproved(change.supplierId, change.newMaskedIban);
    }
  };

  const reject = () => {
    setStatus("rejete");
    add(status === "une-validation" ? daf : accountant, "Changement rejeté : le profil garde l'IBAN habituel.");
  };

  return (
    <section className={styles.pendingBox} aria-labelledby="pending-title">
      <h2 id="pending-title">Changements en attente</h2>
      <div className={styles.pendingCard}>
        <div className={styles.pendingMain}>
          <strong className={styles.name}>{change.supplierName}</strong> demande un nouvel IBAN
          <div className={styles.ibanChange}>
            <span className={styles.mono}>{change.currentMaskedIban}</span>
            <span aria-hidden="true">→</span>
            <span className={`${styles.mono} ${styles.ibanNew}`}>{change.newMaskedIban}</span>
          </div>
          <span className={styles.learned}>
            Reçu par mail de {change.fromEmail} aujourd&apos;hui à {change.receivedAt.slice(0, 5)}, pièce jointe {change.attachment}
          </span>
        </div>
        <span className={status === "valide" ? styles.trustOk : status === "rejete" ? styles.statusRejected : styles.trustNew}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className={styles.pendingActions}>
        <Button icon={<Call20Regular />} onClick={call} disabled={called || closed}>
          {called ? "Contre-appel noté" : "Appeler au numéro du profil"}
        </Button>
        <Button appearance="primary" icon={<Checkmark20Regular />} onClick={approve} disabled={closed}>
          {status === "une-validation" ? `Valider en tant que DAF (${approvers.daf})` : "Valider (2 personnes requises)"}
        </Button>
        <Button icon={<Dismiss20Regular />} onClick={reject} disabled={closed}>
          Rejeter
        </Button>
      </div>
      {called && !closed && (
        <p className={styles.learned}>
          Appel simulé au {change.phone}. En vrai, seul le fournisseur joint à ce numéro peut confirmer le changement.
        </p>
      )}
      {status === "une-validation" && (
        <p className={styles.learned}>
          Simulation : le DAF valide ici depuis le même écran. En vrai, il valide depuis son propre compte.
        </p>
      )}

      <p className={styles.rule}>
        <LockClosed16Regular />
        Un mail ne peut jamais modifier un profil : tout changement passe par une validation humaine.
      </p>

      <h3 className={styles.logTitle}>Journal</h3>
      <ol className={styles.log}>
        {log.map((entry, i) => (
          <li key={i}>
            <span className={styles.mono}>{entry.time}</span>
            <span>
              <strong>{entry.who}</strong> · {entry.text}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
};
