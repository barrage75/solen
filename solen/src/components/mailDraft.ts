// Logique du formulaire « Testez votre propre mail » : sans React, pour pouvoir la tester.
import type { Mail } from "@/data/mails";

export type AuthChoice = "pass" | "fail" | "none";

export type DraftAttachment = { name: string; url?: string; file?: File };

export type Draft = {
  fromName: string;
  fromEmail: string;
  auth: AuthChoice;
  subject: string;
  body: string;
  attachment?: DraftAttachment;
};

export const EMPTY_DRAFT: Draft = { fromName: "", fromEmail: "", auth: "pass", subject: "", body: "" };

// Même limite que le serveur (src/lib/pdf.ts) : au-delà, le PDF ne serait pas lu.
export const MAX_PDF_BYTES = 5 * 1024 * 1024;
// Même limite que l'API : au-delà, elle refuse le mail.
export const MAX_BODY_CHARS = 50_000;

export const domainOf = (email: string) => email.trim().split("@")[1]?.toLowerCase() ?? "";

// Ce qu'écrirait le serveur de mail d'Arkos Systems après ses contrôles SPF, DKIM et DMARC.
export const authHeader = (email: string, auth: AuthChoice) => {
  const domain = domainOf(email);
  if (auth === "none" || !domain) return "";
  return `Authentication-Results: mx.arkos-systems.fr; spf=${auth} smtp.mailfrom=${domain}; dkim=${auth} header.d=${domain}; dmarc=${auth} header.from=${domain}`;
};

// Lit le résultat d'authentification d'un en-tête existant, pour préremplir le formulaire avec un exemple.
export const authOf = (headers: string): AuthChoice => {
  const values = [...headers.matchAll(/\b(?:spf|dkim|dmarc)=(\w+)/gi)].map((m) => m[1].toLowerCase());
  if (values.length === 0) return "none";
  return values.every((v) => v === "pass") ? "pass" : "fail";
};

export const draftFromMail = (mail: Mail): Draft => ({
  fromName: mail.from.displayName,
  fromEmail: mail.from.emailAddress,
  auth: authOf(mail.internetHeaders),
  subject: mail.subject,
  body: mail.body,
  ...(mail.attachments[0] && { attachment: { name: mail.attachments[0].name, url: mail.attachments[0].url } }),
});

const sameAttachment = (a?: DraftAttachment, b?: DraftAttachment) =>
  a?.name === b?.name && a?.url === b?.url && a?.file === b?.file;

export const isUnchanged = (draft: Draft, example: Mail) => {
  const original = draftFromMail(example);
  return (
    draft.fromName === original.fromName &&
    draft.fromEmail === original.fromEmail &&
    draft.auth === original.auth &&
    draft.subject === original.subject &&
    draft.body === original.body &&
    sameAttachment(draft.attachment, original.attachment)
  );
};

// Un exemple non modifié garde son identifiant et ses en-têtes : il reçoit la même analyse que dans la boîte mail.
// Un mail écrit ou modifié reçoit un identifiant neuf, donc une analyse en direct.
export const toMail = (draft: Draft, example: Mail | undefined, newId: string): Mail => {
  const keep = example && isUnchanged(draft, example);
  return {
    id: newId,
    internetMessageId: keep ? example.internetMessageId : `<${newId}@essai.solen-demo>`,
    subject: draft.subject,
    from: { displayName: draft.fromName.trim() || draft.fromEmail.trim(), emailAddress: draft.fromEmail.trim() },
    to: "c.bernard@arkos-systems.fr",
    received: { dayOffset: 0, time: "" },
    body: draft.body,
    attachments: draft.attachment
      ? [{ id: "pj", name: draft.attachment.name, contentType: "application/pdf", size: 0, url: draft.attachment.url ?? "" }]
      : [],
    internetHeaders: keep ? example.internetHeaders : authHeader(draft.fromEmail, draft.auth),
  };
};

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
