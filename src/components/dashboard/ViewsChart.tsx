import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { fmt } from '@/lib/util';

interface Point { day: string; views: number }

const H = 248;
const PAD = { top: 14, right: 12, bottom: 28, left: 36 };
const ACCENT = '#8b5cf6'; // validated against the card surface (#0f0f12): passes contrast and lightness checks
const SURFACE = '#0f0f12';

const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric' });

/** Smallest "nice" number (1, 2, 5 × 10ⁿ) at or above max, for a clean y-axis. */
function niceMax(max: number) {
  if (max <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= max) return m * p;
  return 10 * p;
}

/** Single-series area chart of views per day, with a crosshair, tooltip and keyboard support. */
export function ViewsChart({ data }: { data: Point[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const max = niceMax(Math.max(0, ...data.map((d) => d.views)));
    const iw = Math.max(1, w - PAD.left - PAD.right);
    const ih = H - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const y = (v: number) => PAD.top + ih - (v / max) * ih;
    const pts = data.map((d, i) => [x(i), y(d.views)] as const);
    const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join('');
    const area = pts.length ? `${line}L${pts[pts.length - 1][0].toFixed(1)},${y(0)}L${pts[0][0].toFixed(1)},${y(0)}Z` : '';
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
    const every = Math.max(1, Math.ceil(data.length / 6));
    return { x, y, line, area, ticks, every, max };
  }, [data, w]);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!data.length) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0;
    for (let i = 1; i < data.length; i++) if (Math.abs(geo.x(i) - px) < Math.abs(geo.x(best) - px)) best = i;
    setActive(best);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (!data.length) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); setActive((a) => Math.min(data.length - 1, (a ?? -1) + 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setActive((a) => Math.max(0, (a ?? data.length) - 1)); }
    if (e.key === 'Home') setActive(0);
    if (e.key === 'End') setActive(data.length - 1);
  };

  const a = active !== null ? data[active] : null;
  const tipLeft = active !== null ? Math.min(Math.max(geo.x(active), 70), w - 70) : 0;

  return (
    <div
      ref={box}
      className="relative outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-[10px]"
      tabIndex={0}
      role="group"
      aria-label="Profile views per day. Use the left and right arrow keys to read each day."
      onKeyDown={onKey}
      onFocus={() => setActive((v) => v ?? data.length - 1)}
      onBlur={() => setActive(null)}
    >
      {w > 0 && (
        <svg width={w} height={H} className="block touch-none" onPointerMove={onMove} onPointerLeave={() => setActive(null)} aria-hidden>
          <defs>
            <linearGradient id="views-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0.16" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
            </linearGradient>
          </defs>
          {geo.ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={w - PAD.right} y1={geo.y(t)} y2={geo.y(t)} stroke="rgba(255,255,255,.06)" strokeWidth="1" />
              <text x={PAD.left - 10} y={geo.y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="#71717a" className="tabular-nums">
                {fmt(Math.round(t))}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % geo.every === 0 || i === data.length - 1 ? (
              <text key={d.day} x={geo.x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} fontSize="11" fill="#71717a">
                {i === data.length - 1 ? 'Today' : dayLabel(d.day)}
              </text>
            ) : null,
          )}
          <path d={geo.area} fill="url(#views-fill)" />
          <path d={geo.line} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {active !== null && (
            <g>
              <line x1={geo.x(active)} x2={geo.x(active)} y1={PAD.top} y2={H - PAD.bottom} stroke="rgba(255,255,255,.16)" strokeWidth="1" />
              <circle cx={geo.x(active)} cy={geo.y(data[active].views)} r="5" fill={ACCENT} stroke={SURFACE} strokeWidth="2" />
            </g>
          )}
        </svg>
      )}
      {a && (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-[9px] border border-white/[.08] bg-[#18181d] px-2.5 py-1.5 shadow-[0_12px_30px_-10px_rgba(0,0,0,.8)]"
          style={{ left: tipLeft }}
        >
          <div className="flex items-center gap-2">
            <span className="h-[2px] w-3 rounded-full" style={{ background: ACCENT }} />
            <span className="text-[13px] font-semibold tabular-nums text-zinc-50">{fmt(a.views)}</span>
            <span className="text-[12px] text-zinc-500">{a.views === 1 ? 'view' : 'views'}</span>
          </div>
          <div className="text-[11.5px] text-zinc-500">{dayLabel(a.day)}</div>
        </div>
      )}
      <table className="sr-only">
        <caption>Profile views per day</caption>
        <thead><tr><th>Day</th><th>Views</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.day}><td>{dayLabel(d.day)}</td><td>{d.views}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
