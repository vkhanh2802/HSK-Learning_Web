import { describe, expect, it } from "vitest";
import { gradeGrammar, stripGrammarAnswers, type GrammarExercise } from "../src/lib/grammar";

const choose: GrammarExercise = {
  type: "choose",
  prompt: { hanzi: "我 ___ 学生。", vi: "Tôi là học sinh." },
  options: ["是", "很", "有"],
  answer: 0,
};
const reorder: GrammarExercise = {
  type: "reorder",
  words: ["去", "明天", "北京", "我"],
  vi: "Ngày mai tôi đi Bắc Kinh.",
  answers: ["我明天去北京。", "明天我去北京。"],
};

describe("gradeGrammar", () => {
  it("chọn đáp án theo số thứ tự", () => {
    expect(gradeGrammar(choose, 0)).toBe(true);
    expect(gradeGrammar(choose, 1)).toBe(false);
  });
  it("sắp xếp: chấp nhận mọi câu trong answers, bỏ qua dấu câu", () => {
    expect(gradeGrammar(reorder, ["我", "明天", "去", "北京"])).toBe(true);
    expect(gradeGrammar(reorder, ["明天", "我", "去", "北京"])).toBe(true);
    expect(gradeGrammar(reorder, ["我", "去", "北京", "明天"])).toBe(false);
    expect(gradeGrammar(reorder, 0)).toBe(false);
  });
});

describe("stripGrammarAnswers", () => {
  it("không gửi đáp án xuống client", () => {
    const [c, r] = stripGrammarAnswers([choose, reorder]);
    expect(c).not.toHaveProperty("answer");
    expect(r).not.toHaveProperty("answers");
  });
});
