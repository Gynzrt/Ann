import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cx } from '@/lib/util';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'white';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,.16),0_1px_2px_rgba(0,0,0,.4)] hover:bg-accent-hover disabled:bg-white/[.07] disabled:text-zinc-500 disabled:opacity-100 disabled:shadow-none',
  secondary:
    'border border-white/[.08] bg-white/[.04] text-zinc-200 hover:border-white/[.13] hover:bg-white/[.07] hover:text-white',
  ghost: 'text-zinc-400 hover:bg-white/[.05] hover:text-zinc-100',
  danger: 'border border-red-500/20 bg-red-500/[.08] text-red-400 hover:border-red-500/30 hover:bg-red-500/[.14]',
  white: 'bg-white text-zinc-950 shadow-[0_1px_2px_rgba(0,0,0,.4)] hover:bg-zinc-200',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-[9px] px-3 text-[12.5px]',
  md: 'h-9 gap-2 rounded-[10px] px-3.5 text-[13px]',
  lg: 'h-11 gap-2 rounded-[11px] px-5 text-[14px]',
  icon: 'h-9 w-9 rounded-[10px]',
  'icon-sm': 'h-8 w-8 rounded-[9px]',
};

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cx(
    'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium outline-none transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150 active:scale-[.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={buttonClass(variant, size, className)} {...rest}>
      {loading && <Loader2 size={size === 'lg' ? 16 : 14} className="animate-spin" />}
      {children}
    </button>
  );
});

export function ButtonLink({ variant = 'primary', size = 'md', className, ...rest }: LinkProps & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={cx('hidden rounded-[5px] border border-white/15 bg-white/10 px-1 font-sans text-[10.5px] font-medium leading-4 text-white/70 lg:inline-block', className)}>
      {children}
    </kbd>
  );
}
