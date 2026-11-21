"use client";

import { useState, useTransition } from "react";
import { addMockMistakes } from "@/app/actions";

/** Nút đưa từ trong các câu làm sai của một lần thi thử vào ôn tập. */
export default function AddMistakes({ resultId, count }: { resultId: number; count: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-2 flex items-center gap-3">
      <button
        type="button"
        disabled={pending || msg !== null}
        onClick={() =>
          startTransition(async () => {
            try {
              const added = await addMockMistakes(resultId);
              setMsg(added ? `Đã thêm ${added} từ vào ôn tập.` : "Các từ này đã có trong ôn tập.");
            } catch {
              setMsg("Không thêm được, thử lại sau.");
            }
          })
        }
        className="rounded bg-accent px-4 py-1.5 font-semibold text-background disabled:opacity-40"
      >
        Thêm {count} từ vào ôn tập
      </button>
      {msg && <span role="status">{msg}</span>}
    </div>
  );
}
