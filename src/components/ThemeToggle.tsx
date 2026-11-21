"use client";

export default function ThemeToggle() {
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
      aria-label="Đổi chế độ sáng/tối"
      title="Đổi chế độ sáng/tối"
      className="ml-auto rounded-full border border-border px-3 py-1 hover:bg-muted"
    >
      ◐
    </button>
  );
}
