import { describe, expect, it, vi } from "vitest";
import * as ai from "@/lib/ai";
import { POST } from "./route";

const request = (ip: string, body: unknown) =>
  new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });

const newsletter = {
  internetMessageId: "<news@exemple.fr>",
  subject: "Lettre d'octobre",
  fromName: "Lettre",
  fromEmail: "news@exemple.fr",
  headers: "",
  body: "Au sommaire ce mois-ci.",
  attachments: [],
};

describe("API d'analyse", () => {
  it("bloque une adresse IP qui enchaîne les demandes (vider les crédits, tester ses faux mails)", async () => {
    vi.spyOn(ai, "analyzeWithMistral");
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) statuses.push((await POST(request("203.0.113.7", newsletter))).status);
    expect(statuses.slice(0, 20).every((s) => s === 200)).toBe(true);
    expect(statuses[20]).toBe(429);
    // Une autre adresse n'est pas pénalisée.
    expect((await POST(request("203.0.113.8", newsletter))).status).toBe(200);
  });

  it("refuse un mail géant qui ferait exploser le coût de l'analyse", async () => {
    const response = await POST(request("203.0.113.9", { ...newsletter, body: "x".repeat(60_000) }));
    expect(response.status).toBe(413);
  });
  it("répond 400, sans planter, à un mail aux champs absents ou du mauvais type", async () => {
    const bad = [
      null,
      [],
      { ...newsletter, body: undefined },
      { ...newsletter, subject: 42 },
      { ...newsletter, headers: ["spf=pass"] },
      { ...newsletter, attachments: "rib.pdf" },
      { ...newsletter, attachments: [{ name: "rib.pdf", contentType: "application/pdf" }] },
      { ...newsletter, attachments: [null] },
    ];
    for (const [i, body] of bad.entries()) {
      expect((await POST(request(`198.51.100.${i}`, body))).status).toBe(400);
    }
  });

  it("accepte un mail sans objet ni en-têtes", async () => {
    const minimal = { fromEmail: newsletter.fromEmail, body: newsletter.body };
    const response = await POST(request("198.51.100.50", minimal));
    expect(response.status).toBe(200);
    expect((await response.json()).verdict).toBeDefined();
  });

  it("refuse une pièce jointe trop lourde avant même de la décoder", async () => {
    const huge = { name: "rib.pdf", contentType: "application/pdf", contentBase64: "A".repeat(8_000_000) };
    const response = await POST(request("198.51.100.60", { ...newsletter, attachments: [huge] }));
    expect(response.status).toBe(413);
  });
});
