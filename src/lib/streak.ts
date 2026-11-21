import { addDaysKey, dayKey } from "@/lib/time";

/** Số ngày học liên tiếp tính đến hôm nay (hoặc hôm qua nếu hôm nay chưa học), theo múi giờ người học. */
export function streak(activity: Date[], now = new Date()): number {
  const days = new Set(activity.map(dayKey));
  let d = dayKey(now);
  if (!days.has(d)) d = addDaysKey(d, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDaysKey(d, -1);
  }
  return n;
}
