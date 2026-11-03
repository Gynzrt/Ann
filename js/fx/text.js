import { el, reduceMotion } from '../util.js';

export function nameEl(name, fx) {
  const text = name.trim() || 'Unnamed';
  const h = el('h1', `name fx-${fx}`);
  if (fx === 'wave' && !reduceMotion) {
    // Each letter bounces on its own; screen readers get the plain name.
    h.append(el('span', 'sr-only', text));
    Array.from(text).forEach((ch, i) => {
      if (ch === ' ') return h.append(' ');
      const s = el('span', 'wave-ch', ch);
      s.setAttribute('aria-hidden', 'true');
      s.style.animationDelay = `${(i * 0.07).toFixed(2)}s`;
      h.append(s);
    });
  } else {
    h.textContent = text;
    if (fx === 'glitch') h.dataset.text = text;
  }
  return h;
}

/**
 * Fills the bio element. 'typewriter' types the whole bio once; 'rotate' types
 * each line, erases it and moves on to the next, forever. Returns a stop function.
 */
export function typeBio(node, text, mode) {
  node.replaceChildren();
  if (!text) return () => {};
  if (mode === 'none' || reduceMotion) {
    node.textContent = text;
    return () => {};
  }
  const typed = el('span', 'typed');
  typed.setAttribute('aria-hidden', 'true');
  node.append(el('span', 'sr-only', text), typed);

  let alive = true;
  let timer = 0;
  const wait = ms => new Promise(resolve => (timer = setTimeout(resolve, ms)));
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);

  (async () => {
    if (mode === 'typewriter' || lines.length < 2) {
      const chars = Array.from(text);
      for (let i = 1; alive && i <= chars.length; i++) {
        typed.textContent = chars.slice(0, i).join('');
        await wait(28 + Math.random() * 50);
      }
      return;
    }
    for (let n = 0; alive; n = (n + 1) % lines.length) {
      const chars = Array.from(lines[n]);
      for (let i = 1; alive && i <= chars.length; i++) {
        typed.textContent = chars.slice(0, i).join('');
        await wait(40 + Math.random() * 60);
      }
      await wait(1800);
      for (let i = chars.length - 1; alive && i >= 0; i--) {
        typed.textContent = chars.slice(0, i).join('');
        await wait(22);
      }
      await wait(400);
    }
  })();

  return () => {
    alive = false;
    clearTimeout(timer);
  };
}

/** Animates the browser tab title. Returns a stop function that restores it. */
export function animateTitle(base, mode) {
  document.title = base;
  if (mode === 'none' || reduceMotion) return () => {};
  const chars = Array.from(base);
  let i = 0;
  let dir = 1;
  let hold = 0;
  const loop = [...chars, ' ', '·', ' '];
  const id = setInterval(() => {
    if (mode === 'scroll') {
      document.title = loop.slice(i).concat(loop.slice(0, i)).join('');
      i = (i + 1) % loop.length;
      return;
    }
    if (hold > 0) return void hold--;
    i += dir;
    if (i >= chars.length) {
      i = chars.length;
      dir = -1;
      hold = 10;
    } else if (i <= 1) {
      i = 1; // an empty title would show the URL instead
      dir = 1;
      hold = 3;
    }
    document.title = chars.slice(0, i).join('');
  }, mode === 'scroll' ? 280 : 200);
  return () => {
    clearInterval(id);
    document.title = base;
  };
}
