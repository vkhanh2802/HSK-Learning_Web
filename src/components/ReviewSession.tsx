"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reviewCard } from "@/app/actions";
import AudioButton from "@/components/AudioButton";
import { useLang, useT } from "@/components/LangProvider";
import StrokeQuiz from "@/components/StrokeQuiz";
import { matchesDictation } from "@/lib/compare";
import { writeGrade, type Grade } from "@/lib/srs";
import { speak } from "@/lib/tts";
import type { WordView } from "@/lib/words";

export type ReviewItem = {
  cardId: number;
  mode: "recognize" | "listen" | "write" | "recall";
  word: WordView;
  options?: string[]; // thẻ nghe: các chữ để chọn (đã gồm đáp án)
};

/** Thẻ nhớ lại: xem nghĩa, gõ chữ Hán hoặc pinyin (dấu thanh tuỳ ý). */
function RecallFront({ word, onDone }: { word: WordView; onDone: (input: string, ok: boolean) => void }) {
  const t = useT();
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onDone(text, matchesDictation(text, word));
      }}
    >
      <p className="text-sm opacity-75">{t("Gõ từ có nghĩa", "Type the word meaning")}</p>
      <p className="mt-1 text-2xl">{word.meaning}</p>
      {word.pos && <p className="text-sm opacity-75">({word.pos})</p>}
      <label htmlFor="recall-input" className="sr-only">
        {t("Chữ Hán hoặc pinyin", "Characters or pinyin")}
      </label>
      <input
        id="recall-input"
        autoFocus
        autoComplete="off"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("chữ Hán hoặc pinyin", "characters or pinyin")}
        className="mt-3 w-full max-w-xs rounded border border-border bg-background px-3 py-2 text-center text-xl"
      />
      <button type="submit" disabled={!text.trim()} className="mt-2 block w-full rounded border border-border px-4 py-2 hover:bg-muted disabled:opacity-40">
        {t("Kiểm tra", "Check")} <kbd className="text-sm opacity-75">Enter</kbd>
      </button>
    </form>
  );
}

/** Thẻ viết: viết lần lượt từng chữ của từ, không có mẫu; báo tổng số lần sai khi xong. */
function WriteFront({ word, onDone }: { word: WordView; onDone: (mistakes: number) => void }) {
  const t = useT();
  const chars = [...word.hanzi];
  const [i, setI] = useState(0);
  const [total, setTotal] = useState(0);
  return (
    <div>
      <p className="text-sm opacity-75">{t("Viết từ này", "Write this word")}</p>
      <p className="mt-1 text-xl">{word.pinyin}</p>
      <p className="text-lg">{word.meaning}</p>
      {chars.length > 1 && (
        <p className="mt-2 text-sm opacity-75">
          {t("Chữ", "Character")} {i + 1}/{chars.length}
        </p>
      )}
      <div className="mt-2 flex justify-center">
        <StrokeQuiz
          key={i}
          char={chars[i]}
          mode="blind"
          size={220}
          onComplete={(m) => {
            const sum = total + m;
            setTotal(sum);
            if (i < chars.length - 1) setI(i + 1);
            else onDone(sum);
          }}
        />
      </div>
    </div>
  );
}

const GRADES = [
  { grade: 1, label: ["Quên", "Again"], key: "1" },
  { grade: 2, label: ["Khó", "Hard"], key: "2" },
  { grade: 3, label: ["Nhớ", "Good"], key: "3" },
  { grade: 4, label: ["Dễ", "Easy"], key: "4" },
] as const;

// Thẻ chấm xong mà FSRS hẹn lại trong khoảng này thì ôn lại ngay trong lượt hiện tại.
const REQUEUE_MS = 10 * 60_000;

