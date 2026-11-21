// Chấm câu tự viết bằng AI (Phase 9.2). Chỉ chạy ở server; API key đọc từ biến môi trường, không gửi xuống client.
import { z } from "zod";

/** Kết quả AI phải trả về đúng dạng này; dùng để validate output trước khi lưu/hiển thị. */
export const gradeResultSchema = z.object({
  score: z.number().min(0).max(10), // 0–10
  corrected: z.string(), // câu đã sửa (giữ nguyên nếu đã đúng)
  errors: z.array(z.object({ wrong: z.string(), right: z.string(), explanationVi: z.string() })),
  explanationVi: z.string(), // nhận xét chung bằng tiếng Việt
});
export type GradeResult = z.infer<typeof gradeResultSchema>;

export type CompositionTask = { words: string[]; hint: string; sample: string };

/**
 * Khoá toàn bộ phần chấm bằng AI (tab "Đặt câu" + server action gradeWriting) cho tới khi người dùng
 * chọn API/model. Đổi thành true sau khi đã viết thân `gradeComposition` và cấu hình key.
 */
export const AI_GRADING_ENABLED = false;

export class GraderNotConfigured extends Error {
  constructor() {
    super("Chưa cấu hình chấm bằng AI");
  }
}

/**
 * Gửi đề + câu của người học cho AI, trả về kết quả đã validate bằng `gradeResultSchema.parse(...)`.
 * shortcut: chưa nối nhà cung cấp AI — người dùng sẽ chọn API và model; khi đó thay thân hàm này
 * (đọc key từ process.env, gọi model, `return gradeResultSchema.parse(json)`).
 */
export async function gradeComposition(task: CompositionTask, answer: string): Promise<GradeResult> {
  void task;
  void answer;
  throw new GraderNotConfigured();
}
