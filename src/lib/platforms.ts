import {
  siDiscord, siTiktok, siSpotify, siX, siGithub, siSteam, siInstagram, siYoutube, siTwitch, siRoblox,
  siSoundcloud, siTelegram, siReddit, siSnapchat, siKick, siPaypal, siCashapp, siPinterest, siThreads,
  siBluesky, siPatreon, siKofi, siApplemusic, siLastdotfm, siFacebook, siBitcoin, siEthereum, siLitecoin,
  siSolana, siNamemc, siLetterboxd, siSignal,
} from 'simple-icons';

export interface Platform {
  id: string;
  name: string;
  /** SVG path in a 24×24 box. */
  path: string;
  color: string;
  /** Builds a URL from a username; when absent the user enters a full URL. */
  template?: string;
  placeholder: string;
  /** Copy the value to the clipboard instead of opening a link. */
  copy?: boolean;
}

const LINK_PATH =
  'M10.59 13.41a1 1 0 0 0 1.41 0l4-4a3 3 0 1 0-4.24-4.24l-1.06 1.06a1 1 0 1 0 1.41 1.41l1.06-1.06a1 1 0 1 1 1.42 1.42l-4 4a1 1 0 0 0 0 1.41ZM13.41 10.59a1 1 0 0 0-1.41 0l-4 4a3 3 0 1 0 4.24 4.24l1.06-1.06a1 1 0 1 0-1.41-1.41l-1.06 1.06a1 1 0 1 1-1.42-1.42l4-4a1 1 0 0 0 0-1.41Z';
const MAIL_PATH =
  'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 2.4V17h16V7.4l-8 5.6-8-5.6ZM5.3 7 12 11.7 18.7 7H5.3Z';
const LINKEDIN_PATH =
  'M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z';

const p = (s: { path: string; hex: string }) => ({ path: s.path, color: `#${s.hex}` });

