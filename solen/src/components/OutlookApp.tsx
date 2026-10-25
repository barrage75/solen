"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Button, FluentProvider, Tooltip, webLightTheme } from "@fluentui/react-components";
import {
  Alert20Regular,
  Apps24Regular,
  ArrowSwap20Regular,
  Archive20Regular,
  ArrowForward20Regular,
  ArrowReply20Regular,
  ArrowReplyAll20Regular,
  Attach16Regular,
  BuildingMultiple20Regular,
  Calendar24Regular,
  CheckboxChecked24Regular,
  ChevronDown16Regular,
  Delete20Regular,
  DocumentGlobe24Filled,
  DocumentPdf24Filled,
  Drafts20Regular,
  ErrorCircle20Filled,
  Filter20Regular,
  Flag20Regular,
  FolderProhibited20Regular,
  Grid20Regular,
  Image24Filled,
  Info20Regular,
  Mail24Filled,
  MailInbox20Regular,
  MailEdit20Regular,
  MoreHorizontal20Regular,
  Note20Regular,
  People24Regular,
  QuestionCircle20Regular,
  Search20Regular,
  Send20Regular,
  Settings20Regular,
  ShieldError20Regular,
} from "@fluentui/react-icons";
import { MAILBOX_OWNER } from "@/data/company";
import { MAILS, type Mail } from "@/data/mails";
import { displayMail } from "@/data/mails.en";
import { useLang } from "@/i18n/lang";
import { translateResult } from "@/i18n/result";
import type { Strings } from "@/i18n/ui";
import { useStrings } from "@/i18n/useStrings";
import type { AnalysisResult } from "@/lib/analyze";
import { SpotlightTour, tourSteps, type TourStep } from "./GuidedTour";
import { LangSwitch } from "./LangSwitch";
import { SolenLogo } from "./SolenLogo";
import { SolenPane } from "./SolenPane";
import { applyReflex, EMPTY_VIGILANCE, type BadgeId, type Reflex, type VigilanceState } from "./vigilance";
import { analyze } from "./mailClient";
import styles from "./outlook.module.css";

const STORAGE_KEY = "solen-installe";
// Touches 1 à 6 : ouvrent les mails dans l'ordre de la démo.
const DEMO_ORDER = ["nuvio", "mfa", "pdg", "daf", "conseiller", "sosie"];
const VIGILANCE_KEY = "solen-vigilance";

const loadVigilance = (): VigilanceState => {
  try {
    const saved = localStorage.getItem(VIGILANCE_KEY);
    return saved ? { ...EMPTY_VIGILANCE, ...JSON.parse(saved) } : EMPTY_VIGILANCE;
  } catch {
    return EMPTY_VIGILANCE;
  }
};

const saveVigilance = (state: VigilanceState) => {
  try {
    localStorage.setItem(VIGILANCE_KEY, JSON.stringify(state));
  } catch {}
};

const dateOf = (mail: Mail) => {
  const d = new Date();
  d.setDate(d.getDate() + mail.received.dayOffset);
  const [h, m] = mail.received.time.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};

const listDate = (mail: Mail, locale: string) =>
  mail.received.dayOffset === 0
    ? mail.received.time
    : dateOf(mail).toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "2-digit" });

const fullDate = (mail: Mail, locale: string) =>
  `${dateOf(mail).toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })} ${mail.received.time}`;

const preview = (mail: Mail) => mail.body.replace(/\s+/g, " ").slice(0, 110);

// Icône de la pièce jointe selon son type : PDF, image, ou page web (souvent un piège).
const AttachmentIcon = ({ contentType }: { contentType: string }) =>
  contentType === "application/pdf" ? (
    <DocumentPdf24Filled className={styles.pdfIcon} />
  ) : contentType.startsWith("image/") ? (
    <Image24Filled className={styles.imageIcon} />
  ) : (
    <DocumentGlobe24Filled className={styles.webIcon} />
  );

