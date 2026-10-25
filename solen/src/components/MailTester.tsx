"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Field, FluentProvider, Input, Select, Textarea, webLightTheme } from "@fluentui/react-components";
import { Attach20Regular, Dismiss16Regular, DocumentPdf20Regular, Send20Regular } from "@fluentui/react-icons";
import type { Mail } from "@/data/mails";
import type { AnalysisResult } from "@/lib/analyze";
import { useLang } from "@/i18n/lang";
import { translateResult, translateRole } from "@/i18n/result";
import { useStrings } from "@/i18n/useStrings";
import { LangSwitch } from "./LangSwitch";
import { SolenLogo } from "./SolenLogo";
import { SolenPane } from "./SolenPane";
import { applyReflex, EMPTY_VIGILANCE, type Reflex } from "./vigilance";
import {
  draftFromMail,
  EMPTY_DRAFT,
  isValidEmail,
  MAX_BODY_CHARS,
  MAX_PDF_BYTES,
  toMail,
  type AuthChoice,
  type Draft,
  type DraftAttachment,
} from "./mailDraft";
import portal from "./portal.module.css";
import styles from "./tester.module.css";

export type Example = { id: string; label: string; mail: Mail };
type Props = {
  companyName: string;
  examples: Example[];
  suppliers: { name: string; domain: string }[];
  people: { name: string; role: string; email: string }[];
};

type Shown = { mail: Mail; result?: AnalysisResult; error?: string };

const AUTH_CHOICES: AuthChoice[] = ["pass", "fail", "none"];

const toBase64 = async (attachment: DraftAttachment) => {
  const buffer = attachment.file ? await attachment.file.arrayBuffer() : await (await fetch(attachment.url!)).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  // Par morceaux : String.fromCharCode refuse un trop grand nombre d'arguments d'un coup.
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

const analyze = async (mail: Mail, attachment?: DraftAttachment): Promise<AnalysisResult> => {
  const attachments = attachment
    ? [{ name: attachment.name, contentType: "application/pdf", contentBase64: await toBase64(attachment) }]
    : [];
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      internetMessageId: mail.internetMessageId,
      subject: mail.subject,
      fromName: mail.from.displayName,
      fromEmail: mail.from.emailAddress,
      headers: mail.internetHeaders,
      body: mail.body,
      attachments,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? `Analyse impossible (HTTP ${response.status}).`);
  return data;
};

