import { describe, expect, it } from "vitest";
import { matchesDictation } from "../src/lib/compare";

const ex = { hanzi: "我是学生。", pinyin: "Wǒ shì xuésheng." };

describe("matchesDictation", () => {
  it("khớp chữ Hán, bỏ qua dấu câu và khoảng trắng", () => {
    expect(matchesDictation("我是学生", ex)).toBe(true);
    expect(matchesDictation(" 我 是 学生！", ex)).toBe(true);
  });
  it("khớp pinyin có dấu hoặc không dấu", () => {
    expect(matchesDictation("wǒ shì xuésheng", ex)).toBe(true);
    expect(matchesDictation("wo shi xuesheng", ex)).toBe(true);
    expect(matchesDictation("WoShiXuesheng.", ex)).toBe(true);
  });
  it("chấp nhận v thay ü", () => {
    expect(matchesDictation("nv er", { hanzi: "女儿", pinyin: "nǚ'ér" })).toBe(true);
  });
  it("sai chữ hoặc rỗng thì không khớp", () => {
    expect(matchesDictation("我是老师", ex)).toBe(false);
    expect(matchesDictation("wo shi laoshi", ex)).toBe(false);
    expect(matchesDictation("   ", ex)).toBe(false);
  });
});
