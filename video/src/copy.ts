export type PitchLang = "fr" | "en";

type InlineLine =
  | {text: string}
  | {before: string; emphasis: string; after: string};

type PitchCopy = {
  story: {
    hook: {
      eyebrow: string;
      amount: string;
      headline: string;
      transfer: string;
      action: string;
      rewind: string;
    };
    alarm: {
      chapter: string;
      day: string;
      time: string;
      job: string;
      company: string;
      clockDay: string;
    };
    routine: {
      chapter: string;
      items: {title: string; label: string}[];
      footer: string[];
    };
    mail: {
      chapter: string;
      headlines: [string, string, string];
      subheading: string;
      dayAndTime: string;
      sender: string;
      email: string;
      subject: string;
      preview: string;
      body: InlineLine[];
      footer: string;
      notification: string;
    };
    click: {
      chapter: string;
      headline: string;
      approve: string;
      transfer: string;
      beneficiary: string;
      purpose: string;
      iban: string;
      amountLabel: string;
      amount: string;
      cancel: string;
      sent: string;
      action: string;
      irreversible: string;
    };
    loss: {
      chapter: string;
      eyebrow: string;
      headline: string | ((amount: string) => string);
      subheading: string;
      billAmount: string;
      caller: string;
      callState: string;
      question: string;
      counter: (amount: string) => string;
    };
    cost: {
      chapter: string;
      amount: string;
      label: string;
      explanation: [string, string];
      regionAndYear: string;
      nationalAmount: (amount: number) => string;
      nationalLabel: string;
      growth: string;
      growthLabel: string;
      source: string;
    };
    rewind: {
      chapter: string;
      rewind: string;
      headline: string;
      tagline: string;
      footer: string;
    };
  };
  how: {
    profile: {
      chapter: string;
      imageAlt: string;
      topLine: string;
      supplier: string;
      referenceIban: string;
      phone: string;
      usualAmount: string;
      range: string;
      confirmed: string;
      paymentCount: string;
    };
    history: {
      chapter: string;
      paymentCount: string;
      since: string;
      ibanLabel: string;
      emailRule: string;
      mailEyebrow: string;
      mailSubject: string;
      newIban: string;
      mismatch: string;
    };
    code: {
      chapter: string;
      rows: [string, string, string][];
      fraud: string;
    };
    ai: {
      chapter: string;
      subject: string;
      nodeLabel: string;
      title: string;
      chips: string[];
      reason: string;
    };
    rule: {
      chapter: string;
      verdicts: [string, string, string];
      blocked: string;
      bottom: string;
    };
  };
  demoHud: string;
  endCard: {
    label: string;
    tagline: string;
    footer: string;
  };
};

