import { cx } from '@/lib/util';

export function Slider({ label, value, min, max, step = 1, unit = '', onChange, disabled, format }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
  format?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cx('space-y-2', disabled && 'pointer-events-none opacity-40')}>
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-zinc-300">{label}</span>
        <span className="min-w-[44px] rounded-[6px] border border-white/[.06] bg-white/[.03] px-1.5 py-px text-center font-mono text-[11px] tabular-nums text-zinc-400">
          {format ? format(value) : `${value}${unit}`}
        </span>
      </div>
      <input
        type="range"
        className="range block w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(+e.target.value)}
        style={{ ['--p' as string]: `${pct}%` }}
      />
    </div>
  );
}
