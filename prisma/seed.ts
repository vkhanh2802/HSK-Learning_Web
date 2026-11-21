// Nạp dữ liệu HSK vào SQLite. Chạy: npx prisma db seed (an toàn khi chạy lại nhiều lần).
//
// Nguồn:
//   data/raw/hsk1.json     — danh sách từ HSK1 (drkameleon/complete-hsk-vocabulary, MIT); data/raw/hskN.json còn dùng để tra bộ thủ
//   data/raw/hsk2012-lN.tsv — danh sách chính thức HSK 2012 cấp 2–4 (glxxyz/hskhsk.com, MIT): nghĩa tiếng Anh
//   data/vocab/hskN.json   — tự soạn: pinyin chuẩn (tách âm tiết bằng dấu cách), nghĩa Việt, loại từ, câu ví dụ
//   data/lessons/hskN.json — chia bài theo chủ đề
//   data/exercises/hskN-skill.json — bài tập (nghe, đọc, …), định dạng ở src/lib/exercises.ts
//   data/passages/hskN.json — bài đọc, định dạng + cách tách token ở src/lib/passages.ts
//   data/grammar/hskN.json — điểm ngữ pháp + bài tập (src/lib/grammar.ts); bài học trỏ tới bằng key ("grammar": [...])
// Chỉ cấp nào có đủ data/vocab và data/lessons mới được nạp.
import "dotenv/config";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { z } from "zod";
import { prisma } from "../src/lib/db";
import { exerciseSchema, splitExercise } from "../src/lib/exercises";
import { grammarFileSchema } from "../src/lib/grammar";
import { passageFileSchema, tokenize } from "../src/lib/passages";
import { joinSyllables } from "../src/lib/pinyin";

