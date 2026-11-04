import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cx } from '@/lib/util';

export interface GridOption<T extends string> { value: T; label: string; preview: ReactNode; title?: string }

const COLS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-3 @[420px]:grid-cols-4',
  5: 'grid-cols-3 @[420px]:grid-cols-5',
};

/** Visual single-choice picker: each option is a tile with a preview and a label. */
export function OptionGrid<T extends string>({ value, options, onChange, cols = 3, previewClass = 'h-[64px]', ariaLabel }: {
  value: T;
  options: GridOption<T>[];
  onChange: (v: T) => void;
  cols?: 2 | 3 | 4 | 5;
  previewClass?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="@container">
      <div role="radiogroup" aria-label={ariaLabel} className={cx('grid gap-2', COLS[cols])}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              title={o.title}
              onClick={() => onChange(o.value)}
              className={cx(
                'group relative flex flex-col overflow-hidden rounded-[11px] border text-left outline-none transition-[border-color,background-color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-accent/50',
                on ? 'border-accent/55 bg-accent/[.05] shadow-[0_0_0_1px_rgba(139,92,246,.25)]' : 'border-white/[.06] bg-field hover:border-white/[.13]',
              )}
            >
              <span className={cx('relative flex items-center justify-center overflow-hidden transition-colors', previewClass, on ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-300')}>
                {o.preview}
              </span>
              <span className={cx('flex items-center justify-between gap-1 border-t px-2.5 py-[7px] text-[12px] font-medium', on ? 'border-accent/20 text-white' : 'border-white/[.05] text-zinc-400 group-hover:text-zinc-200')}>
                <span className="truncate">{o.label}</span>
                <span className={cx('grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full transition', on ? 'bg-accent text-white' : 'opacity-0')}>
                  <Check size={9} strokeWidth={3.5} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
