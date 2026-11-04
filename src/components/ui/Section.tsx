import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '@/lib/util';

/** A titled group of settings. Every editor screen is built from these. */
export function Section({ title, description, action, children, className, bodyClassName }: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx('rounded-[14px] border border-white/[.06] bg-card shadow-[inset_0_1px_0_rgba(255,255,255,.025)]', className)}>
      <header className="flex items-start justify-between gap-4 px-5 pt-[18px]">
        <div className="min-w-0">
          <h3 className="text-[13.5px] font-semibold tracking-[-0.01em] text-zinc-100">{title}</h3>
          {description && <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-500">{description}</p>}
        </div>
        {action && <div className="-mt-1 shrink-0">{action}</div>}
      </header>
      <div className={cx('space-y-5 px-5 pb-5 pt-4', bodyClassName)}>{children}</div>
    </section>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-[14px] border border-white/[.06] bg-card shadow-[inset_0_1px_0_rgba(255,255,255,.025)]', className)}>{children}</div>;
}

/** Dashboard page title bar. */
export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex min-h-[64px] shrink-0 items-center justify-between gap-4 border-b border-white/[.06] px-4 py-3 sm:px-6 lg:px-7">
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-zinc-50">{title}</h1>
        {description && <p className="mt-0.5 hidden truncate text-[12.5px] text-zinc-500 sm:block">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, children }: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-[12px] border border-white/[.07] bg-white/[.03]">
        <Icon size={19} strokeWidth={1.8} className="text-zinc-400" />
      </div>
      <p className="mt-4 text-[13.5px] font-medium text-zinc-200">{title}</p>
      {description && <p className="mt-1 max-w-[280px] text-[12.5px] leading-relaxed text-zinc-500">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
