import { useId } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cx } from '@/lib/util';

export interface SegOption<T extends string> {
  value: T;
  label?: string;
  icon?: LucideIcon;
  title?: string;
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md', className, full = true }: {
  value: T;
  options: SegOption<T>[];
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  full?: boolean;
}) {
  const id = useId();
  return (
    <div role="radiogroup" className={cx('relative flex rounded-[10px] border border-white/[.06] bg-field p-[3px]', !full && 'inline-flex', className)}>
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label ? undefined : o.title}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative z-0 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent/50',
              full && 'flex-1',
              size === 'sm' ? 'h-7 px-2 text-[12px]' : 'h-8 px-2.5 text-[12.5px]',
              active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 -z-10 rounded-[7px] bg-white/[.09] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_1px_2px_rgba(0,0,0,.3)]"
                transition={{ type: 'spring', stiffness: 520, damping: 40 }}
              />
            )}
            {Icon && <Icon size={size === 'sm' ? 14 : 15} strokeWidth={1.9} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
