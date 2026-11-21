"use client";

import { useT } from "./LangProvider";

export default function ThemeToggle() {
  const t = useT();
  function toggle() {
    const root = document.documentElement;
    const isDark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = isDark ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {} // trình duyệt chặn storage: vẫn đổi được trong phiên hiện tại
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("Đổi chế độ sáng/tối", "Toggle light/dark mode")}
      title={t("Đổi chế độ sáng/tối", "Toggle light/dark mode")}
      className="rounded-full border border-border px-3 py-1 hover:bg-muted"
    >
      ◐
    </button>
  );
}