type RawWord = {
  simplified: string;
  radical?: string;
  forms: { transcriptions: { pinyin: string }; meanings: string[] }[];
};
type VocabEntry = {
  pinyin: string;
  pos: string;
  vi: string;
  example: { hanzi: string; pinyin: string; vi: string };
  extra?: boolean; // từ ngoài danh sách gốc của cấp (vd. từ HSK1 bản 2012 chưa có ở HSK1 hiện tại)
};
type LessonEntry = { order: number; title: string; topic: string; words: string[]; grammar?: string[] };

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
const plain = (pinyin: string) => pinyin.replace(/[\s']/g, "").toLowerCase();

// Danh sách cũ (drkameleon) — HSK1 dùng làm danh sách từ, các cấp khác chỉ để tra bộ thủ.
const drkameleon = new Map(
  [1, 2, 3, 4].flatMap((n) => readJson<RawWord[]>(`data/raw/hsk${n}.json`)).map((w) => [w.simplified, w]),
);

/**
 * Danh sách từ gốc của một cấp: HSK1 theo data/raw/hsk1.json (người dùng chọn giữ), HSK2–4 theo danh sách
 * chính thức 2012 data/raw/hsk2012-lN.tsv (glxxyz/hskhsk.com, MIT): chữ giản thể, phồn thể, số, pinyin, nghĩa Anh.
 */
function rawWords(level: number): RawWord[] {
  if (level === 1) return readJson<RawWord[]>("data/raw/hsk1.json");
  return readFileSync(`data/raw/hsk2012-l${level}.tsv`, "utf8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [simplified, , , pinyin, en] = line.split("\t");
      return {
        simplified,
        radical: drkameleon.get(simplified)?.radical,
        forms: [{ transcriptions: { pinyin }, meanings: [en] }],
      };
    });
}

async function seedLevel(level: number) {
  const vocabPath = `data/vocab/hsk${level}.json`;
  const lessonPath = `data/lessons/hsk${level}.json`;
  if (!existsSync(vocabPath) || !existsSync(lessonPath)) {
    console.log(`HSK${level}: chưa có dữ liệu, bỏ qua`);
    return;
  }

  // Từ đã có ở cấp dưới (theo dữ liệu đã soạn) thì không lặp lại ở cấp này.
  const lower = new Set(
    Array.from({ length: level - 1 }, (_, i) => `data/vocab/hsk${i + 1}.json`)
      .filter(existsSync)
      .flatMap((f) => Object.keys(readJson<Record<string, VocabEntry>>(f))),
  );
  const raw = new Map(rawWords(level).filter((w) => !lower.has(w.simplified)).map((w) => [w.simplified, w]));
  const vocab = readJson<Record<string, VocabEntry>>(vocabPath);
  const lessons = readJson<LessonEntry[]>(lessonPath);

  // Kiểm tra dữ liệu trước khi ghi để không nạp nửa chừng.
  const errors: string[] = [];
  for (const hanzi of raw.keys()) if (!vocab[hanzi]) errors.push(`thiếu trong ${vocabPath}: ${hanzi}`);
  for (const [hanzi, v] of Object.entries(vocab)) {
    if (!raw.has(hanzi) && !v.extra) errors.push(`không có trong danh sách gốc (thêm "extra": true nếu cố ý): ${hanzi}`);
    if (lower.has(hanzi)) errors.push(`đã có ở cấp dưới: ${hanzi}`);
    if (v.pinyin.trim().split(/\s+/).length !== [...hanzi].length)
      errors.push(`số âm tiết pinyin khác số chữ: ${hanzi} "${v.pinyin}"`);
  }
  const seen = new Map<string, number>();
  for (const l of lessons)
    for (const w of l.words) {
      if (!vocab[w]) errors.push(`bài ${l.order} có từ không tồn tại: ${w}`);
      if (seen.has(w)) errors.push(`từ ${w} nằm ở cả bài ${seen.get(w)} và ${l.order}`);
      seen.set(w, l.order);
    }
  for (const hanzi of Object.keys(vocab)) if (!seen.has(hanzi)) errors.push(`từ chưa thuộc bài nào: ${hanzi}`);
  if (errors.length) throw new Error(`HSK${level} dữ liệu lỗi:\n- ${errors.join("\n- ")}`);

  await prisma.level.upsert({ where: { id: level }, update: {}, create: { id: level, name: `HSK${level}` } });

  // Pinyin của từng chữ: ưu tiên cách đọc khi chữ đứng một mình là một từ (不 bù, không lấy bú trong 不客气).
  const charInfo = new Map<string, { pinyin: string; radical?: string; single: boolean }>();
  for (const [hanzi, v] of Object.entries(vocab)) {
    const syllables = v.pinyin.trim().split(/\s+/);
    const chars = [...hanzi];
    chars.forEach((c, i) => {
      const single = chars.length === 1;
      const prev = charInfo.get(c);
      if (!prev || (single && !prev.single))
        charInfo.set(c, {
          pinyin: syllables[i].toLowerCase(),
          radical: single ? (raw.get(hanzi) ?? drkameleon.get(hanzi))?.radical : prev?.radical,
          single,
        });
    });
  }
  const charIds = new Map<string, number>();
  for (const [char, info] of charInfo) {
    const data = { pinyin: info.pinyin, radical: info.radical ?? null };
    // Chữ đã tạo ở cấp dưới giữ nguyên cách đọc; chỉ ghi đè khi ở cấp này chữ đứng riêng thành một từ.
    const existing = await prisma.character.findUnique({ where: { char } });
    const row = existing
      ? info.single
        ? await prisma.character.update({ where: { char }, data })
        : existing
      : await prisma.character.create({ data: { char, ...data } });
    charIds.set(char, row.id);
  }

  const wordIds = new Map<string, number>();
  for (const [hanzi, v] of Object.entries(vocab)) {
    const pinyin = joinSyllables(v.pinyin.trim().split(/\s+/));
    const forms = raw.get(hanzi)?.forms ?? [];
    const form = forms.find((f) => plain(f.transcriptions.pinyin) === plain(pinyin)) ?? forms[0];
    const data = {
      pinyin,
      meaningVi: v.vi,
      meaningEn: form?.meanings.join("; ") ?? null,
      pos: v.pos,
      levelId: level,
      examples: JSON.stringify([v.example]),
    };
    const word = await prisma.word.upsert({ where: { hanzi }, update: data, create: { hanzi, ...data } });
    wordIds.set(hanzi, word.id);
    await prisma.wordCharacter.deleteMany({ where: { wordId: word.id } });
    await prisma.wordCharacter.createMany({
      data: [...hanzi].map((c, position) => ({ wordId: word.id, characterId: charIds.get(c)!, position })),
    });
  }

  for (const l of lessons) {
    const data = { title: l.title, topic: l.topic };
    const lesson = await prisma.lesson.upsert({
      where: { levelId_order: { levelId: level, order: l.order } },
      update: data,
      create: { levelId: level, order: l.order, ...data },
    });
    await prisma.lessonItem.deleteMany({ where: { lessonId: lesson.id, itemType: "word" } });
    await prisma.lessonItem.createMany({
      data: l.words.map((w, order) => ({ lessonId: lesson.id, itemType: "word", itemId: wordIds.get(w)!, order })),
    });
  }

  console.log(`HSK${level}: ${wordIds.size} từ, ${charIds.size} chữ, ${lessons.length} bài`);
}

// data/exercises/hsk{N}-{skill}.json, ví dụ hsk1-listening.json. Upsert theo key nên chạy lại không trùng
// và không xoá bài cũ (Attempt đang trỏ tới).
async function seedExercises() {
  for (const file of readdirSync("data/exercises").filter((f) => f.endsWith(".json"))) {
    const m = /^hsk(\d)-(\w+)\.json$/.exec(file);
    if (!m) throw new Error(`Tên file bài tập không đúng mẫu hskN-skill.json: ${file}`);
    const [levelId, skill] = [Number(m[1]), m[2]];
    const items = z.array(exerciseSchema).parse(readJson(`data/exercises/${file}`));
    const keys = new Set(items.map((i) => i.key));
    if (keys.size !== items.length) throw new Error(`${file}: trùng key`);
    for (const item of items)
      if ("options" in item && item.answer >= item.options.length)
        throw new Error(`${file}: ${item.key} có đáp án ngoài số phương án`);
    for (const item of items) {
      const { key, type, payload, answer } = splitExercise(item);
      const data = { levelId, skill, type, payload: JSON.stringify(payload), answer: JSON.stringify(answer) };
      await prisma.exercise.upsert({ where: { key }, update: data, create: { key, ...data } });
    }
    console.log(`${file}: ${items.length} bài`);
  }
}

// data/passages/hskN.json. Mọi token phải là từ vựng cấp ≤ N hoặc có trong gloss của bài (kiểm tra từ vượt cấp).
async function seedPassages(level: number) {
  const file = `data/passages/hsk${level}.json`;
  if (!existsSync(file)) return;
  const passages = z.array(passageFileSchema).parse(readJson(file));
  const words = await prisma.word.findMany({ where: { levelId: { lte: level } } });
  const vocab = new Map(words.map((w) => [w.hanzi, w]));

  const errors: string[] = [];
  const built = passages.map((p) => {
    const { lines, unknown } = tokenize(p.text, vocab, p.gloss);
    if (unknown.length) errors.push(`${p.key}: từ ngoài HSK1–${level} chưa có gloss: ${[...new Set(unknown)].join(" ")}`);
    p.questions.forEach((q, i) => {
      if ("options" in q && q.answer >= q.options.length) errors.push(`${p.key}: câu ${i + 1} có đáp án ngoài số phương án`);
    });
    return { p, lines };
  });
  if (new Set(passages.map((p) => p.key)).size !== passages.length) errors.push("trùng key");
  if (errors.length) throw new Error(`${file} lỗi:\n- ${errors.join("\n- ")}`);

  for (const { p, lines } of built) {
    const data = {
      levelId: level,
      type: p.type,
      title: p.title,
      tokens: JSON.stringify(lines),
      translation: p.translation,
      questions: JSON.stringify(p.questions),
    };
    await prisma.passage.upsert({ where: { key: p.key }, update: data, create: { key: p.key, ...data } });
  }
  console.log(`${file}: ${passages.length} bài đọc`);
}

// data/grammar/hskN.json, rồi gắn vào bài học theo trường "grammar" trong data/lessons/hskN.json.
async function seedGrammar(level: number) {
  const file = `data/grammar/hsk${level}.json`;
  if (!existsSync(file)) return;
  const points = grammarFileSchema.parse(readJson(file));

  const errors: string[] = [];
  if (new Set(points.map((p) => p.key)).size !== points.length) errors.push("trùng key");
  for (const p of points)
    p.exercises.forEach((ex, i) => {
      if ("options" in ex && ex.answer >= ex.options.length) errors.push(`${p.key}: bài ${i + 1} có đáp án ngoài số phương án`);
      // Câu đáp án của bài sắp xếp phải ghép đúng từ chính các từ đã cho.
      if (ex.type === "reorder") {
        const pool = [...ex.words].sort().join("|");
        for (const a of ex.answers) {
          const used = ex.words.filter((w) => a.includes(w)).length === ex.words.length;
          const len = a.replace(/[\s\p{P}]/gu, "").length === ex.words.join("").length;
          if (!used || !len) errors.push(`${p.key}: bài ${i + 1} đáp án "${a}" không ghép được từ [${pool}]`);
        }
      }
    });
  const lessons = readJson<LessonEntry[]>(`data/lessons/hsk${level}.json`);
  const keys = new Set(points.map((p) => p.key));
  for (const l of lessons) for (const k of l.grammar ?? []) if (!keys.has(k)) errors.push(`bài ${l.order} trỏ tới ${k} không tồn tại`);
  if (errors.length) throw new Error(`${file} lỗi:\n- ${errors.join("\n- ")}`);

  const ids = new Map<string, number>();
  for (const p of points) {
    const data = {
      levelId: level,
      title: p.title,
      pattern: p.pattern,
      explanation: p.explanation,
      examples: JSON.stringify(p.examples),
      mistakes: JSON.stringify(p.mistakes),
      exercises: JSON.stringify(p.exercises),
    };
    const row = await prisma.grammarPoint.upsert({ where: { key: p.key }, update: data, create: { key: p.key, ...data } });
    ids.set(p.key, row.id);
  }
  for (const l of lessons) {
    const lesson = await prisma.lesson.findUnique({ where: { levelId_order: { levelId: level, order: l.order } } });
    if (!lesson) continue;
    await prisma.lessonItem.deleteMany({ where: { lessonId: lesson.id, itemType: "grammar" } });
    await prisma.lessonItem.createMany({
      data: (l.grammar ?? []).map((k, order) => ({ lessonId: lesson.id, itemType: "grammar", itemId: ids.get(k)!, order })),
    });
  }
  console.log(`${file}: ${points.length} điểm ngữ pháp, ${points.reduce((n, p) => n + p.exercises.length, 0)} bài tập`);
}

async function main() {
  for (const level of [1, 2, 3, 4]) await seedLevel(level);
  for (const level of [1, 2, 3, 4]) await seedGrammar(level);
  for (const level of [1, 2, 3, 4]) await seedPassages(level);
  await seedExercises();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
