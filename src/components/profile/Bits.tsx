import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, MapPin, Check } from 'lucide-react';
import type { Appearance, Profile, SocialLink } from '@/lib/types';
import { BADGE_MAP } from '@/lib/badges';
import { platform } from '@/lib/platforms';
import { cx, fmt, hexA } from '@/lib/util';
import { useMedia } from '@/hooks/useMedia';
import { Typewriter } from './Typewriter';

export function glow(color: string, strength: number, on: boolean) {
  if (!on) return undefined;
  const s = strength / 100;
  return `drop-shadow(0 0 ${2 + s * 6}px ${hexA(color, 0.5 + s * 0.4)})`;
}

export function Avatar({ src, size, ap, className }: { src: string; size: number; ap: Appearance; className?: string }) {
  const url = useMedia(src);
  return (
    <div
      className={cx('shrink-0 overflow-hidden rounded-full bg-white/5', className)}
      style={{ width: size, height: size, boxShadow: `0 0 0 ${ap.borderWidth ? 2 : 0}px ${ap.borderColor}` }}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className="grid h-full w-full place-items-center text-white/30" style={{ fontSize: size * 0.4 }}>?</div>
      )}
    </div>
  );
}

export function Username({ name, ap, className }: { name: string; ap: Appearance; className?: string }) {
  const style: React.CSSProperties = {
    color: ap.textColor,
    filter: glow(ap.accentColor, ap.glowStrength, ap.glowUsername),
  };
  const e = ap.usernameEffect;
  if (e === 'typewriter') return <h1 className={className} style={style}><Typewriter lines={[name]} /></h1>;
  if (e === 'rainbow')
    return (
      <h1 className={cx(className, 'animate-rainbow bg-clip-text text-transparent')}
        style={{ ...style, color: 'transparent', backgroundImage: 'linear-gradient(90deg,#ff5f6d,#ffc371,#47e891,#3fa7ff,#b06bff,#ff5f6d)', backgroundSize: '200% 100%' }}>
        {name}
      </h1>
    );
  if (e === 'shimmer')
    return (
      <h1 className={cx(className, 'animate-rainbow bg-clip-text text-transparent')}
        style={{ ...style, color: 'transparent', backgroundImage: `linear-gradient(90deg, ${ap.textColor} 0%, ${ap.textColor} 40%, ${ap.accentColor} 50%, ${ap.textColor} 60%, ${ap.textColor} 100%)`, backgroundSize: '200% 100%' }}>
        {name}
      </h1>
    );
  if (e === 'glow')
    return <h1 className={cx(className, 'name-pulse')} style={{ ...style, ['--g' as string]: ap.accentColor }}>{name}</h1>;
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

export function Badges({ ids, ap, size = 18 }: { ids: string[]; ap: Appearance; size?: number }) {
  if (!ap.showBadges || !ids.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {ids.map((id) => {
        const b = BADGE_MAP[id];
        if (!b) return null;
        const I = b.icon;
        return (
          <span key={id} className="group relative" tabIndex={0}>
            <I size={size} style={{ color: ap.monochromeIcons ? ap.iconColor : b.color, filter: glow(b.color, ap.glowStrength, ap.glowBadges) }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus:opacity-100">
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
    <motion.svg whileHover={{ y: -3, scale: 1.08 }} whileTap={{ scale: 0.92 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      viewBox="0 0 24 24" width={size} height={size} fill={color} style={{ filter: glow(color, ap.glowStrength, ap.glowSocials) }} aria-hidden>
      <path d={pl.path} />
    </motion.svg>
  );
  const tip = (
    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">
      {copied ? 'Copied!' : link.label || pl.name}
    </span>
  );
  if (pl.copy)
    return (
      <button type="button" className="group relative" aria-label={`Copy ${pl.name}`}
        onClick={() => navigator.clipboard?.writeText(link.url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); })}>
        {copied ? <Check size={size} color={color} /> : icon}
        {tip}
      </button>
    );
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer nofollow" className="group relative" aria-label={link.label || pl.name}>
      {icon}
      {tip}
    </a>
  );
}

export function Socials({ links, ap, size, className }: { links: SocialLink[]; ap: Appearance; size?: number; className?: string }) {
  if (!links.length) return null;
  return (
    <div className={cx('flex flex-wrap items-center justify-center gap-3', className)}>
      {links.map((l) => <SocialIcon key={l.id} link={l} ap={ap} size={size} />)}
    </div>
  );
}

export function Bio({ p, className }: { p: Profile; className?: string }) {
  const ap = p.appearance;
  if (ap.typewriterBio && ap.typewriterLines.filter(Boolean).length)
    return <p className={className} style={{ color: hexA(ap.textColor, 0.8) }}><Typewriter lines={ap.typewriterLines} /></p>;
  if (!p.bio) return null;
  return <p className={cx('whitespace-pre-line', className)} style={{ color: hexA(ap.textColor, 0.8) }}>{p.bio}</p>;
}

export function Location({ p, className }: { p: Profile; className?: string }) {
  if (!p.location) return null;
  return (
    <span className={cx('inline-flex items-center gap-1', className)} style={{ color: hexA(p.appearance.textColor, 0.7) }}>
      <MapPin size={14} /> {p.location}
    </span>
  );
}

export function Views({ p, className }: { p: Profile; className?: string }) {
  if (!p.appearance.showViews) return null;
  return (
    <span className={cx('inline-flex items-center gap-1 tabular-nums', className)} style={{ color: hexA(p.appearance.textColor, 0.7) }} title="Profile views">
      <Eye size={14} /> {fmt(p.views)}
    </span>
  );
}