export const OutlookApp = () => {
  const router = useRouter();
  const lang = useLang();
  const t: Strings = useStrings();
  const [selectedId, setSelectedId] = useState(MAILS[0].id);
  const [read, setRead] = useState<Set<string>>(new Set([MAILS[0].id]));
  // Composant rendu uniquement dans le navigateur (ssr: false) : localStorage est disponible ici.
  const [installed, setInstalled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "0";
    } catch {
      return true;
    }
  });
  // Désépinglé au chargement : aucune analyse (ni appel à Mistral) tant qu'on n'appuie pas sur S ou sur le bouton Solen.
  const [paneOpen, setPaneOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, AnalysisResult>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vigilance, setVigilance] = useState<VigilanceState>(loadVigilance);
  const [toast, setToast] = useState<BadgeId | null>(null);
  // Visite guidée : reproposée à chaque chargement ou actualisation de la page, rien n'est mémorisé.
  // La touche V et le bouton « ? » la relancent à tout moment.
  const [tourOpen, setTourOpen] = useState(true);
  // Pendant la visite, les raccourcis de la démo sont coupés : la visite a ses propres touches.
  const tourOpenRef = useRef(tourOpen);
  useEffect(() => {
    tourOpenRef.current = tourOpen;
  }, [tourOpen]);
  // Sous 900 px, la liste des mails se replie pour laisser la place au mail et au volet Solen.
  const [listOpen, setListOpen] = useState(false);

  // L'analyse lit toujours le mail d'origine ; l'écran montre sa version dans la langue choisie.
  const mail = MAILS.find((m) => m.id === selectedId)!;
  const shown = displayMail(mail, lang);

  // Démo « avant / après » : retire ou réinstalle Solen. Bouton visible ou touche A.
  const toggleInstalled = useCallback(() => {
    setInstalled((v) => {
      try {
        localStorage.setItem(STORAGE_KEY, v ? "0" : "1");
      } catch {}
      return !v;
    });
    setPaneOpen(true);
    setDismissed(new Set());
  }, []);

  useEffect(() => {
    // Raccourcis d'une seule touche, sans modificateur : Alt+Maj change la langue du clavier sous Windows.
    // On lit event.key (le caractère tapé) et non event.code (la position QWERTY), sinon les lettres
    // sont fausses sur un clavier AZERTY.
    const onKey = (e: KeyboardEvent) => {
      if (tourOpenRef.current || e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable || target?.closest?.("input, textarea, select, [contenteditable]")) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        // S : ouvre ou ferme le volet. Fermé, Solen n'analyse plus rien (utile avant la démo).
        setPaneOpen((v) => !v);
      } else if (key === "a") {
        toggleInstalled();
      } else if (key === "v") {
        setTourOpen(true);
      } else if (key === "r") {
        setVigilance(EMPTY_VIGILANCE);
        saveVigilance(EMPTY_VIGILANCE);
      } else if (key === "f") {
        router.push("/fournisseurs");
      } else if (key === "e") {
        router.push("/essayer");
      } else {
        const demoMail = DEMO_ORDER[Number(key) - 1];
        if (demoMail) {
          setSelectedId(demoMail);
          setRead((prev) => new Set(prev).add(demoMail));
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleInstalled, router]);

  useEffect(() => {
    // Comme dans Outlook, le module ne tourne que si son volet est ouvert (épinglé) : volet fermé, aucun appel à l'IA.
    if (!installed || !paneOpen) return;
    let cancelled = false;
    analyze(mail)
      .then((r) => !cancelled && setResults((prev) => ({ ...prev, [mail.id]: r })))
      .catch((e: Error) => !cancelled && setErrors((prev) => ({ ...prev, [mail.id]: e.message })));
    return () => {
      cancelled = true;
    };
  }, [installed, paneOpen, mail]);

  const onReflex = (reflex: Reflex) => {
    const r = results[mail.id];
    if (!r) return;
    const { state, unlocked } = applyReflex(vigilance, {
      mailId: mail.id,
      reflex,
      alert: r.verdict !== "fiable",
      amount: r.amount,
      lookalike: Boolean(r.sender.lookalike),
      impersonation: r.sender.kind === "impersonation",
    });
    setVigilance(state);
    saveVigilance(state);
    if (unlocked.length) {
      setToast(unlocked[unlocked.length - 1]);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const select = (id: string) => {
    setSelectedId(id);
    setRead((prev) => new Set(prev).add(id));
    setListOpen(false);
  };

  // La visite ouvre elle-même le bon mail et épingle le volet : le visiteur voit l'analyse sans connaître les raccourcis.
  const enterTourStep = (step: TourStep) => {
    if (step.mail) {
      const id = step.mail;
      select(id);
      // Un bandeau ignoré plus tôt doit réapparaître pour que la visite puisse le montrer.
      setDismissed((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    if (step.pane) {
      setInstalled(true);
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {}
      setPaneOpen(true);
    }
  };

  const groups = useMemo(
    () => [
      { label: t.mailbox.today, mails: MAILS.filter((m) => m.received.dayOffset === 0).map((m) => displayMail(m, lang)) },
      { label: t.mailbox.yesterday, mails: MAILS.filter((m) => m.received.dayOffset === -1).map((m) => displayMail(m, lang)) },
    ],
    [t, lang],
  );

  // Même tableau tant que la langue ne change pas : la visite ne relance pas son étape à chaque rendu.
  const steps = useMemo(() => tourSteps(t), [t]);

  const unreadCount = MAILS.filter((m) => m.unread && !read.has(m.id)).length;
  const rawResult = results[mail.id];
  const result = rawResult && translateResult(rawResult, lang).result;
  // Un module ne peut afficher sa notification que s'il tourne, c'est-à-dire volet épinglé et ouvert.
  const showInfobar = installed && paneOpen && result && !dismissed.has(mail.id);

  return (
    // La classe de mise en page reste sur un conteneur intérieur : Fluent recopie la classe du fournisseur sur les
    // couches flottantes (info-bulles, fenêtres), qui couvriraient alors tout l'écran.
    <FluentProvider theme={webLightTheme}>
      <div className={styles.root}>
        <header className={styles.topBar}>
          <span className={styles.waffle}>
            <Grid20Regular />
          </span>
          <span className={styles.productName}>Outlook</span>
          <div className={styles.search}>
            <Search20Regular />
            <span>{t.mailbox.search}</span>
          </div>
          <div className={styles.topIcons}>
            {/* Même onglet : la page fournisseurs a son bouton de retour, et l'état de la boîte mail est conservé. */}
            <Link href="/fournisseurs" className={styles.suppliersLink} data-tour="suppliers" aria-label={t.common.suppliers}>
              <BuildingMultiple20Regular /> <span className={styles.suppliersText}>{t.common.suppliers}</span>
            </Link>
            <Link href="/essayer" className={`${styles.suppliersLink} ${styles.compactLink}`} aria-label={t.mailbox.tryMailLabel}>
              <MailEdit20Regular /> <span>{t.mailbox.tryMail}</span>
            </Link>
            <LangSwitch />
            <Alert20Regular />
            <Settings20Regular />
            <Tooltip content={t.mailbox.restartTour} relationship="label">
              <button type="button" className={styles.topIconButton} onClick={() => setTourOpen(true)}>
                <QuestionCircle20Regular />
              </button>
            </Tooltip>
            <Avatar name={MAILBOX_OWNER.name} size={32} color="colorful" className={styles.topAvatar} />
          </div>
        </header>

        <div className={styles.shell}>
          <nav className={styles.appRail} aria-label={t.mailbox.apps}>
            <span className={styles.railActive}>
              <Mail24Filled />
            </span>
            <Calendar24Regular />
            <People24Regular />
            <CheckboxChecked24Regular />
            <Apps24Regular />
          </nav>

          <div className={styles.main}>
            <div className={styles.ribbonTabs}>
              <span className={styles.ribbonTabActive}>{t.mailbox.tabs[0]}</span>
              <span>{t.mailbox.tabs[1]}</span>
              <span>{t.mailbox.tabs[2]}</span>
            </div>
            <div className={styles.ribbon}>
              <Button appearance="primary" size="small">
                {t.mailbox.newMail}
              </Button>
              <span className={styles.ribbonExtra}>
                <span className={styles.ribbonSep} />
                <Button appearance="subtle" size="small" icon={<Delete20Regular />}>
                  {t.mailbox.delete}
                </Button>
                <Button appearance="subtle" size="small" icon={<Archive20Regular />}>
                  {t.mailbox.archive}
                </Button>
                <Button appearance="subtle" size="small" icon={<ShieldError20Regular />}>
                  {t.mailbox.report}
                </Button>
                <span className={styles.ribbonSep} />
                <Button appearance="subtle" size="small" icon={<ArrowReply20Regular />}>
                  {t.mailbox.reply}
                </Button>
                <Button appearance="subtle" size="small" icon={<ArrowReplyAll20Regular />}>
                  {t.mailbox.replyAll}
                </Button>
                <Button appearance="subtle" size="small" icon={<ArrowForward20Regular />}>
                  {t.mailbox.forward}
                </Button>
                <Button appearance="subtle" size="small" icon={<Flag20Regular />}>
                  {t.mailbox.flag}
                </Button>
              </span>
              {installed && (
                <>
                  <span className={styles.ribbonSep} />
                  <Tooltip content={t.mailbox.openPane} relationship="description">
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<SolenLogo />}
                      onClick={() => setPaneOpen(true)}
                    >
                      Solen
                    </Button>
                  </Tooltip>
                </>
              )}
              <Button appearance="subtle" size="small" icon={<MoreHorizontal20Regular />} aria-label={t.mailbox.moreOptions} />
              <Tooltip
                content={installed ? t.mailbox.removeSolen : t.mailbox.reinstallSolen}
                relationship="description"
              >
                <Button
                  className={styles.beforeAfter}
                  size="small"
                  icon={<ArrowSwap20Regular />}
                  aria-pressed={!installed}
                  onClick={toggleInstalled}
                >
                  {t.mailbox.beforeAfter}
                </Button>
              </Tooltip>
            </div>


            <div className={styles.panes}>
              <nav className={styles.folderPane} aria-label={t.mailbox.folders}>
                <div className={styles.folderAccount}>
                  <ChevronDown16Regular /> {MAILBOX_OWNER.email}
                </div>
                <a className={styles.folderActive}>
                  <MailInbox20Regular /> {t.mailbox.inbox} {unreadCount > 0 && <b>{unreadCount}</b>}
                </a>
                <a>
                  <FolderProhibited20Regular /> {t.mailbox.junk}
                </a>
                <a>
                  <Drafts20Regular /> {t.mailbox.drafts}
                </a>
                <a>
                  <Send20Regular /> {t.mailbox.sent}
                </a>
                <a>
                  <Delete20Regular /> {t.mailbox.deleted}
                </a>
                <a>
                  <Archive20Regular /> {t.mailbox.archiveFolder}
                </a>
                <a>
                  <Note20Regular /> {t.mailbox.notes}
                </a>
              </nav>

              <section
                className={`${styles.messageList} ${listOpen ? "" : styles.messageListCollapsed}`}
                aria-label={t.mailbox.inbox}
              >
                {/* Visible seulement sous 900 px (voir outlook.module.css). */}
                <button type="button" className={styles.listToggle} aria-expanded={listOpen} onClick={() => setListOpen((v) => !v)}>
                  <MailInbox20Regular /> {t.mailbox.inbox} {unreadCount > 0 && <b>{unreadCount}</b>}
                  <span className={styles.listToggleHint}>{listOpen ? t.mailbox.collapse : t.mailbox.showMails}</span>
                  <ChevronDown16Regular className={listOpen ? styles.chevronOpen : undefined} />
                </button>
                <div className={styles.listBody}>
                  <div className={styles.listHeader}>
                    <div className={styles.listTabs}>
                      <span className={styles.listTabActive}>{t.mailbox.focused}</span>
                      <span>{t.mailbox.other}</span>
                    </div>
                    <Filter20Regular />
                  </div>
                  {groups.map((g) => (
                    <div key={g.label}>
                      <div className={styles.groupLabel}>{g.label}</div>
                      {g.mails.map((m) => {
                        const unread = m.unread && !read.has(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            className={`${styles.listItem} ${m.id === selectedId ? styles.listItemSelected : ""} ${unread ? styles.listItemUnread : ""}`}
                            onClick={() => select(m.id)}
                          >
                            <Avatar name={m.from.displayName} size={32} color="colorful" />
                            <span className={styles.itemBody}>
                              <span className={styles.itemTop}>
                                <span className={styles.itemFrom}>{m.from.displayName}</span>
                                <span className={styles.itemDate}>{listDate(m, t.locale)}</span>
                              </span>
                              <span className={styles.itemSubject}>
                                {m.attachments.length > 0 && <Attach16Regular />}
                                <span className={styles.ellipsis}>{m.subject}</span>
                              </span>
                              <span className={styles.itemPreview}>{preview(m)}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </section>

              <article className={styles.readingPane} aria-label={t.mailbox.readingPane} data-mail={mail.id}>
                <h1 className={styles.subject}>{shown.subject}</h1>
                <div className={styles.messageCard} data-tour="mail">
                  <div className={styles.messageHeader}>
                    <Avatar name={shown.from.displayName} size={40} color="colorful" />
                    <div className={styles.messageMeta}>
                      <div>
                        <strong>{shown.from.displayName}</strong>{" "}
                        <span className={styles.address}>&lt;{mail.from.emailAddress}&gt;</span>
                      </div>
                      <div className={styles.muted}>
                        {t.mailbox.to} {mail.to}
                      </div>
                    </div>
                    <div className={styles.messageActions}>
                      <Tooltip content={t.mailbox.reply} relationship="label">
                        <Button appearance="subtle" size="small" icon={<ArrowReply20Regular />} />
                      </Tooltip>
                      <Tooltip content={t.mailbox.replyAll} relationship="label">
                        <Button appearance="subtle" size="small" icon={<ArrowReplyAll20Regular />} />
                      </Tooltip>
                      <Tooltip content={t.mailbox.forward} relationship="label">
                        <Button appearance="subtle" size="small" icon={<ArrowForward20Regular />} />
                      </Tooltip>
                      <div className={styles.muted}>{fullDate(mail, t.locale)}</div>
                    </div>
                  </div>

                  {/* Notification de module (ErrorMessage / InformationalMessage) : 150 caractères au plus,
                      style imposé par Outlook, et seule l'action « Ignorer » est permise en lecture. */}
                  {showInfobar && (
                    <div
                      className={`${styles.infobar} ${result.verdict === "fiable" ? styles.infobarInfo : styles.infobarError}`}
                      data-tour="infobar"
                      role="status"
                    >
                      {result.verdict === "fiable" ? <Info20Regular /> : <ErrorCircle20Filled />}
                      <span className={styles.infobarText}>{result.infobar}</span>
                      <Button size="small" onClick={() => setDismissed((prev) => new Set(prev).add(mail.id))}>
                        {t.mailbox.dismiss}
                      </Button>
                    </div>
                  )}

                  {mail.attachments.length > 0 && (
                    <div className={styles.attachments}>
                      {mail.attachments.map((a) => (
                        <a key={a.id} className={styles.attachment} href={a.url} target="_blank" rel="noreferrer">
                          <AttachmentIcon contentType={a.contentType} />
                          <span>
                            <span className={styles.attachmentName}>{a.name}</span>
                            <span className={styles.muted}>{t.mailbox.kb(a.size)}</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  )}

                  <div className={styles.messageBody}>{shown.body}</div>
                  {/* Comme dans Outlook, une image jointe s'affiche aussi sous le texte : ici, le QR code piégé. */}
                  {mail.attachments
                    .filter((a) => a.contentType.startsWith("image/"))
                    .map((a) => (
                      <Image
                        key={a.id}
                        src={a.url}
                        alt={t.mailbox.imageAlt(a.name)}
                        width={160}
                        height={160}
                        className={styles.inlineImage}
                      />
                    ))}
                </div>
              </article>

              {installed && paneOpen && (
                <SolenPane
                  key={mail.id}
                  mail={shown}
                  result={result}
                  error={errors[mail.id]}
                  onClose={() => setPaneOpen(false)}
                  vigilance={vigilance}
                  onReflex={onReflex}
                  notice={toast ? t.badges[toast].label : undefined}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Aide discrète, toujours visible : les raccourcis tiennent en une ligne. */}
      <p className={styles.shortcutsHelp} data-shortcuts-help>
        {t.mailbox.shortcuts} <kbd>S</kbd> {t.mailbox.shortcutPane} · <kbd>A</kbd> {t.mailbox.shortcutBeforeAfter} · <kbd>V</kbd>{" "}
        {t.mailbox.shortcutTour} · <kbd>E</kbd> {t.mailbox.shortcutTry}
      </p>
      {tourOpen && <SpotlightTour steps={steps} onEnterStep={enterTourStep} onClose={() => setTourOpen(false)} />}
    </FluentProvider>
  );
};
