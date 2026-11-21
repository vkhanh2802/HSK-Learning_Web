import { describe, expect, it } from "vitest";
import { matchesDictation } from "../src/lib/compare";
import { gradeExercise } from "../src/lib/exercises";

const grade = (type: Parameters<typeof gradeExercise>[0], answer: unknown, response: unknown, payload = {}) =>
  gradeExercise(type, answer, payload, response, matchesDictation);

describe("gradeExercise", () => {
  it("chọn đáp án / đúng sai so trực tiếp", () => {
    expect(grade("mcq", 2, 2)).toBe(true);
    expect(grade("picture_tf", false, true)).toBe(false);
  });
  it("điền chữ: đúng chữ, bỏ khoảng trắng", () => {
    expect(grade("fill", "生", " 生 ")).toBe(true);
    expect(grade("fill", "生", "shēng")).toBe(false);
  });
  it("sắp xếp: chấp nhận mọi câu trong đáp án", () => {
    const ans = ["我明天去北京。", "明天我去北京。"];
    expect(grade("reorder", ans, ["明天", "我", "去", "北京"])).toBe(true);
    expect(grade("reorder", ans, ["我", "去", "明天", "北京"])).toBe(false);
  });
  it("chép chính tả dùng matchesDictation", () => {
    const audio = [{ hanzi: "你好！", pinyin: "Nǐ hǎo!", vi: "Xin chào" }];
    expect(grade("dictation", null, "ni hao", { audio })).toBe(true);
  });
  it("đặt câu không chấm ở đây", () => {
    expect(grade("compose", { hanzi: "我是学生。" }, "我是学生。")).toBe(false);
  });
});
