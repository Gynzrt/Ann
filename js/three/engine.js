/* Runs the optional Three.js background scene.
 *
 * One engine (WebGL renderer + canvas) lives per stage and survives
 * re-renders, so the editor preview doesn't create a new WebGL context on
 * every keystroke. The scene is rebuilt only when its kind or density
 * changes; colour changes are applied in place. Three.js itself is loaded
 * on first use, so pages without a 3D scene never download it.
 */
import { el, reduceMotion, finePointer } from '../util.js';
import { SCENES } from './scenes.js';

let threePromise = null;
const loadThree = () => (threePromise ??= import('../../vendor/three.module.min.js'));

const engines = new WeakMap();

/** Shows scene `p.scene` in `stage`, inserted before `before`. Returns a release function. */
export function mount3D(stage, p, { before, notice, audio }) {
  let engine = engines.get(stage);
  if (engine?.failed) {
    notice?.(engine.failed);
    return () => {};
  }
  if (!engine) {
    engine = createEngine(stage);
    engines.set(stage, engine);
  }
  stage.insertBefore(engine.canvas, before);
  engine.mount(p, { notice, audio });
  return () => engine.release();
}

function createEngine(stage) {
  const canvas = el('canvas', 'scene3d');
  canvas.setAttribute('aria-hidden', 'true');
  const mobile = !finePointer || Math.min(screen.width, screen.height) < 600;
  const maxRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
  const input = { x: 0, y: 0, tx: 0, ty: 0, rawX: 0, rawY: 0, active: false, down: false, bass: 0, beat: 0, clicks: [] };

  let THREE = null;
  let renderer = null;
  let rendererPromise = null;
  let current = null;
  let key = '';
  let wanted = null;
  let audio = null;
  let raf = 0;
  let running = false;
  let visible = true;
  let lost = false;
  let destroyTimer = 0;
  let last = 0;
  let time = 0;
  let ratio = maxRatio;
  let slow = 0;
  let frames = 0;
  let dead = false;

  const engine = { canvas, failed: '' };

  function ensureRenderer() {
    rendererPromise ??= (async () => {
      THREE = await loadThree();
      if (dead) return; // torn down while three.js was downloading
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
      renderer.setClearColor(0x000000, 0);
    })();
    return rendererPromise;
  }

  const cfgOf = p => ({ a: p.bgA, b: p.bgB, accent: p.accent, density: p.density });

  async function configure(p, notice) {
    wanted = p;
    try {
      await ensureRenderer();
    } catch (e) {
      console.warn('3D scene unavailable:', e);
      engine.failed = '3D scenes aren’t supported on this device, so the regular background is shown instead.';
      notice?.(engine.failed);
      destroy();
      return;
    }
    if (dead || wanted !== p || !renderer) return; // torn down, or superseded by a newer render
    const nextKey = `${p.scene}|${p.density}`;
    if (nextKey !== key || !current) {
      current?.dispose();
      current = null;
      key = '';
      try {
        current = SCENES[p.scene](THREE, renderer, cfgOf(p), { mobile });
        key = nextKey;
      } catch (e) {
        console.warn('Could not build the 3D scene:', e);
        notice?.('Couldn’t start the 3D scene on this device.');
        return;
      }
      resize();
    } else {
      current.setColors(cfgOf(p));
    }
    if (reduceMotion) renderOnce();
  }

  function resize() {
    if (!renderer) return;
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    const pr = ratio * (current?.renderScale ?? 1);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    current?.resize(w, h, pr);
    if (reduceMotion) renderOnce();
  }

  function draw(dt) {
    current.update(dt, time, input);
    input.clicks.length = 0;
    renderer.render(current.scene, current.camera);
    if (!canvas.dataset.ready) canvas.dataset.ready = '1';
  }

  function renderOnce() {
    if (current && renderer && !lost) draw(0);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!current || !visible || lost) {
      last = now;
      return;
    }
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    time += dt;
    const k = Math.min(1, dt * 3);
    input.x += (input.tx - input.x) * k;
    input.y += (input.ty - input.y) * k;
    const levels = audio?.();
    input.bass += ((levels?.bass ?? 0) - input.bass) * Math.min(1, dt * 10);
    input.beat += ((levels?.beat ?? 0) - input.beat) * Math.min(1, dt * (levels?.beat > input.beat ? 25 : 6));
    draw(dt);
    adapt(dt);
  }

  // If frames are slow, lower the resolution step by step instead of stuttering.
  function adapt(dt) {
    if (++frames < 90) return;
    slow = dt > 1 / 30 ? slow + 1 : Math.max(0, slow - 0.5);
    if (slow > 60 && ratio > 0.5) {
      ratio = Math.max(0.5, ratio - 0.25);
      slow = 0;
      frames = 0;
      resize();
    }
  }

  /* ----- pointer ----- */

  const local = e => {
    const r = stage.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)];
  };
  const onMove = e => {
    const [x, y] = local(e);
    input.rawX = x;
    input.rawY = y;
    input.active = true;
    if (!reduceMotion) {
      input.tx = x;
      input.ty = y;
    }
  };
  const onLeave = () => {
    input.tx = input.ty = 0;
    input.active = false;
    input.down = false;
  };
  const onDown = e => {
    const [x, y] = local(e);
    input.down = true;
    input.clicks.push({ x, y });
  };
  const onUp = () => (input.down = false);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerleave', onLeave);
  stage.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);

  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);
  const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
  io.observe(canvas);
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    lost = true;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    key = '';
    if (wanted) configure(wanted);
  });

  /* ----- lifecycle ----- */

  engine.mount = (p, opts) => {
    clearTimeout(destroyTimer);
    audio = opts.audio;
    configure(p, opts.notice);
    if (reduceMotion || running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  // Called when the page re-renders. If the next render doesn't mount a
  // scene again soon, free the GPU resources.
  engine.release = () => {
    cancelAnimationFrame(raf);
    running = false;
    audio = null;
    clearTimeout(destroyTimer);
    destroyTimer = setTimeout(destroy, 1500);
  };

  function destroy() {
    dead = true;
    cancelAnimationFrame(raf);
    running = false;
    ro.disconnect();
    io.disconnect();
    stage.removeEventListener('pointermove', onMove);
    stage.removeEventListener('pointerleave', onLeave);
    stage.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    current?.dispose();
    current = null;
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
    }
    canvas.remove();
    if (!engine.failed) engines.delete(stage);
  }

  return engine;
}
