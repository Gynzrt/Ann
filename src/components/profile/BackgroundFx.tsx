import { useEffect, useRef } from 'react';
import type { BackgroundEffect } from '@/lib/types';
import { hexA } from '@/lib/util';

interface P {
  x: number; y: number; vx: number; vy: number; r: number; a: number; t: number;
}

/** Canvas background effects. Pauses when hidden and respects reduced motion. */
export function BackgroundFx({ effect, color }: { effect: BackgroundEffect; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || effect === 'none' || effect === 'blur-orbs') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d')!;
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    // Layout size, not on-screen size: the editor preview scales its frame with a transform.
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const count = { particles: 70, snow: 120, rain: 160, stars: 160, nightfall: 90 }[effect] ?? 60;
    const make = (init: boolean): P => {
      const base = { x: Math.random() * w, y: init ? Math.random() * h : -10, t: Math.random() * 6.28 };
      switch (effect) {
        case 'snow': return { ...base, vx: 0, vy: 0.4 + Math.random() * 1.1, r: 1 + Math.random() * 2.4, a: 0.4 + Math.random() * 0.6 };
        case 'rain': return { ...base, vx: -0.6, vy: 7 + Math.random() * 6, r: 10 + Math.random() * 14, a: 0.15 + Math.random() * 0.35 };
        case 'stars': return { ...base, y: Math.random() * h, vx: 0, vy: 0, r: Math.random() * 1.4 + 0.2, a: Math.random() };
        case 'nightfall': return { ...base, x: Math.random() * w + h * 0.3, vx: -2.2 - Math.random() * 2, vy: 2.2 + Math.random() * 2, r: 30 + Math.random() * 60, a: 0.3 + Math.random() * 0.5 };
        default: return { ...base, y: init ? Math.random() * h : h + 10, vx: (Math.random() - 0.5) * 0.3, vy: -0.2 - Math.random() * 0.5, r: 0.8 + Math.random() * 2, a: 0.2 + Math.random() * 0.6 };
      }
    };
    const ps = Array.from({ length: count }, () => make(true));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.t += 0.02;
        p.x += p.vx + (effect === 'snow' ? Math.sin(p.t) * 0.4 : 0);
        p.y += p.vy;
        if (effect === 'rain') {
          ctx.strokeStyle = hexA('#ffffff', p.a);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 2, p.y - p.r); ctx.stroke();
        } else if (effect === 'nightfall') {
          const g = ctx.createLinearGradient(p.x, p.y, p.x + p.r, p.y - p.r);
          g.addColorStop(0, hexA(color, p.a)); g.addColorStop(1, hexA(color, 0));
          ctx.strokeStyle = g; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.r, p.y - p.r); ctx.stroke();
        } else {
          const a = effect === 'stars' ? (Math.sin(p.t * 1.5) + 1) / 2 * p.a : p.a;
          ctx.fillStyle = effect === 'particles' ? hexA(color, a) : hexA('#ffffff', a);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        }
        if (p.y > h + 30 || p.y < -30 || p.x < -100 || p.x > w + 100) {
          if (effect !== 'stars') ps[i] = make(false);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    // Only animate while the canvas is on screen and the tab is visible.
    let inView = true;
    const sync = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && inView) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); });
    io.observe(canvas);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [effect, color]);

  if (effect === 'none') return null;
  if (effect === 'blur-orbs')
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="orb absolute -left-24 top-1/4 h-[420px] w-[420px] rounded-full blur-[110px]" style={{ background: hexA(color, 0.35) }} />
        <div className="orb orb-2 absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full blur-[110px]" style={{ background: hexA(color, 0.22) }} />
      </div>
    );
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
