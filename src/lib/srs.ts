import { DefaultScheduler, Rating } from "ts-fsrs";

// Grade người dùng chọn: 1 Again · 2 Hard · 3 Good · 4 Easy (đúng giá trị Rating của ts-fsrs).
export type Grade = typeof Rating.Again | typeof Rating.Hard | typeof Rating.Good | typeof Rating.Easy;

const scheduler = DefaultScheduler();
type FsrsCard = ReturnType<Awaited<typeof scheduler>["newCard"]>;

// Card lưu trong DB dạng JSON; dueAt/lastReviewAt phải đổi lại thành Date trước khi đưa vào scheduler.
const revive = (json: string): FsrsCard =>
  JSON.parse(json, (k, v) => ((k === "dueAt" || k === "lastReviewAt") && v ? new Date(v) : v));

export async function newCard(now: Date) {
  const card = (await scheduler).newCard({ now });
  return { fsrs: JSON.stringify(card), due: card.dueAt };
}

export async function review(fsrs: string, grade: Grade, now: Date) {
  const { card } = (await scheduler).review({ card: revive(fsrs), grade, now });
  return { fsrs: JSON.stringify(card), due: card.dueAt };
}

/** Gợi ý điểm cho thẻ viết theo tổng số lần sai nét: ≤1 Nhớ · 2–3 Khó · >3 Quên. */
export const writeGrade = (mistakes: number): Grade => (mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1);
