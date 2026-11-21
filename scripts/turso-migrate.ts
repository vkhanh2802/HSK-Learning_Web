// Áp các migration của Prisma (prisma/migrations/*/migration.sql) lên DB Turso.
// `prisma migrate deploy` không chạy thẳng trên Turso nên dùng script này. Chạy lại an toàn: migration đã áp sẽ bỏ qua.
// Chạy: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/turso-migrate.ts
import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
if (!url) throw new Error("Thiếu TURSO_DATABASE_URL");
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

await db.execute("CREATE TABLE IF NOT EXISTS _turso_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
const done = new Set((await db.execute("SELECT name FROM _turso_migrations")).rows.map((r) => String(r.name)));

const dirs = readdirSync("prisma/migrations", { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();
for (const name of dirs) {
  if (done.has(name)) continue;
  const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8");
  // executeMultiple chạy cả file; ghi tên migration ngay sau để lần sau bỏ qua.
  await db.executeMultiple(sql);
  await db.execute({ sql: "INSERT INTO _turso_migrations (name, applied_at) VALUES (?, ?)", args: [name, new Date().toISOString()] });
  console.log(`Đã áp ${name}`);
}
console.log(`Xong: ${dirs.length} migration (${dirs.length - done.size} mới).`);
db.close();
