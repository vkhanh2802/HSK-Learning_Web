"use client";

import { useRouter } from "next/navigation";
import { LANG_COOKIE } from "@/lib/lang";
import { useLang } from "./LangProvider";

export default function LangToggle() {
  const lang = useLang();
  const router = useRouter();

  function set(next: "vi" | "en") {
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div role="group" aria-label="Language / Ngôn ngữ" className="flex overflow-hidden rounded-full border border-border text-sm">
      {(["vi", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          aria-pressed={lang === l}
          className={`px-3 py-1 ${lang === l ? "bg-accent text-background" : "hover:bg-muted"}`}
        >
          {l === "vi" ? "VI" : "EN"}
        </button>
      ))}
    </div>
  );
}
