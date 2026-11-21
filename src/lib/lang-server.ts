import { cookies } from "next/headers";
import { LANG_COOKIE, parseLang, tr } from "./lang";

export async function getLang() {
  return parseLang((await cookies()).get(LANG_COOKIE)?.value);
}

/** Dùng trong Server Component / Server Action: `const t = await getT(); t("Xin chào", "Hello")`. */
export async function getT() {
  return tr(await getLang());
}
