// Version anglaise des mails de la démo, pour l'affichage seulement.
// L'analyse lit toujours le mail d'origine (src/data/mails.ts) : le verdict ne dépend pas de la langue choisie.
import type { Mail } from "./mails";

type MailText = { subject: string; body: string; displayName?: string };

const paragraphs = (...parts: string[]) => parts.join("\n\n");

export const MAILS_EN: Record<string, MailText> = {
  nuvio: {
    subject: "Change of bank details",
    body: paragraphs(
      "Dear Ms Bernard,",
      "Following the e-invoicing reform, we are changing banks. Invoice no. 2026-114 for €18,400.00, which you received on your platform, remains valid, but please pay it into our new account (bank details attached).",
      "Transfers to the old account can no longer be processed from Monday.",
      "Kind regards,",
      "Billing department\nNuvio Cloud\n12 rue des Entrepreneurs, 69007 Lyon",
    ),
  },
  daf: {
    subject: "Urgent: Lumio Data invoice to pay today",
    body: paragraphs(
      "Claire,",
      "Could you pay Lumio Data's invoice F-2026-219 (€2,350.00) today? It has been overdue since the 15th and they have chased us twice. I don't want late payment penalties.",
      "Thanks,",
      "Marc Lefèvre\nChief Financial Officer\nArkos Systems",
    ),
  },
  mfa: {
    subject: "Action required: your two-factor authentication expires today",
    displayName: "IT support",
    body: paragraphs(
      "Hello Claire,",
      "As part of the security update, your two-factor authentication expires today. To keep access to your email and the VPN, renew it before 6 pm:\nhttps://arkos-systerns.fr/securite/renouvellement",
      "Without action on your part, your account will be suspended.",
      "IT support",
    ),
  },
  muller: {
    // Fournisseur allemand : le mail reste en allemand, comme dans la réalité.
    subject: "Rechnung 2026-0388 – neue Bankverbindung",
    body: paragraphs(
      "Sehr geehrte Frau Bernard,",
      "anbei erhalten Sie unsere Rechnung 2026-0388. Bitte beachten Sie, dass sich unsere Bankverbindung geändert hat. Die neuen Kontodaten finden Sie auf der Rechnung.",
      "Wir bitten um Überweisung des Betrags bis spätestens Freitag.",
      "Mit freundlichen Grüßen\nBuchhaltung\nMüller Technik GmbH, Köln",
    ),
  },
  pdg: {
    subject: "Confidential transfer",
    body: paragraphs(
      "Claire,",
      "I'm in a meeting with our lawyers and can't talk. We are closing an acquisition and I need you to make a €35,000 transfer today.",
      "This is strictly confidential until the deal is announced: don't tell anyone, not even Marc. I'll send you the bank details in a moment.",
      "Jean-Pierre Durand\nSent from my iPhone",
    ),
  },
  colis: {
    subject: "Your parcel is on hold: redelivery fee to pay",
    body: paragraphs(
      "Hello,",
      "Your parcel no. RC 4471 2093 FR is on hold at our sorting centre: a redelivery fee of €1.99 has not been paid.",
      "To receive your parcel tomorrow, pay this fee within 24 hours:\nhttps://rapidocolis-suivi.com/paiement/RC44712093",
      "Without payment, the parcel will be returned to the sender.",
      "Rapido Colis customer service",
    ),
  },
  paie: {
    subject: "Change of bank details for my salary",
    body: paragraphs(
      "Hi Claire,",
      "I changed banks this week. Could you pay my October salary into my new account?\nIBAN: FR79 1751 5009 0000 0412 3456 789",
      "I'm visiting a client until Friday and can't access my work email, hence this address. Salaries go out on Thursday, which is why I'm sending it now.",
      "Thanks a lot!\nSophie",
    ),
  },
  qr: {
    subject: "Invoice F-2026-231: pay in 10 seconds with a QR code",
    body: paragraphs(
      "Hello,",
      "To make your payments easier, Lumio Data is switching to QR code payment. Your invoice F-2026-231 for €2,180.00 is available.",
      "Scan the attached QR code with your phone to pay it by card in a few seconds.",
      "Payment is due before Friday to avoid reminder fees.",
      "Accounts department, Lumio Data",
    ),
  },
  conseiller: {
    subject: "Security alert: suspicious transaction on your business account",
    displayName: "Security Department – Banque Horizon",
    body: paragraphs(
      "Madam,",
      "A suspicious transaction of €12,450.00 has been detected on the Arkos Systems business account. To block it, immediately make a security transfer of the same amount to your temporary protection account:\nIBAN: FR24 1450 8000 0100 9876 5432 110",
      "Your adviser will call you back today. Do not contact your branch: the procedure is automated.",
      "Security Department\nBanque Horizon",
    ),
  },
  dubois: {
    subject: "Reminder: invoice F-2026-219",
    body: paragraphs(
      "Hello,",
      "Unless we are mistaken, invoice F-2026-219 for €2,350.00, due on 15 October, remains unpaid. It is available on your invoicing platform.",
      "Please pay it into the usual account.",
      "Kind regards,\nAccounts department, Lumio Data",
    ),
  },
  cartes: {
    subject: "Quick favour",
    body: paragraphs(
      "Claire, are you at your desk?",
      "I need you to buy 10 gift cards of €100, €1,000 in total, to thank some clients tonight. It's a surprise, don't tell the team.",
      "Pay with the company card, scratch the back of the cards and send me the codes as photos by reply. I'll pay you back tomorrow.",
      "JPD\nSent from my mobile",
    ),
  },
  "piece-jointe": {
    subject: "Unpaid invoice no. 2026-1107 – final notice before legal action",
    displayName: "Verlaine Debt Collection",
    body: paragraphs(
      "Madam,",
      "Despite our reminders, invoice no. 2026-1107 for €3,960.00 remains unpaid.",
      "Open the attached invoice to see the details and pay online. Without payment within 72 hours, the case will be passed to our legal department.",
      "Verlaine Debt Collection",
    ),
  },
  sosie: {
    subject: "Invoice DP-2026-118 – October engagement",
    displayName: "Delivery Partners – Billing",
    body: paragraphs(
      "Dear Ms Bernard,",
      "Please find below our invoice DP-2026-118 for supporting your teams in October, for €14,400.00.",
      "As our firm changed banks this month, please pay into our new account:\nIBAN: FR24 1450 8000 0100 9876 5432 110\nBIC: HRZNFRP1",
      "Payment is expected within 48 hours, in line with our terms.",
      "Kind regards,\nBilling department, Delivery Partners",
    ),
  },
  delivery: {
    subject: "Invoice DP-2026-104 – September engagement",
    displayName: "Delivery Partners – Billing",
    body: paragraphs(
      "Dear Ms Bernard,",
      "Please find below our invoice DP-2026-104 for supporting your teams in September, for €13,200.00, payable within 30 days to our usual account:\nIBAN: FR09 3006 6109 4700 0104 5678 941",
      "Please let us know if you have any questions.",
      "Kind regards,\nBilling department, Delivery Partners",
    ),
  },
  domaine: {
    subject: "Expiry notice: arkos-systems.fr",
    body: paragraphs(
      "Dear Sir or Madam,",
      "The domain name arkos-systems.fr expires on 31/10/2026. To avoid your website and email being cut off, pay renewal invoice no. DSE-88412 for €389.00 by transfer:\nIBAN: FR07 1820 6000 0265 0873 2145 317",
      "After this date, the domain may be registered by a third party.",
      "Billing department\nDomain Services Europe",
    ),
  },
  impots: {
    subject: "Refund of a tax overpayment: €1,284.00",
    displayName: "Business Tax Office",
    body: paragraphs(
      "Dear Sir or Madam,",
      "After recalculating Arkos Systems' corporate tax instalment, an overpayment of €1,284.00 is due to you.",
      "To receive the transfer, confirm the company's bank details before 31 October:\nhttps://impots-remboursement-pro.fr/sie/confirmation",
      "Without confirmation from you, the refund will be cancelled.",
      "Business Tax Office",
    ),
  },
  news: {
    subject: "Your October letter: year-end cash management",
    displayName: "SME Finance Letter",
    body: paragraphs(
      "In this issue:",
      "• Preparing year-end cash flow\n• E-invoicing: the timetable for SMEs\n• Three questions for a finance director",
      "Enjoy your reading,\nThe editorial team",
    ),
  },
};

// Le mail tel qu'il s'affiche : texte anglais si demandé, mais même identifiant, mêmes pièces jointes, mêmes en-têtes.
export const displayMail = (mail: Mail, lang: "fr" | "en"): Mail => {
  const en = lang === "en" ? MAILS_EN[mail.id] : undefined;
  if (!en) return mail;
  return {
    ...mail,
    subject: en.subject,
    body: en.body,
    from: { ...mail.from, displayName: en.displayName ?? mail.from.displayName },
  };
};
