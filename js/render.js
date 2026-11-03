/* Renders a (cleaned) profile into a stage element. Profiles come from links
 * anyone can craft, so text only ever goes in through textContent and every
 * URL passes through safeUrl/linkHref first. */
import { el, safeUrl, linkHref, platformOf, readableOn, hexToRgb, reduceMotion, finePointer } from './util.js';
import { BADGES } from './schema.js';
import { startParticles } from './fx/particles.js';
import { startPointerFx } from './fx/pointer.js';
import { nameEl, typeBio, animateTitle, decodeName } from './fx/text.js';
import { createPlayer } from './music.js';
import { startPresence } from './discord.js';
import { mount3D } from './three/engine.js';

const cleanups = new WeakMap();
let grainUrl = '';

/**
 * opts.preview – editor preview: leaves the tab title and favicon alone
 * opts.splash  – allow the "click to enter" screen (default true)
 * opts.animate – play the card entrance animation (default true)
 * opts.notice  – called with non-fatal problems worth showing in the editor
 */
export function render(stage, p, opts = {}) {
  const { preview = false, splash = true, animate = true, notice } = opts;
  cleanups.get(stage)?.();
  const stops = [];
  const add = stop => stops.push(stop);
  cleanups.set(stage, () => {
    for (const stop of stops.splice(0)) {
      try {
        stop();
      } catch (e) {
        console.warn(e);
      }
    }
  });

  const motion = !reduceMotion;
  stage.replaceChildren();
  stage.className = `stage ${preview ? 'preview' : 'full'} font-${p.font} hover-${p.linkHover}${p.scene !== 'none' ? ' has-3d' : ''}`;
  const vars = {
    '--accent': p.accent,
    '--accent-rgb': hexToRgb(p.accent).join(', '),
    '--on-accent': readableOn(p.accent),
    '--bg-a': p.bgA,
    '--bg-b': p.bgB,
  };
  for (const [k, v] of Object.entries(vars)) stage.style.setProperty(k, v);

  // Background, 3D scene, dimming and particles
  let player = null;
  const bg = background(p);
  const dim = el('div', 'dim');
  dim.style.opacity = String(p.dim / 100);
  stage.append(bg, dim);
  if (p.scene !== 'none') {
    add(mount3D(stage, p, { before: dim, notice, audio: () => (p.react ? player?.levels() : null) }));
  }
  if (p.vignette) stage.append(el('div', 'ov ov-vignette'));
  if (p.particles !== 'none' && motion) {
    add(startParticles(stage, p.particles, { accent: p.accent, density: p.density, mouse: p.particleMouse }));
  }
  if (p.parallax && finePointer && motion) add(follow(stage, bg, (x, y) => `translate3d(${-x * 28}px, ${-y * 28}px, 0)`));

  // Card
  const content = el('div', 'content');
  const tilt = el('div', 'tilt');
  const card = el('article', `card card-${p.card}`);
  tilt.append(card);
  content.append(tilt);
  stage.append(content);

  const avatar = el('div', `avatar-wrap shape-${p.avatarShape} ring-${p.avatarRing}`);
  avatar.append(fallbackAvatar(p.name));
  const setAvatar = url => {
    const img = el('img', 'avatar');
    img.alt = '';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => img.replaceWith(fallbackAvatar(p.name)));
    img.src = url;
    avatar.querySelector('.avatar').replaceWith(img);
    if (!preview) setFavicon(url);
  };
  const avatarUrl = safeUrl(p.avatar);
  if (avatarUrl) setAvatar(avatarUrl);

  const musicUrl = safeUrl(p.music);
  const viz = musicUrl && p.visualizer && motion ? el('canvas', 'viz') : null;
  if (viz) {
    viz.hidden = true;
    viz.setAttribute('aria-hidden', 'true');
    avatar.append(viz);
  }
  const dot = el('span', 'status-dot');
  dot.hidden = true;
  dot.setAttribute('role', 'img');
  avatar.append(dot);
  const name = nameEl(p.name, p.nameFx);
  card.append(avatar, name);
  if (p.shine !== 'none') {
    card.classList.add(`shine-${p.shine}`);
    card.append(el('div', 'shine'));
    if (finePointer && motion) add(trackShine(stage, card));
  }

  if (p.badges.length) card.append(badgeRow(p.badges));
  if (p.location) card.append(el('p', 'location', `⌖ ${p.location}`));
  const dcStatus = el('p', 'dc-status');
  dcStatus.hidden = true;
  const bio = el('p', 'bio');
  bio.hidden = !p.bio;
  const activity = el('div', 'dc-activity');
  activity.hidden = true;
  card.append(dcStatus, bio, activity);
  const links = buildLinks(p);
  if (links) {
    card.append(links);
    if (p.linkHover === 'magnetic' && finePointer && motion) add(magnetic(links));
  }

  if (p.footer) {
    const foot = el('div', 'made-with');
    const a = el('a', null, 'make your own');
    a.href = location.pathname;
    if (preview) a.addEventListener('click', e => e.preventDefault());
    foot.append(a);
    content.append(foot);
  }

  // Overlays that sit above the card
  if (p.grain) {
    const g = el('div', 'ov ov-grain');
    g.style.backgroundImage = `url(${grainTexture()})`;
    stage.append(g);
  }
  if (p.scanlines) stage.append(el('div', 'ov ov-scanlines'));

  // Behaviour
  if (p.tilt && finePointer && motion) {
    add(follow(stage, tilt, (x, y) => `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`));
  }
  if (p.discordId) {
    add(startPresence(p.discordId, {
      dot, statusLine: dcStatus, box: activity, setAvatar,
      useAvatar: p.discordAvatar, showActivity: p.discordActivity, notice,
    }));
  }
  if (musicUrl) {
    player = createPlayer(stage, {
      url: musicUrl, title: p.musicTitle, volume: p.volume, accent: p.accent, vizCanvas: viz, analyse: p.react,
    });
    add(player.stop);
    if (p.react && motion) add(pulseWithBeat(card, player));
  }
  add(startPointerFx(stage, { cursor: p.cursorFx, click: p.clickFx, accent: p.accent }));
  if (!preview) add(animateTitle(p.tabTitle.trim() || p.name.trim() || 'halo', p.tabFx));

  // Entrance: runs right away, or after the "click to enter" screen.
  const entrance = animate && motion && p.cardAnim !== 'none' ? `enter-${p.cardAnim}` : '';
  if (entrance) card.classList.add('pre-enter');
  let started = false;
  const start = withSound => {
    if (started) return;
    started = true;
    if (entrance) card.classList.replace('pre-enter', entrance);
    add(typeBio(bio, p.bio, p.bioFx));
    if (p.nameFx === 'decode') add(decodeName(name, animate));
    if (withSound) player?.play();
  };

  if (splash && (p.splash || musicUrl)) {
    const s = el('button', 'splash');
    s.type = 'button';
    s.append(el('span', null, p.splashText.trim() || 'click to enter'));
    s.addEventListener('click', () => {
      s.classList.add('out');
      setTimeout(() => s.remove(), 650);
      start(true);
    }, { once: true });
    stage.append(s);
    if (!preview) s.focus({ preventScroll: true });
  } else {
    start(false);
  }
}

