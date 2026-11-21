// Thống kê cho dashboard (Phase 12). Hàm thuần, tính theo giờ máy chủ như streak.ts.

export const dayKey = (d: Date) => d.toLocaleDateString("sv"); // YYYY-MM-DD

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Số thẻ đến hạn mỗi ngày trong `days` ngày tới; ngày 0 (hôm nay) gồm cả thẻ đã quá hạn. */
export function forecast(dues: Date[], now: Date, days = 30) {
  const today = startOfDay(now);
  const counts = new Array<number>(days).fill(0);
  for (const due of dues) {
    const i = Math.max(0, Math.round((startOfDay(due).getTime() - today.getTime()) / 86_400_000));
    if (i < days) counts[i]++;
  }
  return counts.map((count, i) => ({ date: dayKey(addDays(today, i)), count }));
}

export const SKILLS = ["listening", "speaking", "reading", "writing", "grammar"] as const;
export const SKILL_NAMES: Record<string, string> = {
  listening: "Nghe",
  speaking: "Nói",
  reading: "Đọc",
  writing: "Viết",
  grammar: "Ngữ pháp",
};

/** Tỉ lệ đúng theo kỹ năng; `weakest` = kỹ năng có tỉ lệ thấp nhất trong các kỹ năng đủ `minAttempts` lượt. */
export function accuracyBySkill(attempts: { skill: string; correct: boolean }[], minAttempts = 5) {
  const rows = SKILLS.map((skill) => {
    const mine = attempts.filter((a) => a.skill === skill);
    const correct = mine.filter((a) => a.correct).length;
    return { skill, correct, total: mine.length, rate: mine.length ? correct / mine.length : null };
  });
  const rated = rows.filter((r) => r.total >= minAttempts);
  const weakest = rated.length ? rated.reduce((a, b) => (b.rate! < a.rate! ? b : a)).skill : null;
  return { rows, weakest };
}

/**
 * Lưới ngày học `weeks` tuần, mỗi cột một tuần (thứ Hai → Chủ nhật), cột cuối là tuần hiện tại.
 * Ngày sau hôm nay có `count: null` (chưa tới).
 */
export function heatmap(activity: Date[], now: Date, weeks = 26) {
  const counts = new Map<string, number>();
  for (const d of activity) counts.set(dayKey(d), (counts.get(dayKey(d)) ?? 0) + 1);
  const today = startOfDay(now);
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  const first = addDays(monday, -7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(first, w * 7 + d);
      return { date: dayKey(date), count: date > today ? null : (counts.get(dayKey(date)) ?? 0) };
    }),
  );
}

/** Mức màu heatmap 0–4 theo số hoạt động trong ngày. */
export const heatLevel = (count: number) => (count <= 0 ? 0 : count < 5 ? 1 : count < 20 ? 2 : count < 50 ? 3 : 4);

/** Một từ được coi là đã thuộc khi mọi thẻ của nó có độ ổn định FSRS > 21 ngày. */
export const MASTERED_DAYS = 21;
export function isMastered(stabilities: number[]) {
  return stabilities.length > 0 && stabilities.every((s) => s > MASTERED_DAYS);
}
