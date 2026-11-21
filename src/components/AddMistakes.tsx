"use client";

import { useState, useTransition } from "react";
import { addMockMistakes } from "@/app/actions";
import { useT } from "./LangProvider";

/** Nút đưa từ trong các câu làm sai của một lần thi thử vào ôn tập. */
export default function AddMistakes({ resultId, count }: { resultId: number; count: number }) {
  const t = useT();
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
              setMsg(added ? t(`Đã thêm ${added} từ vào ôn tập.`, `Added ${added} words to review.`) : t("Các từ này đã có trong ôn tập.", "These words are already in review."));
            } catch {
              setMsg(t("Không thêm được, thử lại sau.", "Could not add, please try again later."));
            }
          })
        }
        className="rounded bg-accent px-4 py-1.5 font-semibold text-background disabled:opacity-40"
      >
        {t(`Thêm ${count} từ vào ôn tập`, `Add ${count} words to review`)}
      </button>
      {msg && <span role="status">{msg}</span>}
    </div>
  );
}
