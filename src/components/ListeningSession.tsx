"use client";

import { useState } from "react";
import ExercisePlayer from "@/components/ExercisePlayer";
import type { ListeningExercise } from "@/lib/exercises";

const RATES = [
  { rate: 0.68, label: "0.75x" },
  { rate: 0.9, label: "1x" },
  { rate: 1.12, label: "1.25x" },
]; // 0.9 = tốc độ "bình thường" của app (giọng mặc định hơi nhanh với người mới)

const shuffle = <T,>(xs: T[]) =>
  xs
    .map((x) => [Math.random(), x] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, x]) => x);

export default function ListeningSession({ exercises }: { exercises: ListeningExercise[] }) {
  const [queue, setQueue] = useState<ListeningExercise[] | null>(null);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [rate, setRate] = useState(0.9);

  const start = (n: number) => {
    // Bốc ngẫu nhiên trong event handler, không lúc render, để server/client không lệch nhau.
    setQueue(n >= exercises.length ? exercises : shuffle(exercises).slice(0, n));
    setI(0);
    setScore(0);
  };

  const speed = (
    <div role="group" aria-label="Tốc độ đọc" className="flex items-center gap-1 text-sm">
      Tốc độ:
      {RATES.map((r) => (
        <button
          key={r.label}
          type="button"
          aria-pressed={rate === r.rate}
          onClick={() => setRate(r.rate)}
          className={`rounded border border-border px-2 py-1 ${rate === r.rate ? "bg-accent font-semibold text-background" : "hover:bg-muted"}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  const startButtons = (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => start(10)} className="rounded bg-accent px-4 py-2 font-semibold text-background">
        Bộ 10 câu ngẫu nhiên
      </button>
      <button type="button" onClick={() => start(exercises.length)} className="rounded border border-border px-4 py-2 hover:bg-muted">
        Làm cả {exercises.length} câu
      </button>
    </div>
  );

  if (exercises.length === 0) return <p className="mt-4">Chưa có bài nghe cho cấp này.</p>;
  if (!queue)
    return (
      <div className="mt-4 space-y-4">
        {speed}
        {startButtons}
      </div>
    );

  if (i >= queue.length)
    return (
      <div className="mt-4 space-y-4">
        <p role="status" className="text-xl font-semibold">
          Kết quả: {score}/{queue.length} câu đúng
        </p>
        {startButtons}
      </div>
    );

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm opacity-75">
          Câu {i + 1}/{queue.length} · Đúng {score}
        </p>
        {speed}
      </div>
      <ExercisePlayer
        key={queue[i].id}
        exercise={queue[i]}
        rate={rate}
        onDone={({ correct }) => {
          if (correct) setScore((s) => s + 1);
          setI((n) => n + 1);
        }}
      />
    </div>
  );
}
