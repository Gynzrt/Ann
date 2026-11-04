import { createContext, useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, MapPin, Check } from 'lucide-react';
import type { Appearance, Profile, SocialLink } from '@/lib/types';
import { BADGE_MAP } from '@/lib/badges';
import { platform } from '@/lib/platforms';
import { cx, fmt, hexA } from '@/lib/util';
import { useMedia } from '@/hooks/useMedia';
import { Typewriter } from './Typewriter';

/** True while a profile renders inside the editor preview. */
export const PreviewContext = createContext(false);
export const useIsPreview = () => useContext(PreviewContext);

export function glow(color: string, strength: number, on: boolean) {
  if (!on) return undefined;
  const s = strength / 100;
  return `drop-shadow(0 0 ${2 + s * 6}px ${hexA(color, 0.45 + s * 0.4)})`;
}

const muted = (ap: Appearance, a: number) => hexA(ap.textColor, a);

export function Avatar({ src, size, ap, name = '', className, square }: { src: string; size: number; ap: Appearance; name?: string; className?: string; square?: boolean }) {
  const url = useMedia(src);
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <div
      className={cx('relative shrink-0 overflow-hidden', square ? 'rounded-[22%]' : 'rounded-full', className)}
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 0 ${ap.borderWidth ? Math.max(1.5, ap.borderWidth) : 1}px ${ap.borderWidth ? ap.borderColor : muted(ap, 0.1)}, 0 10px 30px -12px rgba(0,0,0,.65)`,
      }}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div
          className="grid h-full w-full place-items-center font-semibold"
          style={{ fontSize: size * 0.38, color: hexA(ap.accentColor, 0.95), background: `linear-gradient(145deg, ${hexA(ap.accentColor, 0.22)}, ${hexA(ap.accentColor, 0.06)})` }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}

export function Username({ name, ap, className }: { name: string; ap: Appearance; className?: string }) {
  const style: React.CSSProperties = { color: ap.textColor, filter: glow(ap.accentColor, ap.glowStrength, ap.glowUsername) };
  const e = ap.usernameEffect;
  if (e === 'typewriter') return <h1 className={className} style={style}><Typewriter lines={[name]} /></h1>;
  if (e === 'rainbow')
    return (
      <h1
        className={cx(className, 'animate-rainbow bg-clip-text')}
        style={{ ...style, color: 'transparent', backgroundImage: 'linear-gradient(90deg,#ff6b6b,#ffc46b,#5ee89a,#5ab4ff,#b98bff,#ff6b6b)', backgroundSize: '200% 100%' }}
      >
        {name}
      </h1>
    );
  if (e === 'shimmer')
    return (
      <h1
        className={cx(className, 'animate-rainbow bg-clip-text')}
        style={{ ...style, color: 'transparent', backgroundImage: `linear-gradient(90deg, ${ap.textColor} 0%, ${ap.textColor} 38%, ${ap.accentColor} 50%, ${ap.textColor} 62%, ${ap.textColor} 100%)`, backgroundSize: '200% 100%' }}
      >
        {name}
      </h1>
    );
  if (e === 'glow') return <h1 className={cx(className, 'name-pulse')} style={{ ...style, ['--g' as string]: hexA(ap.accentColor, 0.8) }}>{name}</h1>;
  if (e === 'sparkle')
    return (
      <h1 className={cx(className, 'relative inline-block')} style={style}>
        {name}
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="sparkle" style={{ left: `${10 + i * 20}%`, animationDelay: `${i * 0.45}s`, background: ap.accentColor }} />
        ))}
      </h1>
    );
  return <h1 className={className} style={style}>{name}</h1>;
}

export function Handle({ p, className }: { p: Profile; className?: string }) {
  if (!p.appearance.showUsername) return null;
  return <p className={cx('text-[14px] font-medium', className)} style={{ color: muted(p.appearance, 0.45) }}>@{p.username}</p>;
}

/** Badge icons. `pill` puts them in a small rounded container. */
export function Badges({ ids, ap, size = 16, pill, className }: { ids: string[]; ap: Appearance; size?: number; pill?: boolean; className?: string }) {
  const list = ids.map((id) => BADGE_MAP[id]).filter(Boolean);
  if (!ap.showBadges || !list.length) return null;
  return (
    <div
      className={cx('inline-flex flex-wrap items-center justify-center gap-1.5', pill && 'rounded-full px-2.5 py-1.5', className)}
      style={pill ? { background: muted(ap, 0.05), boxShadow: `inset 0 0 0 1px ${muted(ap, 0.08)}` } : undefined}
    >
      {list.map((b) => {
        const I = b.icon;
        return (
          <span key={b.id} className="group relative grid place-items-center" tabIndex={0} aria-label={b.name}>
            <I size={size} strokeWidth={2} style={{ color: ap.monochromeIcons ? ap.iconColor : b.color, filter: glow(b.color, ap.glowStrength, ap.glowBadges) }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 group-focus:opacity-100">
              {b.name}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function SocialIcon({ link, ap, size = 26 }: { link: SocialLink; ap: Appearance; size?: number }) {
  const pl = platform(link.platform);
  const [copied, setCopied] = useState(false);
  const color = ap.monochromeIcons ? ap.iconColor : pl.color;
  const icon = (
    <motion.svg
      whileHover={{ y: -3, scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      style={{ filter: glow(color, ap.glowStrength, ap.glowSocials) }}
      aria-hidden
    >
      <path d={pl.path} />
    </motion.svg>
  );
  const tip = (
    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
      {copied ? 'Copied!' : link.label || pl.name}
    </span>
  );
  const cls = 'group relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/50';
  if (pl.copy)
    return (
      <button
        type="button"
        className={cls}
        aria-label={`Copy ${pl.name}`}
        onClick={() => navigator.clipboard?.writeText(link.url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); })}
      >
        {copied ? <Check size={size} color={color} /> : icon}
        {tip}
      </button>
    );
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer nofollow" className={cls} aria-label={link.label || pl.name}>
      {icon}
      {tip}
    </a>
  );
}

export function Socials({ links, ap, size, className }: { links: SocialLink[]; ap: Appearance; size?: number; className?: string }) {
  if (!links.length) return null;
  return (
    <div className={cx('flex flex-wrap items-center justify-center gap-x-4 gap-y-3', className)}>
      {links.map((l) => <SocialIcon key={l.id} link={l} ap={ap} size={size} />)}
    </div>
  );
}

export function Bio({ p, className }: { p: Profile; className?: string }) {
  const ap = p.appearance;
  if (ap.typewriterBio && ap.typewriterLines.filter(Boolean).length)
    return <p className={className} style={{ color: muted(ap, 0.78) }}><Typewriter lines={ap.typewriterLines} /></p>;
  if (!p.bio) return null;
  return <p className={cx('whitespace-pre-line break-words', className)} style={{ color: muted(ap, 0.78) }}>{p.bio}</p>;
}

export function Location({ p, className }: { p: Profile; className?: string }) {
  if (!p.location) return null;
  return (
    <span className={cx('inline-flex items-center gap-1.5', className)} style={{ color: muted(p.appearance, 0.55) }}>
      <MapPin size={13} strokeWidth={2} /> {p.location}
    </span>
  );
}

export function Views({ p, className, style }: { p: Profile; className?: string; style?: React.CSSProperties }) {
  if (!p.appearance.showViews) return null;
  return (
    <span className={cx('inline-flex items-center gap-1.5 tabular-nums', className)} style={{ color: muted(p.appearance, 0.55), ...style }} title="Profile views">
      <Eye size={13} strokeWidth={2} /> {fmt(p.views)}
    </span>
  );
}
