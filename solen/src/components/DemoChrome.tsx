"use client";

import { useEffect } from "react";
import { rememberLangFromUrl } from "@/i18n/lang";
import { useStrings } from "@/i18n/useStrings";

// Présent sur toutes les pages : mention de démonstration dans la bonne langue, et langue reçue par lien mémorisée.
export const DemoChrome = () => {
  const t = useStrings();
  useEffect(() => {
    rememberLangFromUrl();
  }, []);
  return (
    <p className="demo-disclaimer" role="note">
      {t.common.disclaimer}
    </p>
  );
};
