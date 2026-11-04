/* The dashboard: every setting of the page in one wide, searchable screen.
 * It edits the same draft (localStorage) as the editor, so both stay in sync. */
import { el, linkHref, platformOf } from './util.js';
import { STARTER, OPTIONS, BADGES, PRESETS, PRESET_BASE, MAX_BADGES, MAX_LINKS, clean, optionLabel } from './schema.js';
import { encode } from './codec.js';

const DRAFT_KEY = 'halo:draft';

/* ----- what the dashboard shows ----- */

const SECTIONS = [
  { id: 'themes', title: 'Themes', icon: '✦', custom: 'themes' },
  {
    id: 'assets', title: 'Assets', icon: '▣', cols: 4,
    fields: [
      { key: 'bgUrl', label: 'Background image or video', type: 'url', placeholder: 'https://… (.jpg, .png, .mp4)' },
      { key: 'music', label: 'Audio', type: 'url', placeholder: 'https://… (.mp3, .ogg)' },
      { key: 'avatar', label: 'Profile avatar', type: 'url', placeholder: 'https://… (.png, .jpg, .gif)' },
      { key: 'musicTitle', label: 'Track title', type: 'text', placeholder: 'Shown in the player', max: 60 },
    ],
  },
  {
    id: 'general', title: 'General', icon: '☰', cols: 4,
    fields: [
      { key: 'name', label: 'Display name', type: 'text', max: 40 },
      { key: 'location', label: 'Location', type: 'text', max: 40, placeholder: 'City, Country' },
      { key: 'discordId', label: 'Discord user ID', type: 'text', placeholder: '123456789012345678', hint: 'Live status through Lanyard' },
      { key: 'tabTitle', label: 'Browser tab title', type: 'text', max: 60, placeholder: 'Defaults to your name' },
      { key: 'bio', label: 'Description', type: 'textarea', max: 400, wide: 2, placeholder: 'One phrase per line' },
      { key: 'dim', label: 'Background dim', type: 'range', min: 0, max: 90, step: 5, unit: '%' },
      { key: 'blur', label: 'Background blur', type: 'range', min: 0, max: 20, step: 1, unit: 'px' },
    ],
  },
  {
    id: 'colors', title: 'Colors', icon: '◐', cols: 3,
    fields: [
      { key: 'accent', label: 'Accent color', type: 'color' },
      { key: 'bgA', label: 'Background color A', type: 'color' },
      { key: 'bgB', label: 'Background color B', type: 'color' },
    ],
  },
  {
    id: 'scene', title: '3D & background', icon: '◈', cols: 4,
    fields: [
      { key: 'scene', label: '3D scene', type: 'select' },
      { key: 'bgType', label: 'Background type', type: 'select' },
      { key: 'particles', label: 'Particles', type: 'select' },
      { key: 'density', label: 'Particle amount', type: 'range', min: 0.25, max: 2, step: 0.25, unit: '×' },
      { key: 'bgAnimate', label: 'Animate gradient', type: 'toggle' },
      { key: 'parallax', label: 'Mouse parallax', type: 'toggle' },
      { key: 'particleMouse', label: 'Particles react to mouse', type: 'toggle' },
      { key: 'vignette', label: 'Vignette', type: 'toggle' },
      { key: 'grain', label: 'Film grain', type: 'toggle' },
      { key: 'scanlines', label: 'Scanlines', type: 'toggle' },
    ],
  },
  {
    id: 'effects', title: 'Effects', icon: '✺', cols: 4,
    fields: [
      { key: 'nameFx', label: 'Username effect', type: 'select' },
      { key: 'bioFx', label: 'Description effect', type: 'select' },
      { key: 'cursorFx', label: 'Cursor effect', type: 'select' },
      { key: 'clickFx', label: 'Click effect', type: 'select' },
      { key: 'cardAnim', label: 'Entrance animation', type: 'select' },
      { key: 'shine', label: 'Card shine', type: 'select' },
      { key: 'tabFx', label: 'Tab title effect', type: 'select' },
      { key: 'tilt', label: '3D card tilt', type: 'toggle' },
    ],
  },
  {
    id: 'card', title: 'Card & avatar', icon: '▢', cols: 4,
    fields: [
      { key: 'card', label: 'Card style', type: 'select' },
      { key: 'font', label: 'Font', type: 'select' },
      { key: 'avatarShape', label: 'Avatar shape', type: 'select' },
      { key: 'avatarRing', label: 'Avatar ring', type: 'select' },
    ],
  },
  {
    id: 'links', title: 'Links', icon: '⛓', custom: 'links', cols: 4,
    fields: [
      { key: 'linkStyle', label: 'Layout', type: 'select' },
      { key: 'linkHover', label: 'Hover effect', type: 'select' },
      { key: 'favicons', label: 'Show site icons', type: 'toggle' },
    ],
  },
  { id: 'badges', title: 'Badges', icon: '★', custom: 'badges' },
  {
    id: 'audio', title: 'Audio', icon: '♪', cols: 4,
    fields: [
      { key: 'volume', label: 'Volume', type: 'range', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'visualizer', label: 'Visualizer around avatar', type: 'toggle' },
      { key: 'react', label: 'Effects react to the music', type: 'toggle' },
      { key: 'splash', label: '“Click to enter” screen', type: 'toggle' },
      { key: 'splashText', label: 'Enter screen text', type: 'text', max: 40, placeholder: 'click to enter' },
    ],
  },
  {
    id: 'discord', title: 'Discord', icon: '◉', cols: 3,
    fields: [
      { key: 'discordAvatar', label: 'Use Discord avatar', type: 'toggle' },
      { key: 'discordActivity', label: 'Show activity', type: 'toggle' },
      { key: 'footer', label: 'Show “make your own” link', type: 'toggle' },
    ],
  },
];

