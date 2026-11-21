"use client";

import { useState, useTransition } from "react";
import { submitGrammar } from "@/app/actions";
import type { ClientGrammarExercise } from "@/lib/grammar";

type Result = { correct: boolean; answer: number | string; explain?: string };

const optionClass = (r: Result | undefined, i: number, picked: number | undefined) =>
  !r
    ? "hover:bg-muted"
    : r.answer === i
      ? "border-green-600 bg-green-600/15"
      : picked === i
        ? "border-accent bg-accent/15"
        : "opacity-60";

/** Sắp xếp câu: bấm từ ở dưới để ghép lên trên, bấm từ đã ghép để trả về. Dùng được bằng bàn phím. */
export function ReorderSentence({
  words,
  disabled,
  onSubmit,
  onChange,
}: {
  words: string[];
  disabled: boolean;
  onSubmit?: (order: string[]) => void;
  /** Có onChange (dùng trong đề thi): báo mỗi lần ghép/bỏ từ và không hiện nút Kiểm tra. */
  onChange?: (order: string[]) => void;
}) {
  // Lưu chỉ số để từ lặp lại (vd. 几 … 几) vẫn phân biệt được.
  const [chosen, setChosen] = useState<number[]>([]);
  const remaining = words.map((w, i) => ({ w, i })).filter(({ i }) => !chosen.includes(i));
  const chip = "rounded border border-border px-3 py-1.5 text-xl disabled:opacity-40";
  const update = (next: number[]) => {
    setChosen(next);
    onChange?.(next.map((i) => words[i]));
  };

  return (
    <div>
      <div
        aria-label="Câu đang ghép"
        className="flex min-h-14 flex-wrap items-center gap-2 rounded border border-dashed border-border p-2"
        lang="zh-CN"
      >
        {chosen.length === 0 && <span className="text-sm opacity-60">Bấm các từ bên dưới theo đúng thứ tự…</span>}
        {chosen.map((i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            aria-label={`Bỏ ${words[i]}`}
            onClick={() => update(chosen.filter((x) => x !== i))}
            className={`${chip} bg-muted`}
          >
            {words[i]}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2" lang="zh-CN">
        {remaining.map(({ w, i }) => (
          <button key={i} type="button" disabled={disabled} onClick={() => update([...chosen, i])} className={`${chip} hover:bg-muted`}>
            {w}
          </button>
        ))}
      </div>
      {!onChange && (
        <button
          type="button"
          disabled={disabled || remaining.length > 0}
          onClick={() => onSubmit?.(chosen.map((i) => words[i]))}
          className="mt-3 rounded bg-accent px-4 py-2 font-semibold text-background disabled:opacity-40"
        >
          Kiểm tra
        </button>
      )}
    </div>
  );
}

/** Bài tập của một điểm ngữ pháp; chấm từng câu ở server. */
export default function GrammarPractice({ pointId, exercises }: { pointId: number; exercises: ClientGrammarExercise[] }) {
  const [results, setResults] = useState<Record<number, Result>>({});
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const answer = (ei: number, response: number | string[]) => {
    if (typeof response === "number") setPicked((p) => ({ ...p, [ei]: response }));
    startTransition(async () => {
      try {
        const r = await submitGrammar({ pointId, exercise: ei, response });
        setResults((rs) => ({ ...rs, [ei]: r }));
        setError(null);
      } catch {
        setError("Không chấm được, thử lại.");
      }
    });
  };

  const done = Object.keys(results).length;
  const score = Object.values(results).filter((r) => r.correct).length;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Bài tập</h2>
      <ol className="mt-3 space-y-4">
        {exercises.map((ex, ei) => {
          const r = results[ei];
          const locked = !!r || pending;
          return (
            <li key={ei} className="rounded border border-border p-4">
              <p className="mb-2 text-sm opacity-75">
                Câu {ei + 1} ·{" "}
                {ex.type === "choose" ? "Chọn đáp án đúng" : ex.type === "reorder" ? "Sắp xếp thành câu" : "Tìm câu SAI"}
              </p>

              {ex.type === "choose" && (
                <>
                  <p lang="zh-CN" className="text-xl">
                    {ex.prompt.hanzi}
                  </p>
                  <p className="text-sm opacity-75">{ex.prompt.vi}</p>
                </>
              )}
              {ex.type === "reorder" && <p className="mb-2 text-sm">Nghĩa: {ex.vi}</p>}

              {ex.type === "reorder" ? (
                <ReorderSentence words={ex.words} disabled={locked} onSubmit={(order) => answer(ei, order)} />
              ) : (
                <div className="mt-3 flex flex-wrap gap-2" lang="zh-CN">
                  {ex.options.map((o, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={locked}
                      onClick={() => answer(ei, i)}
                      className={`rounded border border-border px-4 py-2 text-lg ${optionClass(r, i, picked[ei])}`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              )}

              {r && (
                <p role="status" className="mt-2 text-sm">
                  {r.correct ? "✓ Chính xác! " : "✗ Chưa đúng. "}
                  {ex.type === "reorder" && (
                    <>
                      Đáp án: <span lang="zh-CN">{r.answer}</span>
                    </>
                  )}
                  {r.explain}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {error && (
        <p role="alert" className="mt-2 text-accent">
          {error}
        </p>
      )}
      {done === exercises.length && (
        <p role="status" className="mt-4 text-lg font-semibold">
          Kết quả: {score}/{exercises.length} câu đúng
        </p>
      )}
    </section>
  );
}
