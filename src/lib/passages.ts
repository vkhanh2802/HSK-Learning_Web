// Bài đọc: định dạng file data/passages/hskN.json, cách tách token, và câu hỏi đọc hiểu.
import { z } from "zod";

const text = z.object({ hanzi: z.string().min(1), pinyin: z.string().min(1), vi: z.string().min(1) });
const option = z.object({ hanzi: z.string().min(1), pinyin: z.string().min(1) });

export const questionSchema = z.discriminatedUnion("type", [
  // Câu nói đúng hay sai so với bài.
  z.object({ type: z.literal("tf"), statement: text, answer: z.boolean() }),
  // Câu hỏi + phương án chữ.
  z.object({ type: z.literal("mcq"), question: text, options: z.array(option).min(2), answer: z.number().int().min(0) }),
  // Đọc câu, chọn tranh (emoji) đúng.
  z.object({
    type: z.literal("picture"),
    sentence: text,
    options: z.array(z.object({ emoji: z.string().min(1), label: z.string().min(1) })).min(2),
    answer: z.number().int().min(0),
  }),
]);

export const passageFileSchema = z.object({
  key: z.string().min(1),
  type: z.enum(["reading", "dialogue"]),
  title: z.string().min(1),
  // Token cách nhau bằng dấu cách, mỗi dòng một câu thoại/đoạn: "我 是 学生 。"
  text: z.string().min(1),
  translation: z.string().min(1),
  // Nghĩa cho token ngoài từ vựng (tên riêng…). Token nào không có trong từ vựng ≤ cấp bài và không có ở đây là lỗi.
  gloss: z.record(z.string(), z.object({ p: z.string().min(1), vi: z.string().min(1) })).default({}),
  questions: z.array(questionSchema).min(1),
});

export type PassageFile = z.infer<typeof passageFileSchema>;
export type Question = z.infer<typeof questionSchema>;

/** t: chữ; p, vi: pinyin, nghĩa (không có với dấu câu); w: id từ vựng nếu là từ HSK (để thêm vào ôn tập). */
export type Token = { t: string; p?: string; vi?: string; w?: number };

const PUNCT = /^[\p{P}\p{S}]+$/u;

/**
 * Tách bài thành token theo dấu cách, tra pinyin/nghĩa từ `vocab` (chỉ chứa từ ở cấp ≤ cấp bài) rồi `gloss`.
 * Trả về cả danh sách token không tra được để báo lỗi "từ vượt cấp".
 */
export function tokenize(
  text: string,
  vocab: Map<string, { id: number; pinyin: string; meaningVi: string }>,
  gloss: PassageFile["gloss"],
): { lines: Token[][]; unknown: string[] } {
  const unknown: string[] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) =>
      line.split(/\s+/).map((t): Token => {
        if (PUNCT.test(t)) return { t };
        const v = vocab.get(t);
        if (v) return { t, p: v.pinyin, vi: v.meaningVi, w: v.id };
        const g = gloss[t];
        if (g) return { t, p: g.p, vi: g.vi };
        unknown.push(t);
        return { t };
      }),
    );
  return { lines, unknown };
}

/** Câu hỏi gửi xuống client: bỏ đáp án. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- tách answer ra để bỏ đi
export const stripAnswers = (qs: Question[]) => qs.map(({ answer, ...q }) => q);
export type ClientQuestion = ReturnType<typeof stripAnswers>[number];
