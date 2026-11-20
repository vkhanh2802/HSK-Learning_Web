# web_chinese

Scaffold Next.js 16, TypeScript, Tailwind CSS và ESLint cho mục 1.1 trong `ROADMAP.md`.

## Cài đặt và chạy local

Yêu cầu: Node.js >= 20.9.0 và npm.

```bash
npm ci
npm run dev
```

Mở <http://localhost:3000>. Trang mẫu nằm ở `src/app/page.tsx`.

## Kiểm tra

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Chạy bản production sau khi build thành công:

```bash
npm start
```

Scaffold dùng `next/font/google` (Geist); lần build đầu cần truy cập Google Fonts.
Chưa có formatter hoặc bộ test tự động; thư viện kiểm thử thuộc mục 1.2.
