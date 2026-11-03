import { el, linkHref, platformOf } from './util.js';
import { BASE, STARTER, OPTIONS, BADGES, PRESETS, PRESET_BASE, MAX_BADGES, MAX_LINKS, clean, optionLabel } from './schema.js';
import { encode, decode } from './codec.js';
import { render } from './render.js';

export const DRAFT_KEY = 'halo:draft';

// Changing one of these replays the entrance animations in the preview.
const ANIMATED_FIELDS = new Set(['cardAnim', 'nameFx']);

const SCENE_HINTS = {
  none: 'Add a real-time 3D background behind your card. It uses your background and accent colours.',
  galaxy: 'A spiral galaxy of glowing stars that drifts as the mouse moves.',
  orb: 'A glossy orb that slowly morphs. Turn on “React to the music” to make it pulse.',
  liquid: 'A flowing gradient made from your two background colours and accent.',
  waves: 'An ocean of glowing points. Moving the mouse sends ripples across it.',
  warp: 'Stars rushing past. Hold the mouse button down to jump to warp speed.',
  shapes: 'Glossy, iridescent shapes floating around your card. Click one to spin it.',
};

export function startEditor(initial) {
  const $ = id => document.getElementById(id);
  const form = $('form');
  const linksBox = $('links');
  const preview = $('preview');
  const statusEl = $('status');
  const noticeEl = $('notice');
  $('editor').hidden = false;

  for (const sel of form.querySelectorAll('select[name]')) {
    for (const v of OPTIONS[sel.name] || []) sel.append(new Option(optionLabel(sel.name, v), v));
  }
  buildBadgePicker();
  buildPresets();

  let state = clean(initial);
  let renderId = 0;
  let timer = 0;
  let pendingAnimate = false;
  let statusTimer = 0;

  function setStatus(msg) {
    statusEl.textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => (statusEl.textContent = ''), 5000);
  }

  function save() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ v: 2, ...state }));
    } catch {}
  }

  function draw({ animate = false, splash = false } = {}) {
    const id = ++renderId;
    noticeEl.textContent = '';
    render(preview, state, {
      preview: true,
      animate,
      splash,
      notice: msg => {
        if (id === renderId) noticeEl.textContent = msg;
      },
    });
  }

  /* ----- form <-> state ----- */

  function fillForm() {
    for (const f of form.elements) {
      if (!f.name || !(f.name in BASE)) continue;
      if (f.type === 'checkbox') f.checked = !!state[f.name];
      else f.value = state[f.name];
    }
    for (const b of form.querySelectorAll('input[name=badge]')) b.checked = state.badges.includes(b.value);
    linksBox.replaceChildren();
    state.links.forEach(addLinkRow);
    syncHints();
  }

  function readForm() {
    const p = { v: 2 };
    for (const f of form.elements) {
      if (!f.name || !(f.name in BASE)) continue;
      p[f.name] = f.type === 'checkbox' ? f.checked : f.type === 'range' ? Number(f.value) : f.value;
    }
    p.badges = [...form.querySelectorAll('input[name=badge]:checked')].map(b => b.value);
    p.links = [...linksBox.children]
      .map(row => ({
        type: row.querySelector('[data-k=type]').value,
        label: row.querySelector('[data-k=label]').value,
        value: row.querySelector('[data-k=value]').value,
      }))
      .filter(l => l.label.trim() || l.value.trim());
    return clean(p);
  }

  function syncHints() {
    for (const r of form.querySelectorAll('input[type=range]')) {
      const out = r.closest('label')?.querySelector('.val');
      if (!out) continue;
      const v = Number(r.value);
      out.textContent = r.name === 'density' ? `${v}×` : r.name === 'blur' ? `${v}px` : `${v}%`;
    }
    const id = form.elements.discordId;
    id.classList.toggle('invalid', !!id.value.trim() && !state.discordId);
    $('scene-hint').textContent = SCENE_HINTS[state.scene] || '';
  }

  function update(e) {
    const t = e?.target;
    if (t?.name === 'badge' && t.checked && form.querySelectorAll('input[name=badge]:checked').length > MAX_BADGES) {
      t.checked = false;
      setStatus(`You can pick up to ${MAX_BADGES} badges.`);
    }
    state = readForm();
    syncHints();
    if (t && ANIMATED_FIELDS.has(t.name)) pendingAnimate = true;
    clearTimeout(timer);
    timer = setTimeout(() => {
      draw({ animate: pendingAnimate });
      pendingAnimate = false;
      save();
    }, 150);
  }

  function load(p, message) {
    state = clean(p);
    fillForm();
    draw({ animate: true });
    save();
    if (message) setStatus(message);
  }

  /* ----- links ----- */

  function addLinkRow(l = { type: 'link', label: '', value: '' }) {
    const row = el('div', 'link-row');
    const type = el('select');
    type.dataset.k = 'type';
    type.setAttribute('aria-label', 'Link type');
    type.append(new Option('Link', 'link'), new Option('Copy', 'copy'));
    type.value = l.type;
    const label = el('input');
    Object.assign(label, { value: l.label, maxLength: 40 });
    label.dataset.k = 'label';
    label.setAttribute('aria-label', 'Label');
    const value = el('input', 'value');
    Object.assign(value, { value: l.value, maxLength: 500 });
    value.dataset.k = 'value';
    value.setAttribute('aria-label', 'Link or text to copy');
    const button = (text, name, onClick) => {
      const b = el('button', 'icon-btn', text);
      b.type = 'button';
      b.title = name;
      b.setAttribute('aria-label', name);
      b.addEventListener('click', onClick);
      return b;
    };
    const up = button('↑', 'Move up', () => {
      if (!row.previousElementSibling) return;
      linksBox.insertBefore(row, row.previousElementSibling);
      update();
    });
    const down = button('↓', 'Move down', () => {
      if (!row.nextElementSibling) return;
      linksBox.insertBefore(row.nextElementSibling, row);
      update();
    });
    const remove = button('✕', 'Remove link', () => {
      row.remove();
      update();
    });
    const sync = () => {
      const copy = type.value === 'copy';
      value.placeholder = copy ? 'Text to copy, e.g. a username' : 'https://… or example.com/you';
      const plat = copy ? null : platformOf(linkHref(value.value));
      label.placeholder = plat ? plat.name : copy ? 'Label' : 'Label (optional)';
    };
    type.addEventListener('change', sync);
    value.addEventListener('input', sync);
    sync();
    row.append(type, label, up, down, remove, value);
    linksBox.append(row);
    return row;
  }

  /* ----- pickers ----- */

  function buildBadgePicker() {
    const box = $('badges');
    for (const [id, [emoji, name]] of Object.entries(BADGES)) {
      const chip = el('label', 'chip');
      const cb = el('input');
      cb.type = 'checkbox';
      cb.name = 'badge';
      cb.value = id;
      chip.append(cb, el('span', 'chip-emoji', emoji), el('span', null, name));
      box.append(chip);
    }
  }

  function buildPresets() {
    const box = $('presets');
    for (const [name, preset] of Object.entries(PRESETS)) {
      const b = el('button', 'preset');
      b.type = 'button';
      const swatch = el('span', 'swatch');
      swatch.style.background = `linear-gradient(135deg, ${preset.bgA}, ${preset.bgB})`;
      swatch.style.setProperty('--dot', preset.accent);
      if (preset.scene && preset.scene !== 'none') swatch.append(el('span', 'tag', '3D'));
      b.append(swatch, el('span', null, name));
      b.addEventListener('click', () => load({ ...state, ...PRESET_BASE, ...preset, v: 2 }, `Applied the ${name} theme.`));
      box.append(b);
    }
  }

  /* ----- actions ----- */

  async function shareUrl() {
    return `${location.origin}${location.pathname}#p=${await encode(state)}`;
  }

  const lengthNote = url =>
    url.length > 2000 ? ` It’s long (${url.length} characters), so some apps may cut it off.` : '';

  form.addEventListener('input', update);
  form.addEventListener('submit', e => e.preventDefault());

  $('add-link').addEventListener('click', () => {
    if (linksBox.children.length >= MAX_LINKS) return setStatus(`You can add up to ${MAX_LINKS} links.`);
    addLinkRow().querySelector('[data-k=value]').focus();
  });

  $('share').addEventListener('click', async () => {
    const url = await shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setStatus(`Link copied.${lengthNote(url)}`);
    } catch {
      window.prompt('Copy your link:', url);
    }
  });

  $('open').addEventListener('click', async () => window.open(await shareUrl(), '_blank', 'noopener'));

  $('export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ v: 2, ...state }, null, 2)], { type: 'application/json' });
    const a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${slug(state.name) || 'profile'}.halo.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $('import').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      load(JSON.parse(await file.text()), `Imported ${file.name}.`);
    } catch {
      setStatus('That file isn’t a valid profile.');
    }
  });

  const loadFromLink = async () => {
    const input = $('load-url');
    const m = input.value.trim().match(/#p=([A-Za-z0-9_-]+)/);
    if (!m) return setStatus('Paste a full share link. It contains “#p=”.');
    try {
      load(await decode(m[1]), 'Loaded the page from that link.');
      input.value = '';
    } catch {
      setStatus('Couldn’t read that link.');
    }
  };
  $('load-btn').addEventListener('click', loadFromLink);
  $('load-url').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      loadFromLink();
    }
  });

  $('reset').addEventListener('click', () => {
    if (confirm('Reset everything to the starter page?')) load(STARTER, 'Reset to the starter page.');
  });

  const sizes = document.querySelectorAll('[data-size]');
  for (const b of sizes) {
    b.addEventListener('click', () => {
      $('frame').classList.toggle('phone', b.dataset.size === 'phone');
      for (const o of sizes) o.setAttribute('aria-pressed', String(o === b));
    });
  }
  $('replay').addEventListener('click', () => draw({ animate: true, splash: true }));

  fillForm();
  draw({ animate: true });
}

function slug(s) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}
