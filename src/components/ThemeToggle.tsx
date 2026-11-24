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
    // aria-checked chỉ là mặc định cho trình đọc màn hình; hình dạng công tắc do CSS theo data-theme quyết định.
    <button
      type="button"
      role="switch"
      aria-checked="false"
      onClick={toggle}
      aria-label={t("Đổi chế độ sáng/tối", "Toggle light/dark mode")}
      title={t("Đổi chế độ sáng/tối", "Toggle light/dark mode")}
      className="uv-switch"
    />
  );
}
