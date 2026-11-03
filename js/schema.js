/* Profile schema.
 *
 * BASE is the neutral profile that every share link is decoded against. Links
 * only store the fields that differ from BASE, so existing BASE values must
 * never change: that would silently restyle pages people already shared.
 * Adding new fields is fine as long as their BASE value means "off".
 */

export const MAX_LINKS = 12;
export const MAX_BADGES = 6;

export const OPTIONS = {
  linkStyle: ['list', 'grid', 'icons'],
  linkHover: ['lift', 'glow', 'shine', 'slide'],
  bgType: ['gradient', 'aurora', 'image', 'video'],
  card: ['glass', 'solid', 'outline', 'none'],
  font: ['sans', 'rounded', 'mono', 'serif'],
  avatarShape: ['circle', 'rounded', 'square'],
  avatarRing: ['solid', 'spin', 'pulse', 'none'],
  cardAnim: ['none', 'fade', 'zoom', 'blur', 'drop'],
  nameFx: ['none', 'glow', 'rainbow', 'shimmer', 'neon', 'glitch', 'wave'],
  bioFx: ['none', 'typewriter', 'rotate'],
  tabFx: ['none', 'type', 'scroll'],
  particles: ['none', 'dust', 'stars', 'snow', 'fireflies', 'rain', 'bubbles', 'hearts', 'petals', 'confetti', 'network', 'code'],
  cursorFx: ['none', 'trail', 'sparkle', 'ring'],
  clickFx: ['none', 'burst', 'ripple'],
};

const LABELS = {
  linkStyle: { icons: 'Icons only' },
  card: { none: 'No card' },
  avatarRing: { spin: 'Spinning' },
  cardAnim: { fade: 'Fade up', blur: 'Blur in', drop: 'Drop in' },
  bioFx: { rotate: 'Rotate lines' },
  tabFx: { type: 'Typing', scroll: 'Scrolling' },
  particles: { code: 'Code rain' },
  cursorFx: { trail: 'Glow trail', sparkle: 'Sparkles', ring: 'Custom ring' },
};

export const optionLabel = (field, value) =>
  LABELS[field]?.[value] ?? value.charAt(0).toUpperCase() + value.slice(1);

export const BADGES = {
  dev: ['🛠️', 'Developer'],
  gamer: ['🎮', 'Gamer'],
  artist: ['🎨', 'Artist'],
  music: ['🎧', 'Music lover'],
  creator: ['🎬', 'Creator'],
  photo: ['📷', 'Photographer'],
  writer: ['✍️', 'Writer'],
  owl: ['🌙', 'Night owl'],
  coffee: ['☕', 'Coffee powered'],
  pets: ['🐾', 'Pet person'],
  sport: ['⚽', 'Sporty'],
  travel: ['✈️', 'Traveler'],
  student: ['📚', 'Student'],
  bug: ['🐛', 'Bug hunter'],
  plant: ['🌱', 'Plant parent'],
  early: ['⭐', 'Early adopter'],
};

export const BASE = Object.freeze({
  name: '',
  avatar: '',
  bio: '',
  location: '',
  badges: Object.freeze([]),
  links: Object.freeze([]),
  linkStyle: 'list',
  linkHover: 'lift',
  favicons: false,
  discordId: '',
  discordAvatar: false,
  discordActivity: true,
  bgType: 'gradient',
  bgA: '#1b1f3a',
  bgB: '#5b2a6e',
  bgUrl: '',
  bgAnimate: false,
  dim: 30,
  blur: 0,
  parallax: false,
  vignette: false,
  grain: false,
  scanlines: false,
  accent: '#7c9cff',
  card: 'glass',
  font: 'sans',
  avatarShape: 'circle',
  avatarRing: 'solid',
  cardAnim: 'none',
  tilt: false,
  nameFx: 'none',
  bioFx: 'none',
  tabTitle: '',
  tabFx: 'none',
  particles: 'none',
  density: 1,
  particleMouse: false,
  cursorFx: 'none',
  clickFx: 'none',
  music: '',
  musicTitle: '',
  volume: 50,
  visualizer: false,
  splash: false,
  splashText: '',
  footer: true,
});

