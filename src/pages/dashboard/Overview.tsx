import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Check, Eye, Hash, Info, Link2, Palette, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { backend } from '@/lib/backend';
import { cx, fmt } from '@/lib/util';
import { ButtonLink, Card, PageHeader, Segmented } from '@/components/ui';
import { ViewsChart } from '@/components/dashboard/ViewsChart';
import { ScaledFrame, UrlChip } from '@/components/dashboard/Preview';
import { ProfileView } from '@/components/profile/ProfileView';
import { useDraft } from './draft';

type Range = '7' | '14' | '30';

function Stat({ icon: Icon, label, value, children }: { icon: LucideIcon; label: string; value: string; children?: React.ReactNode }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[12.5px] font-medium text-zinc-400">{label}</span>
        <span className="grid h-7 w-7 place-items-center rounded-[8px] border border-white/[.06] bg-white/[.03] text-zinc-500">
          <Icon size={14} strokeWidth={1.9} />
        </span>
      </div>
      <div className="mt-3 text-[24px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-zinc-50 sm:text-[28px]">{value}</div>
      <div className="mt-2.5 flex min-h-[20px] flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-zinc-500">{children}</div>
    </Card>
  );
}

function Delta({ now, before }: { now: number; before: number }) {
  if (!before && !now) return <span>No views yet</span>;
  if (!before) return <span className="inline-flex items-center gap-1 rounded-[6px] bg-emerald-400/10 px-1.5 py-0.5 font-medium text-emerald-400"><TrendingUp size={12} />New</span>;
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  const I = up ? ArrowUpRight : ArrowDownRight;
  return (
    <>
      <span className={cx('inline-flex items-center gap-0.5 rounded-[6px] px-1.5 py-0.5 font-medium tabular-nums', up ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400')}>
        <I size={12} />{up ? '+' : ''}{pct}%
      </span>
      <span>vs previous 7 days</span>
    </>
  );
}

export default function Overview() {
  const { saved: profile } = useDraft();
  const [range, setRange] = useState<Range>('14');
  const [days, setDays] = useState<{ day: string; views: number }[] | null>(null);
  useEffect(() => { backend.viewsByDay(30).then(setDays).catch(() => setDays([])); }, [profile.views]);

  const shown = useMemo(() => (days ?? []).slice(-Number(range)), [days, range]);
  const last7 = (days ?? []).slice(-7).reduce((a, b) => a + b.views, 0);
  const prev7 = (days ?? []).slice(-14, -7).reduce((a, b) => a + b.views, 0);
  const ap = profile.appearance;
  const steps = [
    { ok: !!profile.avatarUrl, text: 'Upload an avatar', to: '/dashboard/customize' },
    { ok: !!profile.bio || (ap.typewriterBio && ap.typewriterLines.some(Boolean)), text: 'Write a description', to: '/dashboard/customize' },
    { ok: profile.links.length > 0, text: 'Add your first link', to: '/dashboard/links' },
    { ok: !!ap.backgroundUrl || ap.backgroundEffect !== 'particles' || ap.layout !== 'default', text: 'Make the style your own', to: '/dashboard/customize' },
    { ok: ap.audio.length > 0 || ap.showDiscord, text: 'Add music or Discord presence', to: '/dashboard/customize' },
  ];
  const done = steps.filter((s) => s.ok).length;
  const joined = new Date(profile.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Overview"
        description={`Welcome back, ${profile.displayName || profile.username}.`}
        actions={
          <>
            <a href={`/${profile.username}`} target="_blank" rel="noreferrer" className="hidden sm:block">
              <span className="inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-white/[.08] bg-white/[.04] px-3 text-[12.5px] font-medium text-zinc-200 transition hover:border-white/[.13] hover:bg-white/[.07]">
                View page <ArrowUpRight size={14} />
              </span>
            </a>
            <ButtonLink to="/dashboard/customize" size="sm"><Palette size={14} />Customize</ButtonLink>
          </>
        }
      />
      <div className="mx-auto w-full max-w-[1480px] space-y-3 p-3 sm:p-5 lg:p-7">
        {backend.mode === 'local' && (
          <div className="flex items-start gap-3 rounded-[12px] border border-amber-300/15 bg-amber-300/[.04] px-4 py-3 text-[12.5px] leading-relaxed text-amber-100/80">
            <Info size={15} className="mt-0.5 shrink-0 text-amber-300/80" />
            <span>Local mode: your page and its views are stored in this browser only, so other people can’t open it yet. Add Supabase keys to publish it (see the README).</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Stat icon={Eye} label="Total views" value={fmt(profile.views)}><span>Unique visitors per day</span></Stat>
          <Stat icon={TrendingUp} label="Last 7 days" value={fmt(last7)}><Delta now={last7} before={prev7} /></Stat>
          <Stat icon={Link2} label="Links" value={String(profile.links.length)}>
            <Link to="/dashboard/links" className="font-medium text-zinc-400 transition hover:text-zinc-100">Manage links →</Link>
          </Stat>
          <Stat icon={Hash} label="Profile ID" value={`#${profile.uid}`}><span>Joined {joined}</span></Stat>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="min-w-0 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-zinc-100">Profile views</h2>
                <p className="mt-0.5 text-[12.5px] text-zinc-500">
                  {fmt(shown.reduce((a, b) => a + b.views, 0))} views in the last {range} days
                </p>
              </div>
              <Segmented<Range>
                size="sm"
                full={false}
                value={range}
                onChange={setRange}
                options={[{ value: '7', label: '7 days' }, { value: '14', label: '14 days' }, { value: '30', label: '30 days' }]}
              />
            </div>
            <div className="mt-5">
              {days ? <ViewsChart data={shown} /> : <div className="skeleton h-[248px] rounded-[10px]" />}
            </div>
          </Card>

          <Card className="flex flex-col p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-zinc-100">Your page</h2>
              <span className="text-[12px] text-zinc-500">{ap.layout[0].toUpperCase() + ap.layout.slice(1)} layout</span>
            </div>
            <div className="group relative mt-4 overflow-hidden rounded-[12px] border border-white/[.06] bg-black">
              <div className="pointer-events-none transition-transform duration-300 group-hover:scale-[1.015]" {...({ inert: "" } as object)}>
                <ScaledFrame width={1280} height={860} fitWidth>
                  <ProfileView p={profile} preview still />
                </ScaledFrame>
              </div>
              <Link to="/dashboard/customize" className="absolute inset-0 rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60" aria-label="Edit your page">
                <span className="absolute bottom-2.5 right-2.5 rounded-[8px] bg-black/70 px-2.5 py-1 text-[11.5px] font-medium text-zinc-200 opacity-0 backdrop-blur transition group-hover:opacity-100">Edit page</span>
              </Link>
            </div>
            <div className="mt-3"><UrlChip username={profile.username} /></div>
          </Card>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[14px] font-semibold text-zinc-100">Get set up</h2>
                <p className="mt-0.5 text-[12.5px] text-zinc-500">{done === steps.length ? 'All done. Your page is ready to share.' : `${done} of ${steps.length} done`}</p>
              </div>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/[.06]" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={steps.length} aria-label="Setup progress">
                <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(done / steps.length) * 100}%` }} />
              </div>
            </div>
            <ul className="mt-4 grid gap-1.5 md:grid-cols-2">
              {steps.map((s) => (
                <li key={s.text}>
                  <Link to={s.to} className="group flex items-center gap-3 rounded-[10px] border border-white/[.05] bg-white/[.015] px-3 py-2.5 text-[13px] transition hover:border-white/[.1] hover:bg-white/[.03]">
                    <span className={cx('grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border transition', s.ok ? 'border-accent bg-accent text-white' : 'border-white/20 text-transparent')}>
                      <Check size={11} strokeWidth={3.5} />
                    </span>
                    <span className={cx('flex-1', s.ok ? 'text-zinc-500 line-through decoration-zinc-600' : 'text-zinc-200')}>{s.text}</span>
                    {!s.ok && <ArrowUpRight size={14} className="text-zinc-600 transition group-hover:text-zinc-300" />}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="text-[14px] font-semibold text-zinc-100">Account</h2>
            <dl className="mt-3 divide-y divide-white/[.05] text-[13px]">
              {[
                ['Plan', 'Free'],
                ['Storage', backend.mode === 'supabase' ? 'Supabase' : 'This browser'],
                ['Badges', String(profile.badges.length)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2.5">
                  <dt className="text-zinc-500">{k}</dt>
                  <dd className="font-medium text-zinc-200">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
