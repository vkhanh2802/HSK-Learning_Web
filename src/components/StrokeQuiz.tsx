"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "./LangProvider";

export type StrokeMode = "animate" | "trace" | "blind";

type Props = {
  char: string;
  mode: StrokeMode;
  size?: number;
  onLoad?: (strokes: number) => void;
  onComplete?: (mistakes: number) => void;
};

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Một ô viết chữ bằng hanzi-writer.
 * animate: xem thứ tự nét (lặp lại) · trace: viết đè lên chữ mờ · blind: viết không có mẫu (gợi ý sau 3 lần sai).
 * Dữ liệu nét tải từ CDN jsDelivr (hanzi-writer-data) nên cần mạng.
 */
export default function StrokeQuiz({ char, mode, size = 260, onLoad, onComplete }: Props) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  // Giữ callback mới nhất mà không phải tạo lại writer mỗi lần cha render.
  const handlers = useRef({ onLoad, onComplete });
  useEffect(() => {
    handlers.current = { onLoad, onComplete };
  });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    setError(false);

    import("hanzi-writer").then(({ default: HanziWriter }) => {
      if (cancelled) return;
      el.replaceChildren();
      const writer = HanziWriter.create(el, char, {
        width: size,
        height: size,
        padding: 10,
        showOutline: mode !== "blind",
        showCharacter: false,
        strokeColor: cssVar("--foreground") || "#171717",
        outlineColor: cssVar("--border") || "#e2e2e2",
        drawingColor: cssVar("--accent") || "#b91c1c",
        highlightColor: cssVar("--accent") || "#b91c1c",
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 250,
        onLoadCharDataSuccess: (data) => !cancelled && handlers.current.onLoad?.(data.strokes.length),
        onLoadCharDataError: () => !cancelled && setError(true),
      });
      if (mode === "animate") writer.loopCharacterAnimation();
      else
        writer.quiz({
          showHintAfterMisses: mode === "blind" ? 3 : 1,
          onComplete: ({ totalMistakes }) => !cancelled && handlers.current.onComplete?.(totalMistakes),
        });
    });

    return () => {
      cancelled = true;
      el.replaceChildren();
    };
  }, [char, mode, size]);

  return (
    <div>
      <div
        ref={box}
        role="img"
        aria-label={mode === "animate" ? t(`Hoạt ảnh thứ tự nét chữ ${char}`, `Stroke order animation for ${char}`) : t(`Ô viết chữ ${char}, dùng chuột hoặc tay để viết`, `Writing area for ${char}; write with mouse or finger`)}
        className="touch-none rounded border border-border bg-[linear-gradient(to_right,transparent_49.5%,var(--border)_49.5%,var(--border)_50.5%,transparent_50.5%),linear-gradient(to_bottom,transparent_49.5%,var(--border)_49.5%,var(--border)_50.5%,transparent_50.5%)]"
        style={{ width: size, height: size }}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold">
          {t("Không tải được dữ liệu nét chữ (cần kết nối mạng).", "Could not load stroke data (needs an internet connection).")}
        </p>
      )}
    </div>
  );
}
