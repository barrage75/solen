import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { COMPANY } from "@/data/company";
import { ImpactReport } from "@/components/ImpactReport";
import { computeImpact } from "@/impact/compute";
import { CASES } from "@/redteam/cases";
import { replayAll } from "@/redteam/replay";

export const metadata: Metadata = { title: "Impact - Solen" };

// Calculé à chaque visite avec le vrai code : la page ne peut pas afficher un chiffre que le code ne produit plus.
const LiveImpact = async () => {
  await connection();
  const [impact, { replays }] = await Promise.all([computeImpact(), replayAll(CASES)]);
  const attacks = replays.filter((r) => r.case.expected !== "fiable");
  const genuine = replays.filter((r) => r.case.expected === "fiable");
  return (
    <ImpactReport
      companyName={COMPANY.name}
      impact={impact}
      redTeam={{
        stopped: attacks.filter((r) => r.stopped).length,
        attacks: attacks.length,
        falseAlarms: genuine.filter((r) => !r.stopped).length,
        genuine: genuine.length,
      }}
    />
  );
};

export default function ImpactPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Calcul de l&apos;impact…</p>}>
      <LiveImpact />
    </Suspense>
  );
}
