import { useEffect, useRef } from 'react';
import type { CursorStyle } from '@/lib/types';
import { useMedia } from '@/hooks/useMedia';

const TRAIL = 14;

/**
 * Custom cursors, drawn inside the profile's own scroll container so they work
 * both on the public page and inside the (possibly scaled) editor preview.
 * Only active for devices with a fine pointer.
 */
export function Cursor({ style, color, url, scope }: { style: CursorStyle; color: string; url: string; scope: React.RefObject<HTMLElement> }) {
  const layer = useRef<HTMLDivElement>(null);
  const src = useMedia(url);

  useEffect(() => {
    const root = scope.current;
    if (!root || style === 'default' || !matchMedia('(pointer: fine)').matches) return;
    if (style === 'custom') {
      if (!src) return;
      root.style.cursor = `url("${src}") 4 4, auto`;
      return () => { root.style.cursor = ''; };
    }
    const el = layer.current;
    if (!el) return;
    root.classList.add('cursor-none-all');
    const dots = [...el.children] as HTMLElement[];
    const pts = Array.from({ length: TRAIL }, () => ({ x: -100, y: -100 }));
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0, visible = false;

    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const sx = root.offsetWidth / r.width || 1;
      const sy = root.offsetHeight / r.height || 1;
      x = (e.clientX - r.left) * sx + root.scrollLeft;
      y = (e.clientY - r.top) * sy + root.scrollTop;
      if (!visible) { visible = true; el.style.opacity = '1'; rx = x; ry = y; pts.forEach((p) => { p.x = x; p.y = y; }); }
    };
    const leave = () => { visible = false; el.style.opacity = '0'; };
    const tick = () => {
      rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;
      pts.unshift({ x, y }); pts.length = TRAIL;
      dots.forEach((d, i) => {
        if (style === 'trail') {
          const p = pts[i];
          d.style.transform = `translate(${p.x}px, ${p.y}px) scale(${1 - i / TRAIL})`;
        } else if (i === 0) d.style.transform = `translate(${x}px, ${y}px)`;
        else if (i === 1) d.style.transform = `translate(${rx}px, ${ry}px)`;
      });
      raf = requestAnimationFrame(tick);
    };
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', leave);
    raf = requestAnimationFrame(tick);
    return () => {
      root.classList.remove('cursor-none-all');
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(raf);
    };
  }, [style, color, src, scope]);

  if (style === 'default' || style === 'custom') return null;
  const count = style === 'trail' ? TRAIL : style === 'ring' ? 2 : 1;
  return (
    <div ref={layer} className="pointer-events-none absolute left-0 top-0 z-[60] opacity-0 transition-opacity duration-150" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const ring = style === 'ring' && i === 1;
        return (
          <div
            key={i}
            className="absolute left-0 top-0 rounded-full will-change-transform"
            style={{
              width: ring ? 30 : 8,
              height: ring ? 30 : 8,
              marginLeft: ring ? -15 : -4,
              marginTop: ring ? -15 : -4,
              background: ring ? 'transparent' : color,
              border: ring ? `1.5px solid ${color}` : undefined,
              opacity: style === 'trail' ? 1 - i / TRAIL : 1,
            }}
          />
        );
      })}
    </div>
  );
}
