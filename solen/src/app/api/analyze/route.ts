import { analyzeMail, type MailPayload } from "@/lib/analyze";
import { MAX_ATTACHMENT_BYTES, pdfText } from "@/lib/pdf";
import { createRateLimiter } from "@/lib/rateLimit";

type Body = Omit<MailPayload, "attachments"> & {
  // Comme getAttachmentContentAsync d'Office.js : le contenu arrive encodé en base64.
  attachments: { name: string; contentType: string; contentBase64: string }[];
};

const MAX_BODY_CHARS = 50_000;
const MAX_ATTACHMENTS = 5;

// Limite par adresse IP : sans elle, n'importe qui pourrait vider les crédits Mistral
// ou tester ses faux mails en boucle jusqu'à trouver celui qui passe.
const limiter = createRateLimiter({ max: 20, windowMs: 60_000, maxTrackedIps: 1000 });

// Le base64 grossit les données d'un tiers : au-delà, la pièce jointe dépasse la taille lue par pdfText.
const MAX_BASE64_CHARS = Math.ceil((MAX_ATTACHMENT_BYTES * 4) / 3) + 4;

const isString = (v: unknown): v is string => typeof v === "string";
const OPTIONAL_TEXT_FIELDS = ["internetMessageId", "subject", "fromName", "headers"] as const;

// Le corps de la requête vient de n'importe qui : on vérifie chaque champ avant de l'analyser,
// pour répondre 400 au lieu de planter sur un champ absent ou du mauvais type.
const parseBody = (raw: unknown): Body | null => {
  if (typeof raw !== "object" || raw === null) return null;
  const b = raw as Record<string, unknown>;
  if (!isString(b.body) || !isString(b.fromEmail)) return null;
  if (OPTIONAL_TEXT_FIELDS.some((k) => b[k] !== undefined && !isString(b[k]))) return null;
  const attachments = b.attachments ?? [];
  if (!Array.isArray(attachments)) return null;
  const valid = attachments.every(
    (a) =>
      typeof a === "object" && a !== null && isString(a.name) && isString(a.contentType) && isString(a.contentBase64),
  );
  if (!valid) return null;
  return {
    internetMessageId: isString(b.internetMessageId) ? b.internetMessageId : "",
    subject: isString(b.subject) ? b.subject : "",
    fromName: isString(b.fromName) ? b.fromName : "",
    headers: isString(b.headers) ? b.headers : "",
    fromEmail: b.fromEmail,
    body: b.body,
    attachments: attachments as Body["attachments"],
  };
};

const readAttachment = async (a: Body["attachments"][number]) => {
  if (a.contentType !== "application/pdf") return { name: a.name, text: "" };
  const text = await pdfText(new Uint8Array(Buffer.from(a.contentBase64, "base64")));
  // Un PDF sans texte est un scan : on ne peut pas y lire l'IBAN, donc on le signale.
  return text === null || text.trim() === "" ? { name: a.name, text: "", unreadable: true } : { name: a.name, text };
};

export const POST = async (request: Request) => {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (limiter.isLimited(ip)) return Response.json({ error: "Trop de demandes, réessayez dans une minute." }, { status: 429 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }
  const body = parseBody(raw);
  if (!body) return Response.json({ error: "Mail incomplet" }, { status: 400 });
  if (
    body.body.length > MAX_BODY_CHARS ||
    body.attachments.length > MAX_ATTACHMENTS ||
    body.attachments.some((a) => a.contentBase64.length > MAX_BASE64_CHARS)
  ) {
    return Response.json({ error: "Mail trop volumineux" }, { status: 413 });
  }
  const attachments = await Promise.all(body.attachments.map(readAttachment));
  return Response.json(await analyzeMail({ ...body, attachments }));
};
