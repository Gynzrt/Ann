import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, ExternalLink, Link2, LogOut, Menu, Palette, Settings, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { Logo } from '@/components/ui';
import { Avatar } from '@/components/profile/Bits';
import { cx } from '@/lib/util';

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: BarChart3, end: true },
  { to: '/dashboard/customize', label: 'Customize', icon: Palette },
  { to: '/dashboard/links', label: 'Links', icon: Link2 },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function Sidebar({ onNav }: { onNav?: () => void }) {
  const { profile } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="px-2 text-[17px]"><Logo /></Link>
      <nav className="mt-8 flex flex-col gap-0.5">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={onNav}
            className={({ isActive }) => cx('relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition', isActive ? 'bg-white/[.07] text-white' : 'text-white/55 hover:bg-white/[.04] hover:text-white')}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-pill" className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-brand-500" />}
                <n.icon size={17} /> {n.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-2">
        {profile && (
          <a href={`/${profile.username}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-lg border border-white/[.08] py-2 text-sm font-medium text-white/80 transition hover:bg-white/[.04]">
            <ExternalLink size={14} /> View my page
          </a>
        )}
        <div className="flex items-center gap-3 rounded-lg bg-white/[.03] p-2.5">
          {profile && <Avatar src={profile.avatarUrl} size={34} ap={{ ...profile.appearance, borderWidth: 0 }} />}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{profile?.displayName}</div>
            <div className="truncate text-xs text-white/40">UID {profile?.uid}</div>
          </div>
          <button onClick={() => backend.signOut()} className="rounded-md p-1.5 text-white/40 transition hover:bg-white/5 hover:text-white" aria-label="Log out" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Shell() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-ink-950">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-white/[.06] bg-ink-900 p-4 lg:block"><Sidebar /></aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[.06] bg-ink-900/90 px-4 backdrop-blur lg:hidden">
        <Link to="/" className="text-[16px]"><Logo /></Link>
        <button onClick={() => setOpen(true)} className="rounded-lg p-2" aria-label="Open menu"><Menu size={20} /></button>
      </header>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-white/[.06] bg-ink-900 p-4 lg:hidden"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}>
              <button onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 text-white/60" aria-label="Close menu"><X size={18} /></button>
              <Sidebar onNav={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <main className="lg:pl-60">
        <motion.div key={loc.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