export default function ReviewSession({ items }: { items: ReviewItem[] }) {
  const t = useT();
  const li = useLang() === "en" ? 1 : 0;
  const [queue, setQueue] = useState(items);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(0);
  const [suggested, setSuggested] = useState<{ grade: Grade; note: string } | null>(null);
  const shownAt = useRef(0);

  // Lật thẻ; thẻ viết/nghe mà lật trước khi làm xong coi như chưa nhớ.
  const flip = useCallback(() => {
    setFlipped(true);
    const mode = queue[0]?.mode;
    setSuggested(
      (s) =>
        s ??
        (mode === "write" || mode === "recall"
          ? { grade: 1, note: mode === "write" ? t("Chưa viết xong — gợi ý chấm Quên.", "Not finished — suggested grade: Again.") : t("Chưa trả lời — gợi ý chấm Quên.", "No answer — suggested grade: Again.") }
          : mode === "listen" && queue[0]?.options
            ? { grade: 1, note: t("Chưa chọn — gợi ý chấm Quên.", "Nothing chosen — suggested grade: Again.") }
            : null),
    );
  }, [queue, t]);

  const current = queue[0];

  useEffect(() => {
    shownAt.current = Date.now();
    if (current?.mode === "listen") speak(current.word.hanzi);
  }, [current, reviewed]); // reviewed: chạy lại cả khi thẻ duy nhất được xếp lại cuối hàng

  const rate = useCallback(
    async (grade: 1 | 2 | 3 | 4) => {
      if (!current || busy) return;
      setBusy(true);
      try {
        const due = await reviewCard({ cardId: current.cardId, grade, durationMs: Date.now() - shownAt.current });
        const again = new Date(due).getTime() - Date.now() < REQUEUE_MS;
        setQueue((q) => (again ? [...q.slice(1), q[0]] : q.slice(1)));
        setReviewed((n) => n + 1);
        setFlipped(false);
        setSuggested(null);
        setError(null);
      } catch {
        setError(t("Không lưu được kết quả, thử lại.", "Could not save the result, please try again."));
      } finally {
        setBusy(false);
      }
    },
    [current, busy],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return; // đang gõ đáp án
      if (e.key === " " && !flipped) {
        e.preventDefault();
        flip();
      } else if (flipped) {
        const g = GRADES.find((x) => x.key === e.key);
        if (g) rate(g.grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, rate, flip]);

  if (!current)
    return (
      <p role="status" className="mt-6 text-lg">
        {t(`✓ Xong! Bạn đã ôn ${reviewed} lượt thẻ.`, `✓ Done! You reviewed ${reviewed} cards.`)}
      </p>
    );

  const w = current.word;
  return (
    <section className="mt-6 max-w-xl">
      <p className="text-sm opacity-75">
        {t(`Còn ${queue.length} thẻ · Đã ôn ${reviewed}`, `${queue.length} left · ${reviewed} reviewed`)}
      </p>
      <div className="mt-3 min-h-64 rounded border border-border p-6 text-center">
        {current.mode === "recognize" ? (
          <p lang="zh-CN" className="text-6xl">
            {w.hanzi}
          </p>
        ) : current.mode === "write" ? (
          !flipped && (
            <WriteFront
              key={`${current.cardId}-${reviewed}`}
              word={w}
              onDone={(mistakes) => {
                const grade = writeGrade(mistakes);
                setSuggested({ grade, note: t(`Sai ${mistakes} lần — gợi ý chấm ${GRADES[grade - 1].label[0]}.`, `${mistakes} mistakes — suggested grade: ${GRADES[grade - 1].label[1]}.`) });
                setFlipped(true);
              }}
            />
          )
        ) : current.mode === "recall" ? (
          !flipped && (
            <RecallFront
              key={`${current.cardId}-${reviewed}`}
              word={w}
              onDone={(input, ok) => {
                setSuggested(
                  ok
                    ? { grade: 3, note: t("✓ Đúng — gợi ý chấm Nhớ.", "✓ Correct — suggested grade: Good.") }
                    : { grade: 1, note: t(`✗ Bạn gõ “${input}” — gợi ý chấm Quên.`, `✗ You typed “${input}” — suggested grade: Again.`) },
                );
                setFlipped(true);
              }}
            />
          )
        ) : (
          <div>
            <p className="text-sm opacity-75">{current.options ? t("Nghe và chọn từ đúng", "Listen and pick the right word") : t("Nghe và nhớ lại từ", "Listen and recall the word")}</p>
            <div className="mt-3 flex justify-center">
              <AudioButton key={current.cardId} text={w.hanzi} hideText />
            </div>
            {current.options && !flipped && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {current.options.map((h) => (
                  <button
                    key={h}
                    type="button"
                    lang="zh-CN"
                    className="rounded border border-border px-3 py-3 text-2xl hover:bg-muted"
                    onClick={() => {
                      setSuggested(
                        h === w.hanzi
                          ? { grade: 3, note: t("✓ Chọn đúng — gợi ý chấm Nhớ.", "✓ Right choice — suggested grade: Good.") }
                          : { grade: 1, note: t(`✗ Bạn chọn ${h} — gợi ý chấm Quên.`, `✗ You chose ${h} — suggested grade: Again.`) },
                      );
                      setFlipped(true);
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {flipped && (
          <div className={current.mode === "write" || current.mode === "recall" ? "" : "mt-4 border-t border-border pt-4"}>
            {suggested && (
              <p role="status" className="mb-2 text-sm">
                {suggested.note}
              </p>
            )}
            {current.mode !== "recognize" && (
              <p lang="zh-CN" className="text-5xl">
                {w.hanzi}
              </p>
            )}
            <p className="mt-2 flex items-center justify-center gap-2 text-xl">
              {w.pinyin} {current.mode === "recognize" && <AudioButton key={current.cardId} text={w.hanzi} />}
            </p>
            <p className="mt-1 text-lg">{w.meaning}</p>
            {w.example && (
              <div className="mt-3 text-sm">
                <p lang="zh-CN">{w.example.hanzi}</p>
                <p className="opacity-75">{w.example.pinyin}</p>
                <p>{w.example.vi}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {!flipped ? (
        <button
          type="button"
          className="mt-4 w-full rounded bg-accent px-4 py-3 font-semibold text-background hover:opacity-90"
          onClick={flip}
        >
          {t("Hiện đáp án", "Show answer")} <kbd className="ml-2 text-sm opacity-75">Space</kbd>
        </button>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              type="button"
              disabled={busy}
              className={`rounded border px-2 py-3 hover:bg-muted disabled:opacity-40 ${suggested?.grade === g.grade ? "border-accent border-2 font-semibold" : "border-border"}`}
              onClick={() => rate(g.grade)}
            >
              {g.label[li]} <kbd className="block text-sm opacity-75">{g.key}</kbd>
            </button>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 font-semibold">
          {error}
        </p>
      )}
    </section>
  );
}