/** The example page a new visitor starts editing from. */
export const STARTER = {
  ...BASE,
  name: 'Your Name',
  bio: 'gamer · night owl · building things on the internet\ncurrently learning to draw\nsay hi on discord',
  badges: ['gamer', 'dev', 'owl'],
  links: [
    { type: 'link', label: '', value: 'https://discord.com' },
    { type: 'link', label: '', value: 'https://github.com' },
    { type: 'link', label: '', value: 'https://youtube.com' },
    { type: 'copy', label: 'Discord username', value: 'yourname' },
  ],
  favicons: true,
  bgAnimate: true,
  vignette: true,
  grain: true,
  avatarRing: 'spin',
  cardAnim: 'fade',
  tilt: true,
  nameFx: 'glow',
  bioFx: 'rotate',
  tabFx: 'type',
  particles: 'network',
  particleMouse: true,
  cursorFx: 'trail',
  clickFx: 'burst',
};

/** One-click looks. They change style only, never the profile's content. */
export const PRESETS = {
  Midnight: {
    bgType: 'gradient', bgA: '#0f1226', bgB: '#2a1b4d', bgAnimate: true, accent: '#8ea2ff',
    card: 'glass', font: 'sans', avatarShape: 'circle', avatarRing: 'spin', nameFx: 'glow',
    particles: 'stars', vignette: true, grain: false, scanlines: false, cursorFx: 'trail', clickFx: 'burst',
  },
  Sakura: {
    bgType: 'gradient', bgA: '#2b1a2e', bgB: '#7a3b5c', bgAnimate: true, accent: '#ffb7d5',
    card: 'glass', font: 'rounded', avatarShape: 'circle', avatarRing: 'pulse', nameFx: 'shimmer',
    particles: 'petals', vignette: true, grain: false, scanlines: false, cursorFx: 'sparkle', clickFx: 'burst',
  },
  Terminal: {
    bgType: 'gradient', bgA: '#010603', bgB: '#04160b', bgAnimate: false, accent: '#39ff88',
    card: 'solid', font: 'mono', avatarShape: 'square', avatarRing: 'solid', nameFx: 'glitch', bioFx: 'typewriter',
    particles: 'code', vignette: true, grain: true, scanlines: true, cursorFx: 'ring', clickFx: 'ripple',
  },
  Vapor: {
    bgType: 'aurora', bgA: '#ff71ce', bgB: '#01cdfe', accent: '#b967ff',
    card: 'glass', font: 'sans', avatarShape: 'rounded', avatarRing: 'spin', nameFx: 'rainbow', linkStyle: 'grid',
    particles: 'bubbles', vignette: false, grain: true, scanlines: false, cursorFx: 'sparkle', clickFx: 'burst',
  },
  Ember: {
    bgType: 'gradient', bgA: '#160805', bgB: '#4a1a08', bgAnimate: true, accent: '#ff8a3d',
    card: 'solid', font: 'serif', avatarShape: 'circle', avatarRing: 'pulse', nameFx: 'neon',
    particles: 'fireflies', vignette: true, grain: true, scanlines: false, cursorFx: 'trail', clickFx: 'ripple',
  },
  Frost: {
    bgType: 'gradient', bgA: '#0b1a2a', bgB: '#1d3b5a', bgAnimate: false, accent: '#9be7ff',
    card: 'glass', font: 'sans', avatarShape: 'circle', avatarRing: 'solid', nameFx: 'glow',
    particles: 'snow', vignette: true, grain: false, scanlines: false, cursorFx: 'sparkle', clickFx: 'ripple',
  },
  Candy: {
    bgType: 'aurora', bgA: '#ff8fab', bgB: '#ffd166', accent: '#ff5d8f',
    card: 'glass', font: 'rounded', avatarShape: 'rounded', avatarRing: 'pulse', nameFx: 'wave', linkHover: 'slide',
    particles: 'hearts', vignette: false, grain: false, scanlines: false, cursorFx: 'sparkle', clickFx: 'burst',
  },
  Mono: {
    bgType: 'gradient', bgA: '#0a0a0a', bgB: '#1c1c1c', bgAnimate: false, accent: '#f5f5f5',
    card: 'outline', font: 'mono', avatarShape: 'rounded', avatarRing: 'solid', nameFx: 'none',
    particles: 'network', vignette: true, grain: true, scanlines: false, cursorFx: 'ring', clickFx: 'none',
  },
};

