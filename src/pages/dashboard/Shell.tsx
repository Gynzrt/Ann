import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import {
  Check, ChevronsUpDown, Copy, ExternalLink, LayoutDashboard, LayoutTemplate, Link2, LogOut, Menu, Palette,
  PanelLeftClose, PanelLeftOpen, Settings, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { Logo, LogoMark, MenuItem, Popover, Tip, useToast } from '@/components/ui';
import { Avatar } from '@/components/profile/Bits';
import { cx } from '@/lib/util';
import { DraftProvider, useDraft } from './draft';

interface Item { to: string; label: string; icon: LucideIcon; end?: boolean; dirty?: 'profile' | 'links' }
const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: 'Dashboard',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/dashboard/customize', label: 'Customize', icon: Palette, dirty: 'profile' },
      { to: '/dashboard/links', label: 'Links', icon: Link2, dirty: 'links' },
      { to: '/dashboard/templates', label: 'Templates', icon: LayoutTemplate },
    ],
  },
  { label: 'Account', items: [{ to: '/dashboard/settings', label: 'Settings', icon: Settings }] },
];

function readCollapsed() {
  try {
    const v = localStorage.getItem('halo.sidebar');
    if (v) return v === 'collapsed';
  } catch { /* ignore */ }
  return typeof innerWidth !== "undefined" && innerWidth < 1400;
}

function NavItem({ item, collapsed, onNav }: { item: Item; collapsed: boolean; onNav?: () => void }) {
  const { dirtyProfile, dirtyLinks } = useDraft();
  const dirty = (item.dirty === 'profile' && dirtyProfile) || (item.dirty === 'links' && dirtyLinks);
  const Icon = item.icon;
  return (
    <li className="group/tip relative">
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNav}
        className={({ isActive }) =>
          cx(
            'group relative flex h-9 items-center gap-3 rounded-[9px] text-[13px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent/50',
            collapsed ? 'justify-center px-0' : 'px-2.5',
            isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-100',
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive ? (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-[9px] bg-white/[.065] shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)]"
                transition={{ type: 'spring', stiffness: 520, damping: 42 }}
              />
            ) : (
              <span className="absolute inset-0 rounded-[9px] bg-white/[.035] opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
            )}
            <Icon
              size={17}
              strokeWidth={1.85}
              className={cx('relative shrink-0 transition-[color,transform] duration-150 group-hover:scale-[1.06]', isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300')}
            />
            {!collapsed && <span className="relative truncate">{item.label}</span>}
            {dirty && (
              <span
                title="Unsaved changes"
                className={cx('h-1.5 w-1.5 rounded-full bg-amber-400', collapsed ? 'absolute right-2 top-2' : 'relative ml-auto')}
              />
            )}
          </>
        )}
      </NavLink>
      {collapsed && <Tip label={item.label} side="right" />}
    </li>
  );
}

