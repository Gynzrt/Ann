import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Check, Layers, Link2, Music2, Palette, Sparkles } from 'lucide-react';
import { MarketingPage } from '@/components/layout/SiteNav';
import { backend, validateUsername } from '@/lib/backend';
import { DEFAULT_APPEARANCE } from '@/lib/types';
import type { LayoutId, Profile } from '@/lib/types';
import { LAYOUT_INFO } from '@/components/profile/Layouts';
import { ProfileView } from '@/components/profile/ProfileView';
import { ScaledFrame } from '@/components/dashboard/Preview';
import { buttonClass } from '@/components/ui';
import { cx, fmt } from '@/lib/util';

function demo(layout: LayoutId): Profile {
  const origin = typeof location !== 'undefined' ? location.origin : '';
  return {
    id: 'demo', username: 'nova', displayName: 'Nova Laurent', bio: 'Product designer & front-end developer.\nBuilding small, delightful things.',
    location: 'Lisbon', avatarUrl: `${origin}/demo/avatar.png`, badges: ['developer', 'creator', 'og'], views: 12842, uid: 7, premium: false, createdAt: '',
    appearance: {
      ...DEFAULT_APPEARANCE, layout, enterScreen: false, tilt: false, entrance: 'fade', profileOpacity: 55, bannerUrl: `${origin}/demo/banner.jpg`,
      backgroundEffect: 'fluid', fxIntensity: 75,
    },
    links: ['discord-user', 'x', 'github', 'spotify', 'instagram'].map((p, i) => ({ id: String(i), platform: p, url: 'https://example.com', position: i })),
  };
}

const FEATURES = [
  { icon: Layers, title: 'Five real layouts', text: 'Default, Modern, Simplistic, Sleek and Portfolio. Each one arranges your page differently.' },
  { icon: Palette, title: 'Every colour, every font', text: 'Accent, text, icon and border colours, six typefaces, card blur, opacity and radius.' },
  { icon: Sparkles, title: 'Effects that feel alive', text: 'A live fluid simulation visitors can stir, aurora and warp-speed shaders, plus snow, rain and stars.' },
  { icon: Music2, title: 'Bring your sound', text: 'Upload a playlist with covers. It starts the moment a visitor steps in.' },
  { icon: Link2, title: 'All your links', text: 'More than thirty platforms, copy-to-clipboard handles and drag-to-reorder.' },
  { icon: BarChart3, title: 'Know who stops by', text: 'Unique daily views, a 30-day chart and a public leaderboard.' },
];

