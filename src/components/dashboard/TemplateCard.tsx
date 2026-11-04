import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Template } from '@/lib/templates';
import type { Profile } from '@/lib/types';
import { DEFAULT_APPEARANCE } from '@/lib/types';
import { ProfileView } from '@/components/profile/ProfileView';
import { ScaledFrame } from './Preview';

/** A profile with a template's look applied, for previews. Effects that need a click are turned off. */
export function withTemplate(p: Profile, t: Template): Profile {
  return {
    ...p,
    appearance: { ...DEFAULT_APPEARANCE, ...p.appearance, ...t.appearance, enterScreen: false, tilt: false, entrance: 'none', cursor: 'default' },
  };
}

export function sampleProfile(t: Template): Profile {
  const origin = typeof location !== 'undefined' ? location.origin : '';
  return withTemplate(
    {
      id: t.id, username: t.id, displayName: t.name.toLowerCase(), bio: 'a short line about me', location: 'Somewhere', avatarUrl: `${origin}/demo/avatar.png`,
      badges: ['creator', 'og'], views: 1337, uid: 1, premium: false, createdAt: '', appearance: DEFAULT_APPEARANCE,
      links: ['discord-user', 'x', 'github', 'spotify'].map((pl, i) => ({ id: String(i), platform: pl, url: 'https://example.com', position: i })),
    },
    t,
  );
}

/** Sample profiles also get the demo banner so the Modern layout looks complete. */
export function sampleWithBanner(t: Template): Profile {
  const p = sampleProfile(t);
  return { ...p, appearance: { ...p.appearance, bannerUrl: `${location.origin}/demo/banner.jpg` } };
}

export function TemplateCard({ t, profile, active, actions }: { t: Template; profile: Profile; active?: boolean; actions: ReactNode }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`group overflow-hidden rounded-[16px] border bg-card transition-colors ${active ? 'border-accent/50' : 'border-white/[.06] hover:border-white/[.12]'}`}
    >
      <div className="relative overflow-hidden border-b border-white/[.06] bg-black">
        <div className="pointer-events-none transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          <ScaledFrame width={1280} height={800} fitWidth>
            <ProfileView p={profile} preview />
          </ScaledFrame>
        </div>
        {active && <span className="absolute left-3 top-3 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">Current</span>}
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold text-zinc-100">{t.name}</div>
          <div className="truncate text-[12px] text-zinc-500">{t.tag} · {t.appearance.layout} layout</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
      </div>
    </motion.div>
  );
}
