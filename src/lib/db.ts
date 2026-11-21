import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

// Có TURSO_DATABASE_URL (bản deploy) thì dùng Turso — SQLite trên cloud; không có thì dùng file SQLite local.
function adapter() {
  const turso = process.env.TURSO_DATABASE_URL;
  if (turso) return new PrismaLibSql({ url: turso, authToken: process.env.TURSO_AUTH_TOKEN });
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL — tạo .env từ .env.example");
  return new PrismaBetterSqlite3({ url });
}

// Giữ một client duy nhất khi dev server hot-reload, tránh mở quá nhiều kết nối.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: adapter() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