export const MailTester = ({ companyName, examples, suppliers, people }: Props) => {
  const lang = useLang();
  const t = useStrings();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [exampleId, setExampleId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ fromEmail?: string; body?: string; attachment?: string }>({});
  const [shown, setShown] = useState<Shown | null>(null);
  const [vigilance, setVigilance] = useState(EMPTY_VIGILANCE);
  const fileInput = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const running = Boolean(shown && !shown.result && !shown.error);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const loadExample = (example: Example) => {
    setExampleId(example.id);
    setDraft(draftFromMail(example.mail));
    setErrors({});
  };

  const clear = () => {
    setExampleId(null);
    setDraft(EMPTY_DRAFT);
    setErrors({});
    setShown(null);
  };

  const pickFile = (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrors((e) => ({ ...e, attachment: t.tester.errPdfType }));
    } else if (file.size > MAX_PDF_BYTES) {
      setErrors((e) => ({ ...e, attachment: t.tester.errPdfSize }));
    } else {
      setErrors((e) => ({ ...e, attachment: undefined }));
      update("attachment", { name: file.name, file });
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = {
      fromEmail: isValidEmail(draft.fromEmail) ? undefined : t.tester.errEmail,
      body: draft.body.trim() ? undefined : t.tester.errBody,
    };
    setErrors((e) => ({ ...e, ...found }));
    if (found.fromEmail || found.body) return;

    const id = `essai-${crypto.randomUUID().slice(0, 8)}`;
    const example = examples.find((x) => x.id === exampleId)?.mail;
    const mail = toMail(draft, example, id);
    setShown({ mail });
    // Sur téléphone, le résultat est sous le formulaire : on l'amène à l'écran.
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    try {
      const result = await analyze(mail, draft.attachment);
      setShown((s) => (s?.mail.id === id ? { ...s, result } : s));
    } catch (error) {
      const message = error instanceof Error ? error.message : t.tester.errAnalyze;
      setShown((s) => (s?.mail.id === id ? { ...s, error: message } : s));
    }
  };

  // Le résultat s'affiche dans la langue du visiteur ; l'analyse, elle, reste celle du serveur.
  const result = shown?.result && translateResult(shown.result, lang).result;

  const onReflex = (reflex: Reflex) => {
    const r = shown?.result;
    if (!shown || !r) return;
    setVigilance(
      (v) =>
        applyReflex(v, {
          mailId: shown.mail.id,
          reflex,
          alert: r.verdict !== "fiable",
          amount: r.amount,
          lookalike: Boolean(r.sender.lookalike),
          impersonation: r.sender.kind === "impersonation",
        }).state,
    );
  };

  return (
    // Classe sur un conteneur intérieur : Fluent recopie la classe du fournisseur sur ses couches flottantes
    // (info-bulles), qui couvriraient alors tout l'écran.
    <FluentProvider theme={webLightTheme}>
      <div className={portal.root}>
      <header className={portal.header}>
        <span className={portal.brand}>
          <SolenLogo /> Solen
        </span>
        <span className={portal.company}>
          {companyName} · {t.tester.company}
        </span>
        <span className={portal.headerEnd}>
          <LangSwitch />
        </span>
      </header>
      <main className={`${portal.main} ${styles.main}`}>
        <Link href="/" className={portal.backLink}>
          <span aria-hidden="true">←</span> {t.common.backToMailbox}
        </Link>

        <div className={portal.titleRow}>
          <div>
            <h1>{t.tester.title}</h1>
            <p className={styles.lead}>{t.tester.lead(companyName)}</p>
          </div>
        </div>

        <div className={styles.layout}>
          <form className={styles.form} onSubmit={submit} noValidate>
            <div className={styles.examples}>
              <span className={styles.examplesLabel}>{t.tester.examples}</span>
              <div className={styles.chips}>
                {examples.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    className={exampleId === x.id ? styles.chipOn : styles.chip}
                    onClick={() => loadExample(x)}
                  >
                    {t.tester.exampleLabels[x.id] ?? x.label}
                  </button>
                ))}
              </div>
              {t.tester.examplesNote && <span className={styles.examplesNote}>{t.tester.examplesNote}</span>}
            </div>

            <div className={styles.row2}>
              <Field label={t.tester.fromName}>
                <Input value={draft.fromName} onChange={(_, d) => update("fromName", d.value)} placeholder="Nuvio Cloud" />
              </Field>
              <Field label={t.tester.fromEmail} required validationMessage={errors.fromEmail}>
                <Input
                  type="email"
                  value={draft.fromEmail}
                  onChange={(_, d) => {
                    update("fromEmail", d.value);
                    setErrors((e) => ({ ...e, fromEmail: undefined }));
                  }}
                  placeholder="facturation@nuvio-cloud.fr"
                />
              </Field>
            </div>

            <Field
              label={t.tester.auth}
              hint={t.tester.authHint}
            >
              <Select value={draft.auth} onChange={(_, d) => update("auth", d.value as AuthChoice)}>
                {AUTH_CHOICES.map((k) => (
                  <option key={k} value={k}>
                    {k === "pass" ? t.tester.authPass : k === "fail" ? t.tester.authFail : t.tester.authNone}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t.tester.subject}>
              <Input value={draft.subject} onChange={(_, d) => update("subject", d.value)} placeholder={t.tester.subjectPlaceholder} />
            </Field>

            <Field label={t.tester.body} required validationMessage={errors.body}>
              <Textarea
                value={draft.body}
                onChange={(_, d) => {
                  update("body", d.value);
                  setErrors((e) => ({ ...e, body: undefined }));
                }}
                maxLength={MAX_BODY_CHARS}
                resize="vertical"
                rows={9}
                placeholder={t.tester.bodyPlaceholder}
              />
            </Field>

            <Field label={t.tester.attachment} validationMessage={errors.attachment}>
              {draft.attachment ? (
                <span className={styles.attachment}>
                  <DocumentPdf20Regular />
                  <span>{draft.attachment.name}</span>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<Dismiss16Regular />}
                    aria-label={t.tester.removeAttachment}
                    onClick={() => update("attachment", undefined)}
                  />
                </span>
              ) : (
                <span>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="application/pdf,.pdf"
                    className={styles.hiddenInput}
                    onChange={(e) => pickFile(e.target.files?.[0])}
                  />
                  <Button icon={<Attach20Regular />} onClick={() => fileInput.current?.click()}>
                    {t.tester.attach}
                  </Button>
                </span>
              )}
            </Field>

            <p className={styles.privacy}>{t.tester.privacy}</p>

            <div className={styles.actions}>
              <Button type="submit" appearance="primary" icon={<Send20Regular />} disabled={running}>
                {running ? t.tester.analyzing : t.tester.analyze}
              </Button>
              <Button type="button" onClick={clear}>
                {t.tester.clear}
              </Button>
            </div>

            <details className={styles.known}>
              <summary>{t.tester.known(companyName)}</summary>
              <p>{t.tester.knownIntro}</p>
              <ul>
                {suppliers.map((s) => (
                  <li key={s.domain}>
                    {t.tester.supplier} <strong>{s.name}</strong> · <span className={styles.mono}>{s.domain}</span>
                  </li>
                ))}
                {people.map((p) => (
                  <li key={p.email}>
                    {lang === "en" ? translateRole(p.role) : p.role} <strong>{p.name}</strong> · <span className={styles.mono}>{p.email}</span>
                  </li>
                ))}
              </ul>
              <p>{t.tester.ideas}</p>
            </details>
          </form>

          <div className={styles.result} ref={resultRef} aria-live="polite">
            {shown ? (
              <>
                {result && (
                  <>
                    <p className={`${styles.infobar} ${styles[result.verdict]}`}>{result.infobar}</p>
                    <p className={styles.aiNote}>{t.tester.aiNote[result.ai]}</p>
                  </>
                )}
                {shown.error && <p className={styles.error}>{shown.error}</p>}
                <div className={styles.paneSlot}>
                  <SolenPane
                    key={shown.mail.id}
                    mail={shown.mail}
                    result={result}
                    error={shown.error}
                    onClose={() => setShown(null)}
                    vigilance={vigilance}
                    onReflex={onReflex}
                  />
                </div>
              </>
            ) : (
              <div className={styles.placeholder}>
                <SolenLogo />
                <p>{t.tester.placeholder}</p>
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </FluentProvider>
  );
};
