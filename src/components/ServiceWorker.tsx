"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const WARM_KEY = "offline-warmed-at";
const enabled = () => process.env.NODE_ENV === "production" && typeof navigator !== "undefined" && "serviceWorker" in navigator;

/**
 * Đăng ký service worker (chỉ bản build production — ở dev nó sẽ cache nhầm code đang sửa).
 * Khi đổi trang, tối đa mỗi giờ một lần, tải trước trang /offline và bộ từ để ôn được khi mất mạng.
 */
export default function ServiceWorker() {
  const pathname = usePathname();

  useEffect(() => {
    if (enabled()) navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled() || pathname === "/login" || !navigator.onLine) return;
    if (Date.now() - Number(localStorage.getItem(WARM_KEY) ?? 0) < 3_600_000) return;
    navigator.serviceWorker.ready
      // Đi qua service worker nên được lưu vào cache; bị chuyển sang trang đăng nhập thì không tính.
      .then(() => Promise.all([fetch("/offline"), fetch("/api/offline-deck")]))
      .then(async ([page, deck]) => {
        if (![page, deck].every((r) => r.ok && !r.redirected)) return;
        // Tải luôn JS/CSS của trang /offline để trang chạy được khi mất mạng (service worker lưu file tĩnh).
        const assets = new Set((await page.text()).match(/\/_next\/static\/[^"'\s\\)]+/g) ?? []);
        await Promise.all([...assets].map((a) => fetch(a)));
        localStorage.setItem(WARM_KEY, String(Date.now()));
      })
      .catch(() => {});
  }, [pathname]);

  return null;
}
