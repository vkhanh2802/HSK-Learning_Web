"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitExercise } from "@/app/actions";
import Picture from "@/components/Picture";
import { useT } from "@/components/LangProvider";
import type { Line, ListeningExercise } from "@/lib/exercises";
import { speakLines } from "@/lib/tts";

export type Result = { correct: boolean };

const optionClass = (answered: boolean, isAnswer: boolean, isPicked: boolean) =>
  !answered
    ? "hover:bg-muted hover:-translate-y-0.5"
    : isAnswer
      ? "animate-pop border-green-600 bg-green-600/15"
      : isPicked
        ? "animate-shake border-accent bg-accent/15"
        : "opacity-50";

function Transcript({ lines }: { lines: Line[] }) {
  const t = useT();
  return (
    <div className="mt-3 rounded bg-muted p-3 text-sm">
      <p className="mb-1 font-semibold">{t("Lời thoại", "Transcript")}</p>
      {lines.map((l, i) => (
        <p key={i} className="mt-1">
          {l.speaker && <span className="mr-1 opacity-75">{l.speaker === "nam" ? t("Nam:", "Man:") : t("Nữ:", "Woman:")}</span>}
          <span lang="zh-CN" className="text-base">
            {l.hanzi}
          </span>{" "}
          <span className="opacity-75">{l.pinyin}</span> — {l.vi}
        </p>
      ))}
    </div>
  );
}

/**
 * Một câu bài nghe: phát âm thanh (tự phát khi hiện câu), nhận câu trả lời, chấm ở server, hiện lời thoại.
 * `rate` là tốc độ đọc do trang chọn.
 */
export default function ExercisePlayer({
  exercise,
  rate,
  onDone,
}: {
  exercise: ListeningExercise;
  rate: number;
  onDone: (r: Result) => void;
}) {
  const t = useT();
  const [picked, setPicked] = useState<boolean | number | string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; answer: unknown } | null>(null);
  const [plays, setPlays] = useState(1); // effect bên dưới tự phát lần đầu
  const [unsupported, setUnsupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const shownAt = useRef(0);
  const { audio } = exercise.payload;

  const play = () => {
    setUnsupported(!speakLines(audio.map((l) => ({ text: l.hanzi, speaker: l.speaker })), rate));
    setPlays((n) => n + 1);
  };

  // Component được tạo mới cho mỗi câu (key = id), nên effect này chạy đúng 1 lần/câu.
  // Không phát lại khi đổi tốc độ; nếu máy thiếu giọng đọc, nút Nghe sẽ báo.
  useEffect(() => {
    shownAt.current = Date.now();
    speakLines(audio.map((l) => ({ text: l.hanzi, speaker: l.speaker })), rate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (response: boolean | number | string) => {
    setPicked(response);
    startTransition(async () => {
      try {
        const r = await submitExercise({ exerciseId: exercise.id, response, durationMs: Date.now() - shownAt.current });
        setResult(r);
        setError(null);
      } catch {
        setPicked(null);
        setError(t("Không chấm được, thử lại.", "Could not grade, please try again."));
      }
    });
  };

  const answered = result !== null;

  return (
    <div className="animate-card-swap rounded border border-border bg-muted/25 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={play}
          className="rounded bg-accent px-4 py-2 font-semibold text-background hover:opacity-90"
        >
          🔊 {t("Nghe", "Listen")} {plays > 1 ? t(`(lần ${plays})`, `(play ${plays})`) : t("lại", "again")}
        </button>
        {unsupported && (
          <span role="status" className="text-sm text-accent">
            {t("Máy chưa có giọng đọc tiếng Trung — cài gói ngôn ngữ Trung (Giản thể) trong cài đặt Windows.", "This device has no Chinese voice — install the Chinese (Simplified) language pack in Windows settings.")}
          </span>
        )}
      </div>

      <div className="mt-4">
        {exercise.type === "picture_tf" && (
          <>
            <p>{t("Âm thanh có khớp với tranh không?", "Does the audio match the picture?")}</p>
            <div className="my-3">
              <Picture picture={exercise.payload.picture} size={200} />
            </div>
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  disabled={answered || pending}
                  onClick={() => submit(v)}
                  className={`min-w-24 rounded border border-border px-4 py-2 ${optionClass(answered, result?.answer === v, picked === v)}`}
                >
                  {v ? t("✓ Đúng", "✓ True") : t("✗ Sai", "✗ False")}
                </button>
              ))}
            </div>
          </>
        )}

        {exercise.type === "picture_mcq" && (
          <>
            <p>{t("Chọn tranh đúng với câu vừa nghe.", "Choose the picture that matches what you heard.")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {exercise.payload.options.map((o, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={answered || pending}
                  onClick={() => submit(i)}
                  aria-label={o.label}
                  className={`rounded border-2 border-border p-1.5 ${optionClass(answered, result?.answer === i, picked === i)}`}
                >
                  <Picture picture={o} size={140} />
                </button>
              ))}
            </div>
          </>
        )}

        {exercise.type === "mcq" && (
          <>
            <p>
              <span lang="zh-CN" className="text-lg">
                {exercise.payload.question.hanzi}
              </span>{" "}
              <span className="text-sm opacity-75">{exercise.payload.question.pinyin}</span>
            </p>
            {answered && <p className="text-sm">{exercise.payload.question.vi}</p>}
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {exercise.payload.options.map((o, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={answered || pending}
                  onClick={() => submit(i)}
                  className={`rounded border border-border px-4 py-3 text-left ${optionClass(answered, result?.answer === i, picked === i)}`}
                >
                  <span lang="zh-CN" className="block text-xl">
                    {o.hanzi}
                  </span>
                  <span className="text-sm opacity-75">{o.pinyin}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {exercise.type === "dictation" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) submit(text);
            }}
          >
            <label htmlFor={`dict-${exercise.id}`}>{t("Gõ lại câu vừa nghe (chữ Hán hoặc pinyin, có dấu hay không đều được):", "Type the sentence you heard (characters or pinyin, tone marks optional):")}</label>
            <div className="mt-2 flex gap-2">
              <input
                id={`dict-${exercise.id}`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={answered || pending}
                autoComplete="off"
                className="flex-1 rounded border border-border bg-background px-3 py-2"
              />
              <button
                type="submit"
                disabled={answered || pending || !text.trim()}
                className="rounded border border-border px-4 py-2 hover:bg-muted disabled:opacity-40"
              >
                {t("Kiểm tra", "Check")}
              </button>
            </div>
          </form>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 font-semibold">
          {error}
        </p>
      )}

      {result && (
        <div className="animate-pop mt-4">
          <p role="status" className="font-semibold">
            {result.correct ? t("✓ Chính xác!", "✓ Correct!") : t("✗ Chưa đúng.", "✗ Not quite.")}
          </p>
          <Transcript lines={audio} />
          <button
            type="button"
            onClick={() => onDone({ correct: result.correct })}
            className="mt-3 rounded bg-accent px-4 py-2 font-semibold text-background hover:opacity-90"
          >
            {t("Câu tiếp →", "Next question →")}
          </button>
        </div>
      )}
    </div>
  );
}
