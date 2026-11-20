"use client";

import { useState } from "react";
import AudioButton from "@/components/AudioButton";
import { speak } from "@/lib/tts";
import type { Syllable, ToneSample } from "@/lib/syllables";

type Tone = 1 | 2 | 3 | 4;
type Question = { syllable: Syllable; answer: Tone; options: Tone[] };

const ROUNDS = 10;
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const tonesOf = (s: Syllable) => (Object.keys(s.tones).map(Number) as Tone[]).sort();

/**
 * single: nghe một âm, chọn thanh 1–4.
 * pairs: chỉ dùng âm tiết có ≥ 2 thanh, phương án là chính các thanh đó (vd. mā / má / mǎ).
 */
export default function ToneDrill({ mode, syllables }: { mode: "single" | "pairs"; syllables: Syllable[] }) {
  const pool = mode === "pairs" ? syllables.filter((s) => tonesOf(s).length >= 2) : syllables;
  const [q, setQ] = useState<Question | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<Tone | null>(null);

  // Tạo câu hỏi trong event handler (không lúc render) để server/client không lệch nhau.
  const nextQuestion = () => {
    const syllable = pick(pool);
    const answer = pick(tonesOf(syllable));
    setQ({ syllable, answer, options: mode === "pairs" ? tonesOf(syllable) : [1, 2, 3, 4] });
    setPicked(null);
    speak(syllable.tones[answer]!.char, 0.8);
  };

  if (!q)
    return (
      <button type="button" className="rounded bg-accent px-4 py-2 font-semibold text-background" onClick={nextQuestion}>
        Bắt đầu ({ROUNDS} câu)
      </button>
    );

  if (round >= ROUNDS)
    return (
      <div role="status">
        <p className="text-lg font-semibold">
          Kết quả: {score}/{ROUNDS}
        </p>
        <button
          type="button"
          className="mt-2 rounded border border-border px-4 py-2 hover:bg-muted"
          onClick={() => {
            setRound(0);
            setScore(0);
            nextQuestion();
          }}
        >
          Làm lại
        </button>
      </div>
    );

  const sample: ToneSample = q.syllable.tones[q.answer]!;
  const answered = picked !== null;
  const label = (t: Tone) => (mode === "pairs" ? q.syllable.tones[t]!.marked : `Thanh ${t}`);

  return (
    <div>
      <p className="flex items-center gap-3 text-sm">
        Câu {round + 1}/{ROUNDS} · Đúng {score} · Nghe lại: <AudioButton key={`${round}-${sample.char}`} text={sample.char} hideText />
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {q.options.map((t) => {
          const state = !answered
            ? "hover:bg-muted"
            : t === q.answer
              ? "border-green-600 bg-green-600/15"
              : t === picked
                ? "border-accent bg-accent/15"
                : "opacity-60";
          return (
            <button
              key={t}
              type="button"
              disabled={answered}
              className={`min-w-20 rounded border border-border px-4 py-3 text-lg ${state}`}
              onClick={() => {
                setPicked(t);
                if (t === q.answer) setScore(score + 1);
              }}
            >
              {label(t)}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-3">
          <p role="status">
            {picked === q.answer ? "✓ Đúng! " : "✗ Chưa đúng. "}
            Đáp án: <strong>{sample.marked}</strong> (thanh {q.answer}) — chữ <span lang="zh-CN">{sample.char}</span>
          </p>
          <button
            type="button"
            className="mt-2 rounded bg-accent px-4 py-2 font-semibold text-background"
            onClick={() => {
              setRound(round + 1);
              if (round + 1 < ROUNDS) nextQuestion();
            }}
          >
            {round + 1 < ROUNDS ? "Câu tiếp →" : "Xem kết quả"}
          </button>
        </div>
      )}
    </div>
  );
}
