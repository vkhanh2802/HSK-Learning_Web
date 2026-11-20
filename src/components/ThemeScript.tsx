"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useRef } from "react";

// Chạy trước khi vẽ trang để không bị nháy sai màu khi người dùng đã chọn chế độ sáng/tối.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

/**
 * Chèn script theme vào HTML do server sinh ra (theo hướng dẫn "Preventing flash" của Next 16).
 * Dùng useServerInsertedHTML thay vì <script> trong layout để React không cảnh báo
 * "Encountered a script tag while rendering React component". Chỉ chèn 1 lần cho tài liệu đầu tiên;
 * thuộc tính data-theme trên <html> vẫn giữ khi chuyển trang.
 */
export default function ThemeScript() {
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
  });
  return null;
}
