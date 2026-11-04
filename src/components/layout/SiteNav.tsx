import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Logo } from '@/components/ui';
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
    <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4">
      <nav className={cx('mx-auto flex h-14 max-w-5xl items-center justify-between rounded-2xl border px-3 pl-4 transition-colors duration-300',
        scrolled ? 'border-white/[.08] bg-ink-900/80 backdrop-blur-xl' : 'border-transparent bg-transparent')}>
        <Link to="/" className="text-[17px]" aria-label="halo home"><Logo /></Link>
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => cx('rounded-lg px-3 py-2 text-sm font-medium transition', isActive ? 'text-white' : 'text-white/60 hover:text-white')}>
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {account ? (
            <Link to="/dashboard" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium transition hover:bg-brand-600">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition hover:text-white">Login</Link>
              <Link to="/register" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium transition hover:bg-brand-600">Sign up free</Link>
            </>
          )}
        </div>
        <button className="rounded-lg p-2 text-white/80 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="mx-auto mt-2 max-w-5xl rounded-2xl border border-white/[.08] bg-ink-900/95 p-2 backdrop-blur-xl md:hidden">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-[15px] font-medium text-white/80 hover:bg-white/5">{l.label}</Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[.06] pt-3">
              {account ? (
                <Link to="/dashboard" className="col-span-2 rounded-lg bg-brand-500 py-2.5 text-center text-sm font-medium">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="rounded-lg bg-white/[.06] py-2.5 text-center text-sm font-medium">Login</Link>
                  <Link to="/register" className="rounded-lg bg-brand-500 py-2.5 text-center text-sm font-medium">Sign up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[.06] px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:justify-between">
        <div>
          <Logo className="text-[17px]" />
          <p className="mt-3 max-w-xs text-sm text-white/45">One link for everything you are. Free to start, yours to style.</p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm">
          <div className="flex flex-col gap-2.5">
            <span className="font-medium text-white/80">Product</span>
            <Link to="/pricing" className="text-white/45 hover:text-white">Pricing</Link>
            <Link to="/templates" className="text-white/45 hover:text-white">Templates</Link>
            <Link to="/leaderboard" className="text-white/45 hover:text-white">Leaderboard</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="font-medium text-white/80">Account</span>
            <Link to="/login" className="text-white/45 hover:text-white">Login</Link>
            <Link to="/register" className="text-white/45 hover:text-white">Sign up</Link>
            <Link to="/dashboard" className="text-white/45 hover:text-white">Dashboard</Link>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-5xl text-xs text-white/30">© {new Date().getFullYear()} halo</p>
    </footer>
  );
}

export function MarketingPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink-950">
      <div className="pointer-events-none absolute left-1/2 top-[-280px] h-[640px] w-[1000px] max-w-[200vw] -translate-x-1/2 rounded-full bg-brand-500/[.17] blur-[150px]" aria-hidden />
      <SiteNav />
      <main className="relative pt-24">{children}</main>
      <SiteFooter />
    </div>
  );
}