/* ----- state ----- */

let state = loadDraft();
const inputs = new Map(); // key -> { node, sync() }

function loadDraft() {
  try {
    return clean(JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') || STARTER);
  } catch {
    return clean(STARTER);
  }
}

let statusTimer = 0;
function setStatus(msg) {
  const s = document.getElementById('status');
  s.textContent = msg;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => (s.textContent = ''), 2500);
}

function save(quiet) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ v: 2, ...state }));
    if (!quiet) setStatus('Saved');
  } catch {
    setStatus('Couldn’t save in this browser');
  }
}

function set(changes) {
  state = clean({ v: 2, ...state, ...changes });
  save();
}

function syncAll() {
  for (const { sync } of inputs.values()) sync();
  renderLinks();
  renderBadges();
}

/* ----- controls ----- */

function field(f) {
  const wrap = el('div', `field${f.wide ? ` wide-${f.wide}` : ''}`);
  wrap.dataset.search = `${f.label} ${f.hint || ''}`.toLowerCase();
  const id = `f-${f.key}`;
  const head = el('label', 'f-label', f.label);
  head.htmlFor = id;
  wrap.append(head);
  let node;
  let sync;

  if (f.type === 'select') {
    node = el('select', 'control');
    for (const v of OPTIONS[f.key]) node.append(new Option(optionLabel(f.key, v), v));
    node.addEventListener('change', () => set({ [f.key]: node.value }));
    sync = () => (node.value = state[f.key]);
  } else if (f.type === 'toggle') {
    node = el('button', 'switch');
    node.type = 'button';
    node.setAttribute('role', 'switch');
    head.htmlFor = '';
    head.addEventListener('click', () => node.click());
    node.setAttribute('aria-label', f.label);
    node.addEventListener('click', () => {
      set({ [f.key]: !state[f.key] });
      sync();
    });
    sync = () => node.setAttribute('aria-checked', String(!!state[f.key]));
  } else if (f.type === 'range') {
    const box = el('div', 'range');
    node = el('input');
    Object.assign(node, { type: 'range', min: f.min, max: f.max, step: f.step });
    const out = el('span', 'range-val');
    const ticks = el('div', 'ticks');
    for (let i = 0; i <= 4; i++) {
      const v = f.min + ((f.max - f.min) * i) / 4;
      ticks.append(el('span', null, `${+v.toFixed(2)}${f.unit}`));
    }
    box.append(node, out);
    wrap.append(box, ticks);
    const label = () => (out.textContent = `${state[f.key]}${f.unit}`);
    node.addEventListener('input', () => {
      set({ [f.key]: Number(node.value) });
      label();
    });
    sync = () => {
      node.value = state[f.key];
      label();
    };
    node.id = id;
    inputs.set(f.key, { node, sync });
    return wrap;
  } else if (f.type === 'color') {
    const box = el('div', 'color');
    node = el('input');
    node.type = 'color';
    const hex = el('input', 'hex');
    hex.maxLength = 7;
    hex.setAttribute('aria-label', `${f.label} hex value`);
    box.append(node, hex);
    wrap.append(box);
    node.addEventListener('input', () => {
      set({ [f.key]: node.value });
      hex.value = node.value;
    });
    hex.addEventListener('input', () => {
      if (/^#[0-9a-f]{6}$/i.test(hex.value)) {
        set({ [f.key]: hex.value });
        node.value = hex.value.toLowerCase();
      }
    });
    sync = () => (node.value = hex.value = state[f.key]);
    node.id = id;
    inputs.set(f.key, { node, sync });
    return wrap;
  } else {
    node = el(f.type === 'textarea' ? 'textarea' : 'input', 'control');
    if (f.type !== 'textarea') node.type = f.type === 'url' ? 'url' : 'text';
    if (f.type === 'textarea') node.rows = 3;
    if (f.max) node.maxLength = f.max;
    if (f.placeholder) node.placeholder = f.placeholder;
    node.addEventListener('input', () => {
      set({ [f.key]: node.value });
      if (f.key === 'discordId') node.classList.toggle('invalid', !!node.value.trim() && !state.discordId);
    });
    sync = () => (node.value = state[f.key]);
  }
  node.id = id;
  wrap.append(node);
  if (f.hint) wrap.append(el('p', 'f-hint', f.hint));
  inputs.set(f.key, { node, sync });
  return wrap;
}

