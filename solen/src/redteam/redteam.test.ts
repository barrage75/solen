// Chaque attaque doit être arrêtée par le code seul, même si l'IA est trompée et répond « fiable ».
import { describe, expect, it } from "vitest";
import { MAILS } from "@/data/mails";
import { VERDICT_RANK } from "@/lib/checks";
import { CASES } from "./cases";
import { isStopped, verdictWithFooledAi } from "./replay";

describe("Attaques arrêtées par le code, IA trompée", () => {
  for (const c of CASES.filter((c) => c.expected !== "fiable")) {
    it(`${c.family} : ${c.attack}`, async () => {
      const result = await verdictWithFooledAi(await c.mail());
      expect(VERDICT_RANK[result.verdict]).toBeGreaterThanOrEqual(VERDICT_RANK[c.expected]);
      if (c.rule) expect(result.reasons.map((r) => r.text).join("\n")).toContain(c.rule);
      // La page /attaques utilise isStopped : elle doit dire exactement la même chose que ce test.
      expect(isStopped(c, result)).toBe(true);
    });
  }
});

describe("Pas de fausse alerte sur les vrais mails", () => {
  for (const c of CASES.filter((c) => c.expected === "fiable")) {
    it(c.attack, async () => {
      const result = await verdictWithFooledAi(await c.mail());
      expect(result.verdict).toBe("fiable");
      expect(isStopped(c, result)).toBe(true);
    });
  }
  for (const id of ["daf", "dubois", "news"]) {
    it(`mail de démo « ${id} »`, async () => {
      const m = MAILS.find((x) => x.id === id)!;
      const { verdict } = await verdictWithFooledAi({
        internetMessageId: m.internetMessageId,
        subject: m.subject,
        fromName: m.from.displayName,
        fromEmail: m.from.emailAddress,
        headers: m.internetHeaders,
        body: m.body,
        attachments: [],
      });
      expect(verdict).toBe("fiable");
    });
  }
});

describe("isStopped", () => {
  const fraud = CASES.find((c) => c.expected === "fraude" && c.rule)!;
  const genuine = CASES.find((c) => c.expected === "fiable")!;
  const result = (verdict: "fiable" | "suspect" | "fraude", reason = "") =>
    ({ verdict, reasons: reason ? [{ text: reason, source: "code", severity: verdict }] : [] }) as never;

  it("refuse un verdict trop doux", () => {
    expect(isStopped(fraud, result("suspect", fraud.rule))).toBe(false);
  });
  it("refuse le bon verdict obtenu par une autre règle", () => {
    expect(isStopped(fraud, result("fraude", "Autre constat"))).toBe(false);
  });
  it("refuse une fausse alerte sur un vrai mail", () => {
    expect(isStopped(genuine, result("suspect", "x"))).toBe(false);
  });
});
