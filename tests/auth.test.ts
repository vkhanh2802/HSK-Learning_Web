import { beforeEach, describe, expect, it } from "vitest";
import { checkPassword, createSessionValue, safeNext, verifySessionValue } from "../src/lib/auth";

beforeEach(() => {
  process.env.APP_PASSWORD = "mat-khau-thu";
  process.env.AUTH_SECRET = "a".repeat(40);
});

describe("session cookie", () => {
  it("cookie vừa tạo hợp lệ; hết hạn, bị sửa hoặc sai secret thì không", () => {
    const now = Date.now();
    const v = createSessionValue(now);
    expect(verifySessionValue(v, now)).toBe(true);
    expect(verifySessionValue(v, now + 31 * 86_400_000)).toBe(false);
    const [exp, sig] = v.split(".");
    expect(verifySessionValue(`${Number(exp) + 1}.${sig}`, now)).toBe(false);
    expect(verifySessionValue(undefined)).toBe(false);
    expect(verifySessionValue("rac")).toBe(false);
    process.env.AUTH_SECRET = "b".repeat(40);
    expect(verifySessionValue(v, now)).toBe(false);
  });
  it("thiếu AUTH_SECRET thì báo lỗi thay vì ký bằng khoá rỗng", () => {
    process.env.AUTH_SECRET = "ngan";
    expect(() => createSessionValue()).toThrow();
  });
});

describe("checkPassword", () => {
  it("so đúng mật khẩu", () => {
    expect(checkPassword("mat-khau-thu")).toBe(true);
    expect(checkPassword("mat-khau-sai")).toBe(false);
    expect(checkPassword("")).toBe(false);
  });
});

describe("safeNext", () => {
  it("chỉ cho đường dẫn nội bộ", () => {
    expect(safeNext("/review?x=1")).toBe("/review?x=1");
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("/\\evil.com")).toBe("/");
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext(null)).toBe("/");
  });
});
