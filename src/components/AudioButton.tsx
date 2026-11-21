"use client";

import { useState } from "react";
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
          {t("Máy chưa có giọng đọc tiếng Trung — cài gói ngôn ngữ Trung (Giản thể) trong cài đặt Windows.", "This device has no Chinese voice — install the Chinese (Simplified) language pack in Windows settings.")}
        </span>
      )}
    </span>
  );
}
