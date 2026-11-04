import { useEffect, useRef, useState } from 'react';
import { Pipette } from 'lucide-react';
import { Popover } from './Popover';
import { fieldShell } from './Field';
import { cx } from '@/lib/util';

interface RGBA { r: number; g: number; b: number; a: number }
interface HSV { h: number; s: number; v: number }

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

export function parseHex(hex: string): RGBA {
  let h = hex.replace('#', '').trim();
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(h)) return { r: 255, g: 255, b: 255, a: 1 };
  const n = parseInt(h.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1 };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }, a = 1) {
  const p = (x: number) => Math.round(x).toString(16).padStart(2, '0');
  return `#${p(r)}${p(g)}${p(b)}${a < 1 ? p(a * 255) : ''}`;
}

function rgbToHsv({ r, g, b }: { r: number; g: number; b: number }): HSV {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function hsvToRgb({ h, s, v }: HSV) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255;
  };
  return { r: f(5), g: f(3), b: f(1) };
}

/** Pointer drag helper that reports positions as 0..1 within the element. */
function drag(onMove: (x: number, y: number) => void) {
  return (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const at = (cx: number, cy: number) => onMove(clamp((cx - r.left) / r.width), clamp((cy - r.top) / r.height));
    at(e.clientX, e.clientY);
    const move = (ev: PointerEvent) => at(ev.clientX, ev.clientY);
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };
}