/* ---------- pieces ---------- */

function background(p) {
  const layer = el('div', 'bg-layer');
  const url = safeUrl(p.bgUrl);
  const gradient = () => {
    layer.replaceChildren();
    layer.className = `bg-layer gradient${p.bgAnimate && !reduceMotion ? ' animate' : ''}`;
  };
  if ((p.bgType === 'image' || p.bgType === 'video') && url) {
    const media = el(p.bgType === 'image' ? 'img' : 'video', 'bg-media');
    if (p.bgType === 'image') {
      media.alt = '';
      media.referrerPolicy = 'no-referrer';
    } else {
      Object.assign(media, { muted: true, defaultMuted: true, loop: true, autoplay: true, playsInline: true });
      media.setAttribute('playsinline', '');
    }
    media.addEventListener('error', gradient); // broken URL: fall back to the gradient
    if (p.blur) media.style.filter = `blur(${p.blur}px)`;
    media.src = url;
    layer.append(media);
  } else if (p.bgType === 'aurora') {
    layer.classList.add('aurora');
    layer.append(el('i', 'blob b1'), el('i', 'blob b2'), el('i', 'blob b3'));
  } else {
    gradient();
  }
  return layer;
}

/** Moves `target` with the pointer: transform(x, y) gets x, y in -0.5..0.5. */
function follow(stage, target, transform) {
  const move = e => {
    const r = stage.getBoundingClientRect();
    const x = Math.min(0.5, Math.max(-0.5, (e.clientX - r.left) / r.width - 0.5));
    const y = Math.min(0.5, Math.max(-0.5, (e.clientY - r.top) / r.height - 0.5));
    target.style.transform = transform(x, y);
  };
  const leave = () => (target.style.transform = '');
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerleave', leave);
  return () => {
    stage.removeEventListener('pointermove', move);
    stage.removeEventListener('pointerleave', leave);
  };
}

/** Glare/holo shine: a light spot that follows the pointer across the card. */
function trackShine(stage, card) {
  const move = e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const near = x > -0.15 && x < 1.15 && y > -0.15 && y < 1.15;
    card.style.setProperty('--px', x.toFixed(3));
    card.style.setProperty('--py', y.toFixed(3));
    card.style.setProperty('--shine-o', near ? '1' : '0');
  };
  const leave = () => card.style.setProperty('--shine-o', '0');
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerleave', leave);
  return () => {
    stage.removeEventListener('pointermove', move);
    stage.removeEventListener('pointerleave', leave);
  };
}

