/* Cursor and click effects, drawn on a canvas above the card.
 * The animation loop only runs while something is moving or fading out. */
import { el, rand, pick, finePointer, reduceMotion } from '../util.js';

const TAU = Math.PI * 2;

export function startPointerFx(stage, { cursor, click, accent }) {
  const useCursor = cursor !== 'none' && finePointer && !reduceMotion;
  const useClick = click !== 'none' && !reduceMotion;
  if (!useCursor && !useClick) return () => {};

  const cv = el('canvas', 'pointer-fx');
  cv.setAttribute('aria-hidden', 'true');
  stage.append(cv);
  const ctx = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let w = 0;
  let h = 0;
  const resize = () => {
    w = stage.clientWidth;
    h = stage.clientHeight;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  const parts = [];
  const trail = [];
  const pos = { x: 0, y: 0 };
  const spawnAt = { x: 0, y: 0 };
  let ring = null;
  let dot = null;
  let rx = 0;
  let ry = 0;
  let entered = false;
  let hot = false;

  if (useCursor && cursor === 'ring') {
    dot = el('div', 'cur-dot');
    ring = el('div', 'cur-ring');
    stage.append(dot, ring);
    stage.classList.add('cursor-ring');
  }

  const local = e => {
    const r = stage.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  function onMove(e) {
    if (!useCursor || e.pointerType === 'touch') return;
    const [x, y] = local(e);
    pos.x = x;
    pos.y = y;
    if (!entered) {
      entered = true;
      rx = x;
      ry = y;
      spawnAt.x = x;
      spawnAt.y = y;
      stage.classList.add('cursor-in');
    }
    if (cursor === 'trail') {
      trail.push({ x, y, life: 1 });
    } else if (cursor === 'sparkle') {
      if ((x - spawnAt.x) ** 2 + (y - spawnAt.y) ** 2 > 64) {
        spawnAt.x = x;
        spawnAt.y = y;
        parts.push({
          kind: 'star', x, y, vx: rand(-1, 1), vy: rand(-1.6, -0.2), r: rand(2.5, 5), rot: rand(0, TAU),
          life: 1, decay: rand(0.02, 0.035), col: pick([accent, '#ffffff']), drag: 0.97, g: 0.06,
        });
      }
    } else if (cursor === 'ring') {
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const over = !!e.target.closest?.('a, button, [tabindex]');
      if (over !== hot) ring.classList.toggle('hot', (hot = over));
    }
    kick();
  }

  function onLeave() {
    entered = false;
    stage.classList.remove('cursor-in');
  }

  function onDown(e) {
    if (!useClick) return;
    const [x, y] = local(e);
    if (click === 'burst') {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU + rand(-0.15, 0.15);
        const s = rand(2, 5);
        parts.push({
          kind: 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rand(1.5, 3),
          life: 1, decay: rand(0.025, 0.04), col: i % 3 ? accent : '#ffffff', drag: 0.92, g: 0.05,
        });
      }
    } else if (click === 'ripple') {
      parts.push({ kind: 'ring', x, y, r: 2, life: 1, decay: 0.03 });
    }
    kick();
  }

  let raf = 0;
  let last = 0;
  function kick() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function frame(now) {
    const dt = Math.min(3, Math.max(0.2, (now - last) / 16.667));
    last = now;
    ctx.clearRect(0, 0, w, h);

    for (const t of trail) t.life -= 0.06 * dt;
    while (trail.length && trail[0].life <= 0) trail.shift();
    if (trail.length > 1) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = accent;
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        ctx.globalAlpha = b.life * 0.7;
        ctx.lineWidth = 1 + b.life * 7;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        parts.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life;
      if (p.kind === 'ring') {
        p.r += 3.5 * dt;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.stroke();
        continue;
      }
      const drag = p.drag ** dt;
      p.vx *= drag;
      p.vy = p.vy * drag + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.fillStyle = p.col;
      if (p.kind === 'star') star(ctx, p.x, p.y, p.r * p.life + 0.5, (p.rot += 0.05 * dt));
      else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.5 + p.life * 0.5), 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    let ringMoving = false;
    if (ring) {
      const k = Math.min(1, 0.22 * dt);
      rx += (pos.x - rx) * k;
      ry += (pos.y - ry) * k;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      ringMoving = Math.abs(pos.x - rx) + Math.abs(pos.y - ry) > 0.3;
    }

    raf = trail.length || parts.length || ringMoving ? requestAnimationFrame(frame) : 0;
  }

  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerleave', onLeave);
  stage.addEventListener('pointerdown', onDown);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    stage.removeEventListener('pointermove', onMove);
    stage.removeEventListener('pointerleave', onLeave);
    stage.removeEventListener('pointerdown', onDown);
    stage.classList.remove('cursor-ring', 'cursor-in');
  };
}

function star(c, x, y, r, rot) {
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * Math.PI) / 4;
    const rr = i % 2 ? r * 0.38 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
}
