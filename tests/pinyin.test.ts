import { describe, expect, it } from "vitest";
import { joinSyllables, numericToMarked, stripTone, toneOf } from "../src/lib/pinyin";

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

describe("numericToMarked", () => {
  it.each([
    ["ma3", "mǎ"],
    ["hao3", "hǎo"],
    ["xie4", "xiè"],
    ["gou3", "gǒu"],
    ["liu4", "liù"],
    ["gui4", "guì"],
    ["nü3", "nǚ"],
    ["lv4", "lǜ"],
    ["lu:4", "lǜ"],
    ["er2", "ér"],
    ["ma5", "ma"],
    ["ma", "ma"],
    ["Bei3", "Běi"],
  ])("%s -> %s", (input, expected) => expect(numericToMarked(input)).toBe(expected));
});

describe("toneOf / stripTone", () => {
  it("đọc thanh", () => {
    expect(toneOf("mā")).toBe(1);
    expect(toneOf("má")).toBe(2);
    expect(toneOf("mǎ")).toBe(3);
    expect(toneOf("mà")).toBe(4);
    expect(toneOf("ma")).toBe(5);
    expect(toneOf("lǜ")).toBe(4);
  });
  it("bỏ dấu", () => {
    expect(stripTone("zhōng")).toBe("zhong");
    expect(stripTone("lǜ")).toBe("lü");
  });
});
