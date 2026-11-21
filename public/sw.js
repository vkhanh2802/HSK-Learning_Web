// Service worker (PWA, Phase 13). Viết tay, không dùng thư viện.
// - File tĩnh của Next (/_next/static, có hash trong tên), ảnh, icon: lấy cache trước.
// - Trang (điều hướng) và /api/offline-deck: lấy mạng trước, lưu bản sao; mất mạng thì dùng bản đã lưu,
//   trang chưa từng mở thì chuyển sang /offline (ôn thẻ từ bộ từ đã lưu).
// Đổi VERSION khi sửa file này để xoá cache cũ.
const VERSION = "v1";
const CACHE = `web-chinese-${VERSION}`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("web-chinese-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStatic = (url) =>
  url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/images/") || url.pathname.startsWith("/icons/");

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) (await caches.open(CACHE)).put(request, res.clone());
  return res;
}

async function networkFirst(request, fallbackUrl) {
  try {
    const res = await fetch(request);
    // Không lưu trang đăng nhập / trang bị chuyển hướng (chưa đăng nhập) để bản offline luôn là nội dung thật.
    if (res.ok && !res.redirected) (await caches.open(CACHE)).put(request, res.clone());
    return res;
  } catch (err) {
    // ignoreVary: trang Next có header Vary theo RSC; bản tải trước và bản điều hướng vẫn là cùng một trang.
    const cached =
      (await caches.match(request, { ignoreVary: true })) || (fallbackUrl && (await caches.match(fallbackUrl, { ignoreVary: true })));
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (isStatic(url)) event.respondWith(cacheFirst(request));
  else if (url.pathname === "/api/offline-deck") event.respondWith(networkFirst(request));
  else if (url.pathname === "/offline") event.respondWith(networkFirst(request, "/offline"));
  else if (request.mode === "navigate" && url.pathname !== "/login") event.respondWith(networkFirst(request, "/offline"));
});
