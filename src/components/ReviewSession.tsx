"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reviewCard } from "@/app/actions";
import AudioButton from "@/components/AudioButton";
import { speak } from "@/lib/tts";
import type { WordView } from "@/lib/words";

export type ReviewItem = { cardId: number; mode: "recognize" | "listen"; word: WordView };

const GRADES = [
  { grade: 1, label: "Quên", key: "1" },
  { grade: 2, label: "Khó", key: "2" },
  { grade: 3, label: "Nhớ", key: "3" },
  { grade: 4, label: "Dễ", key: "4" },
] as const;

// Thẻ chấm xong mà FSRS hẹn lại trong khoảng này thì ôn lại ngay trong lượt hiện tại.
const REQUEUE_MS = 10 * 60_000;

export default function ReviewSession({ items }: { items: ReviewItem[] }) {
  const [queue, setQueue] = useState(items);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(0);
  const shownAt = useRef(0);

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
        setError(null);
      } catch {
        setError("Không lưu được kết quả, thử lại.");
      } finally {
        setBusy(false);
      }
    },
    [current, busy],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === " " && !flipped) {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped) {
        const g = GRADES.find((x) => x.key === e.key);
        if (g) rate(g.grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, rate]);

  if (!current)
    return (
      <p role="status" className="mt-6 text-lg">
        ✓ Xong! Bạn đã ôn {reviewed} lượt thẻ.
      </p>
    );

  const w = current.word;
  return (
    <section className="mt-6 max-w-xl">
      <p className="text-sm opacity-75">
        Còn {queue.length} thẻ · Đã ôn {reviewed}
      </p>
      <div className="mt-3 min-h-64 rounded border border-border p-6 text-center">
        {current.mode === "recognize" ? (
          <p lang="zh-CN" className="text-6xl">
            {w.hanzi}
          </p>
        ) : (
          <div>
            <p className="text-sm opacity-75">Nghe và nhớ lại từ</p>
            <div className="mt-3 flex justify-center">
              <AudioButton key={current.cardId} text={w.hanzi} />
            </div>
          </div>
        )}

        {flipped && (
          <div className="mt-4 border-t border-border pt-4">
            {current.mode === "listen" && (
              <p lang="zh-CN" className="text-5xl">
                {w.hanzi}
              </p>
            )}
            <p className="mt-2 flex items-center justify-center gap-2 text-xl">
              {w.pinyin} {current.mode === "recognize" && <AudioButton key={current.cardId} text={w.hanzi} />}
            </p>
            <p className="mt-1 text-lg">{w.meaningVi}</p>
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
          onClick={() => setFlipped(true)}
        >
          Hiện đáp án <kbd className="ml-2 text-sm opacity-75">Space</kbd>
        </button>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              type="button"
              disabled={busy}
              className="rounded border border-border px-2 py-3 hover:bg-muted disabled:opacity-40"
              onClick={() => rate(g.grade)}
            >
              {g.label} <kbd className="block text-sm opacity-75">{g.key}</kbd>
            </button>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-accent">
          {error}
        </p>
      )}
    </section>
  );
}
