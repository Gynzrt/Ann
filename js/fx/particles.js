/* Background particle effects drawn on a canvas behind the card.
 * Each kind is a factory taking a shared `env` ({ctx, w, h, accent, density,
 * mouse, ptr}) and returning { resize(scaleX, scaleY), frame(dt) }. */
import { el, rand, pick } from '../util.js';

const TAU = Math.PI * 2;

export function startParticles(stage, kind, { accent, density = 1, mouse = false } = {}) {
  const factory = KINDS[kind];
  if (!factory) return () => {};
  const cv = el('canvas', 'particles');
  cv.setAttribute('aria-hidden', 'true');
  stage.append(cv);
  const ctx = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const env = { ctx, w: 0, h: 0, accent, density, mouse, ptr: { x: 0, y: 0, on: false } };
  const sys = factory(env);

  const resize = () => {
    const w = Math.max(1, cv.clientWidth);
    const h = Math.max(1, cv.clientHeight);
    const sx = env.w ? w / env.w : 1;
    const sy = env.h ? h / env.h : 1;
    env.w = w;
    env.h = h;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sys.resize(sx, sy);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(cv);
  resize();

  const move = e => {
    const r = cv.getBoundingClientRect();
    env.ptr.x = e.clientX - r.left;
    env.ptr.y = e.clientY - r.top;
    env.ptr.on = true;
  };
  const leave = () => (env.ptr.on = false);
  if (mouse) {
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerleave', leave);
  }

  let last = performance.now();
  let raf = 0;
  const frame = now => {
    const dt = Math.min(3, Math.max(0.2, (now - last) / 16.667));
    last = now;
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, env.w, env.h);
    sys.frame(dt);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    stage.removeEventListener('pointermove', move);
    stage.removeEventListener('pointerleave', leave);
  };
}

/* ---------- helpers ---------- */

// Scale counts with screen area so phones aren't crowded and big screens aren't empty.
const area = env => Math.min(1.6, Math.max(0.35, (env.w * env.h) / (1280 * 800)));

function wrap(p, env, m = 20) {
  if (p.x < -m) p.x += env.w + 2 * m;
  else if (p.x > env.w + m) p.x -= env.w + 2 * m;
  if (p.y < -m) p.y += env.h + 2 * m;
  else if (p.y > env.h + m) p.y -= env.h + 2 * m;
}

function repel(env, p, dt) {
  const { ptr } = env;
  if (!ptr.on) return;
  const dx = p.x - ptr.x;
  const dy = p.y - ptr.y;
  const d2 = dx * dx + dy * dy;
  const R = 110;
  if (d2 > R * R || d2 < 0.01) return;
  const d = Math.sqrt(d2);
  const f = (1 - d / R) * 4 * dt;
  p.x += (dx / d) * f;
  p.y += (dy / d) * f;
}

function dot(c, x, y, r) {
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}

function heart(c, s) {
  const k = s / 2;
  c.beginPath();
  c.moveTo(0, k * 0.9);
  c.bezierCurveTo(-k * 1.4, -k * 0.1, -k * 0.7, -k * 1.2, 0, -k * 0.45);
  c.bezierCurveTo(k * 0.7, -k * 1.2, k * 1.4, -k * 0.1, 0, k * 0.9);
  c.closePath();
}

/** Builds a system of independent particles from make/step/draw functions. */
function points(count, make, step, draw) {
  return env => {
    const ps = [];
    return {
      ps,
      resize(sx, sy) {
        for (const p of ps) {
          p.x *= sx;
          p.y *= sy;
        }
        const n = Math.max(1, Math.round(count * env.density * area(env)));
        while (ps.length < n) ps.push(make(env, true));
        ps.length = n;
      },
      frame(dt) {
        for (const p of ps) {
          step(env, p, dt);
          if (env.mouse) repel(env, p, dt);
          draw(env.ctx, p, env);
        }
      },
    };
  };
}

/* ---------- kinds ---------- */

