// Langue de la démo : français par défaut, anglais pour les visiteurs qui ne lisent pas le français.
// Ordre de priorité : ?lang=en dans l'adresse, puis le choix mémorisé dans le navigateur, puis le français.
import { useSyncExternalStore } from "react";

export type Lang = "fr" | "en";

const STORAGE_KEY = "solen-lang";
const listeners = new Set<() => void>();

const isLang = (v: unknown): v is Lang => v === "fr" || v === "en";

export const readLang = (): Lang => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (isLang(fromUrl)) return fromUrl;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {}
  return "fr";
};

export const setLang = (lang: Lang) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
    // Un ?lang= dans l'adresse l'emporterait sur le choix : on le met à jour pour que le partage du lien reste juste.
    const url = new URL(window.location.href);
    if (url.searchParams.has("lang")) {
      url.searchParams.set("lang", lang);
      window.history.replaceState(window.history.state, "", url);
    }
  } catch {}
  document.documentElement.lang = lang;
  listeners.forEach((notify) => notify());
};

// Mémorise un ?lang= reçu par lien, pour que la langue suive le visiteur sur les autres pages de la démo.
export const rememberLangFromUrl = () => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (isLang(fromUrl)) window.localStorage.setItem(STORAGE_KEY, fromUrl);
  } catch {}
  document.documentElement.lang = readLang();
};

const subscribe = (notify: () => void) => {
  listeners.add(notify);
  window.addEventListener("storage", notify);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", notify);
  };
};

// Rendu serveur en français, puis la langue du visiteur s'applique dans le navigateur.
export const useLang = (): Lang => useSyncExternalStore(subscribe, readLang, () => "fr");
