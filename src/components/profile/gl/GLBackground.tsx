import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
import type { Engine, EffectOptions } from './engine';
import { shifted } from '@/lib/color';

export const GL_EFFECTS = ['fluid', 'aurora', 'liquid', 'warp'] as const;
export type GlEffect = (typeof GL_EFFECTS)[number];
export const isGlEffect = (e: string): e is GlEffect => (GL_EFFECTS as readonly string[]).includes(e);

/** Browsers cap live WebGL contexts, so galleries fall back to posters past this many. */
const MAX_LIVE = 3;
let live = 0;

/** A still CSS impression of each effect: used for thumbnails, reduced motion and when WebGL is unavailable. */
export function Poster({ effect, accent }: { effect: GlEffect; accent: string }) {
  const a = (alpha: number) => shifted(accent, 0, alpha);
  const b = (alpha: number) => shifted(accent, 50, alpha);
  const c = (alpha: number) => shifted(accent, -55, alpha);
  const style: Record<GlEffect, CSSProperties> = {
    fluid: {
      background: `radial-gradient(32% 28% at 28% 38%, ${a(0.55)}, transparent 70%), radial-gradient(30% 26% at 68% 62%, ${b(0.45)}, transparent 70%), radial-gradient(24% 22% at 56% 26%, ${c(0.4)}, transparent 70%), radial-gradient(26% 24% at 38% 74%, ${b(0.3)}, transparent 70%)`,
      filter: 'blur(24px)',
      inset: '-8%',
    },
    aurora: {
      background: `radial-gradient(70% 22% at 40% 30%, ${a(0.45)}, transparent 70%), radial-gradient(60% 18% at 70% 22%, ${b(0.35)}, transparent 70%), linear-gradient(180deg, transparent 8%, ${a(0.14)} 26%, transparent 55%)`,
      filter: 'blur(10px)',
    },
    liquid: {
      background: `radial-gradient(55% 55% at 22% 30%, ${a(0.55)}, transparent 62%), radial-gradient(50% 50% at 80% 68%, ${b(0.45)}, transparent 62%), radial-gradient(45% 45% at 62% 18%, ${c(0.4)}, transparent 62%)`,
      filter: 'blur(18px)',
      inset: '-6%',
    },
    warp: {
      background: `radial-gradient(circle at 50% 50%, ${a(0.25)}, transparent 30%), repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,.16) 0deg 0.35deg, transparent 0.35deg 5deg)`,
      WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 0%, transparent 8%, #000 40%, transparent 85%)',
      maskImage: 'radial-gradient(circle at 50% 50%, #000 0%, transparent 8%, #000 40%, transparent 85%)',
    },
  };
  return <div className="pointer-events-none absolute inset-0" style={style[effect]} aria-hidden />;
}

/**
 * Runs a WebGL effect on a canvas that fills its container. The pointer is read
 * from `scope` (the profile page), because the canvas sits behind the content.
 * Pauses off-screen and in background tabs; any failure shows the poster.
 */
export function GLBackground({ effect, options, scope, enabled }: {
  effect: GlEffect;
  options: EffectOptions;
  scope: RefObject<HTMLElement>;
  enabled: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const opts = useRef(options);
  opts.current = options;
  const [failed, setFailed] = useState(false);
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = enabled && !reduce && !failed;

  useEffect(() => setFailed(false), [effect]);

  useEffect(() => {
    const box = host.current;
    if (!run || !box) return;
    if (live >= MAX_LIVE) { setFailed(true); return; }
    // A fresh canvas for every run: a canvas whose context was released can't get a new one.
    const el = document.createElement('canvas');
    el.className = 'absolute inset-0 h-full w-full';
    el.setAttribute('aria-hidden', 'true');
    box.appendChild(el);
    let engine: Engine | undefined;
    let cancelled = false;
    let raf = 0;
    let visible = true;
    let prev = 0;
    let time = 0;
    let last: { x: number; y: number } | null = null;

    const start = async () => {
      try {
        if (effect === 'fluid') {
          const { Fluid } = await import('./fluid');
          if (cancelled) return;
          engine = new Fluid(el, () => opts.current);
        } else {
          const { ShaderBg } = await import('./shaders');
          if (cancelled) return;
          engine = new ShaderBg(el, effect, () => opts.current);
        }
      } catch {
        if (!cancelled) setFailed(true);
        return;
      }
      live++;
      resize();
      ro.observe(el);
      io.observe(el);
      loop();
    };

    const resize = () => engine?.resize(el.clientWidth, el.clientHeight, Math.min(devicePixelRatio || 1, 1.5));
    const ro = new ResizeObserver(resize);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); });
    const loop = () => {
      cancelAnimationFrame(raf);
      if (cancelled || !visible || document.hidden || !engine) return;
      raf = requestAnimationFrame((now) => {
        const dt = prev ? Math.min(0.033, (now - prev) / 1000) : 1 / 60;
        prev = now;
        time += dt;
        try { engine?.frame(dt, time); } catch { setFailed(true); return; }
        loop();
      });
    };
    const onVisibility = () => { prev = 0; loop(); };

    const at = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      const x = (cx - r.left) / r.width;
      const y = 1 - (cy - r.top) / r.height;
      return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : null;
    };
    const move = (cx: number, cy: number) => {
      const p = at(cx, cy);
      if (!p) { last = null; return; }
      if (last) engine?.pointer?.(p.x, p.y, p.x - last.x, p.y - last.y);
      last = p;
    };
    const onPointerMove = (e: PointerEvent) => { if (e.pointerType !== 'touch') move(e.clientX, e.clientY); };
    const onPointerDown = (e: PointerEvent) => {
      const p = at(e.clientX, e.clientY);
      if (p) engine?.pointer?.(p.x, p.y, 0, 0, true);
    };
    const onTouchMove = (e: TouchEvent) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); };
    const onTouchEnd = () => { last = null; };
    const onLost = (e: Event) => { e.preventDefault(); setFailed(true); };

    const root = scope.current ?? window;
    root.addEventListener('pointermove', onPointerMove as EventListener);
    root.addEventListener('pointerdown', onPointerDown as EventListener);
    root.addEventListener('touchmove', onTouchMove as EventListener, { passive: true });
    root.addEventListener('touchend', onTouchEnd);
    el.addEventListener('webglcontextlost', onLost);
    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener('pointermove', onPointerMove as EventListener);
      root.removeEventListener('pointerdown', onPointerDown as EventListener);
      root.removeEventListener('touchmove', onTouchMove as EventListener);
      root.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('webglcontextlost', onLost);
      document.removeEventListener('visibilitychange', onVisibility);
      if (engine) {
        live--;
        engine.destroy();
      }
      el.remove();
    };
  }, [run, effect, scope]);

  if (!run) return <Poster effect={effect} accent={options.accent} />;
  return <div ref={host} className="pointer-events-none absolute inset-0" aria-hidden />;
}