const makeRain = (e, init) => ({
  x: rand(-e.w * 0.2, e.w),
  y: init ? rand(0, e.h) : rand(-e.h * 0.3, -10),
  l: rand(10, 22),
  v: rand(9, 15),
  a: rand(0.15, 0.4),
});

const makeBubble = (e, init) => ({
  x: rand(0, e.w),
  y: init ? rand(0, e.h) : e.h + 20,
  r: rand(3, 13),
  vy: rand(0.3, 0.9),
  t: rand(0, TAU),
  a: rand(0.2, 0.5),
});

const makeHeart = (e, init) => ({
  x: rand(0, e.w),
  y: init ? rand(0, e.h) : e.h + 20,
  s: rand(7, 15),
  vy: rand(0.3, 0.8),
  t: rand(0, TAU),
  rot: rand(-0.3, 0.3),
  a: rand(0.35, 0.8),
});

const CONFETTI = ['#ffd166', '#06d6a0', '#ef476f', '#4cc9f0', '#ffffff'];
const GLYPHS = '0123456789ABCDEF<>/{}[]=+*#$%&'.split('');

const KINDS = {
  dust: points(
    70,
    (e, init) => ({
      x: rand(0, e.w), y: init ? rand(0, e.h) : e.h + 10,
      r: rand(0.6, 2), vx: rand(-0.15, 0.15), vy: rand(-0.45, -0.1), a: rand(0.25, 0.8), t: rand(0, TAU),
    }),
    (e, p, dt) => {
      p.t += 0.02 * dt;
      p.x += (p.vx + Math.sin(p.t) * 0.15) * dt;
      p.y += p.vy * dt;
      wrap(p, e);
    },
    (c, p, e) => {
      c.globalAlpha = p.a;
      c.fillStyle = e.accent;
      dot(c, p.x, p.y, p.r);
    },
  ),

  stars: env => {
    const base = points(
      110,
      e => ({
        x: rand(0, e.w), y: rand(0, e.h), r: rand(0.4, 1.6),
        t: rand(0, TAU), s: rand(0.01, 0.04), vx: rand(-0.03, 0.03), vy: rand(-0.02, 0.02),
      }),
      (e, p, dt) => {
        p.t += p.s * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        wrap(p, e, 5);
      },
      (c, p) => {
        c.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(p.t));
        c.fillStyle = '#ffffff';
        dot(c, p.x, p.y, p.r);
      },
    )(env);
    let shot = null; // an occasional shooting star
    return {
      resize: base.resize,
      frame(dt) {
        base.frame(dt);
        if (!shot && Math.random() < 0.004 * dt) {
          shot = { x: rand(0, env.w * 0.6), y: rand(0, env.h * 0.35), vx: rand(8, 12), vy: rand(2.5, 4.5), life: 1 };
        }
        if (!shot) return;
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        shot.life -= 0.022 * dt;
        if (shot.life <= 0) return void (shot = null);
        const c = env.ctx;
        const tx = shot.x - shot.vx * 9;
        const ty = shot.y - shot.vy * 9;
        const g = c.createLinearGradient(shot.x, shot.y, tx, ty);
        g.addColorStop(0, 'rgba(255,255,255,0.9)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.globalAlpha = shot.life;
        c.strokeStyle = g;
        c.lineWidth = 1.6;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(shot.x, shot.y);
        c.lineTo(tx, ty);
        c.stroke();
      },
    };
  },

  snow: points(
    90,
    (e, init) => ({
      x: rand(0, e.w), y: init ? rand(0, e.h) : -10,
      r: rand(1, 3.2), vy: rand(0.4, 1.3), t: rand(0, TAU), sw: rand(0.2, 0.7), a: rand(0.5, 0.95),
    }),
    (e, p, dt) => {
      p.t += 0.015 * dt;
      p.y += p.vy * dt;
      p.x += Math.sin(p.t) * p.sw * dt;
      wrap(p, e, 10);
    },
    (c, p) => {
      c.globalAlpha = p.a;
      c.fillStyle = '#ffffff';
      dot(c, p.x, p.y, p.r);
    },
  ),

  fireflies: points(
    40,
    e => ({ x: rand(0, e.w), y: rand(0, e.h), r: rand(1.2, 2.6), dir: rand(0, TAU), sp: rand(0.2, 0.6), t: rand(0, TAU) }),
    (e, p, dt) => {
      p.dir += rand(-0.15, 0.15) * dt;
      p.x += Math.cos(p.dir) * p.sp * dt;
      p.y += Math.sin(p.dir) * p.sp * dt;
      p.t += 0.03 * dt;
      wrap(p, e);
    },
    (c, p, e) => {
      const glow = 0.3 + 0.7 * Math.max(0, Math.sin(p.t));
      c.fillStyle = e.accent;
      c.globalAlpha = glow * 0.22;
      dot(c, p.x, p.y, p.r * 4);
      c.globalAlpha = glow;
      dot(c, p.x, p.y, p.r);
    },
  ),

  rain: points(
    140,
    makeRain,
    (e, p, dt) => {
      p.y += p.v * dt;
      p.x += p.v * 0.18 * dt;
      if (p.y > e.h + 20) Object.assign(p, makeRain(e, false));
    },
    (c, p) => {
      c.globalAlpha = p.a;
      c.strokeStyle = '#cfe3ff';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x - p.l * 0.18, p.y - p.l);
      c.stroke();
    },
  ),

  bubbles: points(
    35,
    makeBubble,
    (e, p, dt) => {
      p.t += 0.02 * dt;
      p.y -= p.vy * dt;
      p.x += Math.sin(p.t) * 0.4 * dt;
      if (p.y < -20) Object.assign(p, makeBubble(e, false));
    },
    (c, p) => {
      c.globalAlpha = p.a;
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1;
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, TAU);
      c.stroke();
      c.globalAlpha = p.a * 0.7;
      c.fillStyle = '#ffffff';
      dot(c, p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.18);
    },
  ),

  hearts: points(
    26,
    makeHeart,
    (e, p, dt) => {
      p.t += 0.02 * dt;
      p.y -= p.vy * dt;
      p.x += Math.sin(p.t) * 0.35 * dt;
      if (p.y < -20) Object.assign(p, makeHeart(e, false));
    },
    (c, p, e) => {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot + Math.sin(p.t) * 0.2);
      c.globalAlpha = p.a * Math.min(1, Math.max(0, p.y / (e.h * 0.25)));
      c.fillStyle = e.accent;
      heart(c, p.s);
      c.fill();
      c.restore();
    },
  ),

  petals: points(
    40,
    (e, init) => ({
      x: rand(0, e.w), y: init ? rand(0, e.h) : -15, s: rand(5, 10), vy: rand(0.5, 1.2), vx: rand(0.2, 0.8),
      t: rand(0, TAU), rot: rand(0, TAU), vr: rand(-0.03, 0.03), col: pick(['#ffc6dc', '#ffb3cf', '#ffd9e6', '#f9a8c9']),
    }),
    (e, p, dt) => {
      p.t += 0.02 * dt;
      p.y += p.vy * dt;
      p.x += (p.vx + Math.sin(p.t) * 0.6) * dt;
      p.rot += p.vr * dt;
      wrap(p, e);
    },
    (c, p) => {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.scale(1, Math.abs(Math.cos(p.t * 1.3)) * 0.6 + 0.4);
      c.globalAlpha = 0.85;
      c.fillStyle = p.col;
      c.beginPath();
      c.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, TAU);
      c.fill();
      c.restore();
    },
  ),

  confetti: points(
    80,
    (e, init) => ({
      x: rand(0, e.w), y: init ? rand(0, e.h) : -10, pw: rand(4, 8), ph: rand(8, 14),
      vy: rand(1, 2.4), vx: rand(-0.5, 0.5), rot: rand(0, TAU), vr: rand(-0.08, 0.08), t: rand(0, TAU),
      col: pick([e.accent, ...CONFETTI]),
    }),
    (e, p, dt) => {
      p.t += 0.08 * dt;
      p.y += p.vy * dt;
      p.x += (p.vx + Math.sin(p.t) * 0.5) * dt;
      p.rot += p.vr * dt;
      wrap(p, e);
    },
    (c, p) => {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.scale(1, Math.cos(p.t));
      c.globalAlpha = 0.9;
      c.fillStyle = p.col;
      c.fillRect(-p.pw / 2, -p.ph / 2, p.pw, p.ph);
      c.restore();
    },
  ),

  network: env => {
    const base = points(
      70,
      e => ({ x: rand(0, e.w), y: rand(0, e.h), vx: rand(-0.35, 0.35), vy: rand(-0.35, 0.35), r: rand(1, 2.2) }),
      (e, p, dt) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0 || p.x > e.w) {
          p.vx *= -1;
          p.x = Math.min(e.w, Math.max(0, p.x));
        }
        if (p.y < 0 || p.y > e.h) {
          p.vy *= -1;
          p.y = Math.min(e.h, Math.max(0, p.y));
        }
      },
      () => {},
    )(env);
    return {
      resize: base.resize,
      frame(dt) {
        base.frame(dt); // moves the points; all drawing happens below
        const c = env.ctx;
        const ps = base.ps;
        const D = 130;
        c.strokeStyle = env.accent;
        c.lineWidth = 1;
        for (let i = 0; i < ps.length; i++) {
          for (let j = i + 1; j < ps.length; j++) {
            const dx = ps[i].x - ps[j].x;
            const dy = ps[i].y - ps[j].y;
            const d2 = dx * dx + dy * dy;
            if (d2 > D * D) continue;
            c.globalAlpha = (1 - Math.sqrt(d2) / D) * 0.45;
            c.beginPath();
            c.moveTo(ps[i].x, ps[i].y);
            c.lineTo(ps[j].x, ps[j].y);
            c.stroke();
          }
        }
        if (env.mouse && env.ptr.on) {
          const M = 170;
          for (const p of ps) {
            const d = Math.hypot(p.x - env.ptr.x, p.y - env.ptr.y);
            if (d > M) continue;
            c.globalAlpha = (1 - d / M) * 0.8;
            c.beginPath();
            c.moveTo(p.x, p.y);
            c.lineTo(env.ptr.x, env.ptr.y);
            c.stroke();
          }
        }
        c.fillStyle = env.accent;
        c.globalAlpha = 0.85;
        for (const p of ps) dot(c, p.x, p.y, p.r);
      },
    };
  },

  code: env => {
    const SIZE = 15;
    let cols = [];
    const makeCol = (x, init) => ({
      x,
      y: init ? rand(-env.h, env.h) : rand(-env.h * 0.5, 0),
      v: rand(1.6, 4),
      len: Math.floor(rand(8, 24)),
      chars: Array.from({ length: 24 }, () => pick(GLYPHS)),
    });
    return {
      resize() {
        const gap = (SIZE * 1.3) / Math.sqrt(env.density);
        cols = Array.from({ length: Math.ceil(env.w / gap) }, (_, i) => makeCol(i * gap + gap / 2, true));
      },
      frame(dt) {
        const c = env.ctx;
        c.font = `${SIZE}px ui-monospace, Menlo, Consolas, monospace`;
        c.textAlign = 'center';
        for (const col of cols) {
          col.y += col.v * dt;
          if (col.y - col.len * SIZE > env.h) Object.assign(col, makeCol(col.x, false));
          if (Math.random() < 0.05) col.chars[Math.floor(Math.random() * col.chars.length)] = pick(GLYPHS);
          for (let k = 0; k < col.len; k++) {
            const y = col.y - k * SIZE;
            if (y < -SIZE || y > env.h + SIZE) continue;
            c.globalAlpha = k === 0 ? 0.95 : (1 - k / col.len) * 0.7;
            c.fillStyle = k === 0 ? '#ffffff' : env.accent;
            c.fillText(col.chars[k % col.chars.length], col.x, y);
          }
        }
      },
    };
  },
};
