import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { platform } from '@/lib/platforms';
import { hexA } from '@/lib/util';
import { useMedia } from '@/hooks/useMedia';
import { Avatar, Badges, Bio, Location, Socials, Username, Views } from './Bits';
import { DiscordCard } from './Discord';

export interface LayoutProps {
  p: Profile;
  widgets: ReactNode; // audio player and other widgets
}

function cardStyle(p: Profile): React.CSSProperties {
  const ap = p.appearance;
  return {
    background: hexA(ap.backgroundColor, ap.profileOpacity / 100),
    backdropFilter: ap.profileBlur ? `blur(${ap.profileBlur}px)` : undefined,
    WebkitBackdropFilter: ap.profileBlur ? `blur(${ap.profileBlur}px)` : undefined,
    borderRadius: ap.borderRadius,
    border: ap.borderWidth ? `${ap.borderWidth}px solid ${ap.borderColor}` : undefined,
    color: ap.textColor,
  };
}

/** Default: one centred card, everything stacked. */
export function DefaultLayout({ p, widgets }: LayoutProps) {
  const ap = p.appearance;
  return (
    <div className="w-full max-w-[560px] p-6 sm:p-8" style={cardStyle(p)}>
      <div className="flex flex-col items-center text-center">
        <Avatar src={p.avatarUrl} size={112} ap={ap} />
        <div className="mt-4 flex items-center gap-2">
          <Username name={p.displayName || p.username} ap={ap} className="text-[28px] font-bold leading-tight" />
        </div>
        <div className="mt-2"><Badges ids={p.badges} ap={ap} /></div>
        <Bio p={p} className="mt-3 max-w-[420px] text-[15px] leading-relaxed" />
        {(p.location || ap.showViews) && (
          <div className="mt-3 flex items-center gap-4 text-[13px]"><Location p={p} /><Views p={p} /></div>
        )}
        <Socials links={p.links} ap={ap} className="mt-5" />
        <div className="mt-5 flex w-full flex-col gap-2.5 empty:hidden">
          <DiscordCard ap={ap} />
          {widgets}
        </div>
      </div>
    </div>
  );
}

/** Modern: banner header with the avatar overlapping it, left aligned text, stats in the corner. */
export function ModernLayout({ p, widgets }: LayoutProps) {
  const ap = p.appearance;
  const banner = useMedia(ap.bannerUrl);
  return (
    <div className="w-full max-w-[600px] overflow-hidden" style={cardStyle(p)}>
      <div className="relative h-36 sm:h-44" style={{ background: banner ? undefined : `linear-gradient(135deg, ${hexA(ap.accentColor, 0.8)}, ${hexA(ap.accentColor, 0.15)})` }}>
        {banner && <img src={banner} alt="" className="h-full w-full object-cover" />}
        <div className="absolute right-3 top-3 flex gap-2 text-[12px]">
          {ap.showViews && <span className="rounded-full bg-black/45 px-2.5 py-1 backdrop-blur"><Views p={p} /></span>}
        </div>
      </div>
      <div className="px-6 pb-6 sm:px-7">
        <div className="-mt-12 flex items-end justify-between gap-3">
          <div className="rounded-full p-1" style={{ background: ap.backgroundColor }}><Avatar src={p.avatarUrl} size={92} ap={ap} /></div>
          <Badges ids={p.badges} ap={ap} size={17} />
        </div>
        <div className="mt-3 text-left">
          <Username name={p.displayName || p.username} ap={ap} className="text-[26px] font-bold leading-tight" />
          <div className="text-[13px]" style={{ color: hexA(ap.textColor, 0.5) }}>@{p.username}</div>
          <Bio p={p} className="mt-3 text-[15px] leading-relaxed" />
          <Location p={p} className="mt-3 text-[13px]" />
        </div>
        <Socials links={p.links} ap={ap} className="mt-5 !justify-start" size={24} />
        <div className="mt-5 flex flex-col gap-2.5 empty:hidden">
          <DiscordCard ap={ap} />
          {widgets}
        </div>
      </div>
    </div>
  );
}

/** Simplistic: no card at all, content floats on the background. */
export function SimplisticLayout({ p, widgets }: LayoutProps) {
  const ap = p.appearance;
  return (
    <div className="flex w-full max-w-[480px] flex-col items-center text-center" style={{ color: ap.textColor }}>
      <Avatar src={p.avatarUrl} size={132} ap={{ ...ap, borderWidth: 0 }} />
      <Username name={p.displayName || p.username} ap={ap} className="mt-5 text-[34px] font-extrabold tracking-tight" />
      <Bio p={p} className="mt-2 text-[15px]" />
      <Socials links={p.links} ap={ap} className="mt-6 gap-4" size={28} />
      <div className="mt-6 flex items-center gap-4 text-[12px] empty:hidden">
        <Badges ids={p.badges} ap={ap} size={15} />
        <Location p={p} />
        <Views p={p} />
      </div>
      <div className="mt-6 flex w-full flex-col gap-2.5 empty:hidden">
        <DiscordCard ap={ap} />
        {widgets}
      </div>
    </div>
  );
}

