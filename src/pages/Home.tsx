import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Music2, Palette, Sparkles, Wand2, Link2, ArrowRight } from 'lucide-react';
import { MarketingPage } from '@/components/layout/SiteNav';
import { backend, validateUsername } from '@/lib/backend';
import { DEFAULT_APPEARANCE } from '@/lib/types';
import type { Profile } from '@/lib/types';
import { DefaultLayout } from '@/components/profile/Layouts';
import { fmt } from '@/lib/util';

const DEMO: Profile = {
  id: 'demo', username: 'nova', displayName: 'nova', bio: 'designer · night owl · building cute things on the internet',
  location: 'Lisbon', avatarUrl: '', badges: ['developer', 'creator', 'og'], views: 12842, uid: 7, premium: false, createdAt: '',
  appearance: { ...DEFAULT_APPEARANCE, enterScreen: false, usernameEffect: 'glow', profileOpacity: 55 },
  links: ['discord-user', 'x', 'github', 'spotify', 'instagram'].map((p, i) => ({ id: String(i), platform: p, url: 'https://example.com', position: i })),
};

const FEATURES = [
  { icon: Palette, title: 'Make it yours', text: 'Colours, fonts, blur, glow, borders and five distinct layouts.' },
  { icon: Sparkles, title: 'Effects that feel alive', text: 'Animated usernames, typewriter bios, particles, snow, rain and custom cursors.' },
  { icon: Music2, title: 'Bring your sound', text: 'Upload a playlist that starts as soon as visitors step in.' },
  { icon: Link2, title: 'Every link, one place', text: 'Over thirty platforms, copy-to-clipboard handles and drag to reorder.' },
  { icon: BarChart3, title: 'See who stops by', text: 'Unique daily views with a 14-day chart and a public leaderboard.' },
  { icon: Wand2, title: 'Live preview', text: 'Every change shows up instantly while you edit.' },
];

export function Home() {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [stats, setStats] = useState<{ users: number; views: number } | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    backend.leaderboard(1000).then((l) => setStats({ users: l.length, views: l.reduce((a, b) => a + b.views, 0) })).catch(() => {});
  }, []);

  const claim = (e: React.FormEvent) => {
    e.preventDefault();
    const u = name.trim().toLowerCase();
    const v = validateUsername(u);
    if (v) return setErr(v);
    nav(`/register?username=${encodeURIComponent(u)}`);
  };

  return (
    <MarketingPage>
      <section className="relative px-4 pb-24 pt-16 sm:pt-24">
        <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div className="min-w-0 text-center lg:text-left">
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="text-[40px] font-extrabold leading-[1.05] tracking-tight sm:text-[56px]">
              One link.<br /><span className="bg-gradient-to-r from-brand-400 to-fuchsia-400 bg-clip-text text-transparent">Endless style.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
              className="mx-auto mt-5 max-w-md text-[17px] text-white/55 lg:mx-0">
              Build a profile page with music, effects and every one of your socials. Claim your name in seconds.
            </motion.p>
            <motion.form onSubmit={claim} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.16 }}
              className="mx-auto mt-8 flex max-w-md items-center rounded-xl border border-white/[.08] bg-ink-900 p-1.5 focus-within:border-brand-500/50 lg:mx-0">
              <span className="hidden pl-3 text-[15px] text-white/40 sm:inline">{location.host}/</span><span className="pl-3 text-[15px] text-white/40 sm:hidden">/</span>
              <input value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder="username" aria-label="Username"
                size={1} className="min-w-0 flex-1 bg-transparent px-1 text-[15px] outline-none placeholder:text-white/25" />
              <button className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-brand-600 active:scale-[.98]">
                Claim <ArrowRight size={15} />
              </button>
            </motion.form>
            {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
            {stats && stats.users > 0 && (
              <p className="mt-6 text-sm text-white/40">{fmt(stats.users)} profiles · {fmt(stats.views)} views {backend.mode === 'local' && '(on this device)'}</p>
            )}
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }}
            className="relative mx-auto w-full max-w-[420px] animate-floaty">
            <div className="relative overflow-hidden rounded-[22px] border border-white/[.08] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,.35),transparent_65%)] p-5">
              <DefaultLayout p={DEMO} widgets={null} />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-[28px] font-bold tracking-tight sm:text-[34px]">Everything a profile should be</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-white/50">No templates you can't change. No limits on looking good.</p>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="group rounded-xl border border-white/[.06] bg-ink-900 p-5 transition hover:border-brand-500/30">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-brand-500/10 text-brand-400 transition group-hover:bg-brand-500/20"><f.icon size={19} /></div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/50">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/[.06] bg-gradient-to-br from-brand-500/20 via-ink-900 to-ink-900 px-6 py-14 text-center">
          <h2 className="text-[28px] font-bold tracking-tight">Your corner of the internet is waiting.</h2>
          <p className="mt-2 text-white/55">Free forever. Takes under a minute.</p>
          <Link to="/register" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90">
            Create your page <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </MarketingPage>
  );
}
