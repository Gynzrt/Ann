import type { ReactNode } from 'react';
import { ArrowUpRight, Copy } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { platform } from '@/lib/platforms';
import { cx, hexA } from '@/lib/util';
import { useMedia } from '@/hooks/useMedia';
import { Avatar, Badges, Bio, Handle, Location, Socials, Username, Views } from './Bits';

/*
 * Layouts size themselves with container queries (`@[Npx]:`), not viewport
 * breakpoints, so the editor's phone and tablet previews match what visitors see.
 * The nearest container is the profile root set up in ProfileView.
 */

export interface LayoutProps {
  p: Profile;
  /** Discord card, music player and other widgets, or null when there are none. */
  widgets: ReactNode;
}

function cardStyle(p: Profile): React.CSSProperties {
  const ap = p.appearance;
  return {
    background: hexA(ap.backgroundColor, ap.profileOpacity / 100),
    backdropFilter: ap.profileBlur ? `blur(${ap.profileBlur}px)` : undefined,
    WebkitBackdropFilter: ap.profileBlur ? `blur(${ap.profileBlur}px)` : undefined,
    borderRadius: ap.borderRadius,
    boxShadow: `${ap.borderWidth ? `inset 0 0 0 ${ap.borderWidth}px ${ap.borderColor},` : ''} 0 30px 80px -30px rgba(0,0,0,.6)`,
    color: ap.textColor,
  };
}

const name = (p: Profile) => p.displayName || p.username;

function Widgets({ children, className }: { children: ReactNode; className?: string }) {
  if (!children) return null;
  return <div className={cx('flex w-full flex-col gap-2.5', className)}>{children}</div>;
}

/** Default: one centred card with everything stacked; views sit in the corner. */
export function DefaultLayout({ p, widgets }: LayoutProps) {
  const ap = p.appearance;
  return (
    <div className="relative w-full max-w-[540px] px-6 pb-10 pt-8 @[520px]:px-10 @[520px]:pt-10" style={cardStyle(p)}>
      <div className="flex flex-col items-center text-center">
        <Avatar src={p.avatarUrl} name={name(p)} size={108} ap={ap} />
        <Username name={name(p)} ap={ap} className="mt-5 text-[28px] font-semibold leading-tight tracking-[-0.02em]" />
        <Handle p={p} className="mt-1" />
        <Badges ids={p.badges} ap={ap} pill className="mt-3.5" />
        <Bio p={p} className="mt-4 max-w-[420px] text-[15px] leading-[1.6]" />
        <Location p={p} className="mt-3 text-[13px]" />
        <Socials links={p.links} ap={ap} size={27} className="mt-6" />
        <Widgets className="mt-7">{widgets}</Widgets>
      </div>
      <Views p={p} className="absolute bottom-4 left-5 text-[12px]" />
    </div>
  );
}

/** Modern: banner header with an overlapping avatar and left-aligned text. */
export function ModernLayout({ p, widgets }: LayoutProps) {
  const ap = p.appearance;
  const banner = useMedia(ap.bannerUrl);
  return (
    <div className="w-full max-w-[600px] overflow-hidden" style={cardStyle(p)}>
      <div
        className="relative h-32 @[520px]:h-44"
        style={{ background: banner ? undefined : `linear-gradient(135deg, ${hexA(ap.accentColor, 0.4)}, ${hexA(ap.accentColor, 0.08)} 70%)` }}
      >
        {banner && <img src={banner} alt="" className="h-full w-full object-cover" />}
        {ap.showViews && (
          <Views p={p} className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[12px] backdrop-blur-md" style={{ background: 'rgba(0,0,0,.42)', color: 'rgba(255,255,255,.85)' }} />
        )}
      </div>
      <div className="px-6 pb-7 @[520px]:px-8">
        <div className="-mt-12 flex items-end justify-between gap-3">
          <div className="rounded-full p-[5px]" style={{ background: hexA(ap.backgroundColor, Math.max(ap.profileOpacity, 85) / 100) }}>
            <Avatar src={p.avatarUrl} name={name(p)} size={92} ap={ap} />
          </div>
          <Badges ids={p.badges} ap={ap} pill className="mb-1" />
        </div>
        <Username name={name(p)} ap={ap} className="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.02em]" />
        <Handle p={p} className="mt-0.5" />
        <Bio p={p} className="mt-3.5 text-[15px] leading-[1.6]" />
        <Location p={p} className="mt-3 text-[13px]" />
        <Socials links={p.links} ap={ap} size={25} className="mt-5 !justify-start" />
        <Widgets className="mt-6">{widgets}</Widgets>
      </div>
    </div>
  );
}

/** Simplistic: no card at all, the content floats on the background. */
export function SimplisticLayout({ p, widgets }: LayoutProps) {
  const ap = p.appearance;
  return (
    <div className="flex w-full max-w-[480px] flex-col items-center text-center" style={{ color: ap.textColor }}>
      <Avatar src={p.avatarUrl} name={name(p)} size={124} ap={{ ...ap, borderWidth: 0 }} />
      <Username name={name(p)} ap={ap} className="mt-6 text-[34px] font-bold leading-tight tracking-[-0.03em] @[520px]:text-[38px]" />
      <Handle p={p} className="mt-1" />
      <Bio p={p} className="mt-3 max-w-[400px] text-[15px] leading-[1.6]" />
      <Socials links={p.links} ap={ap} size={28} className="mt-7 gap-x-5" />
      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12.5px] empty:hidden">
        <Badges ids={p.badges} ap={ap} size={15} />
        <Location p={p} />
        <Views p={p} />
      </div>
      <Widgets className="mt-7">{widgets}</Widgets>
    </div>
  );
}

