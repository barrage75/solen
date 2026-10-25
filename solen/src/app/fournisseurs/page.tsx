import type { Metadata } from "next";
import { COMPANY, DIRECTORY, MAILBOX_OWNER, SUPPLIERS } from "@/data/company";
import { MAILS } from "@/data/mails";
import { maskIban } from "@/lib/iban";
import type { PendingChangeData } from "@/components/PendingChange";
import { SupplierPortal, type SupplierRow } from "@/components/SupplierPortal";

export const metadata: Metadata = { title: "Profils fournisseurs - Solen" };

// IBAN du « nouveau RIB » joint au mail de Nuvio Cloud (public/attachments/Nouveau_RIB_Nuvio_Cloud.pdf).
const NUVIO_NEW_IBAN = "FR78 1695 8000 0100 4712 8148 213";

// Rendu côté serveur : les IBAN complets ne partent jamais vers le navigateur, seulement leur version masquée.
export default function SuppliersPage() {
  const rows: SupplierRow[] = SUPPLIERS.map((s) => ({
    id: s.id,
    name: s.name,
    domain: s.domain,
    maskedIban: maskIban(s.iban),
    phone: s.phone,
    usualAmount: `${s.usualAmount.min.toLocaleString("fr-FR")} à ${s.usualAmount.max.toLocaleString("fr-FR")} €`,
    // Confirmé = au moins 3 paiements réussis vers cet IBAN.
    trust: s.paymentsToIban >= 3 ? "confirmé" : "nouveau",
    learnedFrom: `${s.paymentsToIban} paiements depuis ${s.since}`,
  }));

  const nuvio = SUPPLIERS.find((s) => s.id === "nuvio")!;
  const mail = MAILS.find((m) => m.id === "nuvio")!;
  const pendingChange: PendingChangeData = {
    supplierId: nuvio.id,
    supplierName: nuvio.name,
    fromEmail: mail.from.emailAddress,
    receivedAt: `${mail.received.time}:12`,
    attachment: mail.attachments[0].name,
    currentMaskedIban: maskIban(nuvio.iban),
    newMaskedIban: maskIban(NUVIO_NEW_IBAN),
    phone: nuvio.phone,
  };
  const approvers = {
    accountant: MAILBOX_OWNER.name,
    daf: DIRECTORY.find((p) => p.role === "DAF")!.name,
  };

  return <SupplierPortal companyName={COMPANY.name} rows={rows} pendingChange={pendingChange} approvers={approvers} />;
}
