import { useCallback, useMemo } from "react";
import { useApp } from "../context/AppContext";
import ms from "./ms";

// Labels are shown in their own language so an admin can always find theirs.
export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ms", label: "Bahasa Malaysia" },
];

const DICTIONARIES = { ms };
const LOCALES = { en: undefined, ms: "ms-MY" };

// English text is the key. Unknown keys (or English mode) return the English
// text, with `{name}` placeholders filled from `params`.
export function translate(lang, text, params) {
  if (text == null) return text;
  let out = DICTIONARIES[lang]?.[text] ?? text;
  if (params) {
    out = out.replace(/\{(\w+)\}/g, (match, key) =>
      key in params ? String(params[key]) : match,
    );
  }
  return out;
}

// const { t, locale } = useI18n();
// t("Delete {name}?", { name }) · date.toLocaleString(locale, …)
export function useI18n() {
  const { settings } = useApp();
  const lang = settings?.language || "en";
  const t = useCallback((text, params) => translate(lang, text, params), [lang]);
  return useMemo(() => ({ t, lang, locale: LOCALES[lang] }), [t, lang]);
}
