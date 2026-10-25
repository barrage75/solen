import { describe, expect, it } from "vitest";
import { MAILS } from "@/data/mails";
import { authHeader, authOf, draftFromMail, isUnchanged, isValidEmail, toMail } from "./mailDraft";

const nuvio = MAILS.find((m) => m.id === "nuvio")!;

describe("Testez votre propre mail", () => {
  it("écrit un en-tête d'authentification pour le domaine de l'expéditeur", () => {
    expect(authHeader("paul@exemple.fr", "pass")).toContain("dmarc=pass header.from=exemple.fr");
    expect(authHeader("paul@exemple.fr", "fail")).toContain("spf=fail");
    expect(authHeader("paul@exemple.fr", "none")).toBe("");
    expect(authHeader("adresse-invalide", "pass")).toBe("");
  });

  it("relit le résultat d'authentification d'un exemple", () => {
    expect(authOf(nuvio.internetHeaders)).toBe("pass");
    expect(authOf("spf=pass dkim=fail dmarc=pass")).toBe("fail");
    expect(authOf("")).toBe("none");
  });

  it("garde l'identifiant et les en-têtes d'un exemple non modifié", () => {
    const draft = draftFromMail(nuvio);
    expect(isUnchanged(draft, nuvio)).toBe(true);
    const mail = toMail(draft, nuvio, "essai-1");
    expect(mail.internetMessageId).toBe(nuvio.internetMessageId);
    expect(mail.internetHeaders).toBe(nuvio.internetHeaders);
    expect(mail.attachments.map((a) => a.name)).toEqual(nuvio.attachments.map((a) => a.name));
  });

  it("donne un identifiant neuf à un exemple modifié, pour une analyse en direct", () => {
    const draft = { ...draftFromMail(nuvio), body: `${nuvio.body}\nMerci.` };
    expect(isUnchanged(draft, nuvio)).toBe(false);
    const mail = toMail(draft, nuvio, "essai-2");
    expect(mail.internetMessageId).toBe("<essai-2@essai.solen-demo>");
    expect(mail.internetHeaders).toBe(authHeader(nuvio.from.emailAddress, "pass"));
  });

  it("compte le changement d'authentification comme une modification", () => {
    const draft = { ...draftFromMail(nuvio), auth: "fail" as const };
    const mail = toMail(draft, nuvio, "essai-3");
    expect(mail.internetMessageId).not.toBe(nuvio.internetMessageId);
    expect(mail.internetHeaders).toContain("dmarc=fail");
  });

  it("utilise l'adresse quand le nom affiché est vide", () => {
    const mail = toMail({ fromName: " ", fromEmail: " paul@exemple.fr ", auth: "none", subject: "", body: "x" }, undefined, "e");
    expect(mail.from).toEqual({ displayName: "paul@exemple.fr", emailAddress: "paul@exemple.fr" });
    expect(mail.internetHeaders).toBe("");
  });

  it("vérifie la forme d'une adresse", () => {
    expect(isValidEmail("paul@exemple.fr")).toBe(true);
    expect(isValidEmail("paul@exemple")).toBe(false);
    expect(isValidEmail("paul exemple.fr")).toBe(false);
  });
});
