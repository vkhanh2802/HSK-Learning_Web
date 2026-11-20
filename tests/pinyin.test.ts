import { describe, expect, it } from "vitest";
import { joinSyllables } from "../src/lib/pinyin";

describe("joinSyllables", () => {
  it("ghép liền các âm tiết", () => {
    expect(joinSyllables(["bà", "ba"])).toBe("bàba");
    expect(joinSyllables(["Běi", "jīng"])).toBe("Běijīng");
  });
  it("thêm ' trước âm tiết bắt đầu bằng a/o/e", () => {
    expect(joinSyllables(["nǚ", "ér"])).toBe("nǚ'ér");
    expect(joinSyllables(["shí", "èr"])).toBe("shí'èr");
  });
  it("không thêm ' cho âm tiết đầu", () => {
    expect(joinSyllables(["ài"])).toBe("ài");
  });
});
