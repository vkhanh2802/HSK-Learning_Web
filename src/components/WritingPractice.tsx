"use client";

import { useState, useTransition } from "react";
import { gradeWriting, submitExercise } from "@/app/actions";
import { ReorderSentence } from "@/components/GrammarPractice";
import Picture from "@/components/Picture";
import { useT } from "./LangProvider";
import type { Line, WritingExercise } from "@/lib/exercises";
import type { GradeResult } from "@/lib/grader";
import { stripTone } from "@/lib/pinyin";

export type ImeWord = { hanzi: string; pinyin: string; vi: string };

type Tab = "ime" | "fill" | "reorder" | "compose";
const TABS: { id: Tab; label: [string, string] }[] = [
  { id: "ime", label: ["Gõ pinyin chọn chữ", "Type pinyin, pick characters"] },
  { id: "fill", label: ["Điền chữ", "Fill in the character"] },
  { id: "reorder", label: ["Sắp xếp câu", "Reorder sentence"] },
  { id: "compose", label: ["Đặt câu", "Write a sentence"] },
];

const primary = "rounded bg-accent px-4 py-2 font-semibold text-background disabled:opacity-40";
const plain = (p: string) => stripTone(p.toLowerCase()).replace(/[\s'’]/g, "");

/** Luyện bộ gõ: đọc nghĩa, gõ pinyin không dấu, chọn đúng chữ trong danh sách gợi ý như bộ gõ thật. */
function ImePractice({ words }: { words: ImeWord[] }) {
  const t = useT();
  const [target, setTarget] = useState<ImeWord | null>(null);
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ ok: 0, total: 0 });

  const next = () => {
    setTarget(words[Math.floor(Math.random() * words.length)]);
    setTyped("");
    setPicked(null);
  };
  if (!target)
    return (
      <button type="button" className={primary} onClick={next}>
        {t("Bắt đầu", "Start")}
      </button>
    );

  const q = plain(typed).replace(/v/g, "ü");
  const candidates = q ? words.filter((w) => plain(w.pinyin).startsWith(q)).slice(0, 9) : [];

  return (
    <div>
      <p className="text-sm opacity-75">
        {t("Đúng", "Correct")} {score.ok}/{score.total}
      </p>
      <p className="mt-2 text-lg">
        {t("Gõ từ có nghĩa:", "Type the word meaning:")} <strong>{target.vi}</strong>
      </p>
      <label className="mt-2 block text-sm" htmlFor="ime-input">
        {t("Pinyin (không cần dấu, ü gõ v):", "Pinyin (no tone marks needed; type v for ü):")}
      </label>
      <input
        id="ime-input"
        value={typed}
        disabled={!!picked}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        className="mt-1 w-full max-w-sm rounded border border-border bg-background px-3 py-2"
      />
      <ol aria-label={t("Chữ gợi ý", "Suggested characters")} className="mt-2 flex flex-wrap gap-2" lang="zh-CN">
        {candidates.map((w, i) => (
          <li key={w.hanzi}>
            <button
              type="button"
              disabled={!!picked}
              onClick={() => {
                setPicked(w.hanzi);
                setScore((s) => ({ ok: s.ok + (w.hanzi === target.hanzi ? 1 : 0), total: s.total + 1 }));
              }}
              className={`rounded border border-border px-3 py-1.5 text-xl ${
                picked && w.hanzi === target.hanzi ? "border-green-600 bg-green-600/15" : picked === w.hanzi ? "border-accent bg-accent/15" : "hover:bg-muted"
              }`}
            >
              <span className="mr-1 text-xs opacity-60">{i + 1}</span>
              {w.hanzi}
            </button>
          </li>
        ))}
      </ol>
      {q && candidates.length === 0 && <p className="mt-2 text-sm opacity-75">{t(`Không có chữ nào khớp “${typed}”.`, `No characters match “${typed}”.`)}</p>}
      {picked && (
        <div role="status" className="mt-3">
          <p>
            {picked === target.hanzi ? t("✓ Đúng! ", "✓ Correct! ") : t("✗ Chưa đúng. ", "✗ Not quite. ")}
            <span lang="zh-CN" className="text-xl">
              {target.hanzi}
            </span>{" "}
            · {target.pinyin}
          </p>
          <button type="button" className={`${primary} mt-2`} onClick={next}>
            {t("Từ tiếp →", "Next word →")}
          </button>
        </div>
      )}
    </div>
  );
}

