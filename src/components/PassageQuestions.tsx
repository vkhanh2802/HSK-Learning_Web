"use client";

import { useState, useTransition } from "react";
import { submitReading } from "@/app/actions";
import Picture from "@/components/Picture";
import type { ClientQuestion } from "@/lib/passages";

type Result = { correct: boolean; answer: boolean | number };

const optionClass = (r: Result | undefined, value: boolean | number, picked: boolean | number | undefined) =>
  !r
    ? "hover:bg-muted"
    : r.answer === value
      ? "border-green-600 bg-green-600/15"
      : picked === value
        ? "border-accent bg-accent/15"
        : "opacity-60";

function Prompt({ text }: { text: { hanzi: string; pinyin: string; vi: string } }) {
  return (
    <p>
      <span lang="zh-CN" className="text-xl">
        {text.hanzi}
      </span>{" "}
      <span className="text-sm opacity-75">{text.pinyin}</span>
    </p>
  );
}

/** Câu hỏi đọc hiểu của một bài; chấm từng câu ở server. */
export default function PassageQuestions({ passageId, questions }: { passageId: number; questions: ClientQuestion[] }) {
  const [results, setResults] = useState<Record<number, Result>>({});
  const [picked, setPicked] = useState<Record<number, boolean | number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const answer = (qi: number, response: boolean | number) => {
    setPicked((p) => ({ ...p, [qi]: response }));
    startTransition(async () => {
      try {
        const r = await submitReading({ passageId, question: qi, response });
        setResults((rs) => ({ ...rs, [qi]: r }));
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
      <h2 className="text-lg font-semibold">Câu hỏi đọc hiểu</h2>
      <ol className="mt-3 space-y-4">
        {questions.map((q, qi) => {
          const r = results[qi];
          const locked = !!r || pending;
          return (
            <li key={qi} className="rounded border border-border p-4">
              <p className="mb-2 text-sm opacity-75">
                Câu {qi + 1} ·{" "}
                {q.type === "tf" ? "Đúng hay sai?" : q.type === "mcq" ? "Chọn đáp án đúng" : "Chọn tranh đúng với câu"}
              </p>
              {q.type === "tf" && <Prompt text={q.statement} />}
              {q.type === "mcq" && <Prompt text={q.question} />}
              {q.type === "picture" && <Prompt text={q.sentence} />}

              <div className="mt-3 flex flex-wrap gap-2">
                {q.type === "tf" &&
                  [true, false].map((v) => (
                    <button
                      key={String(v)}
                      type="button"
                      disabled={locked}
                      onClick={() => answer(qi, v)}
                      className={`min-w-24 rounded border border-border px-4 py-2 ${optionClass(r, v, picked[qi])}`}
                    >
                      {v ? "✓ Đúng" : "✗ Sai"}
                    </button>
                  ))}
                {q.type === "mcq" &&
                  q.options.map((o, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={locked}
                      onClick={() => answer(qi, i)}
                      className={`rounded border border-border px-4 py-2 text-left ${optionClass(r, i, picked[qi])}`}
                    >
                      <span lang="zh-CN" className="block text-lg">
                        {o.hanzi}
                      </span>
                      <span className="text-sm opacity-75">{o.pinyin}</span>
                    </button>
                  ))}
                {q.type === "picture" &&
                  q.options.map((o, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={locked}
                      onClick={() => answer(qi, i)}
                      aria-label={o.label}
                      className={`rounded border-2 border-border p-1.5 ${optionClass(r, i, picked[qi])}`}
                    >
                      <Picture picture={o} size={120} />
                    </button>
                  ))}
              </div>

              {r && (
                <p role="status" className="mt-2 text-sm">
                  {r.correct ? "✓ Chính xác! " : "✗ Chưa đúng. "}
                  {q.type === "tf" ? q.statement.vi : q.type === "mcq" ? q.question.vi : q.sentence.vi}
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
      {done === questions.length && (
        <p role="status" className="mt-4 text-lg font-semibold">
          Kết quả: {score}/{questions.length} câu đúng
        </p>
      )}
    </section>
  );
}
