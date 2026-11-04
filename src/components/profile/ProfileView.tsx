import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { Profile } from '@/lib/types';
import { hexA, loadFont } from '@/lib/util';
import { useMedia } from '@/hooks/useMedia';
import { BackgroundFx } from './BackgroundFx';
import { Cursor } from './Cursor';
import { AudioPlayer } from './AudioPlayer';
import type { AudioHandle } from './AudioPlayer';
import { LAYOUTS } from './Layouts';

const ENTRANCE = {
  fade: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
  slide: { initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 } },
  zoom: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } },
  none: { initial: false as const, animate: {} },
};

/**
 * Renders a public profile. `preview` is used inside the editor: it fills its
 * container, skips the enter screen unless replayed, and never changes the tab title.
 */
export function ProfileView({ p, preview = false, replayKey = 0 }: { p: Profile; preview?: boolean; replayKey?: number }) {
  const ap = p.appearance;
  const root = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioHandle>(null);
  const [entered, setEntered] = useState(!ap.enterScreen || preview);
  const bg = useMedia(ap.backgroundUrl);
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => { loadFont(ap.font); }, [ap.font]);
  useEffect(() => { setEntered(!ap.enterScreen || (preview && replayKey === 0)); }, [replayKey, ap.enterScreen, preview]);
  useEffect(() => {
    if (preview) return;
    const prev = document.title;
    document.title = ap.tabTitle || `@${p.username}`;
    return () => { document.title = prev; };
  }, [preview, ap.tabTitle, p.username]);

  // 3D tilt following the pointer.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 18 });
  const tilt = ap.tilt && !reduce;
  const onMove = (e: React.PointerEvent) => {
    if (!tilt || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const Layout = LAYOUTS[ap.layout] ?? LAYOUTS.default;
  const ent = reduce ? ENTRANCE.none : ENTRANCE[ap.entrance];
  const widgets = <AudioPlayer key={ap.audio.map((t) => t.url).join()} ref={audio} ap={ap} />;

  return (
    <div
      ref={root}
      className={`${preview ? 'absolute' : 'fixed'} inset-0 overflow-y-auto overflow-x-hidden`}
      style={{ background: ap.backgroundColor, fontFamily: `'${ap.font}', Inter, sans-serif`, color: ap.textColor }}
      onPointerMove={onMove}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
    >
      {/* background */}
      <div className={`${preview ? 'absolute' : 'fixed'} inset-0`} aria-hidden>
        {bg && ap.backgroundKind === 'video' && <video src={bg} autoPlay muted loop playsInline className="h-full w-full object-cover" />}
        {bg && ap.backgroundKind !== 'video' && <img src={bg} alt="" className="h-full w-full object-cover" />}
        {bg && <div className="absolute inset-0" style={{ background: hexA('#000000', ap.backgroundDim / 100) }} />}
        {!bg && <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top, ${hexA(ap.accentColor, 0.14)}, transparent 60%)` }} />}
        <BackgroundFx effect={ap.backgroundEffect} color={ap.accentColor} />
      </div>

      <Cursor style={ap.cursor} color={ap.accentColor} url={ap.cursorUrl} scope={root} />

      <div className="relative flex min-h-full items-center justify-center px-4 py-12" style={{ perspective: 1200 }}>
        {entered && (
          <motion.div
            key={`${replayKey}-${ap.layout}`}
            initial={ent.initial}
            animate={ent.animate}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={tilt ? { rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' } : undefined}
            className="flex w-full justify-center"
          >
            <Layout p={p} widgets={widgets} />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {!entered && (
          <motion.button
            type="button"
            className={`${preview ? 'absolute' : 'fixed'} inset-0 z-50 grid cursor-pointer place-items-center bg-black/60 backdrop-blur-xl`}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            onClick={() => { setEntered(true); setTimeout(() => audio.current?.play(), 50); }}
          >
            <motion.span className="text-[17px] font-medium tracking-wide text-white/90"
              animate={{ opacity: [0.55, 1, 0.55] }} transition={{ duration: 2.4, repeat: Infinity }}>
              {ap.enterText || 'click to enter...'}
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
