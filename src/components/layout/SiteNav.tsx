import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Logo, buttonClass } from '@/components/ui';
import { cx } from '@/lib/util';

const LINKS = [
  { to: '/pricing', label: 'Pricing' },
  { to: '/templates', label: 'Templates' },
  { to: '/leaderboard', label: 'Leaderboard' },
];

export function SiteNav() {
  const { account } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(scrollY > 8);
    f();
    addEventListener('scroll', f, { passive: true });
    return () => removeEventListener('scroll', f);
  }, []);

  return (
    <header className={cx('fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color] duration-300', scrolled || open ? 'border-white/[.06] bg-bg/80 backdrop-blur-xl' : 'border-transparent')}>
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="ayas.kys home" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/50"><Logo /></Link>
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => cx('rounded-[9px] px-3 py-2 text-[13.5px] font-medium transition-colors', isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-100')}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {account ? (
            <Link to="/dashboard" className={buttonClass('white', 'sm')}>Dashboard <ArrowRight size={14} /></Link>
          ) : (
            <>
              <Link to="/login" className={buttonClass('ghost', 'sm')}>Log in</Link>
              <Link to="/register" className={buttonClass('white', 'sm')}>Sign up</Link>
            </>
          )}
        </div>
        <button type="button" className="grid h-9 w-9 place-items-center rounded-[10px] text-zinc-300 transition hover:bg-white/[.05] md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden border-t border-white/[.06] md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {LINKS.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-[10px] px-3 py-3 text-[15px] font-medium text-zinc-300 transition hover:bg-white/[.04] hover:text-white">
                  {l.label}
                </Link>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {account ? (
                  <Link to="/dashboard" className={buttonClass('white', 'lg', 'col-span-2')}>Dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" className={buttonClass('secondary', 'lg')}>Log in</Link>
                    <Link to="/register" className={buttonClass('white', 'lg')}>Sign up</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[.06]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-12 sm:flex-row sm:justify-between sm:px-6">
        <div>
          <Logo />
          <p className="mt-3 max-w-[260px] text-[13px] leading-relaxed text-zinc-500">One link for everything you are. Free to start, yours to style.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-16 gap-y-2 text-[13px]">
          <div className="flex flex-col gap-2.5">
            <span className="mb-1 text-[12px] font-medium uppercase tracking-[0.08em] text-zinc-600">Product</span>
            <Link to="/pricing" className="text-zinc-400 transition hover:text-white">Pricing</Link>
            <Link to="/templates" className="text-zinc-400 transition hover:text-white">Templates</Link>
            <Link to="/leaderboard" className="text-zinc-400 transition hover:text-white">Leaderboard</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="mb-1 text-[12px] font-medium uppercase tracking-[0.08em] text-zinc-600">Account</span>
            <Link to="/login" className="text-zinc-400 transition hover:text-white">Log in</Link>
            <Link to="/register" className="text-zinc-400 transition hover:text-white">Sign up</Link>
            <Link to="/dashboard" className="text-zinc-400 transition hover:text-white">Dashboard</Link>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-4 pb-10 text-[12px] text-zinc-600 sm:px-6">© {new Date().getFullYear()} ayas.kys</div>
    </footer>
  );
}

/** Shell for public marketing pages: nav, a faint top light, content and footer. */
export function MarketingPage({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
        style={{ background: 'radial-gradient(60% 100% at 50% 0%, rgba(139,92,246,.10), rgba(255,255,255,.02) 45%, transparent 75%)' }}
        aria-hidden
      />
      <SiteNav />
      <main className="relative pt-16">{children}</main>
      <SiteFooter />
    </div>
  );
}

/** Centered page title used by marketing pages. */
export function PageIntro({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-16 text-center sm:pt-24">
      {eyebrow && <p className="mb-4 text-[12.5px] font-medium uppercase tracking-[0.12em] text-zinc-500">{eyebrow}</p>}
      <h1 className="text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:text-[48px]">{title}</h1>
      {children && <p className="mx-auto mt-4 max-w-lg text-[15.5px] leading-relaxed text-zinc-400">{children}</p>}
    </div>
  );
}
