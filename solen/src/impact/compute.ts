// Chiffres de la page /impact, calculés en direct sur les mails de la démo avec le vrai code de Solen.
// Rien n'est saisi à la main : si une règle change, la page change avec elle.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { FALLBACK_ANALYSES } from "@/data/fallback";
import { MAILS, type Mail } from "@/data/mails";
import { buildResult } from "@/lib/analyze";
import { runRules, type Verdict } from "@/lib/checks";
import { pdfText } from "@/lib/pdf";
import { FOOLED_AI } from "@/redteam/replay";

// Le scénario de la démo : ce que chaque mail est vraiment. Les vrais mails sont aussi vérifiés par redteam.test.ts.
export const DEMO_TRUTH: Record<string, { truth: "fraude" | "légitime"; label: string }> = {
  nuvio: { truth: "fraude", label: "Faux RIB de Nuvio Cloud" },
  muller: { truth: "fraude", label: "Faux RIB en allemand de Müller Technik" },
  pdg: { truth: "fraude", label: "Fraude au président" },
  conseiller: { truth: "fraude", label: "Faux conseiller bancaire" },
  sosie: { truth: "fraude", label: "Domaine sosie de Delivery Partners" },
  mfa: { truth: "fraude", label: "Hameçonnage : fausse double authentification" },
  daf: { truth: "légitime", label: "Vrai mail urgent du DAF" },
  dubois: { truth: "légitime", label: "Vraie relance de Lumio Data" },
  news: { truth: "légitime", label: "Lettre d'information" },
};

export type ImpactMail = {
  id: string;
  label: string;
  truth: "fraude" | "légitime";
  amount?: number;
  // Le code seul, avec une IA trompée qui répond toujours « fiable ».
  codeOnly: Verdict;
  // Le code et l'analyse de l'IA enregistrée pour la démo, comme dans la boîte mail.
  withAi: Verdict;
  // Le premier constat du code : ce qui a fait tomber l'alerte.
  decisive?: string;
};

export type Impact = {
  mails: ImpactMail[];
  frauds: number;
  fraudsFlagged: number;
  fraudsFlaggedByCodeOnly: number;
  genuine: number;
  falseAlarms: number;
  blockedAmount: number;
  blockedPayments: number;
  // Temps moyen des contrôles du code par mail, en millisecondes, mesuré sur ce serveur.
  codeMsPerMail: number;
};

const readAttachments = (mail: Mail) =>
  Promise.all(
    mail.attachments.map(async (a) => {
      const bytes = await readFile(path.join(process.cwd(), "public", a.url));
      return { name: a.name, text: await pdfText(new Uint8Array(bytes)) };
    }),
  );

export const computeImpact = async (): Promise<Impact> => {
  const mails: ImpactMail[] = [];
  let codeMs = 0;
  for (const mail of MAILS) {
    const truth = DEMO_TRUTH[mail.id];
    if (!truth) continue;
    const attachments = await readAttachments(mail);
    const started = performance.now();
    const rules = runRules({
      fromName: mail.from.displayName,
      fromEmail: mail.from.emailAddress,
      headers: mail.internetHeaders,
      text: [mail.subject, mail.body, ...attachments.map((a) => a.text ?? "")].join("\n"),
      unreadableAttachments: attachments.filter((a) => !a.text?.trim()).map((a) => a.name),
    });
    codeMs += performance.now() - started;
    const fallback = FALLBACK_ANALYSES[mail.internetMessageId];
    const codeOnly = buildResult(rules, FOOLED_AI);
    const withAi = buildResult(rules, fallback ? { analysis: fallback, source: "secours" } : { source: "non-appelée" });
    mails.push({
      id: mail.id,
      label: truth.label,
      truth: truth.truth,
      amount: rules.amount,
      codeOnly: codeOnly.verdict,
      withAi: withAi.verdict,
      decisive: codeOnly.reasons.find((r) => r.source === "code" && r.severity !== "fiable")?.text,
    });
  }

  const frauds = mails.filter((m) => m.truth === "fraude");
  const genuine = mails.filter((m) => m.truth === "légitime");
  const flagged = frauds.filter((m) => m.withAi !== "fiable");
  const blocked = flagged.filter((m) => m.amount !== undefined);
  return {
    mails,
    frauds: frauds.length,
    fraudsFlagged: flagged.length,
    fraudsFlaggedByCodeOnly: frauds.filter((m) => m.codeOnly !== "fiable").length,
    genuine: genuine.length,
    falseAlarms: genuine.filter((m) => m.withAi !== "fiable" || m.codeOnly !== "fiable").length,
    blockedAmount: blocked.reduce((sum, m) => sum + (m.amount ?? 0), 0),
    blockedPayments: blocked.length,
    codeMsPerMail: mails.length ? codeMs / mails.length : 0,
  };
};