export const PLATFORMS: Platform[] = [
  { id: 'discord', name: 'Discord', ...p(siDiscord), placeholder: 'https://discord.gg/invite' },
  { id: 'discord-user', name: 'Discord username', ...p(siDiscord), placeholder: 'username', copy: true },
  { id: 'x', name: 'X', ...p(siX), color: '#ffffff', template: 'https://x.com/{}', placeholder: 'username' },
  { id: 'instagram', name: 'Instagram', ...p(siInstagram), template: 'https://instagram.com/{}', placeholder: 'username' },
  { id: 'tiktok', name: 'TikTok', ...p(siTiktok), color: '#ffffff', template: 'https://tiktok.com/@{}', placeholder: 'username' },
  { id: 'youtube', name: 'YouTube', ...p(siYoutube), template: 'https://youtube.com/@{}', placeholder: 'channel' },
  { id: 'twitch', name: 'Twitch', ...p(siTwitch), template: 'https://twitch.tv/{}', placeholder: 'username' },
  { id: 'kick', name: 'Kick', ...p(siKick), template: 'https://kick.com/{}', placeholder: 'username' },
  { id: 'github', name: 'GitHub', ...p(siGithub), color: '#ffffff', template: 'https://github.com/{}', placeholder: 'username' },
  { id: 'spotify', name: 'Spotify', ...p(siSpotify), placeholder: 'https://open.spotify.com/user/…' },
  { id: 'soundcloud', name: 'SoundCloud', ...p(siSoundcloud), template: 'https://soundcloud.com/{}', placeholder: 'username' },
  { id: 'applemusic', name: 'Apple Music', ...p(siApplemusic), placeholder: 'https://music.apple.com/…' },
  { id: 'lastfm', name: 'Last.fm', ...p(siLastdotfm), template: 'https://last.fm/user/{}', placeholder: 'username' },
  { id: 'steam', name: 'Steam', ...p(siSteam), placeholder: 'https://steamcommunity.com/id/…' },
  { id: 'roblox', name: 'Roblox', ...p(siRoblox), color: '#ffffff', placeholder: 'https://roblox.com/users/…' },
  { id: 'namemc', name: 'NameMC', ...p(siNamemc), color: '#ffffff', template: 'https://namemc.com/profile/{}', placeholder: 'username' },
  { id: 'telegram', name: 'Telegram', ...p(siTelegram), template: 'https://t.me/{}', placeholder: 'username' },
  { id: 'signal', name: 'Signal', ...p(siSignal), placeholder: 'https://signal.me/#…' },
  { id: 'reddit', name: 'Reddit', ...p(siReddit), template: 'https://reddit.com/u/{}', placeholder: 'username' },
  { id: 'snapchat', name: 'Snapchat', ...p(siSnapchat), template: 'https://snapchat.com/add/{}', placeholder: 'username' },
  { id: 'threads', name: 'Threads', ...p(siThreads), color: '#ffffff', template: 'https://threads.net/@{}', placeholder: 'username' },
  { id: 'bluesky', name: 'Bluesky', ...p(siBluesky), template: 'https://bsky.app/profile/{}', placeholder: 'handle.bsky.social' },
  { id: 'facebook', name: 'Facebook', ...p(siFacebook), template: 'https://facebook.com/{}', placeholder: 'username' },
  { id: 'linkedin', name: 'LinkedIn', path: LINKEDIN_PATH, color: '#0a66c2', template: 'https://linkedin.com/in/{}', placeholder: 'username' },
  { id: 'pinterest', name: 'Pinterest', ...p(siPinterest), template: 'https://pinterest.com/{}', placeholder: 'username' },
  { id: 'letterboxd', name: 'Letterboxd', ...p(siLetterboxd), template: 'https://letterboxd.com/{}', placeholder: 'username' },
  { id: 'patreon', name: 'Patreon', ...p(siPatreon), color: '#ffffff', template: 'https://patreon.com/{}', placeholder: 'username' },
  { id: 'kofi', name: 'Ko-fi', ...p(siKofi), template: 'https://ko-fi.com/{}', placeholder: 'username' },
  { id: 'paypal', name: 'PayPal', ...p(siPaypal), template: 'https://paypal.me/{}', placeholder: 'username' },
  { id: 'cashapp', name: 'Cash App', ...p(siCashapp), template: 'https://cash.app/${}', placeholder: 'cashtag' },
  { id: 'bitcoin', name: 'Bitcoin', ...p(siBitcoin), placeholder: 'wallet address', copy: true },
  { id: 'ethereum', name: 'Ethereum', ...p(siEthereum), color: '#8c8cf7', placeholder: 'wallet address', copy: true },
  { id: 'litecoin', name: 'Litecoin', ...p(siLitecoin), color: '#a6a9aa', placeholder: 'wallet address', copy: true },
  { id: 'solana', name: 'Solana', ...p(siSolana), placeholder: 'wallet address', copy: true },
  { id: 'email', name: 'Email', path: MAIL_PATH, color: '#ffffff', placeholder: 'you@example.com' },
  { id: 'website', name: 'Website', path: LINK_PATH, color: '#ffffff', placeholder: 'https://example.com' },
];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((x) => [x.id, x]));

export function platform(id: string): Platform {
  return PLATFORM_MAP[id] ?? PLATFORM_MAP.website;
}

/** Turns what the user typed into a value that is safe to render. Returns null if invalid. */
export function normalizeLink(platformId: string, raw: string): string | null {
  const pl = platform(platformId);
  const v = raw.trim();
  if (!v) return null;
  if (pl.copy) return v.slice(0, 200);
  if (pl.id === 'email') return /^\S+@\S+\.\S+$/.test(v) ? `mailto:${v.replace(/^mailto:/, '')}` : null;
  if (pl.template && !/^https?:\/\//i.test(v) && !v.includes('/')) {
    return pl.template.replace('{}', encodeURIComponent(v.replace(/^@/, '')));
  }
  return safeUrl(/^https?:\/\//i.test(v) ? v : `https://${v}`);
}

export function safeUrl(u: string): string | null {
  try {
    const x = new URL(u);
    return x.protocol === 'https:' || x.protocol === 'http:' || x.protocol === 'mailto:' ? x.toString() : null;
  } catch {
    return null;
  }
}

export function PlatformIconPath(id: string) {
  return platform(id).path;
}