function FillItem({ ex }: { ex: Extract<WritingExercise, { type: "fill" }> }) {
  const t = useT();
  const [text, setText] = useState("");
  const [r, setR] = useState<{ correct: boolean; answer: unknown } | null>(null);
  const [pending, start] = useTransition();
  const [before, after] = ex.payload.sentence.split("___");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setR(await submitExercise({ exerciseId: ex.id, response: text })));
      }}
    >
      <p className="text-sm opacity-75">{ex.payload.pinyin}</p>
      <p lang="zh-CN" className="flex flex-wrap items-center gap-1 text-2xl">
        {before}
        <input
          aria-label={t("Chữ còn thiếu", "Missing character")}
          value={text}
          maxLength={2}
          disabled={!!r || pending}
          onChange={(e) => setText(e.target.value)}
          className="w-14 rounded border border-border bg-background px-2 py-1 text-center"
        />
        {after}
      </p>
      <p className="text-sm">{ex.payload.vi}</p>
      {!r ? (
        <button type="submit" disabled={!text.trim() || pending} className={`${primary} mt-2`}>
          {t("Kiểm tra", "Check")}
        </button>
      ) : (
        <p role="status" className="mt-2">
          {r.correct ? t("✓ Chính xác!", "✓ Correct!") : t("✗ Chưa đúng.", "✗ Not quite.")} {t("Chữ đúng:", "Right character:")} <span lang="zh-CN">{String(r.answer)}</span>
        </p>
      )}
    </form>
  );
}

function ReorderItem({ ex }: { ex: Extract<WritingExercise, { type: "reorder" }> }) {
  const t = useT();
  const [r, setR] = useState<{ correct: boolean; answer: unknown } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <p className="mb-2 text-sm">{t("Nghĩa:", "Meaning:")} {ex.payload.vi}</p>
      <ReorderSentence
        words={ex.payload.words}
        disabled={!!r || pending}
        onSubmit={(order) => start(async () => setR(await submitExercise({ exerciseId: ex.id, response: order })))}
      />
      {r && (
        <p role="status" className="mt-2">
          {r.correct ? t("✓ Chính xác!", "✓ Correct!") : t("✗ Chưa đúng.", "✗ Not quite.")} {t("Đáp án:", "Answer:")} <span lang="zh-CN">{(r.answer as string[])[0]}</span>
        </p>
      )}
    </div>
  );
}

