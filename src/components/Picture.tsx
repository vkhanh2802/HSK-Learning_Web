"use client";

import { useState } from "react";

export type PictureData = { emoji: string; image?: string; label: string };

/** Ảnh minh hoạ (public/images, xem CREDITS.md); nếu thiếu hoặc lỗi tải thì hiện emoji. */
export default function Picture({ picture, size = 160 }: { picture: PictureData; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (!picture.image || broken)
    return (
      <span role="img" aria-label={picture.label} style={{ fontSize: size * 0.55, lineHeight: 1 }}>
        {picture.emoji}
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh tĩnh nhỏ đã nén sẵn, không cần next/image
    <img
      src={picture.image}
      alt={picture.label}
      width={size}
      height={size}
      onError={() => setBroken(true)}
      className="rounded object-cover"
      style={{ width: size, height: size }}
    />
  );
}