/* ----- custom sections ----- */

function themes(body) {
  const grid = el('div', 'themes');
  for (const [name, preset] of Object.entries(PRESETS)) {
    const b = el('button', 'theme');
    b.type = 'button';
    b.dataset.search = `${name} theme`.toLowerCase();
    const sw = el('span', 'theme-sw');
    sw.style.background = `linear-gradient(135deg, ${preset.bgA}, ${preset.bgB})`;
    sw.style.setProperty('--dot', preset.accent);
    if (preset.scene && preset.scene !== 'none') sw.append(el('span', 'tag', '3D'));
    b.append(sw, el('span', null, name));
    b.addEventListener('click', () => {
      set({ ...PRESET_BASE, ...preset });
      syncAll();
      setStatus(`Applied ${name}`);
    });
    grid.append(b);
  }
  body.append(grid);
}

let linksBox;
function linksEditor(body) {
  const wrap = el('div', 'field wide-4');
  wrap.dataset.search = 'links add link socials copy';
  linksBox = el('div', 'link-list');
  const add = el('button', 'btn dashed', '+ Add link');
  add.type = 'button';
  add.addEventListener('click', () => {
    if (state.links.length >= MAX_LINKS) return setStatus(`Up to ${MAX_LINKS} links`);
    set({ links: [...state.links, { type: 'link', label: '', value: '' }] });
    renderLinks();
    linksBox.lastChild?.querySelector('.lv')?.focus();
  });
  wrap.append(el('div', 'f-label', 'Your links'), linksBox, add);
  body.prepend(wrap);
}

function renderLinks() {
  if (!linksBox) return;
  linksBox.replaceChildren();
  // Keep empty rows the user just added, even though clean() keeps them too.
  state.links.forEach((l, i) => {
    const row = el('div', 'link-row2');
    const type = el('select', 'control');
    type.append(new Option('Link', 'link'), new Option('Copy', 'copy'));
    type.value = l.type;
    type.setAttribute('aria-label', 'Type');
    const label = el('input', 'control');
    label.value = l.label;
    label.maxLength = 40;
    label.setAttribute('aria-label', 'Label');
    const value = el('input', 'control lv');
    value.value = l.value;
    value.maxLength = 500;
    value.setAttribute('aria-label', 'Link or text');
    const ph = () => {
      const plat = type.value === 'link' ? platformOf(linkHref(value.value)) : null;
      label.placeholder = plat ? plat.name : 'Label';
      value.placeholder = type.value === 'copy' ? 'Text to copy' : 'https://… or example.com/you';
    };
    const write = () => {
      const links = state.links.slice();
      links[i] = { type: type.value, label: label.value, value: value.value };
      set({ links });
      ph();
    };
    type.addEventListener('change', write);
    label.addEventListener('input', write);
    value.addEventListener('input', write);
    ph();
    const btn = (t, name, fn) => {
      const b = el('button', 'icon', t);
      b.type = 'button';
      b.title = name;
      b.setAttribute('aria-label', name);
      b.addEventListener('click', fn);
      return b;
    };
    const move = d => {
      const links = state.links.slice();
      const j = i + d;
      if (j < 0 || j >= links.length) return;
      [links[i], links[j]] = [links[j], links[i]];
      set({ links });
      renderLinks();
    };
    row.append(
      type, label, value,
      btn('↑', 'Move up', () => move(-1)),
      btn('↓', 'Move down', () => move(1)),
      btn('✕', 'Remove', () => {
        set({ links: state.links.filter((_, k) => k !== i) });
        renderLinks();
      }),
    );
    linksBox.append(row);
  });
  if (!state.links.length) linksBox.append(el('p', 'f-hint', 'No links yet.'));
}

