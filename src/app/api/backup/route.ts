import { ZodError } from "zod";
import { exportBackup, importBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";

/** Tải file backup tiến độ học (JSON). */
export async function GET() {
  const backup = await exportBackup();
  const name = `web_chinese-backup-${backup.exportedAt.toLocaleDateString("sv")}.json`;
  return new Response(JSON.stringify(backup), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` },
  });
}

/**
 * Khôi phục từ file backup — XOÁ toàn bộ tiến độ hiện tại rồi nạp lại.
 * Chỉ nhận JSON gửi từ chính trang này (cùng origin) để trang web khác không gửi thay được.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host"))
    return Response.json({ error: "Yêu cầu không hợp lệ" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "Cần gửi JSON" }, { status: 415 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "File không phải JSON hợp lệ" }, { status: 400 });
  }
  try {
    return Response.json(await importBackup(body));
  } catch (e) {
    if (e instanceof ZodError) return Response.json({ error: "File không đúng định dạng backup của web này" }, { status: 400 });
    throw e;
  }
}
