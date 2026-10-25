"use client";

import { setLang, useLang, type Lang } from "@/i18n/lang";
import { useStrings } from "@/i18n/useStrings";
import styles from "./langswitch.module.css";

const OPTIONS: { lang: Lang; label: string; name: string }[] = [
  { lang: "fr", label: "FR", name: "Français" },
  { lang: "en", label: "EN", name: "English" },
];

// Bouton FR / EN, posé dans les en-têtes colorés de la démo.
export const LangSwitch = () => {
  const lang = useLang();
  const t = useStrings();
  return (
    <span className={styles.switch} role="group" aria-label={t.common.langSwitch}>
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          type="button"
          lang={o.lang}
          aria-label={o.name}
          aria-pressed={lang === o.lang}
          className={lang === o.lang ? styles.on : styles.off}
          onClick={() => setLang(o.lang)}
        >
          {o.label}
        </button>
      ))}
    </span>
  );
};
