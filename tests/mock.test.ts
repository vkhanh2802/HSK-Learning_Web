import { describe, expect, it } from "vitest";
import { findWords, pickSection, scoreSections, type PoolItem } from "../src/lib/mock";

// Bộ sinh số giả ngẫu nhiên cố định để test lặp lại được.
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const singles = (level: number, n: number, order = 0): PoolItem[] =>
  Array.from({ length: n }, (_, i) => ({ ref: `s${level}-${i}`, level, order }));
const passage = (id: number, level: number, qs: number): PoolItem[] =>
  Array.from({ length: qs }, (_, q) => ({ ref: `pq:${id}:${q}`, level, order: 2, group: `p:${id}` }));

describe("pickSection", () => {
  it("lấy đủ số câu, không trùng, ưu tiên cùng cấp và câu chưa gặp", () => {
    const pool = [...singles(1, 10), ...singles(2, 10)];
    const recent = new Set(["s2-0", "s2-1"]);
    const refs = pickSection(pool, 10, 2, recent, seeded(1));
    expect(refs).toHaveLength(10);
    expect(new Set(refs).size).toBe(10);
    // 8 câu cấp 2 chưa gặp được lấy hết trước, rồi mới tới câu cấp 1.
    expect(refs.filter((r) => r.startsWith("s2-") && !recent.has(r))).toHaveLength(8);
    expect(refs.some((r) => recent.has(r))).toBe(false);
  });

  it("kho thiếu thì trả về ít hơn", () => {
    expect(pickSection(singles(1, 3), 10, 1, new Set(), seeded(2))).toHaveLength(3);
  });

  it("bài đọc lấy nguyên cụm, khoảng một nửa phần, đặt sau câu lẻ", () => {
    const pool = [...singles(1, 20), ...passage(1, 1, 3), ...passage(2, 1, 3), ...passage(3, 1, 2)];
    const refs = pickSection(pool, 10, 1, new Set(), seeded(3));
    expect(refs).toHaveLength(10);
    const pq = refs.filter((r) => r.startsWith("pq:"));
    expect(pq.length).toBeGreaterThanOrEqual(5);
    // Mỗi bài đọc được chọn thì đủ mọi câu hỏi của nó và đứng liền nhau.
    for (const id of new Set(pq.map((r) => r.split(":")[1]))) {
      const idx = refs.flatMap((r, i) => (r.startsWith(`pq:${id}:`) ? [i] : []));
      expect(idx.length).toBe(pool.filter((p) => p.group === `p:${id}`).length);
      expect(idx.at(-1)! - idx[0]).toBe(idx.length - 1);
    }
    expect(refs.findIndex((r) => r.startsWith("pq:"))).toBe(refs.length - pq.length);
  });
});

describe("scoreSections", () => {
  it("quy mỗi phần về 100 và xét đỗ theo tổng", () => {
    const s = scoreSections(
      [
        { skill: "listening", results: [true, true, false, false] },
        { skill: "reading", results: [true, true, true, false] },
      ],
      120,
    );
    expect(s.sections.map((p) => p.score)).toEqual([50, 75]);
    expect(s.total).toBe(125);
    expect(s.max).toBe(200);
    expect(s.passed).toBe(true);
  });
  it("phần rỗng được 0 điểm", () => {
    expect(scoreSections([{ skill: "writing", results: [] }], 180).sections[0].score).toBe(0);
  });
});

describe("findWords", () => {
  it("khớp từ dài nhất trước, bỏ chữ không có trong từ vựng", () => {
    const vocab = new Set(["我", "喜欢", "喜", "中国", "中国菜", "吃"]);
    expect(findWords("我喜欢吃中国菜！", vocab)).toEqual(["我", "喜欢", "吃", "中国菜"]);
  });
});
