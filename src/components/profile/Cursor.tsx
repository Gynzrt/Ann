import { useEffect, useRef } from 'react';
import type { CursorStyle } from '@/lib/types';
import { useMedia } from '@/hooks/useMedia';

/** Custom cursors. Only on devices with a fine pointer. */
export function Cursor({ style, color, url, scope }: { style: CursorStyle; color: string; url: string; scope: React.RefObject<HTMLElement> }) {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLCanvasElement>(null);
  const src = useMedia(url);

  useEffect(() => {
    const root = scope.current;
    if (!root || style === 'default' || !matchMedia('(pointer: fine)').matches) return;
    if (style === 'custom') {
      if (!src) return;
      root.style.cursor = `url("${src}") 4 4, auto`;
      return () => { root.style.cursor = ''; };
    }
    root.classList.add('cursor-none-all');
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0;
    const pts: { x: number; y: number; life: number }[] = [];
    const cv = trail.current;
    const ctx = cv?.getContext('2d');
    const resize = () => { if (cv) { cv.width = innerWidth; cv.height = innerHeight; } };
    resize();
    addEventListener('resize', resize);
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      if (style === 'trail') pts.push({ x, y, life: 1 });
    };
    const tick = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      if (dot.current) dot.current.style.transform = `translate(${x}px, ${y}px)`;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      if (ctx && cv) {
        ctx.clearRect(0, 0, cv.width, cv.height);
        for (let i = pts.length - 1; i >= 0; i--) {
          const p = pts[i];
          p.life -= 0.04;
          if (p.life <= 0) { pts.splice(i, 1); continue; }
          ctx.globalAlpha = p.life * 0.8;
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(p.x, p.y, 4 * p.life, 0, 6.283); ctx.fill();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    addEventListener('pointermove', move);
    raf = requestAnimationFrame(tick);
    return () => {
      root.classList.remove('cursor-none-all');
      removeEventListener('pointermove', move);
      removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [style, color, src, scope]);

  if (style === 'default' || style === 'custom') return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] hidden [@media(pointer:fine)]:block" aria-hidden>
      {style === 'trail' && <canvas ref={trail} className="absolute inset-0" />}
      <div ref={dot} className="absolute -left-1 -top-1 h-2 w-2 rounded-full" style={{ background: color }} />
      {style === 'ring' && <div ref={ring} className="absolute -left-4 -top-4 h-8 w-8 rounded-full border-2" style={{ borderColor: color }} />}
    </div>
  );
}
