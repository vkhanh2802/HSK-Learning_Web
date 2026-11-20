import { describe, expect, it } from "vitest";
import { stripAnswers, tokenize } from "../src/lib/passages";

const vocab = new Map([
  ["我", { id: 1, pinyin: "wǒ", meaningVi: "tôi" }],
  ["是", { id: 2, pinyin: "shì", meaningVi: "là" }],
  ["学生", { id: 3, pinyin: "xuésheng", meaningVi: "học sinh" }],
]);

describe("tokenize", () => {
  it("tra từ vựng, giữ dấu câu, tách dòng", () => {
    const { lines, unknown } = tokenize("我 是 学生 。\n王明 ： 我 是 学生 ！", vocab, {
      王明: { p: "Wáng Míng", vi: "Vương Minh" },
    });
    expect(unknown).toEqual([]);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual([
      { t: "我", p: "wǒ", vi: "tôi", w: 1 },
      { t: "是", p: "shì", vi: "là", w: 2 },
      { t: "学生", p: "xuésheng", vi: "học sinh", w: 3 },
      { t: "。" },
    ]);
    expect(lines[1][0]).toEqual({ t: "王明", p: "Wáng Míng", vi: "Vương Minh" });
    expect(lines[1][1]).toEqual({ t: "：" });
  });

  it("báo token vượt cấp / chưa có nghĩa", () => {
    expect(tokenize("我 也 是 学生 。", vocab, {}).unknown).toEqual(["也"]);
  });
});

describe("stripAnswers", () => {
  it("bỏ đáp án khỏi câu hỏi", () => {
    const q = stripAnswers([
      { type: "tf", statement: { hanzi: "我是学生。", pinyin: "Wǒ shì xuésheng.", vi: "Tôi là học sinh." }, answer: true },
    ]);
    expect(q[0]).not.toHaveProperty("answer");
  });
});
