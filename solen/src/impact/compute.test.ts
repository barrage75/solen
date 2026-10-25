import { describe, expect, it } from "vitest";
import { MAILS } from "@/data/mails";
import { computeImpact, DEMO_TRUTH } from "./compute";

describe("chiffres de la page impact", () => {
  it("couvre chaque mail de la démo", () => {
    expect(Object.keys(DEMO_TRUTH).sort()).toEqual(MAILS.map((m) => m.id).sort());
  });

  it("signale chaque fraude de la démo, même avec une IA trompée, sans fausse alerte", async () => {
    const impact = await computeImpact();
    expect(impact.frauds).toBe(6);
    expect(impact.fraudsFlagged).toBe(impact.frauds);
    expect(impact.fraudsFlaggedByCodeOnly).toBe(impact.frauds);
    expect(impact.genuine).toBe(3);
    expect(impact.falseAlarms).toBe(0);
  });

  it("additionne les virements frauduleux bloqués", async () => {
    const impact = await computeImpact();
    const expected = impact.mails
      .filter((m) => m.truth === "fraude" && m.amount !== undefined)
      .reduce((sum, m) => sum + m.amount!, 0);
    expect(impact.blockedAmount).toBe(expected);
    expect(impact.blockedAmount).toBeGreaterThan(0);
    expect(impact.blockedPayments).toBe(5);
  });

  it("explique chaque alerte du code par un constat", async () => {
    const impact = await computeImpact();
    for (const m of impact.mails.filter((x) => x.truth === "fraude")) expect(m.decisive, m.id).toBeTruthy();
  });
});
