"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getVolume, setVolume, speak } from "@/lib/tts";
import { useT } from "./LangProvider";

const subscribe = (cb: () => void) => {
  window.addEventListener("volume-change", cb);
  return () => window.removeEventListener("volume-change", cb);
};

// Nút loa; bấm mới mở thanh chỉnh. Thanh dựa trên slider của Galahhad (Uiverse.io, MIT), CSS ở globals.css (.uv-volume).
export default function VolumeSlider() {
  const t = useT();
  const volume = useSyncExternalStore(subscribe, getVolume, () => 1);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const label = t("Âm lượng đọc", "Speech volume");

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button type="button" className="uv-vol-btn" aria-label={label} title={label} aria-expanded={open} onClick={() => setOpen(!open)}>
        <svg aria-hidden viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12 22a1 1 0 0 1-.707-.293L6.586 17H4c-1.103 0-2-.897-2-2V9c0-1.103.897-2 2-2h2.586l4.707-4.707A.998.998 0 0 1 13 3v18a1 1 0 0 1-1 1z" />
          {volume > 0 && (
            <path d="M15.53 16.53a.999.999 0 0 1-.703-1.711C15.572 14.082 16 13.054 16 12s-.428-2.082-1.173-2.819a1 1 0 1 1 1.406-1.422A6 6 0 0 1 18 12a6 6 0 0 1-1.767 4.241.996.996 0 0 1-.703.289z" />
          )}
          {volume > 0.5 && (
            <path d="M18.36 19.36a1 1 0 0 1-.705-1.71C19.167 16.148 20 14.142 20 12s-.833-4.148-2.345-5.65a1 1 0 1 1 1.41-1.419C20.958 6.812 22 9.322 22 12s-1.042 5.188-2.935 7.069a.997.997 0 0 1-.705.291z" />
          )}
        </svg>
      </button>
      {open && (
        <div className="glass uv-vol-pop">
          <label className="uv-volume">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              aria-label={label}
              autoFocus
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              // Nghe thử khi thả chuột/phím để biết mức vừa chọn.
              onPointerUp={() => speak("你好")}
              onKeyUp={() => speak("你好")}
            />
          </label>
        </div>
      )}
    </div>
  );
}
