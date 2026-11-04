import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { Profile } from '@/lib/types';
import { cx, hexA, loadFont } from '@/lib/util';
import { useMedia } from '@/hooks/useMedia';
import { BackgroundFx } from './BackgroundFx';
import { Cursor } from './Cursor';
import { AudioPlayer } from './AudioPlayer';
import type { AudioHandle } from './AudioPlayer';
import { DiscordCard } from './Discord';
import { PreviewContext } from './Bits';
import { LAYOUTS } from './Layouts';

const ENTRANCE = {
  fade: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
  slide: { initial: { opacity: 0, y: 56 }, animate: { opacity: 1, y: 0 } },
  zoom: { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 } },
  none: { initial: false as const, animate: {} },
};

/**
 * Renders a profile page. `preview` is used inside the editor: it fills its
 * container, skips the enter screen unless replayed, shows placeholders for
 * widgets that still need setting up, and never touches the tab title.
 */
export function ProfileView({ p, preview = false, replayKey = 0, still = false, gl = true }: {
  p: Profile;
  preview?: boolean;
  replayKey?: number;
  /** A static thumbnail: no animation, cursor or entrance. */
  still?: boolean;
  /** False shows WebGL effects as posters (for galleries with many previews). */
  gl?: boolean;
}) {
  const ap = p.appearance;
  const root = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioHandle>(null);
  const [entered, setEntered] = useState(!ap.enterScreen || preview);
  const bg = useMedia(ap.backgroundUrl);
  const reduce = still || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);

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
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), { stiffness: 150, damping: 18 });
  const tilt = ap.tilt && !reduce;
  const onMove = (e: React.PointerEvent) => {
    if (!tilt || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const Layout = LAYOUTS[ap.layout] ?? LAYOUTS.default;
  const ent = reduce ? ENTRANCE.none : ENTRANCE[ap.entrance];
  const hasTracks = ap.audio.some((t) => t.url);
  const showDiscord = ap.showDiscord && (preview || /^\d{15,21}$/.test(ap.discordId));
  const showPlayer = ap.showPlayer && hasTracks;
  const player = <AudioPlayer key={ap.audio.map((t) => t.url).join()} ref={audio} ap={ap} hidden={!showPlayer} />;
  const widgets = showDiscord || showPlayer ? (
    <>
      {showDiscord && <DiscordCard ap={ap} />}
      {showPlayer && player}
    </>
  ) : null;
  const pos = preview ? 'absolute' : 'fixed';

  return (
    <PreviewContext.Provider value={preview}>
      <div
        ref={root}
        className={cx(pos, 'inset-0 overflow-y-auto overflow-x-hidden @container')}
        style={{ background: ap.backgroundColor, fontFamily: `'${ap.font}', 'Inter Variable', Inter, sans-serif`, color: ap.textColor }}
        onPointerMove={onMove}
        onPointerLeave={() => { mx.set(0); my.set(0); }}
      >
        <div className={cx(pos, 'inset-0')} aria-hidden>
          {bg && ap.backgroundKind === 'video' && <video src={bg} autoPlay muted loop playsInline className="h-full w-full object-cover" />}
          {bg && ap.backgroundKind !== 'video' && <img src={bg} alt="" className="h-full w-full object-cover" />}
          {bg && <div className="absolute inset-0" style={{ background: hexA('#000000', ap.backgroundDim / 100) }} />}
          {!bg && <div className="absolute inset-0" style={{ background: `radial-gradient(80% 55% at 50% 0%, ${hexA(ap.accentColor, 0.1)}, transparent 70%)` }} />}
          <BackgroundFx ap={ap} hasMedia={!!bg} scope={root} animate={!still} gl={gl} />
        </div>

        {!still && <Cursor style={ap.cursor} color={ap.accentColor} url={ap.cursorUrl} scope={root} />}
        {!showPlayer && hasTracks && player}

        <div className="relative flex min-h-full items-center justify-center px-4 py-14 @[640px]:px-8" style={{ perspective: 1200 }}>
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
              className={cx(pos, 'inset-0 z-50 grid cursor-pointer place-items-center bg-black/55 backdrop-blur-2xl')}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
              onClick={() => { setEntered(true); setTimeout(() => audio.current?.play(), 50); }}
            >
              <motion.span
                className="text-[16px] font-medium tracking-wide text-white/90"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              >
                {ap.enterText || 'click to enter...'}
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </PreviewContext.Provider>
  );
}
