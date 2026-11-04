import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cx } from '@/lib/util';

export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-5 w-[34px] shrink-0 items-center rounded-full p-0.5 outline-none transition-colors duration-200 disabled:opacity-40',
        'focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        checked ? 'bg-accent' : 'bg-white/[.1] hover:bg-white/[.15]',
      )}
    >
      <motion.span
        initial={false}
        animate={{ x: checked ? 14 : 0 }}
        transition={{ type: 'spring', stiffness: 700, damping: 40 }}
        className="block h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.45)]"
      />
    </button>
  );
}

/** A setting with a title, an optional description and a control on the right. */
export function SettingRow({ title, description, children, className }: { title: ReactNode; description?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex items-center justify-between gap-6 py-3 first:pt-0 last:pb-0', className)}>
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-zinc-200">{title}</div>
        {description && <div className="mt-0.5 text-[12px] leading-relaxed text-zinc-500">{description}</div>}
      </div>
      {children}
    </div>
  );
}

export function SwitchRow({ title, description, checked, onChange, disabled }: {
  title: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={cx('group flex cursor-pointer items-center justify-between gap-6 py-3 first:pt-0 last:pb-0', disabled && 'cursor-default opacity-50')}>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-zinc-200 transition-colors group-hover:text-white">{title}</span>
        {description && <span className="mt-0.5 block text-[12px] leading-relaxed text-zinc-500">{description}</span>}
      </span>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </label>
  );
}

/** Groups setting rows with hairline dividers. */
export function Rows({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('divide-y divide-white/[.05]', className)}>{children}</div>;
}
