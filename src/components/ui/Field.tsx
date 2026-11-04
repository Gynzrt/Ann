import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '@/lib/util';

/** Shared look for every text-like control. */
export const fieldShell =
  'rounded-[10px] border border-white/[.07] bg-field transition-[border-color,box-shadow,background-color] duration-150 hover:border-white/[.12]';
export const fieldFocus = 'focus-within:border-accent/70 focus-within:ring-[3px] focus-within:ring-accent/[.14] focus-within:hover:border-accent/70';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
  icon?: LucideIcon;
  prefix?: ReactNode;
  suffix?: ReactNode;
  invalid?: boolean;
  inputSize?: 'md' | 'lg';
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon: Icon, prefix, suffix, invalid, inputSize = 'md', className, wrapperClassName, ...rest },
  ref,
) {
  return (
    <div
      className={cx(
        'group/input flex w-full items-center',
        inputSize === 'lg' ? 'h-11' : 'h-10',
        fieldShell,
        invalid ? 'border-red-500/45 focus-within:border-red-500/70 focus-within:ring-[3px] focus-within:ring-red-500/15' : fieldFocus,
        rest.disabled && 'opacity-50',
        wrapperClassName,
      )}
    >
      {Icon && <Icon size={15} strokeWidth={1.9} className="ml-3 shrink-0 text-zinc-500 transition-colors group-focus-within/input:text-zinc-300" />}
      {prefix && <span className="ml-3 shrink-0 select-none whitespace-nowrap text-[13.5px] text-zinc-500">{prefix}</span>}
      <input
        ref={ref}
        className={cx(
          'h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-zinc-100 outline-none placeholder:text-zinc-600',
          prefix ? 'pl-0 pr-3' : Icon ? 'pl-2.5 pr-3' : 'px-3',
          className,
        )}
        {...rest}
      />
      {suffix && <span className="mr-2 flex shrink-0 items-center gap-1">{suffix}</span>}
    </div>
  );
});

export function Textarea({ className, showCount, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { showCount?: boolean }) {
  const len = typeof rest.value === 'string' ? rest.value.length : 0;
  return (
    <div className={cx('relative', fieldShell, fieldFocus)}>
      <textarea
        className={cx(
          'block min-h-[92px] w-full resize-none bg-transparent px-3 py-2.5 text-[13.5px] leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-600',
          showCount && 'pb-7',
          className,
        )}
        {...rest}
      />
      {showCount && rest.maxLength && (
        <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] tabular-nums text-zinc-600">
          {len}/{rest.maxLength}
        </span>
      )}
    </div>
  );
}

/** A label, a control and optional help text. Clicking the label focuses the control. */
export function Field({ label, hint, aside, error, children, className }: {
  label: ReactNode;
  hint?: ReactNode;
  aside?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-medium text-zinc-300">{label}</span>
        {aside && <span className="text-[11.5px] tabular-nums text-zinc-500">{aside}</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-2 block text-[12px] text-red-400">{error}</span>
      ) : (
        hint && <span className="mt-2 block text-[12px] leading-relaxed text-zinc-500">{hint}</span>
      )}
    </label>
  );
}

/** A label for custom controls (segmented, tiles) that must not act as an HTML <label>. */
export function FieldLabel({ children, aside, className }: { children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cx('mb-2 flex items-baseline justify-between gap-3', className)}>
      <span className="text-[12.5px] font-medium text-zinc-300">{children}</span>
      {aside && <span className="text-[11.5px] tabular-nums text-zinc-500">{aside}</span>}
    </div>
  );
}