/** Upgrades profiles saved by the first version (no `v` field). */
function migrate(p) {
  if (p.v >= 2) return p;
  const q = { ...p };
  if ('fxGlow' in p) q.nameFx = p.fxGlow ? 'glow' : 'none';
  if ('fxTypewriter' in p) q.bioFx = p.fxTypewriter ? 'typewriter' : 'none';
  if ('fxTilt' in p) q.tilt = !!p.fxTilt;
  if ('fxParticles' in p) q.particles = p.fxParticles;
  if (Array.isArray(p.links)) {
    q.links = p.links.map(l => (l && 'url' in l && !('value' in l) ? { type: 'link', label: l.label, value: l.url } : l));
  }
  return q;
}

const HEX = /^#[0-9a-f]{6}$/i;
const COLORS = new Set(['bgA', 'bgB', 'accent']);
const RANGES = { dim: [0, 90], blur: [0, 20], density: [0.25, 2], volume: [0, 100] };
const LENGTHS = { name: 40, bio: 400, location: 40, tabTitle: 60, musicTitle: 60, splashText: 40 };

/** Validates untrusted input (share links, imports, drafts) into a complete profile. */
export function clean(input) {
  const src = migrate(input && typeof input === 'object' && !Array.isArray(input) ? input : {});
  const out = {};
  for (const [key, def] of Object.entries(BASE)) {
    const v = src[key];
    if (OPTIONS[key]) out[key] = OPTIONS[key].includes(v) ? v : def;
    else if (COLORS.has(key)) out[key] = typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : def;
    else if (RANGES[key]) {
      const [lo, hi] = RANGES[key];
      const n = typeof v === 'number' || (typeof v === 'string' && v.trim()) ? Number(v) : NaN;
      out[key] = Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def;
    } else if (typeof def === 'boolean') out[key] = typeof v === 'boolean' ? v : def;
    else if (typeof def === 'string') out[key] = typeof v === 'string' ? v.slice(0, LENGTHS[key] ?? 1000) : def;
  }
  const id = String(src.discordId ?? '').trim();
  out.discordId = /^\d{15,21}$/.test(id) ? id : '';
  out.badges = [...new Set(Array.isArray(src.badges) ? src.badges : [])]
    .filter(b => typeof b === 'string' && Object.hasOwn(BADGES, b))
    .slice(0, MAX_BADGES);
  out.links = (Array.isArray(src.links) ? src.links : [])
    .filter(l => l && typeof l === 'object')
    .slice(0, MAX_LINKS)
    .map(l => ({
      type: l.type === 'copy' ? 'copy' : 'link',
      label: typeof l.label === 'string' ? l.label.slice(0, 40) : '',
      value: typeof l.value === 'string' ? l.value.slice(0, 500) : '',
    }));
  return out;
}

/** Drops fields equal to BASE so share links stay short. */
export function compact(p) {
  const out = { v: 2 };
  for (const key of Object.keys(BASE)) {
    if (JSON.stringify(p[key]) !== JSON.stringify(BASE[key])) out[key] = p[key];
  }
  return out;
}