export function Home() {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [layout, setLayout] = useState<LayoutId>('default');
  const [auto, setAuto] = useState(true);
  const [stats, setStats] = useState<{ users: number; views: number } | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    backend.leaderboard(1000).then((l) => setStats({ users: l.length, views: l.reduce((a, b) => a + b.views, 0) })).catch(() => {});
  }, []);
  useEffect(() => {
    if (!auto) return;
    const ids = LAYOUT_INFO.map((l) => l.id);
    const t = setInterval(() => setLayout((c) => ids[(ids.indexOf(c) + 1) % ids.length]), 3800);
    return () => clearInterval(t);
  }, [auto]);

  const claim = (e: React.FormEvent) => {
    e.preventDefault();
    const u = name.trim().toLowerCase();
    const v = validateUsername(u);
    if (v) return setErr(v);
    nav(`/register?username=${encodeURIComponent(u)}`);
  };

  return (
    <MarketingPage>
      <section className="px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:pb-32">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-10">
          <div className="min-w-0 text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Link to="/templates" className="inline-flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.03] py-1 pl-1.5 pr-3 text-[12.5px] text-zinc-400 transition hover:border-white/[.14] hover:text-zinc-200">
                <span className="rounded-full bg-white/[.08] px-2 py-0.5 text-[11px] font-semibold text-zinc-200">New</span>
                New: WebGL fluid backgrounds
                <ArrowRight size={13} />
              </Link>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-6 text-[34px] font-semibold leading-[1.04] tracking-[-0.04em] text-white min-[400px]:text-[38px] sm:text-[60px] lg:text-[68px]"
            >
              Everything you are.
              <br />
              <span className="text-zinc-500">In one link.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mx-auto mt-6 max-w-[460px] text-[16.5px] leading-relaxed text-zinc-400 lg:mx-0"
            >
              A profile page with music, effects and all your socials. Claim your name and make it yours in a minute.
            </motion.p>
            <motion.form
              onSubmit={claim}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className={cx(
                'mx-auto mt-9 flex h-[52px] max-w-[460px] items-center rounded-[14px] border bg-field p-1.5 transition-[border-color,box-shadow] lg:mx-0',
                err ? 'border-red-500/50' : 'border-white/[.09] focus-within:border-accent/60 focus-within:ring-[3px] focus-within:ring-accent/[.12]',
              )}
            >
              <span className="hidden pl-3 text-[15px] text-zinc-500 sm:inline">{location.host}/</span>
              <span className="pl-3 text-[15px] text-zinc-500 sm:hidden">/</span>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value.toLowerCase()); setErr(''); }}
                placeholder="yourname"
                aria-label="Username"
                maxLength={20}
                size={1}
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent px-0.5 text-[15px] text-white outline-none placeholder:text-zinc-600"
              />
              <button type="submit" className={buttonClass('primary', 'md', 'h-full rounded-[10px] px-4')}>
                Claim <ArrowRight size={15} />
              </button>
            </motion.form>
            <p className={cx('mt-3 h-5 text-[13px]', err ? 'text-red-400' : 'text-transparent')} role="alert">{err || '.'}</p>
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-zinc-500 lg:justify-start"
            >
              {['Free forever', 'No ads on your page', stats && stats.users > 0 ? `${fmt(stats.users)} ${stats.users === 1 ? 'page' : 'pages'} · ${fmt(stats.views)} ${stats.views === 1 ? 'view' : 'views'}${backend.mode === 'local' ? ' on this device' : ''}` : 'Live in a minute'].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check size={14} className="text-zinc-400" />{t}</li>
              ))}
            </motion.ul>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="mx-auto w-full max-w-[480px]">
            <div className="relative h-[560px] sm:h-[620px]" aria-hidden {...({ inert: "" } as object)}>
              <ScaledFrame width={410} height={864} padding={0}>
                <div className="relative h-[864px] w-[410px] rounded-[50px] bg-[#1a1a1f] p-[10px] shadow-[0_50px_120px_-30px_rgba(0,0,0,.9),inset_0_0_0_1px_rgba(255,255,255,.08)]">
                  <div className="pointer-events-none relative h-full w-full overflow-hidden rounded-[40px] bg-black">
                    <ProfileView p={demo(layout)} preview />
                    <div className="absolute left-1/2 top-[11px] z-[80] h-[28px] w-[104px] -translate-x-1/2 rounded-full bg-black" />
                  </div>
                </div>
              </ScaledFrame>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-1.5" role="radiogroup" aria-label="Preview layout">
              {LAYOUT_INFO.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={layout === l.id}
                  onClick={() => { setAuto(false); setLayout(l.id); }}
                  className={cx(
                    'rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors',
                    layout === l.id ? 'border-white/[.16] bg-white/[.08] text-white' : 'border-white/[.06] text-zinc-500 hover:border-white/[.12] hover:text-zinc-200',
                  )}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-white/[.05] px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-xl">
            <p className="text-[12.5px] font-medium uppercase tracking-[0.12em] text-zinc-500">Features</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[38px]">Built for the details people notice.</h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[18px] border border-white/[.06] bg-white/[.06] sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
                className="group bg-card p-7 transition-colors hover:bg-[#121216]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/[.08] bg-white/[.03] text-zinc-300 transition-colors group-hover:text-white">
                  <f.icon size={17} strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 text-[15px] font-semibold text-zinc-100">{f.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-500">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-[12.5px] font-medium uppercase tracking-[0.12em] text-zinc-500">Layouts</p>
              <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[38px]">Five ways to arrange you.</h2>
            </div>
            <Link to="/templates" className={buttonClass('secondary', 'md')}>Browse templates <ArrowRight size={14} /></Link>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LAYOUT_INFO.map((l) => (
              <div key={l.id} className="group overflow-hidden rounded-[14px] border border-white/[.06] bg-card transition-colors hover:border-white/[.12]">
                <div className="pointer-events-none overflow-hidden border-b border-white/[.06]" aria-hidden {...({ inert: "" } as object)}>
                  <div className="transition-transform duration-500 group-hover:scale-[1.04]">
                    <ScaledFrame width={1200} height={900} fitWidth>
                      <ProfileView p={demo(l.id)} preview still />
                    </ScaledFrame>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[13.5px] font-semibold text-zinc-100">{l.name}</div>
                  <div className="mt-0.5 text-[12.5px] leading-relaxed text-zinc-500">{l.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-28 sm:px-6">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[22px] border border-white/[.07] bg-card px-6 py-16 text-center">
          <div className="bg-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(60%_80%_at_50%_0%,#000,transparent)]" aria-hidden />
          <div className="relative">
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[36px]">Make the link in your bio worth clicking.</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-zinc-400">Free forever. No card, no ads, no catch.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Link to="/register" className={buttonClass('white', 'lg')}>Create your page <ArrowRight size={15} /></Link>
              <Link to="/pricing" className={buttonClass('secondary', 'lg')}>See pricing</Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
