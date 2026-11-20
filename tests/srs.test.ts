import { describe, expect, it } from "vitest";
import { newCard, review } from "../src/lib/srs";

const now = new Date("2026-01-01T00:00:00Z");

describe("srs", () => {
  it("thẻ mới đến hạn ngay", async () => {
    const c = await newCard(now);
    expect(c.due.getTime()).toBe(now.getTime());
  });

  it("chấm Good: hạn ôn sau hôm nay; Again: ôn lại trong vài phút", async () => {
    const c = await newCard(now);
    const good = await review(c.fsrs, 3, now);
    expect(good.due.getTime()).toBeGreaterThan(now.getTime() + 24 * 3600_000);

    const again = await review(good.fsrs, 1, good.due); // đọc lại từ JSON như khi lấy từ DB
    expect(again.due.getTime() - good.due.getTime()).toBeLessThan(30 * 60_000);
  });
});
