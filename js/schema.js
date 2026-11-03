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
  scene: ['none', 'galaxy', 'orb', 'liquid', 'waves', 'warp', 'shapes'],
  linkStyle: ['list', 'grid', 'icons'],
  linkHover: ['lift', 'glow', 'shine', 'slide', 'magnetic'],
  bgType: ['gradient', 'aurora', 'image', 'video'],
  shine: ['none', 'glare', 'holo'],
  card: ['glass', 'solid', 'outline', 'none'],
  font: ['sans', 'rounded', 'mono', 'serif'],
  avatarShape: ['circle', 'rounded', 'square'],
  avatarRing: ['solid', 'spin', 'pulse', 'none'],
  cardAnim: ['none', 'fade', 'zoom', 'blur', 'drop'],
  nameFx: ['none', 'glow', 'rainbow', 'shimmer', 'neon', 'glitch', 'wave', 'decode'],
  bioFx: ['none', 'typewriter', 'rotate'],
  tabFx: ['none', 'type', 'scroll'],
  particles: ['none', 'dust', 'stars', 'snow', 'fireflies', 'rain', 'bubbles', 'hearts', 'petals', 'confetti', 'network', 'code'],
  cursorFx: ['none', 'trail', 'sparkle', 'ring'],
  clickFx: ['none', 'burst', 'ripple'],
};

const LABELS = {
  scene: {
    none: 'Off', galaxy: 'Galaxy', orb: 'Morphing orb', liquid: 'Liquid gradient',
    waves: 'Particle waves', warp: 'Hyperspace', shapes: 'Glossy shapes',
  },
  shine: { none: 'None', glare: 'Glare', holo: 'Holographic' },
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
  scene: 'none',
  shine: 'none',
  react: false,
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
  scene: 'galaxy',
  bgA: '#05040c',
  bgB: '#3b1d6e',
  accent: '#9db4ff',
  dim: 10,
  vignette: true,
  avatarRing: 'spin',
  cardAnim: 'fade',
  tilt: true,
  shine: 'glare',
  nameFx: 'decode',
  bioFx: 'rotate',
  tabFx: 'type',
  linkHover: 'magnetic',
  cursorFx: 'trail',
  clickFx: 'burst',
};

/** Style fields every theme sets, so switching themes never leaves odd leftovers. */
export const PRESET_BASE = {
  scene: 'none', shine: 'none', dim: 30, bgType: 'gradient', bgAnimate: false, parallax: false,
  vignette: false, grain: false, scanlines: false, particles: 'none', linkStyle: 'list',
  linkHover: 'lift', cardAnim: 'fade', nameFx: 'none',
};

/** One-click looks. They change style only, never the profile's content. */
export const PRESETS = {
  Nebula: {
    scene: 'galaxy', bgA: '#05040c', bgB: '#3b1d6e', accent: '#9db4ff', dim: 10,
    card: 'glass', font: 'sans', avatarShape: 'circle', avatarRing: 'spin', nameFx: 'decode', shine: 'glare',
    vignette: true, linkHover: 'magnetic', cursorFx: 'trail', clickFx: 'burst',
  },
  Liquid: {
    scene: 'liquid', bgA: '#2b1166', bgB: '#06607a', accent: '#ff6ec7', dim: 0,
    card: 'glass', font: 'rounded', avatarShape: 'rounded', avatarRing: 'pulse', nameFx: 'shimmer', shine: 'holo',
    grain: true, linkHover: 'magnetic', cursorFx: 'sparkle', clickFx: 'ripple',
  },
  Orb: {
    scene: 'orb', bgA: '#070b18', bgB: '#1c2f6b', accent: '#5eead4', dim: 5,
    card: 'glass', font: 'sans', avatarShape: 'circle', avatarRing: 'solid', nameFx: 'glow', shine: 'holo',
    vignette: true, linkHover: 'glow', cursorFx: 'ring', clickFx: 'ripple',
  },
  Hyperdrive: {
    scene: 'warp', bgA: '#000000', bgB: '#0a1030', accent: '#7cc4ff', dim: 0,
    card: 'solid', font: 'mono', avatarShape: 'square', avatarRing: 'solid', nameFx: 'decode', shine: 'glare',
    vignette: true, scanlines: true, linkHover: 'magnetic', cursorFx: 'ring', clickFx: 'burst',
  },
  Tide: {
    scene: 'waves', bgA: '#02060f', bgB: '#0b2f57', accent: '#4de1ff', dim: 0,
    card: 'glass', font: 'sans', avatarShape: 'circle', avatarRing: 'pulse', nameFx: 'glow', shine: 'glare',
    vignette: true, linkHover: 'lift', cursorFx: 'trail', clickFx: 'ripple',
  },
  Gloss: {
    scene: 'shapes', bgA: '#0f0c18', bgB: '#2b1d3f', accent: '#ff8fc7', dim: 0, bgAnimate: true,
    card: 'glass', font: 'rounded', avatarShape: 'rounded', avatarRing: 'spin', nameFx: 'shimmer', shine: 'holo',
    vignette: true, grain: true, linkHover: 'magnetic', cursorFx: 'sparkle', clickFx: 'burst',
  },
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
