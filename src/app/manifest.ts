import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Học tiếng Trung HSK1–HSK4",
    short_name: "学中文",
    description: "Học tiếng Trung từ HSK1 đến HSK4 với đủ 4 kỹ năng Nghe, Nói, Đọc, Viết",
    lang: "vi",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b2c20",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Nền phủ kín, chữ nằm trong vùng an toàn 80% nên dùng được cho icon bo góc (maskable).
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Ôn tập", url: "/review" },
      { name: "Ôn offline", url: "/offline" },
    ],
  };
}
