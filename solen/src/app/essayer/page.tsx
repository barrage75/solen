import type { Metadata } from "next";
import { COMPANY, DIRECTORY, SUPPLIERS } from "@/data/company";
import { MAILS } from "@/data/mails";
import { MailTester, type Example } from "@/components/MailTester";

export const metadata: Metadata = { title: "Tester un mail - Solen" };

const EXAMPLES: { id: string; label: string }[] = [
  { id: "nuvio", label: "Faux changement de RIB" },
  { id: "sosie", label: "Domaine sosie" },
  { id: "pdg", label: "Fraude au président" },
  { id: "mfa", label: "Hameçonnage" },
  { id: "daf", label: "Vrai mail urgent" },
];

// Rendu côté serveur : le navigateur reçoit les noms et domaines connus, jamais les IBAN de référence.
export default function TesterPage() {
  const examples: Example[] = EXAMPLES.map(({ id, label }) => ({ id, label, mail: MAILS.find((m) => m.id === id)! }));
  return (
    <MailTester
      companyName={COMPANY.name}
      examples={examples}
      suppliers={SUPPLIERS.map((s) => ({ name: s.name, domain: s.domain }))}
      people={DIRECTORY.map((p) => ({ name: p.name, role: p.role, email: p.email }))}
    />
  );
}