function ShareCard({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${location.origin}/${username}`;
  return (
    <div className="rounded-[12px] border border-white/[.06] bg-white/[.02] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-zinc-300">Your page</span>
        {backend.mode === 'local' ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-300/80"><span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" />This device</span>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Live</span>
        )}
      </div>
      <div className="mt-2 flex h-8 items-center gap-1 rounded-[8px] border border-white/[.06] bg-field pl-2.5 pr-1">
        <span className="min-w-0 flex-1 truncate text-[12px] text-zinc-500">
          {location.host}/<span className="text-zinc-200">{username}</span>
        </span>
        <button
          type="button"
          aria-label="Copy link"
          onClick={() => navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); })}
          className="grid h-6 w-6 place-items-center rounded-[6px] text-zinc-500 transition hover:bg-white/[.07] hover:text-zinc-100"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        </button>
        <a href={`/${username}`} target="_blank" rel="noreferrer" aria-label="Open page" className="grid h-6 w-6 place-items-center rounded-[6px] text-zinc-500 transition hover:bg-white/[.07] hover:text-zinc-100">
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}

function AccountMenu({ collapsed }: { collapsed: boolean }) {
  const { profile, account } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  if (!profile) return null;
  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Account menu"
        className={cx(
          'flex w-full items-center gap-2.5 rounded-[10px] p-1.5 text-left outline-none transition-colors hover:bg-white/[.04] focus-visible:ring-2 focus-visible:ring-accent/50',
          open && 'bg-white/[.04]',
          collapsed && 'justify-center',
        )}
      >
        <Avatar src={profile.avatarUrl} name={profile.displayName || profile.username} size={32} ap={{ ...profile.appearance, borderWidth: 0 }} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium leading-5 text-zinc-100">{profile.displayName || profile.username}</span>
              <span className="block truncate text-[11.5px] leading-4 text-zinc-500">@{profile.username}</span>
            </span>
            <ChevronsUpDown size={14} className="shrink-0 text-zinc-500" />
          </>
        )}
      </button>
      <Popover anchorRef={btn} open={open} onClose={() => setOpen(false)} width={236}>
        <div className="border-b border-white/[.06] px-3 py-2.5">
          <p className="truncate text-[13px] font-medium text-zinc-100">{profile.displayName || profile.username}</p>
          <p className="truncate text-[12px] text-zinc-500">{account?.email}</p>
        </div>
        <div className="p-1">
          <MenuItem icon={ExternalLink} href={`/${profile.username}`} external onClick={() => setOpen(false)}>View my page</MenuItem>
          <MenuItem
            icon={Copy}
            onClick={() => {
              navigator.clipboard?.writeText(`${location.origin}/${profile.username}`);
              toast({ title: 'Link copied', description: `${location.host}/${profile.username}` });
              setOpen(false);
            }}
          >
            Copy link
          </MenuItem>
          <Link to="/dashboard/settings" onClick={() => setOpen(false)} className="flex h-9 items-center gap-2.5 rounded-[8px] px-2.5 text-[13px] text-zinc-300 transition-colors hover:bg-white/[.06] hover:text-white">
            <Settings size={15} className="text-zinc-500" /> Settings
          </Link>
        </div>
        <div className="border-t border-white/[.06] p-1">
          <MenuItem icon={LogOut} danger onClick={() => backend.signOut()}>Log out</MenuItem>
        </div>
      </Popover>
    </>
  );
}

function Sidebar({ collapsed, onToggle, onNav, mobile }: { collapsed: boolean; onToggle?: () => void; onNav?: () => void; mobile?: boolean }) {
  const { profile } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className={cx('flex h-16 shrink-0 items-center', collapsed ? 'justify-center' : 'px-5')}>
        <Link to="/" aria-label="halo home" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
          {collapsed ? <LogoMark size={26} /> : <Logo />}
        </Link>
      </div>

      <LayoutGroup id={mobile ? 'mobile-nav' : 'desktop-nav'}>
        <nav className="flex-1 space-y-6 overflow-y-auto overflow-x-visible px-3 pt-2" aria-label="Dashboard">
          {GROUPS.map((g) => (
            <div key={g.label}>
              {collapsed ? (
                <div className="mx-auto mb-2 h-px w-6 bg-white/[.07]" />
              ) : (
                <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-600">{g.label}</p>
              )}
              <ul className="space-y-0.5">
                {g.items.map((it) => <NavItem key={it.to} item={it} collapsed={collapsed} onNav={onNav} />)}
              </ul>
            </div>
          ))}
        </nav>
      </LayoutGroup>

      <div className="space-y-2 p-3">
        {!collapsed && profile && <ShareCard username={profile.username} />}
        {onToggle && (
          <div className="group/tip relative">
            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cx(
                'flex h-8 w-full items-center gap-2.5 rounded-[9px] text-[12.5px] font-medium text-zinc-500 outline-none transition-colors hover:bg-white/[.035] hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-accent/50',
                collapsed ? 'justify-center' : 'px-2.5',
              )}
            >
              {collapsed ? <PanelLeftOpen size={16} strokeWidth={1.85} /> : <PanelLeftClose size={16} strokeWidth={1.85} />}
              {!collapsed && 'Collapse'}
            </button>
            {collapsed && <Tip label="Expand sidebar" side="right" />}
          </div>
        )}
        <div className="border-t border-white/[.06] pt-2">
          <AccountMenu collapsed={collapsed} />
        </div>
      </div>
    </div>
  );
}

function ShellInner() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const toggle = () => {
    setCollapsed((c) => {
      try { localStorage.setItem('halo.sidebar', c ? 'expanded' : 'collapsed'); } catch { /* ignore */ }
      return !c;
    });
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-bg lg:flex-row">
      <aside
        className={cx(
          'hidden shrink-0 border-r border-white/[.06] bg-panel transition-[width] duration-200 ease-[cubic-bezier(.2,.8,.2,1)] lg:block',
          collapsed ? 'w-[68px]' : 'w-[248px]',
        )}
      >
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </aside>

      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[.06] bg-panel px-3 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-[10px] text-zinc-300 transition hover:bg-white/[.05]" aria-label="Open menu">
          <Menu size={19} />
        </button>
        <Link to="/" aria-label="halo home"><Logo /></Link>
        <span className="w-9" />
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[272px] border-r border-white/[.06] bg-panel lg:hidden"
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            >
              <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3.5 grid h-9 w-9 place-items-center rounded-[10px] text-zinc-400 transition hover:bg-white/[.05] hover:text-white" aria-label="Close menu">
                <X size={18} />
              </button>
              <Sidebar collapsed={false} onNav={() => setOpen(false)} mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto">
        <motion.div key={loc.pathname} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }} className="h-full">
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}

export default function Shell() {
  const { profile } = useAuth();
  if (!profile) return null;
  return (
    <DraftProvider>
      <ShellInner />
    </DraftProvider>
  );
}
