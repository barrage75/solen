// Version anglaise des analyses de l'IA enregistrées (src/data/fallback.ts), pour l'affichage en anglais.
// Mêmes clés, même nombre de raisons et de questions, dans le même ordre : la traduction se fait phrase à phrase.
type AiText = { demande: string; raisons: string[]; questionsContreAppel: string[] };

export const FALLBACK_ANALYSES_EN: Record<string, AiText> = {
  "<20261023074005.9b2c@lumio-data-paiement.fr>": {
    demande: "Pay invoice F-2026-231 for €2,180 by card through a QR code.",
    raisons: [
      "The payment link is hidden in a QR code, invisible to filters.",
      "Lumio Data is always paid by transfer, never by card.",
    ],
    questionsContreAppel: [
      "Have you changed your payment method?",
      "Does invoice F-2026-231 exist on your side?",
      "Do you use the domain lumio-data-paiement.fr?",
    ],
  },
  "<20261023084711.5d0e@rapidocolis-suivi.com>": {
    demande: "Pay a €1.99 redelivery fee through a link to release a parcel.",
    raisons: ["The real goal: stealing the card entered on the fake site.", "No expected parcel justifies this fee."],
    questionsContreAppel: [
      "Are we expecting a parcel from Rapido Colis?",
      "Has anyone entered a card on this link?",
      "Should we alert IT support?",
    ],
  },
  "<CAH3p9vT2@mail.gmail.com>": {
    demande: "Pay Sophie Martin's October salary into a new account.",
    raisons: [
      "A personal address asks to divert a salary: payroll fraud.",
      "The travel excuse avoids any check in person.",
    ],
    questionsContreAppel: [
      "Did you send this email from Gmail?",
      "Did you really change banks this week?",
      "Can you hand your new bank details to HR?",
    ],
  },
  "<DB9P194MB1123@outlook.fr>": {
    demande: "Buy €1,000 of gift cards and send the codes by email.",
    raisons: ["Gift card codes cannot be traced once sent.", "A CEO does not ask for gift cards from Outlook."],
    questionsContreAppel: [
      "Did you ask for gift cards yesterday?",
      "Is this Outlook address yours?",
      "Who must approve this kind of purchase?",
    ],
  },
  "<20261022130533.e81b@verlaine-recouvrement.fr>": {
    demande: "Open an attached €3,960 invoice and pay it online.",
    raisons: [
      "An HTML invoice opens a web page: often a fake login.",
      "Threat of legal action to get the attachment opened without thinking.",
    ],
    questionsContreAppel: [
      "Do we know Verlaine Debt Collection?",
      "Does invoice 2026-1107 exist in our accounts?",
      "Has anyone opened this attachment?",
    ],
  },
  "<20261022102044.3c7a@delivery-partners.fr>": {
    demande: "Pay invoice DP-2026-104 for €13,200 within 30 days.",
    raisons: ["Usual invoice, with no urgency and no change of bank details.", "Normal 30-day payment term."],
    questionsContreAppel: [],
  },
  "<20261022094012.b6f3@domain-services-europe.com>": {
    demande: "Pay €389 to renew the domain name arkos-systems.fr.",
    raisons: ["A provider never paid before: a classic fake renewal invoice.", "The threat of a cut-off pushes you to pay without checking."],
    questionsContreAppel: [
      "Where is our domain name registered?",
      "Did we order a renewal from Domain Services Europe?",
      "What is the domain's real expiry date?",
    ],
  },
  "<20261022081533.0a4d@impots-remboursement-pro.fr>": {
    demande: "Confirm the bank details through a link to receive €1,284.",
    raisons: [
      "The tax office never has an account confirmed through a link.",
      "The refund is bait to steal the bank details.",
    ],
    questionsContreAppel: [
      "Are we expecting a corporate tax refund?",
      "Does this overpayment appear in the official business account?",
      "Has anyone entered our details on this link?",
    ],
  },
  "<20261023104212.7f3a@nuvio-cloud.fr>": {
    demande: "Pay invoice no. 2026-114 for €18,400 into a new bank account.",
    raisons: [
      "The reform forces no one to change banks: it is a pretext.",
      "Only this email asks to pay elsewhere.",
      "Short deadline to prevent any check.",
    ],
    questionsContreAppel: [
      "Did you send an email this morning announcing a change of bank?",
      "Can you confirm the last 4 digits of your IBAN?",
      "Who at your company signed these new bank details?",
    ],
  },
  "<20261023101503.11ab@arkos-systems.fr>": {
    demande: "Pay Lumio Data's invoice F-2026-219 (€2,350) today.",
    raisons: ["Urgency explained: overdue invoice, supplier chasing.", "Usual process, nothing abnormal."],
    questionsContreAppel: [],
  },
  "<20261023100512.4b2e@de1ivery-partners.fr>": {
    demande: "Pay invoice DP-2026-118 for €14,400 into a new account within 48 hours.",
    raisons: ["A change of bank slipped into the invoice: a classic fake bank details scam.", "48-hour deadline to prevent any check."],
    questionsContreAppel: [
      "Did you send us invoice DP-2026-118?",
      "Did you change banks this month?",
      "Do you use the address de1ivery-partners.fr?",
    ],
  },
  "<20261023095801.c2d4@mueller-technik.de>": {
    demande: "Pay invoice 2026-0388 for €9,870 to a new bank before Friday.",
    raisons: ["New bank announced with no explanation.", "The new account is only in the PDF.", "Short deadline: “bis Freitag”."],
    questionsContreAppel: [
      "Have you changed banks recently?",
      "Can you confirm the last 4 digits of your IBAN?",
      "Who sent invoice 2026-0388?",
    ],
  },
  "<CAF8x2kQ7@mail.gmail.com>": {
    demande: "Make a confidential €35,000 transfer today for an acquisition.",
    raisons: [
      "A CEO does not write from Gmail about €35,000.",
      "He demands secrecy, even from the CFO.",
      "He prevents any phone check.",
    ],
    questionsContreAppel: [
      "Did Jean-Pierre Durand request a €35,000 transfer this morning?",
      "Does he use a Gmail address for the company?",
      "Is Marc Lefèvre aware of this transaction?",
    ],
  },
  "<20261022174512.a1c9@banquehorizon-alerte.com>": {
    demande: "Make a €12,450 “security transfer” to a protection account.",
    raisons: ["A bank never asks for a transfer to protect an account.", "It forbids calling the branch."],
    questionsContreAppel: [
      "Was a suspicious transaction detected on our account?",
      "Did the bank ask for a transfer to a protection account?",
      "Did this email really come from your department?",
    ],
  },
  "<20261022161044.9e01@lumio-data.fr>": {
    demande: "Pay invoice F-2026-219 for €2,350 into the usual account.",
    raisons: ["Normal reminder from a known supplier."],
    questionsContreAppel: [],
  },
};
