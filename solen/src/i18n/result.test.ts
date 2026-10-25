import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FALLBACK_ANALYSES } from "@/data/fallback";
import { FALLBACK_ANALYSES_EN } from "@/data/fallback.en";
import { MAILS, type Mail } from "@/data/mails";
import { MAILS_EN } from "@/data/mails.en";
import { buildResult } from "@/lib/analyze";
import { runRules } from "@/lib/checks";
import { pdfText } from "@/lib/pdf";
import { CASES } from "@/redteam/cases";
import { FOOLED_AI, verdictWithFooledAi } from "@/redteam/replay";
import { translateInfobar, translateResult } from "./result";

const rulesFor = async (mail: Mail) => {
  const attachments = await Promise.all(
    mail.attachments.map(async (a) => {
      if (a.contentType !== "application/pdf") return { name: a.name, text: "" as string | null, pdf: false };
      const bytes = await readFile(path.join(process.cwd(), "public", a.url));
      return { name: a.name, text: await pdfText(new Uint8Array(bytes)), pdf: true };
    }),
  );
  return runRules({
    fromName: mail.from.displayName,
    fromEmail: mail.from.emailAddress,
    headers: mail.internetHeaders,
    text: [mail.subject, mail.body, ...attachments.map((a) => a.text ?? "")].join("\n"),
    unreadableAttachments: attachments.filter((a) => a.pdf && !a.text?.trim()).map((a) => a.name),
  });
};

describe("traduction anglaise du résultat", () => {
  for (const mail of MAILS) {
    it(`mail de démo « ${mail.id} » : rien ne reste en français`, async () => {
      const rules = await rulesFor(mail);
      const fallback = FALLBACK_ANALYSES[mail.internetMessageId];
      for (const ai of [FOOLED_AI, fallback ? { analysis: fallback, source: "secours" as const } : { source: "non-appelée" as const }]) {
        const original = buildResult(rules, ai);
        const { result, missing } = translateResult(original, "en");
        expect(missing).toEqual([]);
        // La traduction ne change jamais le verdict ni le montant.
        expect(result.verdict).toBe(original.verdict);
        expect(result.amount).toBe(original.amount);
      }
    });
  }

  for (const c of CASES) {
    it(`attaque « ${c.id} » : rien ne reste en français`, async () => {
      const { missing } = translateResult(await verdictWithFooledAi(await c.mail()), "en");
      expect(missing).toEqual([]);
    });
  }

  it("couvre l'IA indisponible", () => {
    const rules = runRules({ fromName: "Paul", fromEmail: "paul@exemple.fr", headers: "", text: "Merci de régler la facture de 4 500 €." });
    const { missing, result } = translateResult(buildResult(rules, { source: "échec" }), "en");
    expect(missing).toEqual([]);
    expect(result.reasons.map((r) => r.text)).toContain("AI analysis unavailable: check this payment request before paying.");
  });

  it("traduit le bandeau phrase à phrase, montant compris", () => {
    expect(
      translateInfobar("Solen : IBAN différent du profil fournisseur. 18 400 € en jeu. Ne payez pas avant un contre-appel au numéro enregistré."),
    ).toBe("Solen: IBAN differs from the supplier profile. €18,400 at stake. Do not pay before calling back the registered number.");
    expect(translateInfobar("Solen : phrase inconnue.")).toBeUndefined();
  });

  it("laisse le français intact", () => {
    const rules = runRules({ fromName: "Paul", fromEmail: "paul@exemple.fr", headers: "", text: "Bonjour" });
    const original = buildResult(rules, { source: "non-appelée" });
    expect(translateResult(original, "fr").result).toBe(original);
  });
});

describe("données anglaises", () => {
  it("chaque mail de la démo a sa version anglaise", () => {
    expect(Object.keys(MAILS_EN).sort()).toEqual(MAILS.map((m) => m.id).sort());
  });

  it("chaque analyse enregistrée a sa version anglaise, phrase à phrase", () => {
    expect(Object.keys(FALLBACK_ANALYSES_EN).sort()).toEqual(Object.keys(FALLBACK_ANALYSES).sort());
    for (const [id, fr] of Object.entries(FALLBACK_ANALYSES)) {
      const en = FALLBACK_ANALYSES_EN[id];
      expect(en.raisons.length, id).toBe(fr.raisons.length);
      expect(en.questionsContreAppel.length, id).toBe(fr.questionsContreAppel.length);
    }
  });
});
