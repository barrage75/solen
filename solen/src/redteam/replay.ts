// Rejoue un mail piégé avec une IA trompée qui répond toujours « fiable ».
// Utilisé par les tests (redteam.test.ts) et par la page /attaques : les deux vérifient exactement la même chose.
import { buildResult, type AnalysisResult } from "@/lib/analyze";
import { runRules, VERDICT_RANK, type Verdict } from "@/lib/checks";
import { pdfText } from "@/lib/pdf";
import type { AttackCase } from "./cases";
import type { TestMail } from "./client";

export const FOOLED_AI = {
  source: "mistral" as const,
  analysis: { demande: "", langue: "", techniques: [], verdict: "fiable" as Verdict, raisons: [], questionsContreAppel: [] },
};

export const verdictWithFooledAi = async (m: TestMail): Promise<AnalysisResult> => {
  const read = await Promise.all(
    m.attachments.map(async (a) => ({ name: a.name, text: await pdfText(new Uint8Array(Buffer.from(a.base64 ?? "", "base64"))) })),
  );
  const rules = runRules({
    fromName: m.fromName,
    fromEmail: m.fromEmail,
    headers: m.headers,
    text: [m.subject, m.body, ...read.map((r) => r.text ?? "")].join("\n"),
    unreadableAttachments: read.filter((r) => !r.text?.trim()).map((r) => r.name),
  });
  return buildResult(rules, FOOLED_AI);
};

// Une attaque est arrêtée si le verdict est au moins aussi sévère que prévu et si c'est bien la règle visée qui a tranché.
// Un vrai mail (attendu « fiable ») passe s'il ne déclenche aucune alerte.
export const isStopped = (c: AttackCase, result: AnalysisResult) => {
  if (c.expected === "fiable") return result.verdict === "fiable";
  const severeEnough = VERDICT_RANK[result.verdict] >= VERDICT_RANK[c.expected];
  const ruleFired = !c.rule || result.reasons.some((r) => r.text.includes(c.rule!));
  return severeEnough && ruleFired;
};

export type Replay = { case: AttackCase; mail: TestMail; result: AnalysisResult; stopped: boolean };

export const replayCase = async (c: AttackCase): Promise<Replay> => {
  const mail = await c.mail();
  const result = await verdictWithFooledAi(mail);
  return { case: c, mail, result, stopped: isStopped(c, result) };
};

// Rejoue tous les cas en parallèle et mesure la durée totale.
export const replayAll = async (cases: AttackCase[]) => {
  const started = performance.now();
  const replays = await Promise.all(cases.map(replayCase));
  return { replays, durationMs: Math.max(1, Math.round(performance.now() - started)), ranAt: new Date().toISOString() };
};
