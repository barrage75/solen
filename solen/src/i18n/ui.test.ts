import { describe, expect, it } from "vitest";
import { CASES } from "@/redteam/cases";
import { CASE_TITLES_EN } from "@/redteam/cases.en";
import { STRINGS } from "./ui";

type Tree = { [key: string]: unknown };

// Chemins de toutes les feuilles du dictionnaire : « pane.verdict.fraude », « mailbox.tabs.0 »…
const leaves = (node: unknown, prefix = ""): [string, unknown][] =>
  node !== null && typeof node === "object"
    ? Object.entries(node as Tree).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k))
    : [[prefix, node]];

// Textes identiques dans les deux langues, et c'est voulu.
const SAME_IN_BOTH = new Set([
  "mailbox.archiveFolder",
  "mailbox.notes",
  "pane.vigilance",
  "tester.bodyPlaceholder",
  "tester.examplesNote",
  "attacks.mailNote",
]);

describe("dictionnaire d'interface", () => {
  const fr = new Map(leaves(STRINGS.fr));
  const en = new Map(leaves(STRINGS.en));

  it("a exactement les mêmes clés en français et en anglais", () => {
    expect([...en.keys()].sort()).toEqual([...fr.keys()].sort());
  });

  it("n'a oublié aucun texte anglais en français", () => {
    const untranslated = [...fr]
      .filter(([k, v]) => typeof v === "string" && v !== "" && en.get(k) === v && !SAME_IN_BOTH.has(k))
      .map(([k]) => k);
    expect(untranslated).toEqual([]);
  });

  it("formate les montants dans chaque langue", () => {
    expect(STRINGS.en.euros(18400)).toBe("€18,400");
    expect(STRINGS.fr.euros(18400)).toBe("18 400 €");
  });

  it("donne un titre anglais à chaque attaque testée", () => {
    expect(Object.keys(CASE_TITLES_EN).sort()).toEqual(CASES.map((c) => c.id).sort());
  });
});
