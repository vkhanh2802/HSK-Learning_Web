import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";

// Một font cho cả giao diện tiếng Việt và chữ Hán; glyph CJK tải theo unicode-range khi cần.
const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Học tiếng Trung HSK1–HSK4",
  description: "Học tiếng Trung từ HSK1 đến HSK4 với đủ 4 kỹ năng Nghe, Nói, Đọc, Viết",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${notoSansSC.variable} antialiased`}>{children}</body>
    </html>
  );
}