export const COPY: Record<PitchLang, PitchCopy> = {
  fr: {
    story: {
      hook: {
        eyebrow: "VIREMENT · ARKOS SYSTEMS",
        amount: "−35 000 €",
        headline: "PARTIS EN UN SEUL CLIC.",
        transfer: "VIREMENT CONFIDENTIEL",
        action: "VALIDER LE VIREMENT",
        rewind: "RETOUR AU DÉBUT · LUNDI, 7 H 02",
      },
      alarm: {
        chapter: "01 — RÉVEIL",
        day: "Lundi,",
        time: "7 h 02.",
        job: "ASSISTANTE DE DIRECTION",
        company: "ARKOS SYSTEMS",
        clockDay: "LUNDI",
      },
      routine: {
        chapter: "02 — ROUTINE",
        items: [
          {title: "Café", label: "LE RÉVEIL"},
          {title: "Métro", label: "LE TRAJET"},
          {title: "Boîte mail", label: "AU BUREAU"},
        ],
        footer: ["Café", "métro", "ordinateur"],
      },
      mail: {
        chapter: "03 — LE MESSAGE · 9:31",
        headlines: ["L'urgence.", "Le secret.", "35 000 €."],
        subheading: "Un mail qui semble venir du PDG.",
        dayAndTime: "LUNDI · 9:31",
        sender: "Jean-Pierre Durand",
        email: "jp.durand.pdg@gmail.com",
        subject: "Virement confidentiel",
        preview: "Je suis en réunion avec nos avocats…",
        body: [
          {text: "Je suis en réunion avec nos avocats"},
          {
            before: "j'ai besoin que tu passes un virement de ",
            emphasis: "35 000 €",
            after: " aujourd'hui",
          },
          {
            before: "",
            emphasis: "n'en parle à personne",
            after: ", même pas à Marc",
          },
        ],
        footer: "CONFIDENTIEL · ACTION REQUISE AUJOURD'HUI",
        notification: "Nouveau message · 9:31",
      },
      click: {
        chapter: "04 — LE CLIC",
        headline: "Le patron est pressé.",
        approve: "Claire valide.",
        transfer: "VIREMENT À EXÉCUTER",
        beneficiary: "Bénéficiaire : compte inconnu",
        purpose: "Objet : acquisition confidentielle",
        iban: "IBAN · FR76 •••• •••• 4417",
        amountLabel: "MONTANT",
        amount: "35 000 €",
        cancel: "Annuler",
        sent: "Virement envoyé ✓",
        action: "Valider le virement",
        irreversible: "ACTION IRRÉVERSIBLE",
      },
      loss: {
        chapter: "05 — LE LENDEMAIN",
        eyebrow: "LE VRAI PDG APPELLE",
        headline: () => " sont partis.",
        subheading: "Il n'a jamais envoyé ce mail.",
        billAmount: "50 €",
        caller: "Jean-Pierre Durand",
        callState: "APPEL ENTRANT",
        question: "« Quel virement ? »",
        counter: (amount) => `−${amount} €`,
      },
      cost: {
        chapter: "06 — LE COÛT",
        amount: "35 000 €",
        label: "COÛT POUR ARKOS SYSTEMS",
        explanation: ["En France, la fraude par", "manipulation explose."],
        regionAndYear: "FRANCE · 2025",
        nationalAmount: (amount) => `${amount} M€`,
        nationalLabel: "fraude par manipulation",
        growth: "+34 %",
        growthLabel: "en un an",
        source: "SOURCE : BANQUE DE FRANCE, RAPPORT OSMP 2025",
      },
      rewind: {
        chapter: "07 — LA BONNE DÉCISION",
        rewind: "REMBOBINER…",
        headline: "On bloque l'arnaque par mail",
        tagline: "à la source.",
        footer: "LE MAIL EST BLOQUÉ AVANT LE CLIC",
      },
    },
    how: {
      profile: {
        chapter: "PROFIL FOURNISSEUR · NUVIO CLOUD",
        imageAlt: "Capture réelle du profil fournisseur Nuvio Cloud",
        topLine: "UN PROFIL CONSTRUIT PAR LES PAIEMENTS",
        supplier: "Nuvio Cloud",
        referenceIban: "IBAN de référence",
        phone: "Téléphone",
        usualAmount: "Habituel",
        range: "15 000 €–20 000 €",
        confirmed: "CONFIRMÉ",
        paymentCount: "22 PAIEMENTS",
      },
      history: {
        chapter: "HISTORIQUE · 2019—2026",
        paymentCount: "22 paiements",
        since: "depuis 2019",
        ibanLabel: "UN SEUL IBAN DE RÉFÉRENCE",
        emailRule: "Un mail ne peut jamais modifier un profil.",
        mailEyebrow: "NOUVEAU RIB · PIÈCE JOINTE",
        mailSubject: "Changement de coordonnées bancaires",
        newIban: "FR78 •••• •••• 8213",
        mismatch: "IBAN DIFFÉRENT · ALERTE",
      },
      code: {
        chapter: "LE CODE VÉRIFIE · À CHAQUE MAIL",
        rows: [
          ["EXPÉDITEUR", "Domaine authentique de Nuvio Cloud", "✓"],
          ["IBAN", "Différent du profil", "✕"],
          ["MONTANT", "18 400 € · habituel", "✓"],
        ],
        fraud: "FRAUDE",
      },
      ai: {
        chapter: "IA · DONNÉES MINIMISÉES",
        subject: "Changement de coordonnées bancaires",
        nodeLabel: "IA · MISTRAL",
        title: "La demande, pas l'IBAN",
        chips: ["prétexte d’actualité", "changement de coordonnées bancaires", "urgence"],
        reason: "« La réforme ne force personne à changer de banque : prétexte. »",
      },
      rule: {
        chapter: "RÈGLE · LE VERDICT NE PEUT QUE MONTER",
        verdicts: ["FIABLE", "SUSPECT", "FRAUDE"],
        blocked: "↓ BLOQUÉ",
        bottom: "JAMAIS DANS L’AUTRE SENS",
      },
    },
    demoHud: "SOLEN · EN DIRECT",
    endCard: {
      label: "ESSAYEZ-LA",
      tagline: "On bloque l'arnaque par mail à la source.",
      footer: "HACKATHON FINAXYS · BUILD WHAT’S NEXT",
    },
  },
  en: {
    story: {
      hook: {
        eyebrow: "TRANSFER · ARKOS SYSTEMS",
        amount: "−€35,000",
        headline: "GONE IN A SINGLE CLICK.",
        transfer: "CONFIDENTIAL TRANSFER",
        action: "APPROVE TRANSFER",
        rewind: "REWIND · MONDAY, 7:02 A.M.",
      },
      alarm: {
        chapter: "01 — WAKE-UP",
        day: "Monday,",
        time: "7:02 a.m.",
        job: "EXECUTIVE ASSISTANT",
        company: "ARKOS SYSTEMS",
        clockDay: "MONDAY",
      },
      routine: {
        chapter: "02 — THE ROUTINE",
        items: [
          {title: "Coffee", label: "WAKE-UP"},
          {title: "Metro", label: "THE COMMUTE"},
          {title: "Inbox", label: "AT THE OFFICE"},
        ],
        footer: ["Coffee", "metro", "inbox"],
      },
      mail: {
        chapter: "03 — THE EMAIL · 9:31",
        headlines: ["The urgency.", "The secrecy.", "€35,000."],
        subheading: "An email that appears to come from the CEO.",
        dayAndTime: "MONDAY · 9:31 A.M.",
        sender: "Jean-Pierre Durand",
        email: "jp.durand.pdg@gmail.com",
        subject: "Confidential transfer",
        preview: "I'm in a meeting with our lawyers and can't talk.",
        body: [
          {text: "I'm in a meeting with our lawyers and can't talk."},
          {
            before: "We are closing an acquisition and I need you to make a ",
            emphasis: "€35,000 transfer",
            after: " today.",
          },
          {
            before: "This is strictly confidential until the deal is announced: ",
            emphasis: "don't tell anyone",
            after: ", not even Marc.",
          },
        ],
        footer: "CONFIDENTIAL · ACTION REQUIRED TODAY",
        notification: "New message · 9:31 a.m.",
      },
      click: {
        chapter: "04 — THE CLICK",
        headline: "The boss is in a hurry.",
        approve: "Claire approves.",
        transfer: "TRANSFER TO EXECUTE",
        beneficiary: "Beneficiary: unknown account",
        purpose: "Purpose: confidential acquisition",
        iban: "IBAN · FR76 •••• •••• 4417",
        amountLabel: "AMOUNT",
        amount: "€35,000",
        cancel: "Cancel",
        sent: "Transfer sent ✓",
        action: "Approve transfer",
        irreversible: "IRREVERSIBLE ACTION",
      },
      loss: {
        chapter: "05 — THE NEXT DAY",
        eyebrow: "THE REAL CEO CALLS",
        headline: "€35,000 is gone.",
        subheading: "He never sent that email.",
        billAmount: "€50",
        caller: "Jean-Pierre Durand",
        callState: "INCOMING CALL",
        question: "“What transfer?”",
        counter: (amount) => `−\u2009€${amount}`,
      },
      cost: {
        chapter: "06 — THE COST",
        amount: "€35,000",
        label: "COST TO ARKOS SYSTEMS",
        explanation: ["In France, payment manipulation", "fraud is rising."],
        regionAndYear: "FRANCE · 2025",
        nationalAmount: (amount) => `€${amount}M`,
        nationalLabel: "payment manipulation fraud",
        growth: "+34%",
        growthLabel: "year over year",
        source: "SOURCE: BANQUE DE FRANCE, OSMP 2025 REPORT",
      },
      rewind: {
        chapter: "07 — THE RIGHT CALL",
        rewind: "REWINDING…",
        headline: "We block email scams",
        tagline: "at the source.",
        footer: "BLOCK THE EMAIL BEFORE THE CLICK",
      },
    },
    how: {
      profile: {
        chapter: "SUPPLIER PROFILE · NUVIO CLOUD",
        imageAlt: "Live screenshot of the Nuvio Cloud supplier profile",
        topLine: "A PROFILE BUILT FROM PAYMENTS",
        supplier: "Nuvio Cloud",
        referenceIban: "Reference IBAN",
        phone: "Phone",
        usualAmount: "Usual amount",
        range: "€15,000 to €20,000",
        confirmed: "Confirmed",
        paymentCount: "22 PAYMENTS",
      },
      history: {
        chapter: "PAYMENT HISTORY · 2019–2026",
        paymentCount: "22 payments",
        since: "since 2019",
        ibanLabel: "ONE REFERENCE IBAN",
        emailRule: "An email can never change a profile.",
        mailEyebrow: "NEW BANK DETAILS · ATTACHMENT",
        mailSubject: "Change of bank details",
        newIban: "FR78 •••• •••• 8213",
        mismatch: "IBAN MISMATCH · ALERT",
      },
      code: {
        chapter: "CODE CHECKS · EVERY EMAIL",
        rows: [
          ["Sender", "Genuine domain of Nuvio Cloud.", "✓"],
          ["IBAN", "New IBAN: the usual one was used 22 times since 2019.", "✕"],
          ["Amount", "Usual amount: €18,400.", "✓"],
        ],
        fraud: "Likely fraud",
      },
      ai: {
        chapter: "AI · MINIMISED DATA",
        subject: "Change of bank details",
        nodeLabel: "AI · MISTRAL",
        title: "The request, not the IBAN",
        chips: ["topical pretext", "change of bank details", "urgency"],
        reason: "“The reform forces no one to change banks: it is a pretext.”",
      },
      rule: {
        chapter: "RULE · THE VERDICT CAN ONLY GO UP",
        verdicts: ["No anomaly", "Unusual request", "Likely fraud"],
        blocked: "↓ BLOCKED",
        bottom: "NEVER THE OTHER WAY",
      },
    },
    demoHud: "SOLEN · LIVE",
    endCard: {
      label: "TRY THE DEMO",
      tagline: "Stopping email scams at the source.",
      footer: "HACKATHON FINAXYS · BUILD WHAT’S NEXT",
    },
  },
};
