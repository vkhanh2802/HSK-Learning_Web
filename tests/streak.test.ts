import { describe, expect, it } from "vitest";
import { streak } from "../src/lib/streak";

// Giờ Việt Nam (+07:00) để test cho cùng kết quả dù máy chạy test ở múi giờ nào.
const at = (s: string, time = "10:00") => new Date(`${s}T${time}:00+07:00`);
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

describe("streak theo giờ Việt Nam", () => {
  it("23:30 và 00:30 giờ VN là hai ngày khác nhau dù cùng một ngày UTC", () =>
    expect(streak([at("2026-03-09", "23:30"), at("2026-03-10", "00:30")], at("2026-03-10", "08:00"))).toBe(2));
});
