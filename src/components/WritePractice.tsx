"use client";

import { useState } from "react";
import AudioButton from "@/components/AudioButton";
import StrokeQuiz, { type StrokeMode } from "@/components/StrokeQuiz";
import { useT } from "./LangProvider";

const MODES: { mode: StrokeMode; label: [string, string] }[] = [
  { mode: "animate", label: ["Xem thứ tự nét", "Stroke order"] },
  { mode: "trace", label: ["Viết theo mẫu", "Trace"] },
  { mode: "blind", label: ["Viết không mẫu", "Write from memory"] },
];

export default function WritePractice({ char }: { char: string }) {
  const t = useT();
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
      <div role="group" aria-label={t("Chế độ luyện viết", "Writing mode")} className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.mode}
            type="button"
            aria-pressed={mode === m.mode}
            className={`rounded border border-border px-3 py-1.5 ${mode === m.mode ? "bg-accent font-semibold text-background" : "hover:bg-muted"}`}
            onClick={() => choose(m.mode)}
          >
            {t(m.label[0], m.label[1])}
          </button>
        ))}
        <AudioButton text={char} />
      </div>
      <p className="mt-2 text-sm opacity-75">{strokes !== null ? t(`${strokes} nét`, `${strokes} strokes`) : t("Đang tải nét chữ…", "Loading strokes…")}</p>
      <div className="mt-2">
        <StrokeQuiz key={attempt} char={char} mode={mode} onLoad={setStrokes} onComplete={setMistakes} />
      </div>
      {mistakes !== null && (
        <div role="status" className="animate-pop mt-3">
          <p>{mistakes === 0 ? t("✓ Hoàn hảo, không sai nét nào!", "✓ Perfect, no mistakes!") : t(`✓ Xong — sai ${mistakes} lần.`, `✓ Done — ${mistakes} mistakes.`)}</p>
          <button
            type="button"
            className="mt-2 rounded border border-border px-3 py-1.5 hover:bg-muted"
            onClick={() => choose(mode)}
          >
            {t("Viết lại", "Write again")}
          </button>
        </div>
      )}
    </div>
  );
}
