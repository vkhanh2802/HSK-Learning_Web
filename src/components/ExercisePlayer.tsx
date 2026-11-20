"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitExercise } from "@/app/actions";
import type { ClientExercise, Line } from "@/lib/exercises";
import { speakLines } from "@/lib/tts";

export type Result = { correct: boolean };

const optionClass = (answered: boolean, isAnswer: boolean, isPicked: boolean) =>
  !answered
    ? "hover:bg-muted"
    : isAnswer
      ? "border-green-600 bg-green-600/15"
      : isPicked
        ? "border-accent bg-accent/15"
        : "opacity-60";

function Transcript({ lines }: { lines: Line[] }) {
  return (
    <div className="mt-3 rounded bg-muted p-3 text-sm">
      <p className="mb-1 font-semibold">Lời thoại</p>
      {lines.map((l, i) => (
        <p key={i} className="mt-1">
          {l.speaker && <span className="mr-1 opacity-75">{l.speaker === "nam" ? "Nam:" : "Nữ:"}</span>}
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
  exercise: ClientExercise;
  rate: number;
  onDone: (r: Result) => void;
}) {
  const [picked, setPicked] = useState<boolean | number | string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; answer: boolean | number | null } | null>(null);
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
        setError("Không chấm được, thử lại.");
      }
    });
  };

  const answered = result !== null;

  return (
    <div className="rounded border border-border p-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={play}
          className="rounded bg-accent px-4 py-2 font-semibold text-background hover:opacity-90"
        >
          🔊 Nghe {plays > 1 ? `(lần ${plays})` : "lại"}
        </button>
        {unsupported && (
          <span role="status" className="text-sm text-accent">
            Máy chưa có giọng đọc tiếng Trung — cài gói ngôn ngữ Trung (Giản thể) trong cài đặt Windows.
          </span>
        )}
      </div>

      <div className="mt-4">
        {exercise.type === "picture_tf" && (
          <>
            <p>Âm thanh có khớp với tranh không?</p>
            <p className="my-3 text-7xl" role="img" aria-label={exercise.payload.picture.label}>
              {exercise.payload.picture.emoji}
            </p>
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  disabled={answered || pending}
                  onClick={() => submit(v)}
                  className={`min-w-24 rounded border border-border px-4 py-2 ${optionClass(answered, result?.answer === v, picked === v)}`}
                >
                  {v ? "✓ Đúng" : "✗ Sai"}
                </button>
              ))}
            </div>
          </>
        )}

        {exercise.type === "picture_mcq" && (
          <>
            <p>Chọn tranh đúng với câu vừa nghe.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {exercise.payload.options.map((o, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={answered || pending}
                  onClick={() => submit(i)}
                  aria-label={o.label}
                  className={`rounded border border-border px-6 py-3 text-6xl ${optionClass(answered, result?.answer === i, picked === i)}`}
                >
                  {o.emoji}
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
            <label htmlFor={`dict-${exercise.id}`}>Gõ lại câu vừa nghe (chữ Hán hoặc pinyin, có dấu hay không đều được):</label>
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
                Kiểm tra
              </button>
            </div>
          </form>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-accent">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4">
          <p role="status" className="font-semibold">
            {result.correct ? "✓ Chính xác!" : "✗ Chưa đúng."}
          </p>
          <Transcript lines={audio} />
          <button
            type="button"
            onClick={() => onDone({ correct: result.correct })}
            className="mt-3 rounded bg-accent px-4 py-2 font-semibold text-background hover:opacity-90"
          >
            Câu tiếp →
          </button>
        </div>
      )}
    </div>
  );
}