let badgeBox;
function badgePicker(body) {
  badgeBox = el('div', 'badge-grid');
  badgeBox.dataset.search = 'badges';
  body.append(badgeBox);
}

function renderBadges() {
  if (!badgeBox) return;
  badgeBox.replaceChildren();
  for (const [id, [emoji, name]] of Object.entries(BADGES)) {
    const on = state.badges.includes(id);
    const b = el('button', 'badge-chip');
    b.type = 'button';
    b.setAttribute('aria-pressed', String(on));
    b.dataset.search = name.toLowerCase();
    b.append(el('span', 'be', emoji), el('span', null, name));
    b.addEventListener('click', () => {
      if (!on && state.badges.length >= MAX_BADGES) return setStatus(`Up to ${MAX_BADGES} badges`);
      set({ badges: on ? state.badges.filter(x => x !== id) : [...state.badges, id] });
      renderBadges();
    });
    badgeBox.append(b);
  }
}

/* ----- layout ----- */

function build() {
  const main = document.getElementById('main');
  const nav = document.getElementById('nav');
  for (const s of SECTIONS) {
    const sec = el('section', 'sec');
    sec.id = s.id;
    sec.append(el('h2', 'sec-h', s.title));
    const body = el('div', `sec-body cols-${s.cols || 1}`);
    for (const f of s.fields || []) body.append(field(f));
    if (s.custom === 'themes') themes(body);
    if (s.custom === 'links') linksEditor(body);
    if (s.custom === 'badges') badgePicker(body);
    sec.append(body);
    main.append(sec);

    const a = el('a', 'nav-item');
    a.href = `#${s.id}`;
    a.append(el('span', 'ni', s.icon), el('span', null, s.title));
    nav.append(a);
  }
  main.append(el('p', 'empty', 'No settings match your search.'));

  // Highlight the section in view.
  const items = [...nav.children];
  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        items.forEach(a => a.classList.toggle('on', a.hash === `#${e.target.id}`));
      }
    },
    { rootMargin: '-20% 0px -70% 0px' },
  );
  document.querySelectorAll('.sec').forEach(s => io.observe(s));
}

function search(q) {
  q = q.trim().toLowerCase();
  let any = false;
  for (const sec of document.querySelectorAll('.sec')) {
    const title = sec.querySelector('.sec-h').textContent.toLowerCase();
    const items = sec.querySelectorAll('[data-search]');
    let shown = 0;
    for (const it of items) {
      const hit = !q || title.includes(q) || it.dataset.search.includes(q);
      it.hidden = !hit;
      if (hit) shown++;
    }
    const show = !q || title.includes(q) || shown > 0;
    sec.hidden = !show;
    any ||= show;
  }
  document.querySelector('.empty').hidden = any;
}

/* ----- actions ----- */

const shareUrl = async () => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}#p=${await encode(state)}`;

document.getElementById('share').addEventListener('click', async () => {
  const url = await shareUrl();
  try {
    await navigator.clipboard.writeText(url);
    setStatus('Link copied');
  } catch {
    window.prompt('Copy your link:', url);
  }
});
document.getElementById('open').addEventListener('click', async () => window.open(await shareUrl(), '_blank', 'noopener'));

const searchBox = document.getElementById('search');
searchBox.addEventListener('input', () => search(searchBox.value));
addEventListener('keydown', e => {
  if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) {
    e.preventDefault();
    searchBox.focus();
  }
});

// Changes made in the editor (another tab) show up here too.
addEventListener('storage', e => {
  if (e.key !== DRAFT_KEY || !e.newValue) return;
  try {
    state = clean(JSON.parse(e.newValue));
    syncAll();
  } catch {}
});

build();
syncAll();
