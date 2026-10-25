// Traduit en anglais le résultat d'analyse, sans toucher au code qui le produit (checks.ts, analyze.ts).
// Chaque phrase que le code peut écrire a son motif ici ; une phrase inconnue reste en français et est signalée,
// et le test result.test.ts échoue si une règle produit un texte que ce fichier ne sait pas traduire.
import { FALLBACK_ANALYSES } from "@/data/fallback";
import { FALLBACK_ANALYSES_EN } from "@/data/fallback.en";
import type { AnalysisResult } from "@/lib/analyze";
import type { Lang } from "./lang";
import { STRINGS } from "./ui";

const euros = STRINGS.en.euros;

// « 18 400 », « 1,99 » ou « 23 500 » (espaces fines ou insécables) en nombre.
const frNumber = (s: string) => Number(s.replace(/[\s  ]/g, "").replace(",", "."));
const AMOUNT = String.raw`([\d\s  ]+(?:,\d{1,2})?)\s?€`;

const ROLES: Record<string, string> = {
  PDG: "CEO",
  DAF: "CFO",
  DSI: "IT department",
  "Responsable commerciale": "Sales manager",
};
const NAMES: Record<string, string> = { "Support informatique": "IT support" };

const role = (r: string) => ROLES[r];

// Rôle d'une personne de l'annuaire, pour l'affichage en anglais.
export const translateRole = (r: string) => ROLES[r] ?? r;

type Rule = [RegExp, (...groups: string[]) => string | undefined];

const translateWith = (rules: Rule[], text: string): string | undefined => {
  for (const [pattern, build] of rules) {
    const m = text.match(pattern);
    if (m) return build(...m.slice(1));
  }
  return undefined;
};

