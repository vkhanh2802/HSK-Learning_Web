"use client";

import { useState } from "react";
import { speak } from "@/lib/tts";

// hideText: câu hỏi nghe — không đưa chữ vào nhãn, kẻo trình đọc màn hình đọc lộ đáp án.
export default function AudioButton({
  text,
  label = "Nghe phát âm",
  hideText = false,
}: {
  text: string;
  label?: string;
  hideText?: boolean;
}) {
  const [unsupported, setUnsupported] = useState(false);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => setUnsupported(!speak(text))}
        aria-label={hideText ? label : `${label}: ${text}`}
        title={label}
        className="rounded-full border border-border px-2 py-1 leading-none hover:bg-muted"
      >
        🔊
      </button>
      {unsupported && (
        <span role="status" className="text-sm text-accent">
          Máy chưa có giọng đọc tiếng Trung — cài gói ngôn ngữ Trung (Giản thể) trong cài đặt Windows.
        </span>
      )}
    </span>
  );
}
