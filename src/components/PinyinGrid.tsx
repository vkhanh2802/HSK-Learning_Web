"use client";

import { useState } from "react";
import { speak } from "@/lib/tts";
import type { Syllable } from "@/lib/syllables";
import { useT } from "./LangProvider";

const TONES = [1, 2, 3, 4] as const;

export default function PinyinGrid({ groups }: { groups: { initial: string; syllables: Syllable[] }[] }) {
  const tx = useT();
  const [last, setLast] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  return (
    <div>
      <p role="status" className="sticky top-0 z-10 bg-background py-2 text-sm">
        {unsupported
          ? tx("Máy chưa có giọng đọc tiếng Trung — cài gói ngôn ngữ Trung (Giản thể) trong cài đặt Windows.", "This device has no Chinese voice — install the Chinese (Simplified) language pack in Windows settings.")
          : last
            ? tx(`Đang phát: ${last}`, `Playing: ${last}`)
            : tx("Bấm vào một thanh để nghe.", "Tap a tone to listen.")}
      </p>
      {groups.map((g) => (
        <section key={g.initial} className="mt-4">
          <h3 className="font-semibold ">{g.initial || tx("Không có thanh mẫu", "No initial")}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {g.syllables.map((s) => (
              <li key={s.base} className="rounded border border-border p-2">
                <span className="block text-center text-sm font-semibold">{s.base}</span>
                <span className="mt-1 flex gap-1">
                  {TONES.map((t) => {
                    const sample = s.tones[t];
                    return sample ? (
                      <button
                        key={t}
                        type="button"
                        className="rounded px-1.5 py-0.5 hover:bg-muted"
                        aria-label={tx(`${sample.marked}, thanh ${t}, ví dụ chữ ${sample.char}`, `${sample.marked}, tone ${t}, example character ${sample.char}`)}
                        onClick={() => {
                          setUnsupported(!speak(sample.char, 0.8));
                          setLast(`${sample.marked} (${sample.char})`);
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