// Constats du code : runRules (checks.ts) et le constat d'IA indisponible (analyze.ts).
const FINDINGS: Rule[] = [
  [/^Expéditeur non authentifié\.$/, () => "Sender not authenticated."],
  [/^Adresse qui imite (.+)\.$/, (d) => `Address imitating ${d}.`],
  [
    /^Se fait passer pour (.+) \(([^)]+)\) depuis une adresse externe\.$/,
    (name, r) => (role(r) ? `Poses as ${name} (${role(r)}) from an external address.` : undefined),
  ],
  [/^Nouvel IBAN : l'habituel a servi (\d+) fois depuis (\d{4})\.$/, (n, y) => `New IBAN: the usual one was used ${n} times since ${y}.`],
  [/^Se fait passer pour (.+) depuis une autre adresse\.$/, (s) => `Poses as ${s} from another address.`],
  [/^IBAN envoyé par un inconnu\.$/, () => "IBAN sent by an unknown sender."],
  [/^Annonce un changement de banque\.$/, () => "Announces a change of bank."],
  [/^Pièce jointe illisible : IBAN impossible à vérifier\.$/, () => "Unreadable attachment: the IBAN cannot be checked."],
  [/^Les réponses partiraient vers (.+)\.$/, (a) => `Replies would go to ${a}.`],
  [/^Consignes cachées pour tromper l'analyse\.$/, () => "Hidden instructions to fool the analysis."],
  [/^Lien vers un site inconnu : (.+)\.$/, (l) => `Link to an unknown site: ${l}.`],
  [/^Demande de paiement d'un inconnu\.$/, () => "Payment request from an unknown sender."],
  [new RegExp(`^Montant inhabituel : ${AMOUNT}\\.$`), (a) => `Unusual amount: ${euros(frNumber(a))}.`],
  [
    /^Mail authentifié de (.+) \(([^)]+)\)\.$/,
    (name, r) => (role(r) ? `Authenticated email from ${name} (${role(r)}).` : undefined),
  ],
  [/^Domaine authentique de (.+)\.$/, (s) => `Genuine domain of ${s}.`],
  [/^Fournisseur connu, coordonnées inchangées\.$/, () => "Known supplier, bank details unchanged."],
  [/^IBAN habituel\.$/, () => "Usual IBAN."],
  [new RegExp(`^Montant habituel : ${AMOUNT}\\.$`), (a) => `Usual amount: ${euros(frNumber(a))}.`],
  [
    /^Analyse par l'IA indisponible : vérifiez cette demande de paiement avant de payer\.$/,
    () => "AI analysis unavailable: check this payment request before paying.",
  ],
];

// Phrases du bandeau construit par buildResult (analyze.ts), après « Solen : ».
const INFOBAR_SENTENCES: Rule[] = [
  [/^fraude probable\.$/, () => "likely fraud."],
  [/^demande inhabituelle\.$/, () => "unusual request."],
  [/^aucune anomalie détectée\.$/, () => "no anomaly detected."],
  [/^adresse qui imite (.+)\.$/, (d) => `address imitating ${d}.`],
  [/^lien vers un site inconnu de l'entreprise\.$/, () => "link to a site unknown to the company."],
  [/^IBAN différent du profil fournisseur\.$/, () => "IBAN differs from the supplier profile."],
  [new RegExp(`^${AMOUNT} en jeu\\.$`), (a) => `${euros(frNumber(a))} at stake.`],
  [/^Ne payez pas avant un contre-appel au numéro enregistré\.$/, () => "Do not pay before calling back the registered number."],
  [/^Vérifiez auprès de l'expéditeur avant de payer\.$/, () => "Check with the sender before paying."],
  [/^Ne saisissez pas vos identifiants\.$/, () => "Do not enter your credentials."],
];

const SENDER_LABELS: Rule[] = [
  [/^Collègue, domaine de l'entreprise$/, () => "Colleague, company domain"],
  [/^Fournisseur enregistré : (.+)$/, (s) => `Registered supplier: ${s}`],
  [/^Adresse externe, se présente comme (.+)$/, (s) => `External address, poses as ${s}`],
  [/^Adresse inconnue de l'entreprise$/, () => "Address unknown to the company"],
  [/^Expéditeur inconnu$/, () => "Unknown sender"],
];

// Questions par défaut de callbackFor (analyze.ts).
const DEFAULT_QUESTIONS: Rule[] = [
  [/^Avez-vous envoyé ce mail \?$/, () => "Did you send this email?"],
  [/^Avez-vous changé de coordonnées bancaires \?$/, () => "Have you changed your bank details?"],
  [/^Pouvez-vous me confirmer les 4 derniers chiffres de votre IBAN \?$/, () => "Can you confirm the last 4 digits of your IBAN?"],
  [/^Avez-vous envoyé un mail sur la double authentification \?$/, () => "Did you send an email about two-factor authentication?"],
  [/^L'adresse (.+) est-elle à vous \?$/, (a) => `Is the address ${a} yours?`],
  [/^Que dois-je faire si j'ai cliqué sur le lien \?$/, () => "What should I do if I clicked the link?"],
  [new RegExp(`^Avez-vous demandé ce virement de ${AMOUNT} \\?$`), (a) => `Did you request this ${euros(frNumber(a))} transfer?`],
  [/^Ce mail vient-il bien de vous \?$/, () => "Did this email really come from you?"],
  [/^Qui d'autre doit valider cette opération \?$/, () => "Who else must approve this transaction?"],
  [/^Est-ce une demande habituelle \?$/, () => "Is this a usual request?"],
  [
    /^Que dois-je faire si j'ai cliqué sur un lien ou ouvert une pièce jointe \?$/,
    () => "What should I do if I clicked a link or opened an attachment?",
  ],
];

const TECHNIQUES: Record<string, string> = {
  urgence: "urgency",
  secret: "secrecy",
  autorité: "authority",
  "prétexte d'actualité": "topical pretext",
  "changement de coordonnées bancaires": "change of bank details",
  "contournement de la hiérarchie": "bypassing the hierarchy",
  "manipulation de l'outil d'analyse": "manipulating the analysis tool",
};

const LANGUAGES: Record<string, string> = {
  français: "French",
  allemand: "German",
  anglais: "English",
  espagnol: "Spanish",
  italien: "Italian",
  néerlandais: "Dutch",
  portugais: "Portuguese",
};

// Phrases des analyses de l'IA enregistrées : français et anglais alignés phrase à phrase.
const AI_TEXT = new Map<string, string>();
for (const [id, fr] of Object.entries(FALLBACK_ANALYSES)) {
  const en = FALLBACK_ANALYSES_EN[id];
  if (!en) continue;
  AI_TEXT.set(fr.demande, en.demande);
  fr.raisons.forEach((t, i) => en.raisons[i] && AI_TEXT.set(t, en.raisons[i]));
  fr.questionsContreAppel.forEach((t, i) => en.questionsContreAppel[i] && AI_TEXT.set(t, en.questionsContreAppel[i]));
}

export const translateFinding = (text: string) => translateWith(FINDINGS, text);

export const translateInfobar = (text: string): string | undefined => {
  const m = text.match(/^Solen : (.+)$/);
  if (!m) return undefined;
  const sentences = m[1].split(/(?<=\.)\s+/);
  const out = sentences.map((s) => translateWith(INFOBAR_SENTENCES, s));
  return out.every(Boolean) ? `Solen: ${out.join(" ")}` : undefined;
};

const translateWho = (who: string): string | undefined => {
  const m = who.match(/^(.+) \(([^)]+)\)$/);
  if (!m) return who; // Nom d'un fournisseur : il ne se traduit pas.
  const r = role(m[2]);
  return r ? `${NAMES[m[1]] ?? m[1]} (${r})` : undefined;
};

export type Translated = { result: AnalysisResult; missing: string[] };

// Version anglaise du résultat. En français, le résultat est rendu tel quel.
export const translateResult = (result: AnalysisResult, lang: Lang): Translated => {
  if (lang === "fr") return { result, missing: [] };
  const missing: string[] = [];
  const tr = (text: string, translated: string | undefined) => {
    if (translated !== undefined) return translated;
    missing.push(text);
    return text;
  };
  const ai = (text: string) => tr(text, AI_TEXT.get(text));

  return {
    missing,
    result: {
      ...result,
      infobar: tr(result.infobar, translateInfobar(result.infobar)),
      sender: { ...result.sender, label: tr(result.sender.label, translateWith(SENDER_LABELS, result.sender.label)) },
      demande: result.demande ? ai(result.demande) : result.demande,
      langue: result.langue ? tr(result.langue, LANGUAGES[result.langue.toLowerCase()]) : result.langue,
      techniques: result.techniques.map((t) => tr(t, TECHNIQUES[t])),
      reasons: result.reasons.map((r) => ({
        ...r,
        text: r.source === "code" ? tr(r.text, translateFinding(r.text)) : ai(r.text),
      })),
      callback: {
        ...result.callback,
        who: tr(result.callback.who, translateWho(result.callback.who)),
        questions: result.callback.questions.map((q) => tr(q, AI_TEXT.get(q) ?? translateWith(DEFAULT_QUESTIONS, q))),
      },
    },
  };
};
