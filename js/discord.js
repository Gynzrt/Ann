/* Live Discord presence through the public Lanyard API
 * (https://github.com/Phineas/lanyard). The user has to join Lanyard's
 * Discord server once; after that their status is readable by user ID. */
import { el, safeUrl } from './util.js';

const API = 'https://api.lanyard.rest/v1/users/';
const POLL_MS = 20000;
const STATUS = {
  online: ['#23a55a', 'Online'],
  idle: ['#f0b232', 'Idle'],
  dnd: ['#f23f43', 'Do not disturb'],
  offline: ['#80848e', 'Offline'],
};
const VERB = { 0: 'Playing', 1: 'Streaming', 2: 'Listening to', 3: 'Watching', 5: 'Competing in' };

// Shared between the editor's frequent re-renders so typing doesn't spam the API.
const cache = new Map();
function fetchPresence(id) {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < 15000) return hit.promise;
  const promise = fetch(API + id).then(r => r.json());
  cache.set(id, { at: Date.now(), promise });
  promise.catch(() => cache.delete(id));
  return promise;
}

export function startPresence(id, { dot, statusLine, box, setAvatar, useAvatar, showActivity, notice }) {
  let alive = true;
  let shownAvatar = '';
  let current = null;
  let timeEl = null;
  let fillEl = null;

  async function load() {
    let json;
    try {
      json = await fetchPresence(id);
    } catch {
      if (alive) notice?.('Discord: couldn’t reach the Lanyard API.');
      return;
    }
    if (!alive) return;
    if (!json?.success || !json.data) {
      notice?.('Discord: Lanyard isn’t tracking this ID yet. Join the Lanyard Discord server, then reload.');
      return;
    }
    apply(json.data);
  }

  function apply(d) {
    const [color, label] = STATUS[d.discord_status] || STATUS.offline;
    dot.hidden = false;
    dot.style.background = color;
    dot.dataset.tip = label;
    dot.setAttribute('aria-label', `Discord: ${label}`);

    const hash = d.discord_user?.avatar;
    if (useAvatar && typeof hash === 'string' && /^(a_)?[0-9a-f]+$/.test(hash)) {
      const url = `https://cdn.discordapp.com/avatars/${id}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=256`;
      if (url !== shownAvatar) setAvatar((shownAvatar = url));
    }

    if (!showActivity) return;
    const acts = Array.isArray(d.activities) ? d.activities : [];
    const custom = acts.find(a => a.type === 4);
    const customText = custom
      ? [custom.emoji && !custom.emoji.id ? custom.emoji.name : '', custom.state || ''].join(' ').trim()
      : '';
    statusLine.textContent = customText;
    statusLine.hidden = !customText;
    current = pickActivity(d, acts);
    renderActivity();
  }

  function renderActivity() {
    box.replaceChildren();
    timeEl = fillEl = null;
    if (!current) return void (box.hidden = true);
    box.hidden = false;
    if (current.img) {
      const img = el('img');
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => img.remove());
      img.src = current.img;
      box.append(img);
    }
    const meta = el('div', 'dc-meta');
    meta.append(el('span', 'dc-verb', current.verb), el('span', 'dc-title', current.title));
    if (current.sub) meta.append(el('span', 'dc-sub', current.sub));
    if (current.start) {
      if (current.end) {
        const track = el('div', 'dc-bar');
        fillEl = el('i');
        track.append(fillEl);
        meta.append(track);
      }
      timeEl = el('span', 'dc-time');
      meta.append(timeEl);
    }
    box.append(meta);
    tick();
  }

  function tick() {
    if (!current?.start || !timeEl) return;
    const now = Date.now();
    if (current.end && fillEl) {
      const total = Math.max(1, current.end - current.start);
      const done = Math.min(total, Math.max(0, now - current.start));
      fillEl.style.width = `${(done / total) * 100}%`;
      timeEl.textContent = `${clock(done)} / ${clock(total)}`;
    } else {
      timeEl.textContent = `${clock(now - current.start)} elapsed`;
    }
  }

  load();
  const poll = setInterval(load, POLL_MS);
  const ticker = setInterval(tick, 1000);
  return () => {
    alive = false;
    clearInterval(poll);
    clearInterval(ticker);
  };
}

function pickActivity(d, acts) {
  if (d.listening_to_spotify && d.spotify) {
    const s = d.spotify;
    return {
      verb: 'Listening on Spotify',
      title: s.song || 'Spotify',
      sub: s.artist ? `by ${s.artist.replace(/; /g, ', ')}` : '',
      img: safeUrl(s.album_art_url),
      start: s.timestamps?.start,
      end: s.timestamps?.end,
    };
  }
  const a = acts.find(x => x && x.type in VERB && x.name !== 'Spotify');
  if (!a) return null;
  return {
    verb: VERB[a.type],
    title: String(a.name || ''),
    sub: [a.details, a.state].filter(v => typeof v === 'string' && v).join(' · '),
    img: assetUrl(a),
    start: a.timestamps?.start,
    end: a.timestamps?.end,
  };
}

function assetUrl(a) {
  const img = a.assets?.large_image;
  if (typeof img !== 'string') return '';
  if (img.startsWith('mp:')) return safeUrl(`https://media.discordapp.net/${img.slice(3)}`);
  if (img.startsWith('spotify:')) return safeUrl(`https://i.scdn.co/image/${img.slice(8)}`);
  if (/^\d+$/.test(img) && /^\d+$/.test(String(a.application_id ?? ''))) {
    return `https://cdn.discordapp.com/app-assets/${a.application_id}/${img}.png`;
  }
  return '';
}

function clock(ms) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
