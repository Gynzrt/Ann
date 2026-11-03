/* Halo — a serverless bio-link page builder.
 * A profile is a small JSON object. It is compressed and base64url-encoded
 * into the URL hash (#p=...), so sharing the link shares the page.
 * Profiles come from links anyone can craft, so every value is treated as
 * untrusted: text goes in via textContent, and URLs are checked against an
 * allowlist of schemes before use.
 */
(() => {
  'use strict';

  const DRAFT_KEY = 'halo:draft';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const DEFAULTS = {
    name: 'Your Name',
    avatar: '',
    bio: 'gamer · night owl · building things on the internet',
    location: '',
    links: [
      { label: 'Discord', url: 'https://discord.com' },
      { label: 'GitHub', url: 'https://github.com' },
    ],
    bgType: 'gradient', bgA: '#1b1f3a', bgB: '#5b2a6e', bgUrl: '',
    dim: 30, blur: 0,
    accent: '#7c9cff', card: 'glass', font: 'sans',
    fxTypewriter: true, fxGlow: true, fxTilt: true, fxParticles: 'dust',
    music: '', splash: false,
  };

  /* ---------- validation ---------- */

  const HEX = /^#[0-9a-f]{6}$/i;
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const oneOf = (v, opts, d) => (opts.includes(v) ? v : d);
  const num = (v, lo, hi, d) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : d);
  const color = (v, d) => (HEX.test(v) ? v : d);

  function safeUrl(raw, schemes = ['http:', 'https:']) {
    if (typeof raw !== 'string' || !raw.trim()) return '';
    try {
      const u = new URL(raw.trim());
      return schemes.includes(u.protocol) ? u.href : '';
    } catch { return ''; }
  }

  function clean(p) {
    p = p && typeof p === 'object' ? p : {};
    const d = DEFAULTS;
    return {
      name: str(p.name, 40),
      avatar: str(p.avatar, 500),
      bio: str(p.bio, 300),
      location: str(p.location, 40),
      links: (Array.isArray(p.links) ? p.links : []).slice(0, 12).map(l => ({
        label: str(l && l.label, 40),
        url: str(l && l.url, 500),
      })),
      bgType: oneOf(p.bgType, ['gradient', 'image', 'video'], d.bgType),
      bgA: color(p.bgA, d.bgA), bgB: color(p.bgB, d.bgB),
      bgUrl: str(p.bgUrl, 500),
      dim: num(p.dim, 0, 90, d.dim), blur: num(p.blur, 0, 20, d.blur),
      accent: color(p.accent, d.accent),
      card: oneOf(p.card, ['glass', 'solid', 'none'], d.card),
      font: oneOf(p.font, ['sans', 'mono', 'serif'], d.font),
      fxTypewriter: !!p.fxTypewriter, fxGlow: !!p.fxGlow, fxTilt: !!p.fxTilt,
      fxParticles: oneOf(p.fxParticles, ['none', 'dust', 'snow', 'stars'], d.fxParticles),
      music: str(p.music, 500),
      splash: !!p.splash,
    };
  }

  /* ---------- encode / decode ---------- */

  const b64url = bytes => {
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const unb64url = s => {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  };
  const canZip = typeof CompressionStream === 'function';

  async function pipe(bytes, stream) {
    const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
    return new Uint8Array(await out.arrayBuffer());
  }

  // Prefix 'z' = deflate-raw compressed JSON, 'j' = plain JSON.
  async function encode(profile) {
    const json = new TextEncoder().encode(JSON.stringify(profile));
    if (canZip) return 'z' + b64url(await pipe(json, new CompressionStream('deflate-raw')));
    return 'j' + b64url(json);
  }

  async function decode(code) {
    const kind = code[0];
    let bytes = unb64url(code.slice(1));
    if (kind === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    else if (kind !== 'j') throw new Error('Unknown format');
    return clean(JSON.parse(new TextDecoder().decode(bytes)));
  }

  /* ---------- rendering ---------- */

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // Each stage keeps a cleanup function so re-rendering stops old timers/audio.
  const cleanups = new WeakMap();

  function render(stage, p, { preview = false } = {}) {
    if (cleanups.has(stage)) cleanups.get(stage)();
    const stops = [];
    cleanups.set(stage, () => stops.forEach(f => f()));
    stage.replaceChildren();
    stage.style.setProperty('--accent', p.accent);
    stage.className = `stage ${preview ? 'preview' : 'full'} font-${p.font}`;

    // Background
    const bgUrl = safeUrl(p.bgUrl);
    let media = null;
    if (p.bgType === 'image' && bgUrl) {
      media = el('img', 'bg-media'); media.alt = ''; media.src = bgUrl;
    } else if (p.bgType === 'video' && bgUrl) {
      media = el('video', 'bg-media');
      Object.assign(media, { src: bgUrl, autoplay: true, loop: true, muted: true, playsInline: true });
    }
    if (media) {
      if (p.blur) media.style.filter = `blur(${p.blur}px)`, media.style.transform = 'scale(1.06)';
      stage.append(media);
    } else {
      const bg = el('div', 'bg');
      bg.style.background = `linear-gradient(135deg, ${p.bgA}, ${p.bgB})`;
      stage.append(bg);
    }
    const dim = el('div', 'dim');
    dim.style.opacity = p.dim / 100;
    stage.append(dim);

    // Particles
    if (p.fxParticles !== 'none' && !reduceMotion) stops.push(particles(stage, p.fxParticles, p.accent));

    // Card
    const card = el('article', `card ${p.card}`);
    const avatarUrl = safeUrl(p.avatar);
    if (avatarUrl) {
      const img = el('img', 'avatar');
      img.src = avatarUrl; img.alt = '';
      img.onerror = () => img.replaceWith(fallbackAvatar(p.name));
      card.append(img);
    } else {
      card.append(fallbackAvatar(p.name));
    }
    card.append(el('h1', 'name' + (p.fxGlow ? ' glow' : ''), p.name || 'Unnamed'));
    if (p.location) card.append(el('p', 'location', '⌖ ' + p.location));
    const bio = el('p', 'bio');
    card.append(bio);

    const list = el('ul', 'links');
    for (const l of p.links) {
      const href = safeUrl(l.url, ['http:', 'https:', 'mailto:']);
      if (!href) continue;
      const a = el('a');
      a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      const host = href.startsWith('mailto:') ? href.slice(7) : new URL(href).hostname.replace(/^www\./, '');
      const label = l.label || host;
      a.append(el('span', 'ico', label.trim().charAt(0).toUpperCase() || '↗'));
      const txt = el('span', 'txt');
      txt.append(el('span', 'lbl', label), el('span', 'host', host));
      a.append(txt);
      const li = el('li'); li.append(a); list.append(li);
    }
    if (list.children.length) card.append(list);
    stage.append(card);

    if (p.fxTilt && !reduceMotion) stops.push(tilt(stage, card));

    // Music
    const musicUrl = safeUrl(p.music);
    let audio = null;
    if (musicUrl) {
      audio = new Audio(musicUrl);
      audio.loop = true; audio.volume = 0.5;
      const btn = el('button', 'music-btn', '♪');
      btn.type = 'button'; btn.setAttribute('aria-label', 'Play music');
      btn.onclick = () => {
        if (audio.paused) audio.play().catch(() => {}); else audio.pause();
      };
      audio.onplay = () => { btn.textContent = '❚❚'; btn.setAttribute('aria-label', 'Pause music'); };
      audio.onpause = () => { btn.textContent = '♪'; btn.setAttribute('aria-label', 'Play music'); };
      stage.append(btn);
      stops.push(() => { audio.pause(); audio.src = ''; });
    }

    if (!preview) {
      const mw = el('div', 'made-with');
      const a = el('a', null, 'make your own');
      a.href = location.pathname;
      mw.append(a);
      stage.append(mw);
    }

    const startBio = () => {
      if (p.fxTypewriter && !reduceMotion) stops.push(typewriter(bio, p.bio));
      else bio.textContent = p.bio;
    };

    // Splash ("click to enter") — required for music because of autoplay rules.
    if (p.splash || musicUrl) {
      const s = el('button', 'splash');
      s.type = 'button';
      s.append(el('span', null, 'click to enter'));
      s.onclick = () => {
        s.classList.add('out');
        setTimeout(() => s.remove(), 500);
        if (audio) audio.play().catch(() => {});
        startBio();
      };
      stage.append(s);
    } else {
      startBio();
    }
  }

  function fallbackAvatar(name) {
    return el('div', 'avatar avatar-fallback', (name || '?').trim().charAt(0).toUpperCase() || '?');
  }

  function typewriter(node, text) {
    let i = 0, alive = true;
    node.textContent = '';
    node.classList.add('typing');
    const chars = Array.from(text);
    const step = () => {
      if (!alive) return;
      if (i < chars.length) { node.textContent += chars[i++]; setTimeout(step, 35 + Math.random() * 45); }
    };
    step();
    return () => { alive = false; };
  }

  function tilt(stage, card) {
    const move = e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    };
    const leave = () => { card.style.transform = ''; };
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerleave', leave);
    return () => { stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerleave', leave); };
  }

  function particles(stage, kind, accent) {
    const cv = el('canvas');
    stage.append(cv);
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const resize = () => {
      w = stage.clientWidth; h = stage.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    const count = kind === 'stars' ? 90 : 60;
    const rand = (a, b) => a + Math.random() * (b - a);
    const ps = Array.from({ length: count }, () => ({
      x: Math.random(), y: Math.random(),
      r: kind === 'snow' ? rand(1, 3) : rand(0.5, 1.8),
      vx: kind === 'snow' ? rand(-0.0004, 0.0004) : rand(-0.0002, 0.0002),
      vy: kind === 'snow' ? rand(0.0008, 0.002) : kind === 'dust' ? rand(-0.0006, -0.0002) : 0,
      t: Math.random() * Math.PI * 2,
    }));

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy; p.t += 0.03;
        if (p.y > 1.02) p.y = -0.02; if (p.y < -0.02) p.y = 1.02;
        if (p.x > 1.02) p.x = -0.02; if (p.x < -0.02) p.x = 1.02;
        const a = kind === 'stars' ? 0.35 + 0.65 * Math.abs(Math.sin(p.t)) : 0.7;
        ctx.globalAlpha = a;
        ctx.fillStyle = kind === 'dust' ? accent : '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }

  /* ---------- editor ---------- */

  function startEditor(initial) {
    const editor = document.getElementById('editor');
    const form = document.getElementById('form');
    const linksBox = document.getElementById('links');
    const preview = document.getElementById('preview');
    const status = document.getElementById('status');
    editor.hidden = false;

    let state = clean(initial);

    const setStatus = msg => {
      status.textContent = msg;
      clearTimeout(setStatus.t);
      setStatus.t = setTimeout(() => (status.textContent = ''), 3000);
    };

    function fillForm() {
      for (const [k, v] of Object.entries(state)) {
        const f = form.elements[k];
        if (!f || k === 'links') continue;
        if (f.type === 'checkbox') f.checked = v; else f.value = v;
      }
      linksBox.replaceChildren();
      state.links.forEach(addLinkRow);
    }

    function addLinkRow(l = { label: '', url: '' }) {
      const row = el('div', 'link-row');
      const label = el('input'); label.placeholder = 'Label'; label.value = l.label; label.maxLength = 40;
      label.dataset.k = 'label';
      const url = el('input'); url.placeholder = 'https://…'; url.value = l.url; url.type = 'url';
      url.dataset.k = 'url';
      const del = el('button', 'ghost', '✕'); del.type = 'button'; del.setAttribute('aria-label', 'Remove link');
      del.onclick = () => { row.remove(); update(); };
      row.append(label, url, del);
      linksBox.append(row);
    }

    function readForm() {
      const p = {};
      for (const f of form.elements) {
        if (!f.name) continue;
        p[f.name] = f.type === 'checkbox' ? f.checked : f.type === 'range' ? +f.value : f.value;
      }
      p.links = [...linksBox.children].map(r => ({
        label: r.querySelector('[data-k=label]').value,
        url: r.querySelector('[data-k=url]').value,
      })).filter(l => l.label || l.url);
      return clean(p);
    }

    let timer;
    function update() {
      state = readForm();
      clearTimeout(timer);
      timer = setTimeout(() => {
        render(preview, state, { preview: true });
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch {}
      }, 150);
    }

    async function shareUrl() {
      return `${location.origin}${location.pathname}#p=${await encode(state)}`;
    }

    form.addEventListener('input', update);
    form.addEventListener('submit', e => e.preventDefault());
    document.getElementById('add-link').onclick = () => {
      if (linksBox.children.length >= 12) return setStatus('12 links max.');
      addLinkRow(); linksBox.lastChild.querySelector('input').focus();
    };
    document.getElementById('share').onclick = async () => {
      const url = await shareUrl();
      try { await navigator.clipboard.writeText(url); setStatus(`Link copied (${url.length} chars).`); }
      catch { prompt('Copy your link:', url); }
    };
    document.getElementById('open').onclick = async () => window.open(await shareUrl(), '_blank', 'noopener');
    document.getElementById('reset').onclick = () => {
      if (!confirm('Reset everything to the defaults?')) return;
      state = clean(DEFAULTS); fillForm(); update();
    };

    fillForm();
    render(preview, state, { preview: true });
  }

  /* ---------- boot ---------- */

  async function boot() {
    const m = location.hash.match(/^#p=([A-Za-z0-9_-]+)$/);
    if (m) {
      try {
        const p = await decode(m[1]);
        document.title = `${p.name || 'Profile'} · halo`;
        const stage = document.getElementById('profile');
        stage.hidden = false;
        render(stage, p);
        return;
      } catch (e) {
        console.warn('Bad profile link', e);
      }
    }
    let draft = DEFAULTS;
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY)) || DEFAULTS; } catch {}
    startEditor(draft);
  }

  addEventListener('hashchange', () => location.reload());
  boot();
})();
