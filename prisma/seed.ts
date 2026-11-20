// Nạp dữ liệu HSK vào SQLite. Chạy: npx prisma db seed (an toàn khi chạy lại nhiều lần).
//
// Nguồn:
//   data/raw/hskN.json     — danh sách từ HSK 2.0 gốc (drkameleon/complete-hsk-vocabulary, MIT): nghĩa tiếng Anh, bộ thủ
//   data/vocab/hskN.json   — tự soạn: pinyin chuẩn (tách âm tiết bằng dấu cách), nghĩa Việt, loại từ, câu ví dụ
//   data/lessons/hskN.json — chia bài theo chủ đề
//   data/exercises/hskN-skill.json — bài tập (nghe, đọc, …), định dạng ở src/lib/exercises.ts
// Chỉ cấp nào có đủ data/vocab và data/lessons mới được nạp.
import "dotenv/config";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { z } from "zod";
import { prisma } from "../src/lib/db";
import { exerciseSchema, splitExercise } from "../src/lib/exercises";
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
};
type LessonEntry = { order: number; title: string; topic: string; words: string[] };

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
const plain = (pinyin: string) => pinyin.replace(/[\s']/g, "").toLowerCase();

async function seedLevel(level: number) {
  const vocabPath = `data/vocab/hsk${level}.json`;
  const lessonPath = `data/lessons/hsk${level}.json`;
  if (!existsSync(vocabPath) || !existsSync(lessonPath)) {
    console.log(`HSK${level}: chưa có dữ liệu, bỏ qua`);
    return;
  }

  const raw = new Map(readJson<RawWord[]>(`data/raw/hsk${level}.json`).map((w) => [w.simplified, w]));
  const vocab = readJson<Record<string, VocabEntry>>(vocabPath);
  const lessons = readJson<LessonEntry[]>(lessonPath);

  // Kiểm tra dữ liệu trước khi ghi để không nạp nửa chừng.
  const errors: string[] = [];
  for (const hanzi of raw.keys()) if (!vocab[hanzi]) errors.push(`thiếu trong ${vocabPath}: ${hanzi}`);
  for (const [hanzi, v] of Object.entries(vocab)) {
    if (!raw.has(hanzi)) errors.push(`không có trong danh sách gốc: ${hanzi}`);
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
          radical: single ? raw.get(hanzi)?.radical : prev?.radical,
          single,
        });
    });
  }
  const charIds = new Map<string, number>();
  for (const [char, info] of charInfo) {
    const data = { pinyin: info.pinyin, radical: info.radical ?? null };
    const row = await prisma.character.upsert({ where: { char }, update: data, create: { char, ...data } });
    charIds.set(char, row.id);
  }

  const wordIds = new Map<string, number>();
  for (const [hanzi, v] of Object.entries(vocab)) {
    const pinyin = joinSyllables(v.pinyin.trim().split(/\s+/));
    const forms = raw.get(hanzi)!.forms;
    const form = forms.find((f) => plain(f.transcriptions.pinyin) === plain(pinyin)) ?? forms[0];
    const data = {
      pinyin,
      meaningVi: v.vi,
      meaningEn: form.meanings.join("; "),
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

async function main() {
  for (const level of [1, 2, 3, 4]) await seedLevel(level);
  await seedExercises();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