const LIGHT = ['#ffffff', '#f87171', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#8b5cf6', '#f472b6'];
export const DARK_PRESETS = ['#000000', '#08080a', '#0c0c14', '#100a1a', '#08111c', '#09130d', '#170a0e', '#151515'];

function Panel({ value, onChange, alpha, presets }: { value: string; onChange: (v: string) => void; alpha: boolean; presets: string[] }) {
  const init = parseHex(value);
  const [hsv, setHsv] = useState<HSV>(() => rgbToHsv(init));
  const [a, setA] = useState(init.a);
  const [text, setText] = useState(value);
  const hsvRef = useRef(hsv);
  const aRef = useRef(a);
  const last = useRef(value);

  useEffect(() => {
    if (value === last.current) return;
    const c = parseHex(value);
    const n = rgbToHsv(c);
    hsvRef.current = n; aRef.current = c.a;
    setHsv(n); setA(c.a); setText(value);
    last.current = value;
  }, [value]);

  const emit = (n: HSV, al: number) => {
    hsvRef.current = n; aRef.current = al;
    setHsv(n); setA(al);
    const hex = toHex(hsvToRgb(n), alpha ? al : 1);
    last.current = hex;
    setText(hex);
    onChange(hex);
  };
  const setFromHex = (hex: string) => {
    const c = parseHex(hex);
    emit(rgbToHsv(c), alpha ? c.a : 1);
  };

  const hueColor = toHex(hsvToRgb({ h: hsv.h, s: 1, v: 1 }));
  const solid = toHex(hsvToRgb(hsv));
  const EyeDropper = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;

  const key = (dx: number, dy: number) => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.01;
    const map: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    const m = map[e.key];
    if (!m) return;
    e.preventDefault();
    if (dx) emit({ ...hsvRef.current, h: clamp(hsvRef.current.h + m[0] * (e.shiftKey ? 10 : 2), 0, 360) }, aRef.current);
    else if (dy) emit({ ...hsvRef.current, s: clamp(hsvRef.current.s + m[0] * step), v: clamp(hsvRef.current.v + m[1] * step) }, aRef.current);
  };

  return (
    <div className="space-y-3 p-3">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuetext={`${Math.round(hsv.s * 100)}% saturation, ${Math.round(hsv.v * 100)}% brightness`}
        onKeyDown={key(0, 1)}
        onPointerDown={drag((x, y) => emit({ ...hsvRef.current, s: x, v: 1 - y }, aRef.current))}
        className="relative h-[148px] cursor-crosshair touch-none rounded-[8px] outline-none ring-white/40 focus-visible:ring-2"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})` }}
      >
        <span
          className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.3),0_2px_4px_rgba(0,0,0,.4)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: solid }}
        />
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        onKeyDown={key(1, 0)}
        onPointerDown={drag((x) => emit({ ...hsvRef.current, h: x * 360 }, aRef.current))}
        className="relative h-3 cursor-pointer touch-none rounded-full outline-none ring-white/40 focus-visible:ring-2"
        style={{ background: 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}
      >
        <span className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,.5)]" style={{ left: `${(hsv.h / 360) * 100}%`, background: hueColor }} />
      </div>
      {alpha && (
        <div
          role="slider"
          tabIndex={0}
          aria-label="Opacity"
          aria-valuenow={Math.round(a * 100)}
          onPointerDown={drag((x) => emit(hsvRef.current, Math.round(x * 100) / 100))}
          className="bg-checker relative h-3 cursor-pointer touch-none rounded-full outline-none"
        >
          <span className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(to right, transparent, ${solid})` }} />
          <span className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,.5)]" style={{ left: `${a * 100}%`, background: solid }} />
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className={cx('flex h-8 min-w-0 flex-1 items-center px-2', fieldShell)}>
          <span className="mr-1 text-[12px] text-zinc-600">#</span>
          <input
            aria-label="Hex colour"
            value={text.replace('#', '')}
            maxLength={alpha ? 8 : 6}
            spellCheck={false}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9a-f]/gi, '');
              setText(`#${v}`);
              if (v.length === 6 || (alpha && v.length === 8)) setFromHex(`#${v}`);
            }}
            onBlur={() => setText(last.current)}
            className="min-w-0 flex-1 bg-transparent font-mono text-[12px] uppercase text-zinc-100 outline-none"
          />
          {alpha && <span className="ml-1 font-mono text-[11px] tabular-nums text-zinc-500">{Math.round(a * 100)}%</span>}
        </div>
        {EyeDropper && (
          <button
            type="button"
            aria-label="Pick a colour from the screen"
            onClick={() => new EyeDropper().open().then((r) => setFromHex(r.sRGBHex)).catch(() => {})}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] border border-white/[.07] bg-field text-zinc-400 transition hover:border-white/[.13] hover:text-white"
          >
            <Pipette size={14} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Use ${c}`}
            onClick={() => setFromHex(alpha && a < 1 ? toHex(parseHex(c), a) : c)}
            className={cx(
              'aspect-square rounded-[6px] ring-1 ring-inset ring-white/10 transition hover:scale-110',
              solid.toLowerCase() === c.toLowerCase() && 'ring-2 ring-white/80',
            )}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}

/** Colour control: a swatch with its hex value that opens a picker. */
export function ColorField({ label, value, onChange, alpha = false, presets = LIGHT }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  alpha?: boolean;
  presets?: string[];
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-label={`${label}: ${value}`}
        onClick={() => setOpen(!open)}
        className={cx(
          'group flex w-full items-center gap-2.5 p-1.5 pr-3 text-left outline-none',
          fieldShell,
          open ? 'border-accent/70 ring-[3px] ring-accent/[.14] hover:border-accent/70' : 'focus-visible:border-accent/70 focus-visible:ring-[3px] focus-visible:ring-accent/[.14]',
        )}
      >
        <span className="bg-checker relative h-7 w-7 shrink-0 overflow-hidden rounded-[7px]">
          <span className="absolute inset-0 rounded-[7px] ring-1 ring-inset ring-white/15" style={{ background: value }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11.5px] leading-4 text-zinc-500">{label}</span>
          <span className="block truncate font-mono text-[12px] uppercase leading-4 text-zinc-200">{value}</span>
        </span>
      </button>
      <Popover anchorRef={btn} open={open} onClose={() => setOpen(false)} width={252}>
        <Panel value={value} onChange={onChange} alpha={alpha} presets={presets} />
      </Popover>
    </>
  );
}
