const dayKey = (d: Date) => d.toLocaleDateString("sv"); // YYYY-MM-DD theo giờ máy chủ

/** Số ngày học liên tiếp tính đến hôm nay (hoặc hôm qua nếu hôm nay chưa học). */
export function streak(activity: Date[], now = new Date()): number {
  const days = new Set(activity.map(dayKey));
  const d = new Date(now);
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
