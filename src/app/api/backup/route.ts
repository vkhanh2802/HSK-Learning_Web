import { getT } from "@/lib/lang-server";
import { ZodError } from "zod";
import { exportBackup, importBackup } from "@/lib/backup";
import { dayKey } from "@/lib/time";
import { hasSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Tải file backup tiến độ học (JSON). */
export async function GET() {
  if (!(await hasSession())) return Response.json({ error: (await getT())("Chưa đăng nhập", "Not signed in") }, { status: 401 });
  const backup = await exportBackup();
  const name = `web_chinese-backup-${dayKey(backup.exportedAt)}.json`;
  return new Response(JSON.stringify(backup), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` },
  });
}

/**
 * Khôi phục từ file backup — XOÁ toàn bộ tiến độ hiện tại rồi nạp lại.
 * Chỉ nhận JSON gửi từ chính trang này (cùng origin) để trang web khác không gửi thay được.
 */
export async function POST(request: Request) {
  if (!(await hasSession())) return Response.json({ error: (await getT())("Chưa đăng nhập", "Not signed in") }, { status: 401 });
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host"))
    return Response.json({ error: (await getT())("Yêu cầu không hợp lệ", "Invalid request") }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: (await getT())("Cần gửi JSON", "JSON required") }, { status: 415 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: (await getT())("File không phải JSON hợp lệ", "The file is not valid JSON") }, { status: 400 });
  }
  try {
    return Response.json(await importBackup(body));
  } catch (e) {
    if (e instanceof ZodError) return Response.json({ error: (await getT())("File không đúng định dạng backup của web này", "The file is not a backup in this site’s format") }, { status: 400 });
    throw e;
  }
}
