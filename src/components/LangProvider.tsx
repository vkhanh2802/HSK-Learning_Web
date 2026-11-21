"use client";

import { createContext, useContext } from "react";
import { type Lang, tr } from "@/lib/lang";

const LangContext = createContext<Lang>("vi");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext value={lang}>{children}</LangContext>;
}

export const useLang = () => useContext(LangContext);
/** Dùng trong Client Component: `const t = useT(); t("Xin chào", "Hello")`. */
export const useT = () => tr(useLang());
