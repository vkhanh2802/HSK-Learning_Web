// Định dạng các dạng bài tập (lưu trong Exercise.payload / Exercise.answer dạng JSON).
// Schema zod dùng để kiểm tra data/exercises/*.json khi seed và khi đọc ra.
import { z } from "zod";

const line = z.object({
  speaker: z.enum(["nam", "nữ"]).optional(),
  hanzi: z.string().min(1),
  pinyin: z.string().min(1),
  vi: z.string().min(1),
});
const picture = z.object({ emoji: z.string().min(1), image: z.string().startsWith("/images/").optional(), label: z.string().min(1) });
const text = z.object({ hanzi: z.string().min(1), pinyin: z.string().min(1), vi: z.string().optional() });

export const exerciseSchema = z.discriminatedUnion("type", [
  // Nghe một từ/câu, xem tranh: đúng hay sai?
  z.object({ key: z.string(), type: z.literal("picture_tf"), audio: z.array(line).min(1), picture, answer: z.boolean() }),
  // Nghe câu, chọn tranh đúng.
  z.object({
    key: z.string(),
    type: z.literal("picture_mcq"),
    audio: z.array(line).min(1),
    options: z.array(picture).min(2),
    answer: z.number().int().min(0),
  }),
  // Nghe câu/hội thoại, trả lời câu hỏi.
  z.object({
    key: z.string(),
    type: z.literal("mcq"),
    audio: z.array(line).min(1),
    question: text,
    options: z.array(text).min(2),
    answer: z.number().int().min(0),
  }),
  // Nghe câu, gõ lại bằng chữ Hán hoặc pinyin.
  z.object({ key: z.string(), type: z.literal("dictation"), audio: z.array(line).length(1), answer: z.null().optional() }),
  // Viết: điền chữ còn thiếu (___) theo pinyin của cả câu (dạng đề HSK3).
  z.object({
    key: z.string(),
    type: z.literal("fill"),
    sentence: z.string().includes("___"),
    pinyin: z.string().min(1),
    vi: z.string().min(1),
    answer: z.string().length(1),
  }),
  // Viết: sắp xếp từ (đã xáo sẵn) thành câu; answer = các câu chấp nhận được.
  z.object({
    key: z.string(),
    type: z.literal("reorder"),
    words: z.array(z.string().min(1)).min(2),
    vi: z.string().min(1),
    answer: z.array(z.string().min(1)).min(1),
  }),
  // Viết: đặt câu với các từ cho trước (có thể kèm tranh); chấm bằng AI, answer = câu mẫu để tự so.
  z.object({
    key: z.string(),
    type: z.literal("compose"),
    words: z.array(z.string().min(1)).min(1),
    hint: z.string().min(1),
    picture: picture.optional(),
    answer: line,
  }),
]);

export type ExerciseData = z.infer<typeof exerciseSchema>;
export type Line = z.infer<typeof line>;

const clean = (s: string) => s.replace(/[\s\p{P}]/gu, "");

/**
 * Chấm các dạng chấm được không cần AI. `matchesDictation` truyền vào để file này không phụ thuộc compare.ts.
 * compose không chấm ở đây (cần AI) — luôn trả false.
 */
export function gradeExercise(
  type: ExerciseData["type"],
  answer: unknown,
  payload: { audio?: Line[] },
  response: unknown,
  matchesDictation: (input: string, expected: { hanzi: string; pinyin: string }) => boolean,
): boolean {
  if (type === "dictation") return typeof response === "string" && !!payload.audio && matchesDictation(response, payload.audio[0]);
  if (type === "fill") return typeof response === "string" && clean(response) === answer;
  if (type === "reorder")
    return Array.isArray(response) && (answer as string[]).some((a) => clean(a) === clean(response.join("")));
  if (type === "compose") return false;
  return response === answer;
}

/** Tách phần đáp án ra khỏi đề: payload gửi xuống client không cần chứa answer. */
export function splitExercise({ key, type, answer, ...payload }: ExerciseData) {
  return { key, type, payload, answer: answer ?? null };
}

type Payload<T extends ExerciseData["type"]> = Omit<Extract<ExerciseData, { type: T }>, "key" | "type" | "answer">;

/** Bài tập gửi xuống client: có đề, không có đáp án. */
export type ClientExercise = {
  [T in ExerciseData["type"]]: { id: number; type: T; payload: Payload<T> };
}[ExerciseData["type"]];

/** Các dạng bài nghe (có audio) — dùng cho ExercisePlayer / trang Luyện nghe. */
export type ListeningExercise = Extract<ClientExercise, { type: "picture_tf" | "picture_mcq" | "mcq" | "dictation" }>;
/** Các dạng bài viết — dùng cho trang Luyện viết. */
export type WritingExercise = Extract<ClientExercise, { type: "fill" | "reorder" | "compose" }>;
