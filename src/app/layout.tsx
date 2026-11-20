import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans, Noto_Sans_SC } from "next/font/google";
import Nav from "@/components/Nav";
import ThemeScript from "@/components/ThemeScript";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

// Noto Sans cho chữ Latin/tiếng Việt/pinyin (glyph ā ē ī ō ū của Noto Sans SC đặt dấu lệch);
// Noto Sans SC lo chữ Hán, glyph CJK tải theo unicode-range khi cần.
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
});
const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
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
    <html lang="vi" className={`${notoSans.variable} ${notoSansSC.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeScript />
        <a
          href="#noi-dung"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-20 focus:rounded focus:bg-background focus:p-2"
        >
          Bỏ qua tới nội dung
        </a>
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <Link href="/" className="text-lg font-bold text-accent">
              学中文
            </Link>
            <Nav />
            <ThemeToggle />
          </div>
        </header>
        <div id="noi-dung" tabIndex={-1} className="mx-auto max-w-5xl outline-none">
          {children}
        </div>
      </body>
    </html>
  );
}
