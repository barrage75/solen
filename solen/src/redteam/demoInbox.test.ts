// La boîte de démo doit raconter la bonne histoire : chaque fraude alerte, chaque vrai mail passe sans alerte.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FALLBACK_ANALYSES } from "@/data/fallback";
import { MAILS, type Mail } from "@/data/mails";
import { buildResult } from "@/lib/analyze";
import { isPaymentRelated, runRules } from "@/lib/checks";
import { pdfText } from "@/lib/pdf";
import { FOOLED_AI } from "./replay";

// Le scénario de chaque mail de la démo.
const GENUINE = new Set(["daf", "dubois", "delivery", "news"]);

const rulesFor = async (mail: Mail) => {
  // Comme l'API : seuls les PDF sont lus, les autres pièces jointes n'apportent pas de texte.
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

describe("Boîte de démo", () => {
  for (const mail of MAILS) {
    const genuine = GENUINE.has(mail.id);
    it(`${genuine ? "vrai mail" : "fraude"} « ${mail.id} » : ${mail.subject}`, async () => {
      const rules = await rulesFor(mail);
      const fallback = FALLBACK_ANALYSES[mail.internetMessageId];
      const text = [mail.subject, mail.body].join("\n");
      // Un mail qui parle d'argent passe par l'IA : sans analyse enregistrée, la démo hors ligne afficherait « IA indisponible ».
      if (isPaymentRelated(text)) expect(fallback, "analyse de secours manquante").toBeDefined();

      const codeOnly = buildResult(rules, FOOLED_AI);
      const withAi = buildResult(rules, fallback ? { analysis: fallback, source: "secours" } : { source: "non-appelée" });
      if (genuine) {
        expect(codeOnly.verdict).toBe("fiable");
        expect(withAi.verdict).toBe("fiable");
      } else {
        // Le code seul alerte, même quand l'IA est trompée.
        expect(codeOnly.verdict).not.toBe("fiable");
        expect(withAi.verdict).toBe("fraude");
      }
    });
  }
});
