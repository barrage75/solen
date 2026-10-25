"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
} from "@fluentui/react-components";
import { ArrowLeft16Regular, ArrowRight16Regular, Dismiss16Regular, Shield20Filled } from "@fluentui/react-icons";
import styles from "./outlook.module.css";

// Les quatre mails qui racontent Solen à un visiteur qui arrive par le lien en ligne.
export const TOUR_STEPS = [
  {
    mailId: "nuvio",
    title: "Le faux changement de RIB",
    hint: "Nuvio Cloud, un vrai fournisseur, envoie un « nouveau RIB » en PDF. Solen lit le PDF et compare l'IBAN au profil fournisseur : il ne correspond pas.",
  },
  {
    mailId: "daf",
    title: "Le contre-exemple : le vrai mail urgent du DAF",
    hint: "Urgent et avec un montant, mais authentifié, interne et vers un fournisseur connu payé sur son compte habituel : Solen ne déclenche aucune alerte.",
  },
  {
    mailId: "mfa",
    title: "Le faux support informatique",
    hint: "L'adresse arkos-systerns.fr imite arkos-systems.fr : « rn » remplace le « m ». Solen surligne la différence.",
  },
  {
    mailId: "pdg",
    title: "La fraude au président depuis Gmail",
    hint: "Le nom du PDG, mais une adresse Gmail, un virement urgent et l'ordre de n'en parler à personne : Solen l'arrête et indique qui rappeler.",
  },
  {
    // Pas de mail à ouvrir : l'étape montre le bouton « Profils fournisseurs » en haut de la boîte mail.
    mailId: null,
    title: "Les profils fournisseurs",
    hint: "Le bouton « Profils fournisseurs », en haut à droite, montre les IBAN de référence appris des paiements passés et les changements d'IBAN en attente de validation.",
  },
] as const;

type DialogProps = {
  open: boolean;
  onClose: () => void;
  onStep: (index: number) => void;
};

export const TourDialog = ({ open, onClose, onStep }: DialogProps) => (
  <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
    <DialogSurface className={styles.tourSurface}>
      <DialogBody>
        <DialogTitle>
          <span className={styles.tourTitle}>
            <Shield20Filled className={styles.brandIcon} /> Bienvenue dans la démo Solen
          </span>
        </DialogTitle>
        <DialogContent>
          <p className={styles.tourIntro}>
            Solen s&apos;ajoute à la boîte mail et repère les arnaques au virement : faux changement de RIB, fraude au président,
            faux support, domaines sosies. Le code tranche dès que de l&apos;argent est en jeu, et l&apos;IA explique la fraude en
            clair sans jamais voir un IBAN.
          </p>
          <ol className={styles.tourSteps}>
            {TOUR_STEPS.map((step, i) => (
              <li key={step.mailId}>
                <button type="button" className={styles.tourStep} onClick={() => onStep(i)}>
                  <span className={styles.tourStepNumber}>{i + 1}</span>
                  <span>{step.title}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className={styles.muted}>Pour analyser n&apos;importe quel autre mail, cliquez sur le bouton Solen du ruban.</p>
        </DialogContent>
        <DialogActions>
          <Button appearance="primary" onClick={() => onStep(0)}>
            Commencer la visite
          </Button>
          <Button onClick={onClose}>Explorer seul</Button>
        </DialogActions>
      </DialogBody>
    </DialogSurface>
  </Dialog>
);

type BarProps = {
  index: number;
  onStep: (index: number) => void;
  onQuit: () => void;
};

// Barre discrète sous le ruban : rappelle quoi regarder et permet d'avancer sans connaître les raccourcis.
export const TourBar = ({ index, onStep, onQuit }: BarProps) => {
  const step = TOUR_STEPS[index];
  const last = index === TOUR_STEPS.length - 1;
  return (
    <div className={styles.tourBar} role="region" aria-label="Visite guidée">
      <span className={styles.tourBarText}>
        <strong>
          Visite {index + 1}/{TOUR_STEPS.length} · {step.title}
        </strong>
        <span>{step.hint}</span>
      </span>
      <span className={styles.tourBarActions}>
        <Button size="small" icon={<ArrowLeft16Regular />} disabled={index === 0} onClick={() => onStep(index - 1)}>
          Précédent
        </Button>
        {last ? (
          <Button size="small" appearance="primary" onClick={onQuit}>
            Terminer
          </Button>
        ) : (
          <Button size="small" appearance="primary" icon={<ArrowRight16Regular />} iconPosition="after" onClick={() => onStep(index + 1)}>
            Suivant
          </Button>
        )}
        <Button size="small" appearance="subtle" icon={<Dismiss16Regular />} aria-label="Quitter la visite" onClick={onQuit} />
      </span>
    </div>
  );
};
