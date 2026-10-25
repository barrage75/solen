// Analyses de secours, écrites à l'avance : utilisées si Mistral ou le réseau tombe pendant la démo,
// ou si SOLEN_AI=secours pour développer sans consommer de crédits.
import type { AiAnalysis } from "@/lib/ai";

export const FALLBACK_ANALYSES: Record<string, AiAnalysis> = {
  "<20261023084711.5d0e@rapidocolis-suivi.com>": {
    demande: "Payer 1,99 € de frais de réexpédition sur un lien pour débloquer un colis.",
    langue: "français",
    techniques: ["urgence"],
    verdict: "fraude",
    raisons: [
      "Le vrai but : voler la carte bancaire saisie sur le faux site.",
      "Aucun colis attendu ne justifie ces frais.",
    ],
    questionsContreAppel: [
      "Attendons-nous un colis de Rapido Colis ?",
      "Quelqu'un a-t-il saisi une carte sur ce lien ?",
      "Faut-il prévenir le support informatique ?",
    ],
  },
  "<CAH3p9vT2@mail.gmail.com>": {
    demande: "Verser le salaire d'octobre de Sophie Martin sur un nouveau compte.",
    langue: "français",
    techniques: ["changement de coordonnées bancaires", "urgence", "contournement de la hiérarchie"],
    verdict: "fraude",
    raisons: [
      "Une adresse personnelle demande de détourner un salaire : fraude à la paie.",
      "L'excuse du déplacement évite toute vérification de vive voix.",
    ],
    questionsContreAppel: [
      "Avez-vous envoyé ce mail depuis Gmail ?",
      "Avez-vous vraiment changé de banque cette semaine ?",
      "Pouvez-vous déposer votre nouveau RIB au service RH ?",
    ],
  },
  "<DB9P194MB1123@outlook.fr>": {
    demande: "Acheter 1 000 € de cartes cadeaux et envoyer les codes par mail.",
    langue: "français",
    techniques: ["autorité", "secret", "urgence"],
    verdict: "fraude",
    raisons: [
      "Des codes de cartes cadeaux sont introuvables une fois envoyés.",
      "Un PDG ne demande pas de cartes cadeaux depuis Outlook.",
    ],
    questionsContreAppel: [
      "Avez-vous demandé des cartes cadeaux hier ?",
      "Cette adresse Outlook est-elle à vous ?",
      "Qui doit valider ce type d'achat ?",
    ],
  },
  "<20261022130533.e81b@verlaine-recouvrement.fr>": {
    demande: "Ouvrir une facture jointe de 3 960 € et la régler en ligne.",
    langue: "français",
    techniques: ["urgence", "autorité"],
    verdict: "fraude",
    raisons: [
      "Une facture en HTML ouvre une page web : souvent une fausse connexion.",
      "Menace de contentieux pour faire ouvrir la pièce jointe sans réfléchir.",
    ],
    questionsContreAppel: [
      "Connaissons-nous le cabinet Verlaine Recouvrement ?",
      "La facture 2026-1107 existe-t-elle dans notre comptabilité ?",
      "Quelqu'un a-t-il ouvert cette pièce jointe ?",
    ],
  },
  "<20261022102044.3c7a@delivery-partners.fr>": {
    demande: "Payer à 30 jours la facture DP-2026-104 de 13 200 €.",
    langue: "français",
    techniques: [],
    verdict: "fiable",
    raisons: [
      "Facture habituelle, sans urgence ni changement de coordonnées.",
      "Délai de paiement normal de 30 jours.",
    ],
    questionsContreAppel: [],
  },
  "<20261022094012.b6f3@domain-services-europe.com>": {
    demande: "Payer 389 € pour renouveler le nom de domaine arkos-systems.fr.",
    langue: "français",
    techniques: ["urgence", "prétexte d'actualité"],
    verdict: "fraude",
    raisons: [
      "Prestataire jamais payé : fausse facture de renouvellement classique.",
      "La menace de coupure pousse à payer sans vérifier.",
    ],
    questionsContreAppel: [
      "Chez qui notre nom de domaine est-il enregistré ?",
      "Avons-nous commandé un renouvellement à Domain Services Europe ?",
      "Quelle est la vraie date d'expiration du domaine ?",
    ],
  },
  "<20261022081533.0a4d@impots-remboursement-pro.fr>": {
    demande: "Confirmer les coordonnées bancaires sur un lien pour recevoir 1 284 €.",
    langue: "français",
    techniques: ["autorité", "urgence"],
    verdict: "fraude",
    raisons: [
      "L'administration ne fait jamais confirmer un compte par un lien.",
      "Le remboursement sert d'appât pour voler les coordonnées bancaires.",
    ],
    questionsContreAppel: [
      "Attendons-nous un remboursement d'impôt sur les sociétés ?",
      "Ce trop-perçu apparaît-il dans l'espace professionnel officiel ?",
      "Quelqu'un a-t-il saisi nos coordonnées sur ce lien ?",
    ],
  },
  "<20261023104212.7f3a@nuvio-cloud.fr>": {
    demande: "Payer la facture n°2026-114 de 18 400 € sur un nouveau compte bancaire.",
    langue: "français",
    techniques: ["prétexte d'actualité", "changement de coordonnées bancaires", "urgence"],
    verdict: "fraude",
    raisons: [
      "La réforme ne force personne à changer de banque : prétexte.",
      "Seul ce mail demande de payer ailleurs.",
      "Délai court pour empêcher de vérifier.",
    ],
    questionsContreAppel: [
      "Avez-vous envoyé ce matin un mail annonçant un changement de banque ?",
      "Pouvez-vous me confirmer les 4 derniers chiffres de votre IBAN ?",
      "Qui, chez vous, a signé ce nouveau RIB ?",
    ],
  },
  "<20261023101503.11ab@arkos-systems.fr>": {
    demande: "Régler aujourd'hui la facture F-2026-219 de Lumio Data (2 350 €).",
    langue: "français",
    techniques: ["urgence"],
    verdict: "fiable",
    raisons: [
      "Urgence expliquée : facture échue, fournisseur qui relance.",
      "Circuit habituel, rien d'anormal.",
    ],
    questionsContreAppel: [],
  },
  "<20261023100512.4b2e@de1ivery-partners.fr>": {
    demande: "Payer la facture DP-2026-118 de 14 400 € sur un nouveau compte, sous 48 h.",
    langue: "français",
    techniques: ["changement de coordonnées bancaires", "urgence"],
    verdict: "fraude",
    raisons: [
      "Changement de banque glissé dans la facture : faux RIB classique.",
      "Délai de 48 h pour empêcher de vérifier.",
    ],
    questionsContreAppel: [
      "Nous avez-vous envoyé la facture DP-2026-118 ?",
      "Avez-vous changé de banque ce mois-ci ?",
      "Utilisez-vous l'adresse de1ivery-partners.fr ?",
    ],
  },
  "<20261023095801.c2d4@mueller-technik.de>": {
    demande: "Payer la facture 2026-0388 de 9 870 € sur une nouvelle banque avant vendredi.",
    langue: "allemand",
    techniques: ["changement de coordonnées bancaires", "urgence"],
    verdict: "fraude",
    raisons: [
      "Nouvelle banque annoncée sans explication.",
      "Le nouveau compte n'est que dans le PDF.",
      "Délai court : « bis Freitag ».",
    ],
    questionsContreAppel: [
      "Avez-vous changé de banque récemment ?",
      "Pouvez-vous me confirmer les 4 derniers chiffres de votre IBAN ?",
      "Qui a envoyé la facture 2026-0388 ?",
    ],
  },
  "<CAF8x2kQ7@mail.gmail.com>": {
    demande: "Faire aujourd'hui un virement confidentiel de 35 000 € pour une acquisition.",
    langue: "français",
    techniques: ["autorité", "secret", "contournement de la hiérarchie"],
    verdict: "fraude",
    raisons: [
      "Un PDG n'écrit pas depuis Gmail pour 35 000 €.",
      "Il exige le secret, même vis-à-vis du DAF.",
      "Il empêche toute vérification par téléphone.",
    ],
    questionsContreAppel: [
      "Jean-Pierre Durand a-t-il demandé un virement de 35 000 € ce matin ?",
      "Utilise-t-il une adresse Gmail pour l'entreprise ?",
      "Marc Lefèvre est-il informé de cette opération ?",
    ],
  },
  "<20261022174512.a1c9@banquehorizon-alerte.com>": {
    demande: "Faire un « virement de sécurité » de 12 450 € vers un compte de protection.",
    langue: "français",
    techniques: ["urgence", "autorité", "contournement de la hiérarchie"],
    verdict: "fraude",
    raisons: [
      "Une banque ne demande jamais de virement pour protéger un compte.",
      "Il interdit d'appeler l'agence.",
    ],
    questionsContreAppel: [
      "Une opération suspecte a-t-elle été détectée sur notre compte ?",
      "La banque a-t-elle demandé un virement vers un compte de protection ?",
      "Ce mail vient-il bien de vos services ?",
    ],
  },
  "<20261022161044.9e01@lumio-data.fr>": {
    demande: "Régler la facture F-2026-219 de 2 350 € sur le compte habituel.",
    langue: "français",
    techniques: [],
    verdict: "fiable",
    raisons: ["Relance normale d'un fournisseur connu."],
    questionsContreAppel: [],
  },
};