function LinkRow({ p, l, compact }: { p: Profile; l: Profile['links'][number]; compact?: boolean }) {
  const ap = p.appearance;
  const pl = platform(l.platform);
  const color = ap.monochromeIcons ? ap.iconColor : pl.color;
  const shown = pl.copy ? l.url : l.url.replace(/^(https?:\/\/|mailto:)(www\.)?/, '').replace(/\/$/, '');
  const Trail = pl.copy ? Copy : ArrowUpRight;
  const inner = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: hexA(ap.textColor, 0.06) }}>
        <svg viewBox="0 0 24 24" width={17} height={17} fill={color} aria-hidden><path d={pl.path} /></svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium">{l.label || pl.name}</span>
        {!compact && <span className="block truncate text-[12px]" style={{ color: hexA(ap.textColor, 0.45) }}>{shown}</span>}
      </span>
      <Trail size={15} className="shrink-0 opacity-35 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-90" />
    </>
  );
  const cls = 'group flex w-full items-center gap-3 rounded-[12px] p-2 pr-3 text-left outline-none transition hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-white/40';
  const st = { background: hexA(ap.textColor, 0.035), boxShadow: `inset 0 0 0 1px ${hexA(ap.textColor, 0.07)}` };
  return pl.copy ? (
    <button type="button" className={cls} style={st} onClick={() => navigator.clipboard?.writeText(l.url)}>{inner}</button>
  ) : (
    <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className={cls} style={st}>{inner}</a>
  );
}

/** Sleek: wide card, avatar beside the details, links as full rows. */
export function SleekLayout({ p, widgets }: LayoutProps) {
  const ap = p.appearance;
  return (
    <div className="w-full max-w-[680px] p-5 @[560px]:p-7" style={cardStyle(p)}>
      <div className="flex flex-col items-center gap-5 @[560px]:flex-row @[560px]:items-center">
        <Avatar src={p.avatarUrl} name={name(p)} size={100} ap={ap} square />
        <div className="min-w-0 flex-1 text-center @[560px]:text-left">
          <div className="flex flex-col items-center gap-2 @[560px]:flex-row @[560px]:items-center @[560px]:gap-3">
            <Username name={name(p)} ap={ap} className="text-[26px] font-semibold leading-tight tracking-[-0.02em]" />
            <Badges ids={p.badges} ap={ap} size={15} pill />
          </div>
          <Handle p={p} className="mt-0.5 text-[13.5px]" />
          <Bio p={p} className="mt-2.5 text-[14.5px] leading-[1.6]" />
          <div className="mt-3 flex items-center justify-center gap-4 text-[12.5px] empty:hidden @[560px]:justify-start">
            <Location p={p} />
            <Views p={p} />
          </div>
        </div>
      </div>
      {p.links.length > 0 && (
        <div className="mt-6 grid gap-2 @[560px]:grid-cols-2">
          {p.links.map((l) => <LinkRow key={l.id} p={p} l={l} compact />)}
        </div>
      )}
      <Widgets className="mt-4">{widgets}</Widgets>
    </div>
  );
}

/** Portfolio: an identity panel next to a column of labelled sections. */
export function PortfolioLayout({ p, widgets }: LayoutProps) {
  const ap = p.appearance;
  const section = (title: string, body: ReactNode) => (
    <section className="p-5 @[820px]:p-6" style={cardStyle(p)}>
      <h2 className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: hexA(ap.textColor, 0.42) }}>{title}</h2>
      {body}
    </section>
  );
  return (
    <div className="grid w-full max-w-[940px] gap-3 @[820px]:grid-cols-[300px_1fr] @[820px]:gap-4">
      <aside className="flex flex-col items-center p-6 text-center @[820px]:sticky @[820px]:top-8 @[820px]:self-start @[820px]:p-7" style={cardStyle(p)}>
        <Avatar src={p.avatarUrl} name={name(p)} size={112} ap={ap} />
        <Username name={name(p)} ap={ap} className="mt-5 text-[24px] font-semibold leading-tight tracking-[-0.02em]" />
        <Handle p={p} className="mt-0.5 text-[13.5px]" />
        <Badges ids={p.badges} ap={ap} pill className="mt-3.5" />
        <div className="mt-4 flex flex-col items-center gap-1.5 text-[12.5px] empty:hidden">
          <Location p={p} />
          <Views p={p} />
        </div>
        <Socials links={p.links.slice(0, 6)} ap={ap} size={21} className="mt-5" />
      </aside>
      <div className="flex min-w-0 flex-col gap-3 @[820px]:gap-4">
        {(p.bio || (ap.typewriterBio && ap.typewriterLines.some(Boolean))) && section('About', <Bio p={p} className="text-[15px] leading-[1.65]" />)}
        {p.links.length > 0 && section('Links', <div className="grid gap-2">{p.links.map((l) => <LinkRow key={l.id} p={p} l={l} />)}</div>)}
        {widgets && section('Now', <div className="flex flex-col gap-2.5">{widgets}</div>)}
      </div>
    </div>
  );
}

export const LAYOUTS = {
  default: DefaultLayout,
  modern: ModernLayout,
  simplistic: SimplisticLayout,
  sleek: SleekLayout,
  portfolio: PortfolioLayout,
};

export const LAYOUT_INFO: { id: keyof typeof LAYOUTS; name: string; description: string }[] = [
  { id: 'default', name: 'Default', description: 'A centred card with everything stacked' },
  { id: 'modern', name: 'Modern', description: 'Banner header with an overlapping avatar' },
  { id: 'simplistic', name: 'Simplistic', description: 'No card, content floats on the background' },
  { id: 'sleek', name: 'Sleek', description: 'Wide card with links as rows' },
  { id: 'portfolio', name: 'Portfolio', description: 'Two columns with labelled sections' },
];