/** Magnetic links lean toward the pointer while it's over them. */
function magnetic(list) {
  let current = null;
  const reset = a => {
    a.style.setProperty('--dx', '0');
    a.style.setProperty('--dy', '0');
  };
  const move = e => {
    const a = e.target.closest('.link');
    if (current && current !== a) reset(current);
    current = a;
    if (!a) return;
    const r = a.getBoundingClientRect();
    a.style.setProperty('--dx', ((e.clientX - (r.left + r.width / 2)) * 0.18).toFixed(1));
    a.style.setProperty('--dy', ((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1));
  };
  const leave = () => {
    if (current) reset(current);
    current = null;
  };
  list.addEventListener('pointermove', move);
  list.addEventListener('pointerleave', leave);
  return () => {
    list.removeEventListener('pointermove', move);
    list.removeEventListener('pointerleave', leave);
  };
}

/** "React to music": the card glows and the avatar swells on each beat. */
function pulseWithBeat(card, player) {
  card.classList.add('reactive');
  let raf = 0;
  let shown = '';
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const beat = (player.levels()?.beat ?? 0).toFixed(2);
    if (beat !== shown) card.style.setProperty('--beat', (shown = beat));
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

function fallbackAvatar(name) {
  const initial = Array.from(name.trim())[0] || '?';
  return el('div', 'avatar avatar-fallback', initial.toUpperCase());
}

function setFavicon(url) {
  let link = document.querySelector('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.append(link);
  }
  link.href = url;
}

function badgeRow(ids) {
  const row = el('div', 'badges');
  for (const id of ids) {
    const [emoji, label] = BADGES[id];
    const b = el('span', 'badge', emoji);
    b.dataset.tip = label;
    b.tabIndex = 0;
    b.setAttribute('role', 'img');
    b.setAttribute('aria-label', label);
    row.append(b);
  }
  return row;
}

function buildLinks(p) {
  const list = el('ul', `links links-${p.linkStyle}`);
  for (const l of p.links) {
    const item = l.type === 'copy' ? copyItem(l) : linkItem(l, p.favicons);
    if (!item) continue;
    const li = el('li');
    li.style.setProperty('--i', String(list.children.length));
    if (p.linkStyle === 'icons') {
      li.dataset.tip = item.label;
      item.node.setAttribute('aria-label', item.aria || item.label);
    }
    li.append(item.node);
    list.append(li);
  }
  return list.children.length ? list : null;
}

function linkItem(l, favicons) {
  const href = linkHref(l.value);
  if (!href) return null;
  const mail = href.startsWith('mailto:');
  const url = new URL(href);
  const plat = mail ? null : platformOf(href);
  const sub = mail ? decodeSafe(href.slice(7).split('?')[0]) : url.hostname.replace(/^www\./, '');
  const label = l.label.trim() || plat?.name || sub;
  const a = el('a', 'link');
  a.href = href;
  if (!mail) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  const favicon = favicons && !mail ? `${url.origin}/favicon.ico` : '';
  a.append(icon(mail ? '✉' : initial(label), plat?.color, favicon), texts(label, sub), arrow());
  return { node: a, label };
}

function copyItem(l) {
  const value = l.value.trim();
  if (!value) return null;
  const label = l.label.trim() || value;
  const b = el('button', 'link');
  b.type = 'button';
  const t = texts(label, value);
  b.append(icon('⧉'), t);
  let timer = 0;
  b.addEventListener('click', async () => {
    const ok = await copyText(value);
    const msg = ok ? 'Copied!' : 'Copy failed';
    const sub = t.lastChild;
    const li = b.parentElement;
    sub.textContent = msg;
    b.classList.add('copied');
    if (li.dataset.tip) {
      li.dataset.tip = msg;
      li.classList.add('tip-on');
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      sub.textContent = value;
      b.classList.remove('copied');
      if (li.dataset.tip) {
        li.dataset.tip = label;
        li.classList.remove('tip-on');
      }
    }, 1500);
  });
  return { node: b, label, aria: `${label}: copy ${value}` };
}

function icon(text, color, favicon) {
  const ico = el('span', 'ico', text);
  ico.setAttribute('aria-hidden', 'true');
  if (color) {
    ico.style.setProperty('--ico-bg', color);
    ico.style.setProperty('--ico-fg', readableOn(color));
  }
  if (favicon) {
    // Show the site's own icon once it loads; keep the letter tile if it doesn't.
    const img = new Image();
    img.alt = '';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('load', () => {
      if (img.naturalWidth < 2) return;
      ico.replaceChildren(img);
      ico.classList.add('fav');
    });
    img.src = favicon;
  }
  return ico;
}

function texts(label, sub) {
  const t = el('span', 'txt');
  t.append(el('span', 'lbl', label), el('span', 'sub', sub));
  return t;
}

function arrow() {
  const a = el('span', 'arrow', '↗');
  a.setAttribute('aria-hidden', 'true');
  return a;
}

const initial = label => (Array.from(label.trim())[0] || '•').toUpperCase();

function decodeSafe(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers, or clipboard permission denied: use a hidden textarea.
    const ta = el('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;opacity:0';
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {}
    ta.remove();
    return ok;
  }
}

function grainTexture() {
  if (grainUrl) return grainUrl;
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return (grainUrl = c.toDataURL());
}
