"use client";

import { useSyncExternalStore } from "react";
import { useT } from "./LangProvider";

const subscribe = (cb: () => void) => {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", cb);
  window.addEventListener("theme-change", cb);
  return () => {
    mql.removeEventListener("change", cb);
    window.removeEventListener("theme-change", cb);
  };
};

const getIsDark = () => {
  const root = document.documentElement;
  return root.dataset.theme ? root.dataset.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export default function ThemeToggle() {
  const t = useT();
  const isDark = useSyncExternalStore(subscribe, getIsDark, () => false);

  function toggle() {
    const root = document.documentElement;
    const next = getIsDark() ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {} // trình duyệt chặn storage: vẫn đổi được trong phiên hiện tại
    window.dispatchEvent(new Event("theme-change"));
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggle}
      aria-label={t("Đổi chế độ sáng/tối", "Toggle light/dark mode")}
      title={t("Đổi chế độ sáng/tối", "Toggle light/dark mode")}
      className="uv-switch"
    />
  );
}
