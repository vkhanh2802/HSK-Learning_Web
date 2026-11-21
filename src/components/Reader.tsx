"use client";

import { useState, useTransition } from "react";
import { addWordToReview } from "@/app/actions";
import AudioButton from "@/components/AudioButton";
import { useT } from "@/components/LangProvider";
import type { Token } from "@/lib/passages";
import { speakLines } from "@/lib/tts";

const toggleClass = (on: boolean) =>
  `rounded border border-border px-3 py-1.5 ${on ? "bg-accent font-semibold text-background" : "hover:bg-muted"}`;

/**
 * Trình đọc: bấm từ để tra (pinyin, nghĩa, nghe, thêm vào ôn tập), bật/tắt pinyin trên chữ, đọc to cả bài.
 * `inReview`: id các từ đã có thẻ ôn.
 */
export default function Reader({
  lines,
  translation,
  pinyinDefault,
  inReview,
}: {
  lines: Token[][];
  translation: string | null;
  pinyinDefault: boolean;
  inReview: number[];
}) {
  const t = useT();
  const [showPinyin, setShowPinyin] = useState(pinyinDefault);
  const [showTranslation, setShowTranslation] = useState(false);
  const [selected, setSelected] = useState<Token | null>(null);
  const [added, setAdded] = useState(() => new Set(inReview));
  const [message, setMessage] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const [pending, startTransition] = useTransition();

  const readAll = () => setUnsupported(!speakLines(lines.map((l) => ({ text: l.map((t) => t.t).join("") }))));

  const add = (w: number) =>
    startTransition(async () => {
      try {
        await addWordToReview(w);
        setAdded((s) => new Set(s).add(w));
        setMessage(t("✓ Đã thêm vào ôn tập.", "✓ Added to review."));
      } catch {
        setMessage(t("Không thêm được, thử lại.", "Could not add, please try again."));
      }
    });

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={toggleClass(false)} onClick={readAll}>
          {t("🔊 Đọc cả bài", "🔊 Read aloud")}
        </button>
        <button type="button" aria-pressed={showPinyin} className={toggleClass(showPinyin)} onClick={() => setShowPinyin(!showPinyin)}>
          Pinyin
        </button>
        {translation && (
          <button
            type="button"
            aria-pressed={showTranslation}
            className={toggleClass(showTranslation)}
            onClick={() => setShowTranslation(!showTranslation)}
          >
            {t("Bản dịch", "Translation")}
          </button>
        )}
      </div>
      {unsupported && (
        <p role="status" className="mt-2 text-sm font-semibold">
          {t("Máy chưa có giọng đọc tiếng Trung — cài gói ngôn ngữ Trung (Giản thể) trong cài đặt Windows.", "This device has no Chinese voice — install the Chinese (Simplified) language pack in Windows settings.")}
        </p>
      )}

      <div lang="zh-CN" className="mt-4 space-y-2 text-2xl leading-[2.4]">
        {lines.map((line, li) => (
          <p key={li}>
            {line.map((tok, ti) =>
              tok.p ? (
                <button
                  key={ti}
                  type="button"
                  aria-pressed={selected === tok}
                  aria-label={`${tok.t}, ${tok.p}`}
                  onClick={() => {
                    setSelected(tok);
                    setMessage(null);
                  }}
                  className={`rounded px-0.5 hover:bg-muted ${selected === tok ? "bg-accent/20 outline outline-accent" : ""}`}
                >
                  {showPinyin ? (
                    <ruby>
                      {tok.t}
                      <rt className="text-xs opacity-75">{tok.p}</rt>
                    </ruby>
                  ) : (
                    tok.t
                  )}
                </button>
              ) : (
                <span key={ti}>{tok.t}</span>
              ),
            )}
          </p>
        ))}
      </div>

      {showTranslation && translation && (
        <p className="mt-4 whitespace-pre-line rounded bg-muted p-3 text-sm">{translation}</p>
      )}

      <aside aria-live="polite" className="sticky bottom-0 mt-6 rounded border border-border bg-background p-4">
        {selected ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span lang="zh-CN" className="text-3xl">
              {selected.t}
            </span>
            <AudioButton key={selected.t} text={selected.t} />
            <span className="text-lg">{selected.p}</span>
            <span>{selected.vi}</span>
            {selected.w !== undefined &&
              (added.has(selected.w) ? (
                <span className="text-sm opacity-75">{t("Đã có trong ôn tập", "Already in review")}</span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => add(selected.w!)}
                  className="rounded bg-accent px-3 py-1.5 font-semibold text-background disabled:opacity-40"
                >
                  {t("+ Thêm vào ôn tập", "+ Add to review")}
                </button>
              ))}
            {message && (
              <span role="status" className="text-sm">
                {message}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm opacity-75">{t("Bấm vào một từ để xem pinyin, nghĩa và thêm vào ôn tập.", "Tap a word to see its pinyin and meaning, and add it to your review.")}</p>
        )}
      </aside>
    </div>
  );
}
