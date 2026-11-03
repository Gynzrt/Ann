export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

export function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = list => list[Math.floor(Math.random() * list.length)];

/** Returns the normalised URL if it parses and uses an allowed scheme, else ''. */
export function safeUrl(raw, schemes = ['http:', 'https:']) {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  try {
    const u = new URL(raw.trim());
    return schemes.includes(u.protocol) ? u.href : '';
  } catch {
    return '';
  }
}

/** Like safeUrl for links, but forgiving: "github.com/me" and "me@mail.com" work too. */
export function linkHref(raw) {
  let v = typeof raw === 'string' ? raw.trim() : '';
  if (!v) return '';
  if (/^[^\s@/:]+@[^\s@/]+\.[a-z]{2,}$/i.test(v)) v = `mailto:${v}`;
  else if (!/^[a-z][a-z0-9+.-]*:/i.test(v) && /^[\w-]+(\.[\w-]+)+([/?#]|$)/.test(v)) v = `https://${v}`;
  return safeUrl(v, ['http:', 'https:', 'mailto:']);
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Picks dark or white text for the given background colour. */
export function readableOn(hex) {
  const [r, g, b] = hexToRgb(hex).map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? '#0b0d14' : '#ffffff';
}

// Known sites get their name as the default label and a matching tile colour.
const PLATFORMS = [
  [['discord.com', 'discord.gg'], 'Discord', '#5865f2'],
  [['github.com'], 'GitHub', '#6e7681'],
  [['youtube.com', 'youtu.be'], 'YouTube', '#ff0033'],
  [['twitch.tv'], 'Twitch', '#9146ff'],
  [['x.com', 'twitter.com'], 'X', '#e7e9ea'],
  [['instagram.com'], 'Instagram', '#e1306c'],
  [['tiktok.com'], 'TikTok', '#fe2c55'],
  [['spotify.com'], 'Spotify', '#1ed760'],
  [['soundcloud.com'], 'SoundCloud', '#ff5500'],
  [['steamcommunity.com', 'steampowered.com'], 'Steam', '#66c0f4'],
  [['reddit.com'], 'Reddit', '#ff4500'],
  [['linkedin.com'], 'LinkedIn', '#0a66c2'],
  [['bsky.app'], 'Bluesky', '#1185fe'],
  [['threads.net', 'threads.com'], 'Threads', '#e7e9ea'],
  [['t.me', 'telegram.me', 'telegram.org'], 'Telegram', '#26a5e4'],
  [['kick.com'], 'Kick', '#53fc18'],
  [['roblox.com'], 'Roblox', '#e2231a'],
  [['pinterest.com'], 'Pinterest', '#e60023'],
  [['facebook.com', 'fb.com'], 'Facebook', '#1877f2'],
  [['snapchat.com'], 'Snapchat', '#fffc00'],
  [['patreon.com'], 'Patreon', '#ff424d'],
  [['ko-fi.com'], 'Ko-fi', '#ff5e5b'],
  [['buymeacoffee.com'], 'Buy Me a Coffee', '#ffdd00'],
  [['paypal.com', 'paypal.me'], 'PayPal', '#009cde'],
  [['cash.app'], 'Cash App', '#00d64f'],
  [['last.fm'], 'Last.fm', '#d51007'],
  [['letterboxd.com'], 'Letterboxd', '#00e054'],
  [['behance.net'], 'Behance', '#1769ff'],
  [['dribbble.com'], 'Dribbble', '#ea4c89'],
  [['medium.com'], 'Medium', '#e7e9ea'],
  [['substack.com'], 'Substack', '#ff6719'],
  [['tumblr.com'], 'Tumblr', '#5b7a9d'],
  [['vk.com'], 'VK', '#0077ff'],
  [['mastodon.social'], 'Mastodon', '#6364ff'],
];

export function platformOf(href) {
  let host;
  try {
    host = new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
  if (!host) return null;
  for (const [domains, name, color] of PLATFORMS) {
    if (domains.some(d => host === d || host.endsWith(`.${d}`))) return { name, color };
  }
  return null;
}
