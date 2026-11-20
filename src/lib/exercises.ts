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
]);

export type ExerciseData = z.infer<typeof exerciseSchema>;
export type Line = z.infer<typeof line>;

/** Tách phần đáp án ra khỏi đề: payload gửi xuống client không cần chứa answer. */
export function splitExercise({ key, type, answer, ...payload }: ExerciseData) {
  return { key, type, payload, answer: answer ?? null };
}

type Payload<T extends ExerciseData["type"]> = Omit<Extract<ExerciseData, { type: T }>, "key" | "type" | "answer">;

/** Bài tập gửi xuống client: có đề, không có đáp án. */
export type ClientExercise = {
  [T in ExerciseData["type"]]: { id: number; type: T; payload: Payload<T> };
}[ExerciseData["type"]];
