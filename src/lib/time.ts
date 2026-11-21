// Ngày/giờ theo múi giờ của người học, không theo giờ máy chủ (Vercel chạy UTC và không cho đặt biến TZ).
// Đổi bằng biến môi trường APP_TIMEZONE nếu cần.
export const APP_TZ = process.env.APP_TIMEZONE || "Asia/Ho_Chi_Minh";

/** "YYYY-MM-DD" của thời điểm `d` theo múi giờ người học. */
export const dayKey = (d: Date) => d.toLocaleDateString("sv", { timeZone: APP_TZ });

// Cộng trừ ngày trên chuỗi YYYY-MM-DD (tính ở UTC nên không dính giờ máy chủ hay giờ mùa hè).
const fromKey = (k: string) => new Date(`${k}T00:00:00Z`);
export const addDaysKey = (k: string, n: number) => {
  const d = fromKey(k);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const daysBetween = (a: string, b: string) => Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86_400_000);
/** Thứ trong tuần, thứ Hai = 0 … Chủ nhật = 6. */
export const weekdayMon0 = (k: string) => (fromKey(k).getUTCDay() + 6) % 7;

/** Ngày giờ hiển thị cho người học (dùng ở server component). */
export const formatDateTime = (d: Date) => d.toLocaleString("vi-VN", { timeZone: APP_TZ });
