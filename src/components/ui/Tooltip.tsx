import type { ReactNode } from 'react';
import { cx } from '@/lib/util';

/** CSS-only tooltip. The parent must be `relative` with the `group/tip` class. */
export function Tip({ label, side = 'top', align = 'center', className }: {
  label: ReactNode;
  side?: 'top' | 'right' | 'bottom';
  align?: 'center' | 'end';
  className?: string;
}) {
  const vertical = side === 'top' || side === 'bottom';
  return (
    <span
      role="tooltip"
      className={cx(
        'pointer-events-none absolute z-50 whitespace-nowrap rounded-[7px] border border-white/[.08] bg-[#18181d] px-2 py-1 text-[11.5px] font-medium text-zinc-200 opacity-0 shadow-lg transition duration-150 group-hover/tip:opacity-100 group-focus-visible/tip:opacity-100',
        side === 'top' && 'bottom-full mb-2',
        side === 'bottom' && 'top-full mt-2',
        vertical && align === 'center' && 'left-1/2 -translate-x-1/2',
        vertical && align === 'end' && 'right-0',
        side === 'right' && 'left-full top-1/2 ml-3 -translate-y-1/2',
        className,
      )}
    >
      {label}
    </span>
  );
}
