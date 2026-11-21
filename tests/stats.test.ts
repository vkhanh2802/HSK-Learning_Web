import { describe, expect, it } from "vitest";
import { accuracyBySkill, forecast, heatLevel, heatmap, isMastered } from "../src/lib/stats";

// Giờ Việt Nam (UTC+7) để test cho cùng kết quả dù máy chạy test ở múi giờ nào.
const at = (y: number, m: number, d: number, h = 12) => new Date(Date.UTC(y, m - 1, d, h - 7));

describe("forecast", () => {
  it("gộp thẻ quá hạn vào hôm nay, bỏ thẻ ngoài khoảng", () => {
    const now = at(2026, 11, 21, 9);
    const f = forecast([at(2026, 11, 1), at(2026, 11, 21, 23), at(2026, 11, 22, 1), at(2026, 12, 30)], now, 30);
    expect(f).toHaveLength(30);
    expect(f[0]).toEqual({ date: "2026-11-21", count: 2 });
    expect(f[1].count).toBe(1);
    expect(f.reduce((s, d) => s + d.count, 0)).toBe(3);
  });
});

describe("accuracyBySkill", () => {
  it("tính tỉ lệ và chọn kỹ năng yếu nhất trong các kỹ năng đủ lượt", () => {
    const a = (skill: string, ok: number, bad: number) => [
      ...Array.from({ length: ok }, () => ({ skill, correct: true })),
      ...Array.from({ length: bad }, () => ({ skill, correct: false })),
    ];
    const { rows, weakest } = accuracyBySkill([...a("listening", 8, 2), ...a("reading", 3, 3), ...a("writing", 0, 2)]);
    expect(rows.find((r) => r.skill === "listening")!.rate).toBe(0.8);
    expect(rows.find((r) => r.skill === "speaking")!.rate).toBeNull();
    // writing chỉ có 2 lượt (< 5) nên không xét.
    expect(weakest).toBe("reading");
  });
});

describe("heatmap", () => {
  it("lưới tuần bắt đầu thứ Hai, cột cuối chứa hôm nay, ngày tương lai là null", () => {
    const now = at(2026, 11, 21); // thứ Bảy
    const g = heatmap([at(2026, 11, 21, 8), at(2026, 11, 21, 20), at(2026, 11, 16)], now, 2);
    expect(g).toHaveLength(2);
    expect(g[1][0].date).toBe("2026-11-16");
    expect(g[1][0].count).toBe(1);
    expect(g[1][5]).toEqual({ date: "2026-11-21", count: 2 });
    expect(g[1][6].count).toBeNull();
    expect(g[0][0].date).toBe("2026-11-09");
  });
  it("mức màu", () => {
    expect([0, 1, 5, 20, 50].map(heatLevel)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("isMastered", () => {
  it("mọi thẻ phải ổn định > 21 ngày", () => {
    expect(isMastered([30, 25])).toBe(true);
    expect(isMastered([30, 10])).toBe(false);
    expect(isMastered([])).toBe(false);
  });
});
