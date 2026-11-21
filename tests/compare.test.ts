import { describe, expect, it } from "vitest";
import { alignSpeech, matchesDictation, toChineseNumber } from "../src/lib/compare";

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

describe("toChineseNumber", () => {
  it.each([
    [0, "零"],
    [8, "八"],
    [10, "十"],
    [12, "十二"],
    [20, "二十"],
    [99, "九十九"],
    [2026, "二零二六"],
  ])("%i -> %s", (n, s) => expect(toChineseNumber(n)).toBe(s));
});

describe("alignSpeech", () => {
  const sounds = { 他: ["ta"], 她: ["ta"], 是: ["shi"], 十: ["shi"], 点: ["dian"], 八: ["ba"] };
  it("khớp hết thì 100%, dấu câu không tính", () => {
    const r = alignSpeech("我是学生。", "我是学生", sounds);
    expect(r.score).toBe(1);
    expect(r.chars.every((c) => c.ok)).toBe(true);
  });
  it("đánh dấu chữ thiếu/sai", () => {
    const r = alignSpeech("我是学生。", "我是老师", sounds);
    expect(r.chars.map((c) => c.ok)).toEqual([true, true, false, false, true]);
    expect(r.score).toBe(0.5);
  });
  it("chữ đồng âm (他/她) vẫn tính đúng", () => {
    expect(alignSpeech("她是老师。", "他是老师", sounds).score).toBe(1);
  });
  it("đổi chữ số trong kết quả nhận diện", () => {
    expect(alignSpeech("现在八点。", "现在8点", sounds).score).toBe(1);
  });
  it("không nghe được gì thì 0", () => {
    expect(alignSpeech("我是学生。", "", sounds).score).toBe(0);
  });
});
