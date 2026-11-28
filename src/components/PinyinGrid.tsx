"use client";

import { useState } from "react";
import { speak } from "@/lib/tts";
import type { Syllable } from "@/lib/syllables";
import { useT } from "./LangProvider";

const TONES = [1, 2, 3, 4] as const;

export default function PinyinGrid({ groups }: { groups: { initial: string; syllables: Syllable[] }[] }) {
  const tx = useT();
  const [last, setLast] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  return (
    <div>
      <p role="status" className="sticky top-20 z-10 mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-background/85 px-4 py-2 text-sm shadow-sm backdrop-blur-xl">
        {last && !unsupported && <span aria-hidden className="size-2 animate-pulse rounded-full bg-brush" />}
        {unsupported
          ? tx("Máy chưa có giọng đọc tiếng Trung — cài gói ngôn ngữ Trung (Giản thể) trong cài đặt Windows.", "This device has no Chinese voice — install the Chinese (Simplified) language pack in Windows settings.")
          : last
            ? tx(`Đang phát: ${last}`, `Playing: ${last}`)
            : tx("Bấm vào một thanh để nghe.", "Tap a tone to listen.")}
      </p>
      {groups.map((g) => (
        <section key={g.initial} className="mt-5">
          <h3 className="font-semibold">{g.initial || tx("Không có thanh mẫu", "No initial")}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {g.syllables.map((s) => (
              <li key={s.base} className="ui-card rounded border border-border bg-muted/35 p-2">
                <span className="block text-center text-sm font-semibold">{s.base}</span>
                <span className="mt-1 flex gap-1">
                  {TONES.map((t) => {
                    const sample = s.tones[t];
                    const key = `${s.base}-${t}`;
                    const isPlaying = activeKey === key;
                    return sample ? (
                      <button
                        key={t}
                        type="button"
                        className={`rounded-md px-1.5 py-0.5 transition hover:bg-muted ${isPlaying ? "animate-pop bg-brush/15 font-semibold text-brush" : ""}`}
                        aria-label={tx(`${sample.marked}, thanh ${t}, ví dụ chữ ${sample.char}`, `${sample.marked}, tone ${t}, example character ${sample.char}`)}
                        onClick={() => {
                          setUnsupported(!speak(sample.char, 0.8));
                          setLast(`${sample.marked} (${sample.char})`);
                          setActiveKey(key);
                        }}
                      >
                        {sample.marked}
                      </button>
                    ) : (
                      <span key={t} className="w-6" aria-hidden />
                    );
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
