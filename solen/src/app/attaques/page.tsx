import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { COMPANY } from "@/data/company";
import { AttackReport, type AttackRow } from "@/components/AttackReport";
import { CASES } from "@/redteam/cases";
import { replayAll, type Replay } from "@/redteam/replay";

export const metadata: Metadata = { title: "28 attaques rejouées en direct - Solen" };

const MAX_BODY_PREVIEW = 700;

const toRow = ({ case: c, mail, result, stopped }: Replay): AttackRow => {
  const codeReasons = result.reasons.filter((r) => r.source === "code").map((r) => r.text);
  return {
    id: c.id,
    family: c.family,
    attack: c.attack,
    expected: c.expected,
    obtained: result.verdict,
    stopped,
    // Le constat qui a tranché : celui de la règle visée, sinon le premier constat du code.
    decisive: (c.rule && codeReasons.find((t) => t.includes(c.rule!))) || codeReasons[0],
    infobar: result.infobar,
    mail: {
      from: `${mail.fromName} <${mail.fromEmail}>`,
      subject: mail.subject,
      body: mail.body.length > MAX_BODY_PREVIEW ? `${mail.body.slice(0, MAX_BODY_PREVIEW)}…` : mail.body,
      attachments: mail.attachments.map((a) => a.name),
    },
  };
};

// Rejoue les 28 cas à chaque visite, côté serveur, avec une IA trompée qui répond toujours « fiable ».
const LiveReport = async () => {
  await connection();
  const { replays, durationMs, ranAt } = await replayAll(CASES);
  return <AttackReport companyName={COMPANY.name} rows={replays.map(toRow)} durationMs={durationMs} ranAt={ranAt} />;
};

export default function AttacksPage() {
  return (
    <Suspense fallback={<AttackReport companyName={COMPANY.name} rows={null} />}>
      <LiveReport />
    </Suspense>
  );
}
