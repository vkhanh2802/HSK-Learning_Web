"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeLesson } from "@/app/actions";
import AudioButton from "@/components/AudioButton";
import { speak } from "@/lib/tts";
import type { WordView } from "@/lib/words";

type Question = { word: WordView; kind: "meaning" | "listen"; options: WordView[] };

const shuffle = <T,>(xs: T[]) =>
  xs
    .map((x) => [Math.random(), x] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, x]) => x);

// Câu xen kẽ 2 dạng: nhìn chữ chọn nghĩa / nghe chọn chữ; 3 phương án nhiễu lấy từ chính bài.
// Tạo trong event handler (không lúc render) để server và client không lệch nhau khi hydrate.
function buildQuiz(words: WordView[]): Question[] {
  return shuffle(words).map((word, i) => ({
    word,
    kind: i % 2 === 0 ? "meaning" : "listen",
    options: shuffle([word, ...shuffle(words.filter((w) => w.id !== word.id)).slice(0, 3)]),
  }));
}

const btn = "rounded border border-border px-4 py-2 hover:bg-muted disabled:opacity-40";
const primary =
  "rounded bg-accent px-4 py-2 font-semibold text-background hover:opacity-90 disabled:opacity-40";

export default function LessonFlow({ lessonId, words }: { lessonId: number; words: WordView[] }) {
  const [step, setStep] = useState<"intro" | "quiz" | "done">("intro");
  const [i, setI] = useState(0);
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (words.length === 0) return <p className="mt-6">Bài này chưa có từ.</p>;

  if (step === "intro") {
    const w = words[i];
    return (
      <section className="mt-6">
        <p className="text-sm opacity-75">
          Từ mới {i + 1}/{words.length}
        </p>
        <div className="mt-3 rounded border border-border p-6">
          <div className="flex items-center gap-4">
            <span lang="zh-CN" className="text-6xl">
              {w.hanzi}
            </span>
            <AudioButton key={w.hanzi} text={w.hanzi} />
          </div>
          <p className="mt-2 text-xl">{w.pinyin}</p>
          <p className="mt-1 text-lg">
            {w.meaningVi} {w.pos && <span className="text-sm opacity-75">({w.pos})</span>}
          </p>
          <p className="mt-3 text-sm">
            {w.chars.length > 1 ? "Tách chữ (bấm để tập viết):" : "Tập viết:"}{" "}
            {w.chars.map((c, k) => (
              <Link key={k} href={`/write/${c.char}`} target="_blank" className="mr-3 hover:underline">
                <span lang="zh-CN" className="text-lg text-accent">
                  {c.char}
                </span>{" "}
                {c.pinyin}
              </Link>
            ))}
          </p>
          {w.example && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="flex items-center gap-2">
                <span lang="zh-CN" className="text-lg">
                  {w.example.hanzi}
                </span>
                <AudioButton key={w.example.hanzi} text={w.example.hanzi} label="Nghe câu ví dụ" />
              </p>
              <p className="text-sm opacity-75">{w.example.pinyin}</p>
              <p className="text-sm">{w.example.vi}</p>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-3">
          <button type="button" className={btn} disabled={i === 0} onClick={() => setI(i - 1)}>
            ← Trước
          </button>
          {i < words.length - 1 ? (
            <button type="button" className={primary} onClick={() => setI(i + 1)}>
              Tiếp →
            </button>
          ) : (
            <button
              type="button"
              className={primary}
              onClick={() => {
                setQuiz(buildQuiz(words));
                setI(0);
                setScore(0);
                setStep("quiz");
              }}
            >
              Bắt đầu kiểm tra
            </button>
          )}
        </div>
      </section>
    );
  }

  if (step === "quiz") {
    const q = quiz[i];
    const answered = picked !== null;
    const next = () => {
      setPicked(null);
      if (i < quiz.length - 1) setI(i + 1);
      else setStep("done");
    };
    return (
      <section className="mt-6">
        <p className="text-sm opacity-75">
          Câu {i + 1}/{quiz.length} · Đúng {score}
        </p>
        <div className="mt-3 rounded border border-border p-6">
          {q.kind === "meaning" ? (
            <p>
              Nghĩa của{" "}
              <span lang="zh-CN" className="text-4xl">
                {q.word.hanzi}
              </span>{" "}
              là gì?
            </p>
          ) : (
            <p className="flex items-center gap-3">
              Nghe và chọn chữ đúng: <AudioButton key={q.word.id} text={q.word.hanzi} />
            </p>
          )}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {q.options.map((o) => {
              const correct = o.id === q.word.id;
              const state = !answered
                ? "enabled:hover:bg-muted"
                : correct
                  ? "border-green-600 bg-green-600/15"
                  : o.id === picked
                    ? "border-accent bg-accent/15"
                    : "opacity-60";
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={answered}
                  className={`rounded border border-border px-4 py-3 text-left ${state}`}
                  onClick={() => {
                    setPicked(o.id);
                    if (correct) setScore(score + 1);
                    if (q.kind === "listen") speak(q.word.hanzi);
                  }}
                >
                  {q.kind === "meaning" ? (
                    o.meaningVi
                  ) : (
                    <span lang="zh-CN" className="text-2xl">
                      {o.hanzi}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {answered && (
            <p role="status" className="mt-4">
              {picked === q.word.id ? "✓ Chính xác! " : "✗ Chưa đúng. "}
              <span lang="zh-CN">{q.word.hanzi}</span> · {q.word.pinyin} · {q.word.meaningVi}
            </p>
          )}
        </div>
        <button type="button" className={`${primary} mt-4`} disabled={!answered} onClick={next}>
          {i < quiz.length - 1 ? "Câu tiếp →" : "Xem kết quả"}
        </button>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded border border-border p-6">
      <p className="text-xl font-semibold">
        Kết quả: {score}/{quiz.length} câu đúng
      </p>
      {saved ? (
        <p role="status" className="mt-3">
          ✓ Đã lưu. Các từ của bài đã vào hàng ôn tập.{" "}
          <Link href="/review" className="text-accent underline">
            Ôn tập ngay
          </Link>
        </p>
      ) : (
        <button
          type="button"
          className={`${primary} mt-4`}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await completeLesson(lessonId);
                setSaved(true);
                setError(null);
              } catch {
                setError("Không lưu được, thử lại.");
              }
            })
          }
        >
          {pending ? "Đang lưu…" : "Hoàn thành bài và thêm vào ôn tập"}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-accent">
          {error}
        </p>
      )}
      <button
        type="button"
        className={`${btn} mt-4 block`}
        onClick={() => {
          setStep("intro");
          setI(0);
        }}
      >
        Học lại bài
      </button>
    </section>
  );
}
