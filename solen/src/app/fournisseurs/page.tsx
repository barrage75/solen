import type { Metadata } from "next";
import { COMPANY, SUPPLIERS } from "@/data/company";
import { maskIban } from "@/lib/iban";
import { SupplierPortal, type SupplierRow } from "@/components/SupplierPortal";

export const metadata: Metadata = { title: "Profils fournisseurs - Solen" };

// Rendu côté serveur : les IBAN complets ne partent jamais vers le navigateur, seulement leur version masquée.
export default function SuppliersPage() {
  const rows: SupplierRow[] = SUPPLIERS.map((s) => ({
    id: s.id,
    name: s.name,
    domain: s.domain,
    maskedIban: maskIban(s.iban),
    phone: s.phone,
    usualMin: s.usualAmount.min,
    usualMax: s.usualAmount.max,
    // Confirmé = au moins 3 paiements réussis vers cet IBAN.
    trust: s.paymentsToIban >= 3 ? "confirmé" : "nouveau",
    payments: s.paymentsToIban,
    since: s.since,
  }));

  return <SupplierPortal companyName={COMPANY.name} rows={rows} />;
}