function ComposeItem({ ex }: { ex: Extract<WritingExercise, { type: "compose" }> }) {
  const t = useT();
  const [text, setText] = useState("");
  const [r, setR] = useState<{ configured: boolean; result?: GradeResult; sample: Line } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const missing = ex.payload.words.filter((w) => !text.includes(w));

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {ex.payload.picture && <Picture picture={ex.payload.picture} size={160} />}
      <form
        className="flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            try {
              setR(await gradeWriting({ exerciseId: ex.id, text }));
              setError(null);
            } catch {
              setError(t("Không chấm được, thử lại.", "Could not grade, please try again."));
            }
          });
        }}
      >
        <p>{ex.payload.hint}</p>
        <p className="mt-1 flex gap-2" lang="zh-CN">
          {ex.payload.words.map((w) => (
            <span key={w} className={`rounded px-2 py-0.5 text-lg ${text.includes(w) ? "bg-green-600/15" : "bg-muted"}`}>
              {w}
            </span>
          ))}
        </p>
        <label htmlFor={`compose-${ex.id}`} className="sr-only">
          {t("Câu của bạn", "Your sentence")}
        </label>
        <textarea
          id={`compose-${ex.id}`}
          lang="zh-CN"
          rows={2}
          maxLength={200}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-xl"
        />
        {text && missing.length > 0 && <p className="text-sm opacity-75">{t("Chưa dùng:", "Not used yet:")} {missing.join(", ")}</p>}
        <button type="submit" disabled={!text.trim() || pending} className={`${primary} mt-2`}>
          {pending ? t("Đang chấm…", "Grading…") : t("Chấm bài", "Grade")}
        </button>
        {error && (
          <p role="alert" className="mt-2 font-semibold">
            {error}
          </p>
        )}
        {r && (
          <div role="status" className="mt-3 space-y-2 rounded bg-muted p-3 text-sm">
            {r.configured && r.result ? (
              <>
                <p className="text-base font-semibold">{t("Điểm:", "Score:")} {r.result.score}/10</p>
                <p>
                  {t("Câu sửa:", "Corrected:")} <span lang="zh-CN" className="text-lg">{r.result.corrected}</span>
                </p>
                {r.result.errors.map((er, i) => (
                  <p key={i}>
                    ✗ <span lang="zh-CN">{er.wrong}</span> → ✓ <span lang="zh-CN">{er.right}</span>: {er.explanationVi}
                  </p>
                ))}
                <p>{r.result.explanationVi}</p>
              </>
            ) : (
              <p>{t("Chưa cấu hình chấm bằng AI — tự so câu của bạn với câu mẫu bên dưới.", "AI grading is not configured — compare your sentence with the model sentence below yourself.")}</p>
            )}
            <p>
              {t("Câu mẫu:", "Model:")} <span lang="zh-CN" className="text-lg">{r.sample.hanzi}</span> · {r.sample.pinyin} — {r.sample.vi}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

export default function WritingPractice({
  exercises,
  words,
  aiEnabled,
}: {
  exercises: WritingExercise[];
  words: ImeWord[];
  aiEnabled: boolean;
}) {
  const t = useT();
  const [tab, setTab] = useState<Tab>("ime");
  const items = exercises.filter((e) => e.type === tab);

  return (
    <div className="mt-4">
      <div role="tablist" aria-label={t("Dạng bài viết", "Exercise type")} className="flex flex-wrap gap-2">
        {TABS.map((tb) => {
          const locked = tb.id === "compose" && !aiEnabled;
          return (
            <button
              key={tb.id}
              type="button"
              role="tab"
              aria-selected={tab === tb.id}
              disabled={locked}
              title={locked ? t("Đang khoá: cần cấu hình chấm bằng AI", "Locked: needs AI grading to be configured") : undefined}
              onClick={() => setTab(tb.id)}
              className={`rounded border border-border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 ${tab === tb.id ? "bg-accent font-semibold text-background" : "enabled:hover:bg-muted"}`}
            >
              {locked && "🔒 "}
              {t(tb.label[0], tb.label[1])}
            </button>
          );
        })}
      </div>
      {!aiEnabled && (
        <p className="mt-2 text-sm opacity-75">{t("“Đặt câu” đang khoá vì cần chấm bằng AI — sẽ mở khi đã cấu hình API.", "“Write a sentence” is locked because it needs AI grading — it opens once the API is configured.")}</p>
      )}
      <div role="tabpanel" className="mt-4">
        {tab === "ime" ? (
          <div className="rounded border border-border p-4">
            <ImePractice words={words} />
          </div>
        ) : (
          <ol className="space-y-4">
            {items.map((ex) => (
              <li key={ex.id} className="rounded border border-border p-4">
                {ex.type === "fill" && <FillItem ex={ex} />}
                {ex.type === "reorder" && <ReorderItem ex={ex} />}
                {ex.type === "compose" && <ComposeItem ex={ex} />}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
