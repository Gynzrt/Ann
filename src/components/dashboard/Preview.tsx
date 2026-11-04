import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, ExternalLink, Monitor, RotateCcw, Smartphone, Tablet } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { ProfileView } from '@/components/profile/ProfileView';
import { Segmented, Tip } from '@/components/ui';
import { cx } from '@/lib/util';

/** Renders children at a fixed virtual size, scaled down to fit the available box. */
export function ScaledFrame({ width, height, children, padding = 0, fitWidth, className }: {
  width: number;
  height: number;
  children: ReactNode;
  padding?: number;
  /** Scale to the box width and take the matching height (for thumbnails). */
  fitWidth?: boolean;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth - padding * 2;
      const h = el.clientHeight - padding * 2;
      setScale(fitWidth ? w / width : Math.min(1, w / width, h / height));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, padding, fitWidth]);
  return (
    <div
      ref={box}
      className={cx('relative flex items-center justify-center', fitWidth ? 'w-full' : 'h-full w-full', className)}
      style={fitWidth ? { aspectRatio: `${width} / ${height}` } : undefined}
    >
      <div className="relative" style={{ width: width * scale, height: height * scale, opacity: scale ? 1 : 0 }}>
        <div className="absolute left-0 top-0" style={{ width, height, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICES: Record<Exclude<Device, 'desktop'>, { w: number; h: number; bezel: number; radius: number }> = {
  tablet: { w: 768, h: 1024, bezel: 12, radius: 30 },
  mobile: { w: 390, h: 844, bezel: 10, radius: 48 },
};

function readDevice(): Device {
  try {
    const v = localStorage.getItem('halo.previewDevice');
    if (v === 'desktop' || v === 'tablet' || v === 'mobile') return v;
  } catch { /* ignore */ }
  return 'desktop';
}

function DeviceShell({ device, children }: { device: Exclude<Device, 'desktop'>; children: ReactNode }) {
  const d = DEVICES[device];
  return (
    <div
      className="relative bg-[#1a1a1f] shadow-[0_40px_100px_-30px_rgba(0,0,0,.9),inset_0_0_0_1px_rgba(255,255,255,.08)]"
      style={{ width: d.w + d.bezel * 2, height: d.h + d.bezel * 2, padding: d.bezel, borderRadius: d.radius }}
    >
      <div className="relative h-full w-full overflow-hidden bg-black" style={{ borderRadius: d.radius - d.bezel }}>
        {children}
        {device === 'mobile' && <div className="pointer-events-none absolute left-1/2 top-[11px] z-[80] h-[28px] w-[104px] -translate-x-1/2 rounded-full bg-black" />}
      </div>
    </div>
  );
}

export function UrlChip({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${location.origin}/${username}`;
  const copy = () => navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); });
  return (
    <div className="flex h-8 min-w-0 items-center gap-1 rounded-[9px] border border-white/[.07] bg-field pl-3 pr-1">
      <span className="min-w-0 truncate text-[12.5px] text-zinc-500">
        {location.host}/<span className="text-zinc-200">{username}</span>
      </span>
      <span className="group/tip relative ml-1">
        <button type="button" onClick={copy} aria-label="Copy link" className="grid h-6 w-6 place-items-center rounded-[6px] text-zinc-500 transition hover:bg-white/[.07] hover:text-zinc-100">
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        </button>
        <Tip label={copied ? 'Copied' : 'Copy link'} side="bottom" />
      </span>
      <span className="group/tip relative">
        <a href={`/${username}`} target="_blank" rel="noreferrer" aria-label="Open page" className="grid h-6 w-6 place-items-center rounded-[6px] text-zinc-500 transition hover:bg-white/[.07] hover:text-zinc-100">
          <ExternalLink size={13} />
        </a>
        <Tip label="Open page" side="bottom" />
      </span>
    </div>
  );
}

/**
 * The live preview: a toolbar and a stage showing the profile exactly as it
 * renders on the public page, at desktop, tablet or phone size.
 */
export function PreviewPane({ profile, replayKey = 0, onReplay, className, showUrl = true }: {
  profile: Profile;
  replayKey?: number;
  onReplay?: () => void;
  className?: string;
  showUrl?: boolean;
}) {
  const [device, setDeviceState] = useState<Device>(readDevice);
  const setDevice = (d: Device) => {
    setDeviceState(d);
    try { localStorage.setItem('halo.previewDevice', d); } catch { /* ignore */ }
  };

  return (
    <div className={cx('flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 items-center gap-2 text-[12.5px] font-medium text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live preview
          </span>
          {showUrl && <div className="hidden min-w-0 xl:block"><UrlChip username={profile.username} /></div>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Segmented
            size="sm"
            full={false}
            value={device}
            onChange={setDevice}
            options={[
              { value: 'desktop', icon: Monitor, title: 'Desktop' },
              { value: 'tablet', icon: Tablet, title: 'Tablet' },
              { value: 'mobile', icon: Smartphone, title: 'Phone' },
            ]}
          />
          {onReplay && (
            <span className="group/tip relative">
              <button
                type="button"
                onClick={onReplay}
                aria-label="Replay entrance"
                className="grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-white/[.06] bg-field text-zinc-400 transition hover:border-white/[.12] hover:text-white active:scale-95"
              >
                <RotateCcw size={14} />
              </button>
              <Tip label="Replay entrance" side="bottom" align="end" />
            </span>
          )}
        </div>
      </div>

      <div className="bg-dots relative min-h-0 flex-1 overflow-hidden rounded-[16px] border border-white/[.06] bg-[#0a0a0d]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={device}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-0"
          >
            {device === 'desktop' ? (
              <div className="absolute inset-0 overflow-hidden">
                <ProfileView p={profile} preview replayKey={replayKey} />
              </div>
            ) : (
              <ScaledFrame width={DEVICES[device].w + DEVICES[device].bezel * 2} height={DEVICES[device].h + DEVICES[device].bezel * 2} padding={28}>
                <DeviceShell device={device}>
                  <ProfileView p={profile} preview replayKey={replayKey} />
                </DeviceShell>
              </ScaledFrame>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Full-screen preview sheet for small screens. */
export function PreviewSheet({ open, onClose, profile, replayKey }: { open: boolean; onClose: () => void; profile: Profile; replayKey?: number }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex flex-col bg-bg"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 40 }}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[.06] px-4">
            <span className="text-[14px] font-semibold">Preview</span>
            <button type="button" onClick={onClose} className="h-9 rounded-[10px] bg-white/[.06] px-3.5 text-[13px] font-medium text-zinc-200 active:scale-95">
              Done
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            <ProfileView p={profile} preview replayKey={replayKey} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
