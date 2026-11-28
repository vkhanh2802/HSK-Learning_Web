"use client";

import { useEffect, useRef, useState } from "react";
import { speak } from "@/lib/tts";
import { useT } from "./LangProvider";

// hideText: câu hỏi nghe — không đưa chữ vào nhãn, kẻo trình đọc màn hình đọc lộ đáp án.
export default function AudioButton({
  text,
  label: labelProp,
  hideText = false,
}: {
  text: string;
  label?: string;
  hideText?: boolean;
}) {
  const t = useT();
  const label = labelProp ?? t("Nghe phát âm", "Play pronunciation");
  const [unsupported, setUnsupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handlePlay = () => {
    const ok = speak(text);
    setUnsupported(!ok);
    if (ok) {
      setPlaying(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setPlaying(false), 1100);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handlePlay}
        aria-label={hideText ? label : `${label}: ${text}`}
        title={label}
        className={`inline-flex items-center justify-center rounded-full border border-border p-2 leading-none transition hover:border-brush/50 hover:bg-muted ${
          playing ? "audio-playing border-brush/60 bg-muted text-brush" : ""
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" fillOpacity="0.15" />
          <path className="audio-wave-1" d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path className="audio-wave-2" d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      </button>
      {unsupported && (
        <span role="status" className="text-sm text-accent">
          {t("Máy chưa có giọng đọc tiếng Trung — cài gói ngôn ngữ Trung (Giản thể) trong cài đặt Windows.", "This device has no Chinese voice — install the Chinese (Simplified) language pack in Windows settings.")}
        </span>
      )}
    </span>
  );
}
