export type Lang = "vi" | "en";
export const LANG_COOKIE = "lang";
export const parseLang = (v: string | undefined): Lang => (v === "en" ? "en" : "vi");
/** Chọn chuỗi theo ngôn ngữ; cặp (vi, en) viết cạnh nhau để dễ sửa. */
/** Nghĩa của từ theo ngôn ngữ; thiếu bản tiếng Anh thì dùng tiếng Việt. */
export const meaning = (lang: Lang, w: { meaningVi: string; meaningEn: string | null }) =>
  lang === "en" ? w.meaningEn || w.meaningVi : w.meaningVi;
export const tr = (lang: Lang) => (vi: string, en: string) => (lang === "en" ? en : vi);
