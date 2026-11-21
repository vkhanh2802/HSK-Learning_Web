"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { relearnWord } from "@/app/actions";
import { useT } from "./LangProvider";

/** Nút "Học lại": đưa thẻ của từ về hạn ngay để xuất hiện trong lượt ôn tập tới. */
export function RelearnButton({ wordId }: { wordId: number }) {
  const t = useT();
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending || done}
      onClick={() =>
        startTransition(async () => {
          await relearnWord(wordId);
          setDone(true);
        })
      }
      className="rounded border border-border px-2 py-0.5 text-sm hover:bg-muted disabled:opacity-60"
    >
      {done ? t("Đã đưa vào ôn tập", "Added to review") : t("Học lại", "Relearn")}
    </button>
  );
}

/** Tải file backup và khôi phục từ file (ghi đè toàn bộ tiến độ hiện tại). */
export function BackupPanel() {
  const t = useT();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const restore = (file: File) =>
    startTransition(async () => {
      if (!window.confirm(t(`Khôi phục từ “${file.name}” sẽ XOÁ toàn bộ tiến độ hiện tại và thay bằng nội dung file. Tiếp tục?`, `Restoring from “${file.name}” will DELETE all current progress and replace it with the file’s content. Continue?`))) return;
      try {
        const res = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: await file.text() });
        const data = await res.json();
        if (!res.ok) setMsg(data.error ?? t("Không khôi phục được.", "Could not restore."));
        else {
          setMsg(
            t(
              `Đã khôi phục: ${data.lessons} bài đã học, ${data.cards} thẻ, ${data.attempts} lượt làm bài, ${data.mockTests} đề thi thử`,
              `Restored: ${data.lessons} lessons, ${data.cards} cards, ${data.attempts} attempts, ${data.mockTests} mock tests`,
            ) + (data.skipped ? t(` (bỏ qua ${data.skipped} mục không còn trong dữ liệu).`, ` (skipped ${data.skipped} items no longer in the data).`) : "."),
          );
          router.refresh();
        }
      } catch {
        setMsg(t("Không đọc được file.", "Could not read the file."));
      }
    });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href="/api/backup" download className="rounded bg-accent px-4 py-2 font-semibold text-background">
        {t("Tải file backup", "Download backup")}
      </a>
      <button
        type="button"
        disabled={pending}
        onClick={() => input.current?.click()}
        className="rounded border border-border px-4 py-2 hover:bg-muted disabled:opacity-60"
      >
        {pending ? t("Đang khôi phục…", "Restoring…") : t("Khôi phục từ file…", "Restore from file…")}
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label={t("Chọn file backup", "Choose backup file")}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) restore(f);
        }}
      />
      {msg && <p role="status">{msg}</p>}
    </div>
  );
}
