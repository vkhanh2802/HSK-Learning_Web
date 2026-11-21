// Điểm ngữ pháp: định dạng data/grammar/hskN.json, bài tập và cách chấm.
import { z } from "zod";

const sentence = z.object({ hanzi: z.string().min(1), pinyin: z.string().min(1), vi: z.string().min(1) });

export const grammarExerciseSchema = z.discriminatedUnion("type", [
  // Chọn từ/câu đúng điền vào chỗ ___ (hoặc chọn câu đúng theo nghĩa tiếng Việt).
  z.object({
    type: z.literal("choose"),
    prompt: z.object({ hanzi: z.string().min(1), vi: z.string().min(1) }),
    options: z.array(z.string().min(1)).min(2),
    answer: z.number().int().min(0),
  }),
  // Sắp xếp các từ (đã xáo sẵn trong dữ liệu) thành câu đúng; `answers` là các câu chấp nhận được.
  z.object({
    type: z.literal("reorder"),
    words: z.array(z.string().min(1)).min(2),
    vi: z.string().min(1),
    answers: z.array(z.string().min(1)).min(1),
  }),
  // Tìm câu SAI trong các câu cho sẵn.
  z.object({
    type: z.literal("error"),
    options: z.array(z.string().min(1)).min(2),
    answer: z.number().int().min(0),
    explain: z.string().min(1),
  }),
]);

export const grammarFileSchema = z.array(
  z.object({
    key: z.string().min(1),
    title: z.string().min(1),
    // Các thành phần cách nhau bằng " + ", mỗi thành phần được tô một màu.
    pattern: z.string().min(1),
    explanation: z.string().min(1),
    examples: z.array(sentence).min(1),
    mistakes: z.array(z.object({ wrong: z.string().min(1), right: z.string().min(1), note: z.string().min(1) })).default([]),
    exercises: z.array(grammarExerciseSchema).min(1),
  }),
);

export type GrammarExercise = z.infer<typeof grammarExerciseSchema>;
export type Sentence = z.infer<typeof sentence>;
export type Mistake = { wrong: string; right: string; note: string };

const clean = (s: string) => s.replace(/[\s\p{P}]/gu, "");

/** Chấm một bài: chọn/tìm câu sai so số thứ tự; sắp xếp so câu ghép (bỏ dấu câu, khoảng trắng). */
export function gradeGrammar(ex: GrammarExercise, response: number | string[]): boolean {
  if (ex.type === "reorder")
    return Array.isArray(response) && ex.answers.some((a) => clean(a) === clean(response.join("")));
  return response === ex.answer;
}

/** Bài tập gửi xuống client: bỏ đáp án (sắp xếp: bỏ `answers`). */
export function stripGrammarAnswers(exs: GrammarExercise[]) {
  return exs.map((ex) => {
    if (ex.type === "reorder") return { type: ex.type, words: ex.words, vi: ex.vi };
    if (ex.type === "choose") return { type: ex.type, prompt: ex.prompt, options: ex.options };
    return { type: ex.type, options: ex.options };
  });
}
export type ClientGrammarExercise = ReturnType<typeof stripGrammarAnswers>[number];

/** Đáp án/giải thích hiện ra sau khi trả lời. */
export function revealGrammar(ex: GrammarExercise) {
  if (ex.type === "reorder") return { answer: ex.answers[0] };
  if (ex.type === "error") return { answer: ex.answer, explain: ex.explain };
  return { answer: ex.answer };
}
