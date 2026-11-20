import { describe, expect, it } from "vitest";
import { streak } from "../src/lib/streak";

const at = (s: string) => new Date(`${s}T10:00:00`);
const now = at("2026-03-10");

describe("streak", () => {
  it("0 khi chưa học", () => expect(streak([], now)).toBe(0));
  it("đếm các ngày liên tiếp đến hôm nay", () =>
    expect(streak([at("2026-03-10"), at("2026-03-09"), at("2026-03-09"), at("2026-03-08")], now)).toBe(3));
  it("hôm nay chưa học thì tính đến hôm qua", () =>
    expect(streak([at("2026-03-09"), at("2026-03-08")], now)).toBe(2));
  it("đứt chuỗi khi bỏ một ngày", () =>
    expect(streak([at("2026-03-10"), at("2026-03-08")], now)).toBe(1));
});
