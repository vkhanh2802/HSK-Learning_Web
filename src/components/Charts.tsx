"use client";

import { useState, type KeyboardEvent } from "react";
import { heatLevel } from "@/lib/stats";
import { useLang } from "./LangProvider";
import { tr } from "@/lib/lang";

const fmtDate = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${Number(d)}/${Number(m)}`;
};

/** Hộp chú thích khi rê chuột / chọn bằng phím: giá trị đậm trước, nhãn phụ sau. */
function Tip({ value, label }: { value: string; label: string }) {
  return (
    <div role="status" className="pointer-events-none mt-2 h-6 text-sm">
      <strong>{value}</strong> <span className="opacity-75">{label}</span>
    </div>
  );
}

/** Phím mũi tên di chuyển mục đang chọn trong biểu đồ (cùng nội dung như khi rê chuột). */
function arrows(
  e: KeyboardEvent,
  i: number | null,
  n: number,
  step: Record<string, number>,
  set: (i: number) => void,
) {
  const d = step[e.key];
  if (d === undefined) return;
  e.preventDefault();
  set(Math.min(n - 1, Math.max(0, (i ?? -d) + d)));
}

/** Cột: số thẻ đến hạn mỗi ngày trong 30 ngày tới (ngày đầu gồm thẻ quá hạn). */
export function ForecastChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const lang = useLang();
  const t = tr(lang);
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const top = max <= 5 ? 5 : Math.ceil(max / 10) * 10;
  const H = 140;
  const total = data.reduce((s, d) => s + d.count, 0);
  const cur = hover === null ? null : data[hover];

  return (
    <div>
      <div
        tabIndex={0}
        role="img"
        aria-label={t(
          `Biểu đồ cột: ${total} thẻ đến hạn trong ${data.length} ngày tới, nhiều nhất ${max} thẻ một ngày. Dùng phím mũi tên để xem từng ngày.`,
          `Bar chart: ${total} cards due over the next ${data.length} days, at most ${max} in one day. Use the arrow keys to browse each day.`,
        )}
        onKeyDown={(e) =>
          arrows(
            e,
            hover,
            data.length,
            { ArrowLeft: -1, ArrowRight: 1 },
            setHover,
          )
        }
        onBlur={() => setHover(null)}
        className="relative flex gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {/* Trục: chỉ vạch 0 và giá trị trên cùng, vạch lưới mảnh. */}
        <div
          className="flex w-8 flex-col justify-between text-right text-xs tabular-nums opacity-60"
          style={{ height: H }}
        >
          <span>{top}</span>
          <span>{top / 2}</span>
          <span>0</span>
        </div>
        <div className="relative flex-1">
          {[0, 0.5, 1].map((f) => (
            <div
              key={f}
              className="absolute inset-x-0 h-px"
              style={{ top: H * f, background: "var(--viz-grid)" }}
            />
          ))}
          <div
            className="relative flex items-end gap-[2px]"
            style={{ height: H }}
            onPointerLeave={() => setHover(null)}
          >
            {data.map((d, i) => (
              <div
                key={d.date}
                onPointerEnter={() => setHover(i)}
                className="flex h-full flex-1 cursor-default items-end justify-center"
              >
                <div
                  className="chart-bar-grow w-full max-w-6 rounded-t"
                  style={
                    {
                      height: d.count ? Math.max(2, (d.count / top) * H) : 0,
                      background: "var(--viz-bar)",
                      opacity: hover === null || hover === i ? 1 : 0.45,
                      "--bar-i": i,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex text-xs opacity-60">
            {data.map((d, i) => (
              <span
                key={d.date}
                className={`flex-1 whitespace-nowrap ${i === 0 ? "text-left" : "text-center"}`}
              >
                {i % 7 === 0 ? (i === 0 ? t("Hôm nay", "Today") : fmtDate(d.date)) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Tip
        value={cur ? `${cur.count} ${t("thẻ", "cards")}` : ""}
        label={
          cur
            ? hover === 0
              ? t("hôm nay (gồm thẻ quá hạn)", "today (including overdue cards)")
              : fmtDate(cur.date)
            : ""
        }
      />
    </div>
  );
}

const DAYS = { vi: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"], en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] };

/** Lưới ngày học: mỗi cột một tuần, màu đậm = nhiều hoạt động (lượt làm bài + bài học xong). */
export function ActivityHeatmap({
  weeks,
}: {
  weeks: { date: string; count: number | null }[][];
}) {
  const lang = useLang();
  const t = tr(lang);
  const cells = weeks.flat();
  const [hover, setHover] = useState<number | null>(null);
  const cur = hover === null ? null : cells[hover];
  const active = cells.filter((c) => c.count).length;

  return (
    <div>
      <div className="overflow-x-auto p-1">
        <div
          tabIndex={0}
          role="img"
          aria-label={t(
            `Lịch học ${weeks.length} tuần gần nhất: ${active} ngày có học. Dùng phím mũi tên để xem từng ngày.`,
            `Study calendar for the last ${weeks.length} weeks: ${active} days with activity. Use the arrow keys to browse each day.`,
          )}
          onKeyDown={(e) =>
            arrows(
              e,
              hover,
              cells.length,
              { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 },
              setHover,
            )
          }
          onBlur={() => setHover(null)}
          onPointerLeave={() => setHover(null)}
          className="inline-flex gap-[2px] rounded focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <div className="mr-1 grid grid-rows-7 gap-[2px] text-[10px] leading-3 opacity-60">
            {DAYS[lang].map((d, i) => (
              <span key={d} className="h-3">
                {i % 2 === 0 ? d : ""}
              </span>
            ))}
          </div>
          {weeks.map((week, w) => (
            <div key={week[0].date} className="grid grid-rows-7 gap-[2px]">
              {week.map((c, d) => {
                const i = w * 7 + d;
                return (
                  <div
                    key={c.date}
                    onPointerEnter={() => c.count !== null && setHover(i)}
                    className="heat-cell relative size-3 rounded-[2px]"
                    style={{
                      background:
                        c.count === null
                          ? "transparent"
                          : `var(--viz-heat-${heatLevel(c.count)})`,
                      outline:
                        hover === i ? "2px solid var(--foreground)" : undefined,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs opacity-75">
        {t("Ít", "Less")}
        {[0, 1, 2, 3, 4].map((l) => (
          <span
            key={l}
            className="size-3 rounded-[2px]"
            style={{ background: `var(--viz-heat-${l})` }}
          />
        ))}
        {t("Nhiều", "More")}
      </div>
      <Tip
        value={cur && cur.count !== null ? `${cur.count} ${t("hoạt động", "activities")}` : ""}
        label={
          cur
            ? new Date(`${cur.date}T00:00`).toLocaleDateString(lang === "en" ? "en-GB" : "vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "numeric",
              })
            : ""
        }
      />
    </div>
  );
}
