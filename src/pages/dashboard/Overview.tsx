import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Eye, Hash, Link2, Check, Palette } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { Card } from '@/components/ui';
import { fmt } from '@/lib/util';

export default function Overview() {
  const { profile } = useAuth();
  const [days, setDays] = useState<{ day: string; views: number }[]>([]);
  const [copied, setCopied] = useState(false);
  useEffect(() => { backend.viewsByDay(14).then(setDays).catch(() => {}); }, []);
  if (!profile) return null;
  const url = `${location.origin}/${profile.username}`;
  const max = Math.max(1, ...days.map((d) => d.views));
  const week = days.slice(-7).reduce((a, b) => a + b.views, 0);

  const done = [
    { ok: !!profile.avatarUrl, text: 'Upload an avatar', to: '/dashboard/customize' },
    { ok: !!profile.bio, text: 'Write a bio', to: '/dashboard/customize' },
    { ok: profile.links.length > 0, text: 'Add a social link', to: '/dashboard/links' },
    { ok: !!profile.appearance.backgroundUrl || profile.appearance.backgroundEffect !== 'particles', text: 'Pick a background', to: '/dashboard/customize' },
  ];

  return (
    <div>
      <h1 className="text-[22px] font-bold">Welcome back, {profile.displayName}</h1>
      <p className="mt-1 text-sm text-white/45">Here's how your page is doing.</p>
      {backend.mode === 'local' && (
        <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200/80">
          Local mode: your page and its views live in this browser. Add Supabase keys to make it public (see README).
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Eye, label: 'Total views', value: fmt(profile.views) },
          { icon: Eye, label: 'Last 7 days', value: fmt(week) },
          { icon: Hash, label: 'UID', value: `#${profile.uid}` },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between text-[13px] text-white/50">{s.label}<s.icon size={15} /></div>
            <div className="mt-2 text-[26px] font-bold tabular-nums">{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Profile views</h2>
            <span className="text-xs text-white/40">Last 14 days · unique per day</span>
          </div>
          <div className="mt-6 flex h-44 items-end gap-1.5" role="img" aria-label="Views per day chart">
            {days.map((d) => (
              <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
                <div className="rounded-t bg-brand-500/70 transition group-hover:bg-brand-400" style={{ height: `${Math.max(2, (d.views / max) * 100)}%` }} />
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-1.5 py-0.5 text-[11px] opacity-0 group-hover:opacity-100">
                  {d.views} · {d.day.slice(5)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-white/30"><span>{days[0]?.day.slice(5)}</span><span>today</span></div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card className="p-5">
            <h2 className="font-semibold">Your link</h2>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[.08] bg-ink-850 p-1.5 pl-3">
              <span className="min-w-0 flex-1 truncate text-sm text-white/70">{url.replace(/^https?:\/\//, '')}</span>
              <button onClick={() => navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); })}
                className="rounded-md bg-white/[.07] p-2 transition hover:bg-white/[.12]" aria-label="Copy link">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Get set up</h2>
            <ul className="mt-3 space-y-2">
              {done.map((d) => (
                <li key={d.text}>
                  <Link to={d.to} className="flex items-center gap-3 text-sm text-white/70 hover:text-white">
                    <span className={`grid h-5 w-5 place-items-center rounded-full border ${d.ok ? 'border-brand-500 bg-brand-500' : 'border-white/20'}`}>{d.ok && <Check size={12} />}</span>
                    <span className={d.ok ? 'line-through opacity-50' : ''}>{d.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link to="/dashboard/customize" className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 py-2 text-[13px] font-medium hover:bg-brand-600"><Palette size={14} />Customize</Link>
              <Link to="/dashboard/links" className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[.06] py-2 text-[13px] font-medium hover:bg-white/10"><Link2 size={14} />Links</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
