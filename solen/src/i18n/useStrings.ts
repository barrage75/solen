import { useLang } from "./lang";
import { STRINGS } from "./ui";

// Textes d'interface dans la langue choisie par le visiteur.
export const useStrings = () => STRINGS[useLang()];
