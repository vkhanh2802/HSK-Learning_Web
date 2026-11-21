// Thi thử HSK (Phase 11): cấu trúc đề, bốc câu, tính điểm. File thuần (không đụng DB) để test được.

export type Skill = "listening" | "reading" | "writing";
export type SectionSpec = { skill: Skill; count: number; minutes: number };

/** Cấu trúc đề HSK 2.0 (Phụ lục C ROADMAP): số câu và thời gian từng phần, điểm đỗ. */
export const BLUEPRINT: Record<number, { sections: SectionSpec[]; pass: number; maxPlays: number }> = {
  1: { sections: [{ skill: "listening", count: 20, minutes: 15 }, { skill: "reading", count: 20, minutes: 17 }], pass: 120, maxPlays: 2 },
  2: { sections: [{ skill: "listening", count: 35, minutes: 25 }, { skill: "reading", count: 25, minutes: 22 }], pass: 120, maxPlays: 2 },
  3: {
    sections: [
      { skill: "listening", count: 40, minutes: 35 },
      { skill: "reading", count: 30, minutes: 30 },
      { skill: "writing", count: 10, minutes: 15 },
    ],
    pass: 180,
    maxPlays: 1,
  },
  4: {
    sections: [
      { skill: "listening", count: 45, minutes: 30 },
      { skill: "reading", count: 40, minutes: 40 },
      { skill: "writing", count: 15, minutes: 25 },
    ],
    pass: 180,
    maxPlays: 1,
  },
};

export const SKILL_VI: Record<Skill, string> = { listening: "Nghe", reading: "Đọc", writing: "Viết" };

/**
 * Một câu trong kho. `ref` định danh câu: "ex:<exerciseId>", "pq:<passageId>:<câu>", "gr:<pointId>:<bài>".
 * `group`: câu hỏi cùng một bài đọc phải đi cùng nhau. `order`: thứ tự dạng câu trong phần (nhỏ trước).
 */
export type PoolItem = { ref: string; level: number; order: number; group?: string };

export type Rng = () => number;

function shuffle<T>(xs: T[], rng: Rng): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Ưu tiên: câu cùng cấp đề trước câu cấp dưới, câu chưa gặp gần đây trước câu đã gặp; cùng mức thì ngẫu nhiên. */
function prioritize<T extends { level: number; recent: boolean }>(xs: T[], level: number, rng: Rng): T[] {
  const rank = (x: T) => (x.recent ? 2 : 0) + (x.level === level ? 0 : 1);
  return shuffle(xs, rng).sort((a, b) => rank(a) - rank(b));
}

/**
 * Bốc `count` câu cho một phần. Câu có `group` (bài đọc) được lấy nguyên cụm, chiếm khoảng một nửa phần;
 * còn lại là câu lẻ. Kết quả xếp theo `order` (dạng câu), các câu cùng cụm đứng liền nhau.
 * Kho không đủ thì trả về ít hơn `count`.
 */
export function pickSection(pool: PoolItem[], count: number, level: number, recent: Set<string>, rng: Rng): string[] {
  const singles = pool.filter((p) => !p.group);
  const groups = [...Map.groupBy(pool.filter((p) => p.group), (p) => p.group!).values()].map((items) => ({
    items,
    level: items[0].level,
    recent: items.some((i) => recent.has(i.ref)),
  }));

  const picked: PoolItem[] = [];
  const groupTarget = singles.length ? Math.ceil(count / 2) : count;
  for (const g of prioritize(groups, level, rng)) {
    if (picked.length >= groupTarget) break;
    if (picked.length + g.items.length <= count) picked.push(...g.items);
  }
  const rest = prioritize(
    singles.map((s) => ({ ...s, recent: recent.has(s.ref) })),
    level,
    rng,
  ).slice(0, count - picked.length);
  picked.push(...rest);

  // Sắp theo dạng câu; cụm bài đọc giữ thứ tự câu hỏi gốc.
  return picked
    .map((p, i) => ({ p, i }))
    .sort((a, b) => a.p.order - b.p.order || a.i - b.i)
    .map(({ p }) => p.ref);
}

export type SectionScore = { skill: Skill; correct: number; total: number; score: number };

/** Mỗi phần quy về thang 100; tổng = cộng các phần; đỗ khi tổng ≥ điểm đỗ của cấp. */
export function scoreSections(sections: { skill: Skill; results: boolean[] }[], pass: number) {
  const parts: SectionScore[] = sections.map(({ skill, results }) => {
    const correct = results.filter(Boolean).length;
    return { skill, correct, total: results.length, score: results.length ? Math.round((correct / results.length) * 100) : 0 };
  });
  const total = parts.reduce((s, p) => s + p.score, 0);
  return { sections: parts, total, max: parts.length * 100, pass, passed: total >= pass };
}

/**
 * Tách các từ vựng có trong `text` theo kiểu khớp dài nhất trước (từ dài tối đa 4 chữ).
 * Dùng để lấy từ trong câu làm sai đưa vào ôn tập.
 */
export function findWords(text: string, vocab: Set<string>): string[] {
  const chars = [...text];
  const found: string[] = [];
  for (let i = 0; i < chars.length; ) {
    let len = Math.min(4, chars.length - i);
    while (len > 0 && !vocab.has(chars.slice(i, i + len).join(""))) len--;
    if (len > 0) found.push(chars.slice(i, i + len).join(""));
    i += Math.max(len, 1);
  }
  return [...new Set(found)];
}