/** Sleek: wide horizontal card, avatar left, details right, links as full-width rows. */
export function SleekLayout({ p, widgets }: LayoutProps) {
  const ap = p.appearance;
  return (
    <div className="w-full max-w-[680px] p-5 sm:p-6" style={cardStyle(p)}>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <Avatar src={p.avatarUrl} size={104} ap={ap} className="!rounded-2xl" />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
            <Username name={p.displayName || p.username} ap={ap} className="text-[26px] font-bold leading-tight" />
            <Badges ids={p.badges} ap={ap} size={16} />
          </div>
          <Bio p={p} className="mt-2 text-[14px] leading-relaxed" />
          <div className="mt-3 flex items-center justify-center gap-4 text-[12px] sm:justify-start">
            <Location p={p} /><Views p={p} />
          </div>
        </div>
      </div>
      {p.links.length > 0 && (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {p.links.map((l) => {
            const pl = platform(l.platform);
            const color = ap.monochromeIcons ? ap.iconColor : pl.color;
            const inner = (
              <>
                <svg viewBox="0 0 24 24" width={20} height={20} fill={color} aria-hidden><path d={pl.path} /></svg>
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{l.label || pl.name}</span>
                <ArrowUpRight size={16} className="opacity-40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-90" />
              </>
            );
            const cls = 'group flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition hover:-translate-y-px';
            const st = { background: hexA(ap.textColor, 0.05), border: `1px solid ${hexA(ap.textColor, 0.08)}` };
            return pl.copy ? (
              <button key={l.id} className={cls} style={st} onClick={() => navigator.clipboard?.writeText(l.url)}>{inner}</button>
            ) : (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer nofollow" className={cls} style={st}>{inner}</a>
            );
          })}
        </div>
      )}
      <div className="mt-4 flex flex-col gap-2.5 empty:hidden">
        <DiscordCard ap={ap} />
        {widgets}
      </div>
    </div>
  );
}

/** Portfolio: two columns. An identity panel and a content column with labelled sections. */
export function PortfolioLayout({ p, widgets }: LayoutProps) {
  const ap = p.appearance;
  const section = (title: string, body: ReactNode) => (
    <section className="p-5" style={cardStyle(p)}>
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: hexA(ap.textColor, 0.45) }}>{title}</h2>
      {body}
    </section>
  );
  return (
    <div className="grid w-full max-w-[920px] gap-4 md:grid-cols-[300px_1fr]">
      <aside className="flex flex-col items-center p-6 text-center md:sticky md:top-6 md:self-start" style={cardStyle(p)}>
        <Avatar src={p.avatarUrl} size={120} ap={ap} />
        <Username name={p.displayName || p.username} ap={ap} className="mt-4 text-[24px] font-bold" />
        <div className="text-[13px]" style={{ color: hexA(ap.textColor, 0.5) }}>@{p.username}</div>
        <div className="mt-3"><Badges ids={p.badges} ap={ap} /></div>
        <div className="mt-4 flex flex-col items-center gap-1.5 text-[13px]"><Location p={p} /><Views p={p} /></div>
        <Socials links={p.links.slice(0, 6)} ap={ap} className="mt-5" size={22} />
      </aside>
      <div className="flex min-w-0 flex-col gap-4">
        {(p.bio || ap.typewriterBio) && section('About', <Bio p={p} className="text-[15px] leading-relaxed" />)}
        {p.links.length > 0 &&
          section(
            'Links',
            <div className="divide-y" style={{ borderColor: hexA(ap.textColor, 0.08) }}>
              {p.links.map((l) => {
                const pl = platform(l.platform);
                const shown = pl.copy ? l.url : l.url.replace(/^(https?:\/\/|mailto:)(www\.)?/, '').replace(/\/$/, '');
                const row = (
                  <div className="group flex items-center gap-3 py-2.5" style={{ borderColor: hexA(ap.textColor, 0.08) }}>
                    <svg viewBox="0 0 24 24" width={18} height={18} fill={ap.monochromeIcons ? ap.iconColor : pl.color} aria-hidden><path d={pl.path} /></svg>
                    <span className="w-28 shrink-0 text-[14px] font-medium">{l.label || pl.name}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: hexA(ap.textColor, 0.5) }}>{shown}</span>
                    <ArrowUpRight size={15} className="opacity-30 transition group-hover:opacity-90" />
                  </div>
                );
                return pl.copy ? (
                  <button key={l.id} className="block w-full text-left" onClick={() => navigator.clipboard?.writeText(l.url)}>{row}</button>
                ) : (
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="block">{row}</a>
                );
              })}
            </div>,
          )}
        {(ap.showDiscord || (ap.audio.length > 0 && ap.showPlayer)) &&
          section('Now', <div className="flex flex-col gap-2.5"><DiscordCard ap={ap} />{widgets}</div>)}
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
  { id: 'sleek', name: 'Sleek', description: 'Wide card with links as full rows' },
  { id: 'portfolio', name: 'Portfolio', description: 'Two columns with labelled sections' },
];
