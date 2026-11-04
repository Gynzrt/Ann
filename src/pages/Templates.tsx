import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { MarketingPage } from '@/components/layout/SiteNav';
import { TEMPLATES } from '@/lib/templates';
import type { Template } from '@/lib/templates';
import { DEFAULT_APPEARANCE } from '@/lib/types';
import type { Profile } from '@/lib/types';
import { ProfileView } from '@/components/profile/ProfileView';
import { useAuth } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { cx } from '@/lib/util';

function sample(t: Template): Profile {
  return {
    id: t.id, username: t.id, displayName: t.name.toLowerCase(), bio: 'a short line about me', location: '', avatarUrl: '',
    badges: ['creator', 'og'], views: 1337, uid: 1, premium: false, createdAt: '',
    appearance: { ...DEFAULT_APPEARANCE, ...t.appearance, enterScreen: false, tilt: false, entrance: 'none', cursor: 'default' },
    links: ['discord-user', 'x', 'github', 'spotify'].map((p, i) => ({ id: String(i), platform: p, url: 'https://example.com', position: i })),
  };
}

export function Templates() {
  const { account, profile, setProfile } = useAuth();
  const [filter, setFilter] = useState('All');
  const [applied, setApplied] = useState('');
  const [busy, setBusy] = useState('');
  const nav = useNavigate();
  const tags = ['All', ...new Set(TEMPLATES.map((t) => t.tag))];

  const apply = async (t: Template) => {
    if (!account || !profile) return nav('/register');
    setBusy(t.id);
    try {
      const p = await backend.updateProfile({ appearance: { ...profile.appearance, ...t.appearance } });
      setProfile(p);
      setApplied(t.id);
    } finally {
      setBusy('');
    }
  };

  return (
    <MarketingPage>
      <section className="px-4 pb-24 pt-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-center text-[36px] font-extrabold tracking-tight sm:text-[46px]">Templates</h1>
          <p className="mx-auto mt-3 max-w-md text-center text-white/50">Start from a look you like. Applying one keeps your content and changes only the style.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {tags.map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className={cx('rounded-full border px-3.5 py-1.5 text-sm font-medium transition', filter === t ? 'border-brand-500/50 bg-brand-500/15 text-white' : 'border-white/[.08] text-white/55 hover:text-white')}>
                {t}
              </button>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.filter((t) => filter === 'All' || t.tag === filter).map((t) => (
              <motion.div layout key={t.id} className="group overflow-hidden rounded-2xl border border-white/[.06] bg-ink-900">
                <div className="relative h-[300px] overflow-hidden">
                  <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[200%] -translate-x-1/2 -translate-y-1/2 scale-50">
                    <ProfileView p={sample(t)} preview />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/[.06] p-4">
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-white/45">{t.tag} · {t.appearance.layout} layout</div>
                  </div>
                  <button onClick={() => apply(t)} disabled={busy === t.id}
                    className="flex items-center gap-1.5 rounded-lg bg-white/[.07] px-3 py-1.5 text-[13px] font-medium transition hover:bg-brand-500">
                    {applied === t.id ? <><Check size={14} /> Applied</> : account ? 'Use template' : 'Sign up to use'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
