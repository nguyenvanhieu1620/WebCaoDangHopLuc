/**
 * Biểu đồ nhỏ cho Dashboard admin — SVG/HTML thuần dựng ở server, không thêm
 * thư viện biểu đồ. Màu dùng token thương hiệu (brand/accent).
 */

export type DailyPoint = { key: string; label: string; value: number };

/** Biểu đồ cột theo ngày (VD hồ sơ tuyển sinh 30 ngày gần nhất). */
export function DailyBarChart({ points, unit }: { points: DailyPoint[]; unit: string }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const W = 600;
  const H = 160;
  const gap = 3;
  const barW = (W - gap * (points.length - 1)) / points.length;
  const ticks = [0, Math.ceil(max / 2), max].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="h-auto w-full" role="img" aria-label={`Biểu đồ ${unit} theo ngày`}>
        <defs>
          <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-500)" />
            <stop offset="100%" stopColor="var(--brand-700)" />
          </linearGradient>
          <linearGradient id="bar-grad-today" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-500)" />
            <stop offset="100%" stopColor="var(--accent-600)" />
          </linearGradient>
        </defs>
        {ticks.map((t) => {
          const y = H - (t / max) * (H - 10);
          return (
            <g key={t}>
              <line x1="0" x2={W} y1={y} y2={y} className="stroke-line" strokeDasharray={t === 0 ? undefined : "3 4"} />
            </g>
          );
        })}
        {points.map((p, i) => {
          const h = p.value === 0 ? 2 : Math.max(4, (p.value / max) * (H - 10));
          const x = i * (barW + gap);
          const isLast = i === points.length - 1;
          return (
            <g key={p.key}>
              <rect
                x={x}
                y={H - h}
                width={barW}
                height={h}
                rx={Math.min(4, barW / 2)}
                fill={p.value === 0 ? "var(--brand-100)" : isLast ? "url(#bar-grad-today)" : "url(#bar-grad)"}
              >
                <title>{`${p.label}: ${p.value} ${unit}`}</title>
              </rect>
              {(i % 5 === 0 || isLast) && (
                <text x={isLast ? x + barW : x + barW / 2} y={H + 16} textAnchor={isLast ? "end" : "middle"} fontSize="10" className="fill-ink-faint font-mono">
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        {points.map((p) => `${p.label}: ${p.value}`).join(", ")}
      </figcaption>
    </figure>
  );
}

/** Thanh ngang phân bố theo nhóm (VD hồ sơ theo ngành). */
export function BreakdownBars({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <ul className="space-y-3">
      {items.map((item, idx) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate font-medium text-ink">{item.label}</span>
            <span className="shrink-0 font-mono text-[11.5px] text-ink-faint">
              {item.value} · {total ? Math.round((item.value / total) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-paper-alt">
            <div
              className={
                idx === 0
                  ? "h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-500"
                  : "h-full rounded-full bg-gradient-to-r from-brand-700 to-brand-500"
              }
              style={{ width: `${Math.max(3, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Đường xu hướng mini trong thẻ KPI. */
export function Sparkline({ values, tone = "brand" }: { values: number[]; tone?: "brand" | "accent" }) {
  if (values.length < 2) return null;
  const W = 120;
  const H = 34;
  const max = Math.max(1, ...values);
  const step = W / (values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(H - 3 - (v / max) * (H - 6)).toFixed(1)}`);
  const color = tone === "accent" ? "var(--accent-600)" : "var(--brand-700)";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[34px] w-[120px]" aria-hidden="true">
      <polygon points={`0,${H} ${pts.join(" ")} ${W},${H}`} fill={color} opacity="0.08" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
