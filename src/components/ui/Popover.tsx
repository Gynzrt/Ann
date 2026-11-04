import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cx } from '@/lib/util';

interface Pos { top: number; left: number; width?: number; up: boolean }

/**
 * A floating panel anchored to an element. Rendered in a portal so scrolling
 * containers never clip it; flips above the anchor when there is no room below.
 */
export function Popover({ anchorRef, open, onClose, children, width, matchWidth, align = 'start', className }: {
  anchorRef: RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  matchWidth?: boolean;
  align?: 'start' | 'end';
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);

  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const update = () => {
      const a = anchorRef.current;
      const el = ref.current;
      if (!a || !el) return;
      const r = a.getBoundingClientRect();
      const w = matchWidth ? r.width : width ?? el.offsetWidth;
      const h = el.offsetHeight;
      const below = innerHeight - r.bottom;
      const up = below < h + 16 && r.top > below;
      let left = align === 'end' ? r.right - w : r.left;
      left = Math.max(8, Math.min(left, innerWidth - w - 8));
      const top = up ? Math.max(8, r.top - h - 6) : r.bottom + 6;
      setPos({ top, left, width: matchWidth || width ? w : undefined, up });
    };
    update();
    const raf = requestAnimationFrame(update);
    addEventListener('resize', update);
    addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', update);
      removeEventListener('scroll', update, true);
    };
  }, [open, anchorRef, width, matchWidth, align]);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        anchorRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open, onClose, anchorRef]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.97, y: pos?.up ? 4 : -4 }}
          animate={{ opacity: pos ? 1 : 0, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
          transition={{ duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: pos?.width ?? width, transformOrigin: pos?.up ? 'bottom' : 'top' }}
          className={cx('z-[100] rounded-[12px] border border-white/[.08] bg-[#141418] shadow-[0_24px_60px_-12px_rgba(0,0,0,.85),0_0_0_1px_rgba(0,0,0,.4)]', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Items for a simple action menu inside a Popover. */
export function MenuItem({ icon: Icon, children, onClick, danger, href, external }: {
  icon?: LucideIcon;
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  href?: string;
  external?: boolean;
}) {
  const cls = cx(
    'flex h-9 w-full items-center gap-2.5 rounded-[8px] px-2.5 text-left text-[13px] outline-none transition-colors',
    danger ? 'text-red-400 hover:bg-red-500/10 focus-visible:bg-red-500/10' : 'text-zinc-300 hover:bg-white/[.06] hover:text-white focus-visible:bg-white/[.06]',
  );
  const inner = (
    <>
      {Icon && <Icon size={15} className={danger ? '' : 'text-zinc-500'} />}
      {children}
    </>
  );
  if (href) return <a href={href} target={external ? '_blank' : undefined} rel="noreferrer" className={cls} onClick={onClick}>{inner}</a>;
  return <button type="button" className={cls} onClick={onClick}>{inner}</button>;
}
