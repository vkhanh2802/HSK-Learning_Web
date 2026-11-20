"use client";

import { useState } from "react";
import AudioButton from "@/components/AudioButton";
import StrokeQuiz, { type StrokeMode } from "@/components/StrokeQuiz";

const MODES: { mode: StrokeMode; label: string }[] = [
  { mode: "animate", label: "Xem thứ tự nét" },
  { mode: "trace", label: "Viết theo mẫu" },
  { mode: "blind", label: "Viết không mẫu" },
];

export default function WritePractice({ char }: { char: string }) {
  const [mode, setMode] = useState<StrokeMode>("animate");
  const [strokes, setStrokes] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  const choose = (m: StrokeMode) => {
    setMode(m);
    setMistakes(null);
    setAttempt((a) => a + 1);
  };

  return (
    <div>
      <div role="group" aria-label="Chế độ luyện viết" className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.mode}
            type="button"
            aria-pressed={mode === m.mode}
            className={`rounded border border-border px-3 py-1.5 ${mode === m.mode ? "bg-accent font-semibold text-background" : "hover:bg-muted"}`}
            onClick={() => choose(m.mode)}
          >
            {m.label}
          </button>
        ))}
        <AudioButton text={char} />
      </div>
      <p className="mt-2 text-sm opacity-75">{strokes !== null ? `${strokes} nét` : "Đang tải nét chữ…"}</p>
      <div className="mt-2">
        <StrokeQuiz key={attempt} char={char} mode={mode} onLoad={setStrokes} onComplete={setMistakes} />
      </div>
      {mistakes !== null && (
        <div role="status" className="mt-3">
          <p>{mistakes === 0 ? "✓ Hoàn hảo, không sai nét nào!" : `✓ Xong — sai ${mistakes} lần.`}</p>
          <button
            type="button"
            className="mt-2 rounded border border-border px-3 py-1.5 hover:bg-muted"
            onClick={() => choose(mode)}
          >
            Viết lại
          </button>
        </div>
      )}
    </div>
  );
}
