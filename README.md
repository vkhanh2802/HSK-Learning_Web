# web_chinese

Scaffold Next.js 16, TypeScript, Tailwind CSS và ESLint; đã cài thư viện và khởi tạo Prisma SQLite cho mục 1.2 trong `ROADMAP.md`.

## Cài đặt và chạy local

Yêu cầu: Node.js 24.x (khuyến nghị LTS hiện tại) hoặc >= 26 và npm. Bộ thư viện ở mục 1.2 cần Node cao hơn mức tối thiểu riêng của Next.js; `@types/node` dùng nhánh 24.

```bash
npm ci
```

Tạo `.env` từ `.env.example` nếu chưa có (PowerShell; không ghi đè cấu hình hiện tại):

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

```bash
npm run dev
```

Mở <http://localhost:3000>. Trang mẫu nằm ở `src/app/page.tsx`.

## Kiểm tra

```bash
npm run lint
npx prisma validate
npx tsc --noEmit
npm run build
```

Chạy bản production sau khi build thành công:

```bash
npm start
```

Scaffold dùng `next/font/google` (Geist); lần build đầu cần truy cập Google Fonts.
Đã cài `tsx` và Vitest; chưa có bộ test nghiệp vụ hoặc formatter.

## Prisma SQLite (mục 1.2)

Prisma CLI và `@prisma/client` cùng phiên bản 7.10.1. CLI nằm trong devDependencies.
Lệnh init của bản này sinh `prisma7.config.ts`, nạp `.env` qua `dotenv` và đọc `DATABASE_URL` (mặc định local `file:./dev.db`). Schema ở `prisma/schema.prisma`, dùng generator `prisma-client` với output `src/generated/prisma` (đã ignore).

Chưa tạo model, database, migration, seed hoặc Prisma Client. Ở Phase 2 cần điều chỉnh schema mẫu cũ trong Phụ lục A theo Prisma 7: URL đặt trong config, generate client ra output riêng và cài SQLite runtime adapter khi bắt đầu dùng database; chưa cài adapter ở mục 1.2.

### Bản vá dependency Effect

`@prisma/config@7.10.1` ghim `effect@3.20.0`, bị ảnh hưởng bởi [GHSA-7589-6fvf-x4pw / CVE-2026-121707](https://github.com/advisories/GHSA-7589-6fvf-x4pw) (ReDoS trong `Schema.TemplateLiteral`, bản vá từ 3.22.1). Prisma stable mới nhất khi kiểm tra vẫn là 7.10.1, nên `package.json` dùng override hẹp `@prisma/config@7.10.1 -> effect@3.22.5`; không nâng lên Effect 4 hoặc đổi major Prisma. Lockfile chỉ thay phiên bản, URL tarball và integrity của Effect.

Đã kiểm tra Prisma config hợp lệ/không hợp lệ, CLI validate/format trên schema tạm và mẫu input của advisory trong worker có timeout. Khi nâng Prisma, kiểm tra dependency chính thức đã dùng Effect được vá và tương thích; chỉ bỏ override sau khi cây dependency không còn cần nó. Chạy lại `npm ci`, `npm ls effect --all`, `npm audit --json`, kiểm tra Prisma config/CLI, TypeScript, lint và build sau thay đổi đó.
