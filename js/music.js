/* Background music: a small player pill plus an optional audio visualizer
 * drawn as bars around the avatar. */
import { el } from './util.js';

const TAU = Math.PI * 2;

export function createPlayer(stage, { url, title, volume, accent, vizCanvas }) {
  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = volume / 100;
  let viz = !!vizCanvas;
  let wanted = false;
  let stopped = false;
  let ac = null;
  let analyser = null;
  let bins = null;
  let raf = 0;

  if (viz) {
    // An analyser can only read cross-origin audio when the host sends CORS
    // headers. Try that first; if loading fails, retry as plain playback.
    audio.crossOrigin = 'anonymous';
    audio.addEventListener('error', () => {
      if (stopped || audio.crossOrigin === null) return;
      viz = false;
      audio.removeAttribute('crossorigin');
      audio.src = url;
      if (wanted) audio.play().catch(() => {});
    });
  }
  audio.src = url;

  const bar = el('div', 'player');
  const btn = el('button', 'player-btn');
  btn.type = 'button';
  const name = title.trim() || fileName(url);
  const label = el('div', 'player-title');
  label.title = name;
  const inner = el('span', null, name);
  label.append(inner);
  const vol = el('input', 'player-vol');
  Object.assign(vol, { type: 'range', min: '0', max: '100', value: String(volume) });
  vol.setAttribute('aria-label', 'Volume');
  bar.append(btn, label, vol);
  stage.append(bar);

  const sync = () => {
    const on = !audio.paused;
    btn.textContent = on ? '❚❚' : '▶';
    btn.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
    bar.classList.toggle('on', on);
  };
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', () => {
    sync();
    stopViz();
  });
  sync();
  btn.addEventListener('click', () => (audio.paused ? play() : pause()));
  vol.addEventListener('input', () => (audio.volume = vol.value / 100));

  // Long titles scroll like a marquee.
  requestAnimationFrame(() => {
    if (inner.scrollWidth <= label.clientWidth + 1) return;
    label.classList.add('scroll');
    const copy = el('span', null, name);
    copy.setAttribute('aria-hidden', 'true');
    inner.replaceChildren(el('span', null, name), copy);
  });

  function play() {
    wanted = true;
    audio
      .play()
      .then(() => viz && startViz())
      .catch(() => {});
  }

  function pause() {
    wanted = false;
    audio.pause();
  }

  function startViz() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        const src = ac.createMediaElementSource(audio);
        analyser = ac.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.82;
        src.connect(analyser);
        analyser.connect(ac.destination);
        bins = new Uint8Array(analyser.frequencyBinCount);
      } catch {
        viz = false;
        return;
      }
    }
    ac.resume().catch(() => {});
    vizCanvas.hidden = false;
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function draw() {
    raf = requestAnimationFrame(draw);
    const size = vizCanvas.clientWidth || 184;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const px = Math.round(size * dpr);
    if (vizCanvas.width !== px) vizCanvas.width = vizCanvas.height = px;
    const c = vizCanvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, size, size);
    analyser.getByteFrequencyData(bins);
    const N = 56;
    const mid = size / 2;
    const r0 = mid - 32;
    c.strokeStyle = accent;
    c.lineCap = 'round';
    c.lineWidth = 3;
    for (let i = 0; i < N; i++) {
      const k = i < N / 2 ? i : N - 1 - i; // mirrored, so the ring is symmetric
      const v = bins[1 + Math.floor(k * 1.6)] / 255;
      const a = (i / N) * TAU - Math.PI / 2;
      const len = 2 + v * 26;
      c.globalAlpha = 0.3 + v * 0.7;
      c.beginPath();
      c.moveTo(mid + Math.cos(a) * r0, mid + Math.sin(a) * r0);
      c.lineTo(mid + Math.cos(a) * (r0 + len), mid + Math.sin(a) * (r0 + len));
      c.stroke();
    }
  }

  function stopViz() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (vizCanvas) vizCanvas.getContext('2d').clearRect(0, 0, vizCanvas.width, vizCanvas.height);
  }

  return {
    play,
    stop() {
      stopped = true;
      wanted = false;
      stopViz();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      ac?.close().catch(() => {});
    },
  };
}

function fileName(url) {
  try {
    const last = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    return last.replace(/\.[a-z0-9]{2,4}$/i, '') || 'Music';
  } catch {
    return 'Music';
  }
}
