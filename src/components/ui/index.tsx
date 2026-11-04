import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from '@/lib/util';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
const btn: Record<BtnVariant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 shadow-[0_0_0_1px_rgba(255,255,255,.08)_inset]',
  secondary: 'bg-white/[.06] text-white hover:bg-white/[.1] border border-white/[.08]',
  ghost: 'text-white/70 hover:text-white hover:bg-white/[.06]',
  danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean; size?: 'sm' | 'md' }>(
  function Button({ variant = 'primary', loading, size = 'md', className, children, disabled, ...rest }, ref) {
    return (
      <button ref={ref} disabled={disabled || loading}
        className={cx('inline-flex items-center justify-center gap-2 rounded-lg font-medium transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50',
          size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm', btn[variant], className)}
        {...rest}>
        {loading && <Loader2 size={15} className="animate-spin" />}
        {children}
      </button>
    );
  },
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { prefix?: string }>(function Input({ className, prefix, ...rest }, ref) {
  const input = (
    <input ref={ref} {...rest}
      className={cx('h-10 w-full rounded-lg border border-white/[.08] bg-ink-850 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20',
        prefix && 'rounded-l-none border-l-0', className)} />
  );
  if (!prefix) return input;
  return (
    <div className="flex">
      <span className="flex h-10 items-center rounded-l-lg border border-white/[.08] bg-ink-800 px-3 text-sm text-white/40">{prefix}</span>
      {input}
    </div>
  );
});

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx('min-h-[88px] w-full resize-y rounded-lg border border-white/[.08] bg-ink-850 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20', props.className)} />;
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-white/80">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-white/40">{hint}</span>}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-xl border border-white/[.06] bg-ink-900', className)}>{children}</div>;
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
      <span>
        <span className="block text-[13px] font-medium text-white/85">{label}</span>
        {hint && <span className="block text-xs text-white/40">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cx('relative h-5 w-9 shrink-0 rounded-full transition', checked ? 'bg-brand-500' : 'bg-white/15')}>
        <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
      </button>
    </label>
  );
}

export function Slider({ label, value, min, max, step = 1, unit = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="py-1">
      <div className="mb-2 flex justify-between text-[13px]"><span className="font-medium text-white/85">{label}</span><span className="tabular-nums text-white/45">{value}{unit}</span></div>
      <input type="range" className="range w-full" min={min} max={max} step={step} value={value} aria-label={label}
        onChange={(e) => onChange(+e.target.value)} style={{ ['--p' as string]: `${pct}%` }} />
    </div>
  );
}

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-white/[.08] bg-ink-850 p-2">
      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-white/10" style={{ background: value }}>
        <input type="color" value={value.slice(0, 7)} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={label} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] text-white/50">{label}</span>
        <input value={value} onChange={(e) => /^#[0-9a-fA-F]{0,8}$/.test(e.target.value) && onChange(e.target.value)}
          className="w-full bg-transparent text-[13px] font-medium uppercase text-white outline-none" />
      </span>
    </label>
  );
}

export function Select<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}
        className="h-10 w-full rounded-lg border border-white/[.08] bg-ink-850 px-3 text-sm text-white outline-none focus:border-brand-500/60">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-white/[.06] bg-ink-850 p-1">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cx('flex-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12px] font-medium transition', value === o.value ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2 font-bold tracking-tight', className)}>
      <svg viewBox="0 0 32 32" width={26} height={26} aria-hidden>
        <circle cx="16" cy="16" r="9" fill="none" stroke="#8b5cf6" strokeWidth="3.2" />
        <circle cx="16" cy="16" r="3" fill="#fff" />
      </svg>
      halo
    </span>
  );
}
