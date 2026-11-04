import { cx } from '@/lib/util';

export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="9" fill="#fff" />
      <circle cx="16" cy="16" r="7.2" fill="none" stroke="#08080a" strokeWidth="3" />
      <circle cx="16" cy="16" r="2.4" fill="#8b5cf6" />
    </svg>
  );
}

export function Logo({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5 text-[16px] font-semibold tracking-[-0.02em] text-white', className)}>
      <LogoMark size={size} />
      halo
    </span>
  );
}
