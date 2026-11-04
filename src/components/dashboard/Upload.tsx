import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Film, ImageIcon, MousePointer2, Music2, RefreshCw, Trash2, Upload as UploadIcon, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { backend, MAX_UPLOAD } from '@/lib/backend';
import { useMedia } from '@/hooks/useMedia';
import { cx } from '@/lib/util';

export type UploadKind = 'avatar' | 'background' | 'banner' | 'audio' | 'cursor';

export const ACCEPT: Record<UploadKind, string> = {
  avatar: 'image/png,image/jpeg,image/gif,image/webp',
  banner: 'image/png,image/jpeg,image/gif,image/webp',
  cursor: 'image/png,image/x-icon,image/vnd.microsoft.icon,image/gif',
  background: 'image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm',
  audio: 'audio/mpeg,audio/ogg,audio/wav,audio/x-wav,audio/mp4,audio/webm',
};

const META: Record<UploadKind, { icon: LucideIcon; formats: string }> = {
  avatar: { icon: UserRound, formats: 'Image' },
  banner: { icon: ImageIcon, formats: 'Image' },
  background: { icon: Film, formats: 'Image or video' },
  cursor: { icon: MousePointer2, formats: 'PNG or ICO' },
  audio: { icon: Music2, formats: 'MP3, OGG, WAV' },
};

const mb = (k: UploadKind) => `${MAX_UPLOAD[k] / 1024 / 1024 < 1 ? `${MAX_UPLOAD[k] / 1024} KB` : `${MAX_UPLOAD[k] / 1024 / 1024} MB`}`;

/** Checks size and type, then uploads. Returns the stored URL or throws a readable error. */
export async function uploadChecked(file: File, kind: UploadKind) {
  if (file.size > MAX_UPLOAD[kind]) throw new Error(`That file is too big. The limit is ${mb(kind)}.`);
  if (!ACCEPT[kind].split(',').includes(file.type)) throw new Error('That file type isn’t supported.');
  return backend.upload(file, kind);
}

/**
 * Upload tile: drop or click to upload, then shows the file with Replace and
 * Remove actions on hover.
 */
export function Upload({ kind, value, onChange, label, isVideo, className }: {
  kind: UploadKind;
  value: string;
  onChange: (url: string, file?: File) => void;
  label: string;
  isVideo?: boolean;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState('');
  const url = useMedia(value);
  const { icon: Icon, formats } = META[kind];

  const pick = async (f: File | undefined) => {
    setOver(false);
    if (!f) return;
    setErr('');
    setBusy(true);
    try { onChange(await uploadChecked(f, kind), f); }
    catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };

  const filled = !!url;
  return (
    <div className={className}>
      <div
        onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
        className={cx(
          'group relative h-[118px] overflow-hidden rounded-[12px] border transition-[border-color,background-color,transform] duration-150',
          over ? 'scale-[1.015] border-accent/70 bg-accent/[.07]' : filled ? 'border-white/[.07] bg-field' : 'border-dashed border-white/[.11] bg-field/60 hover:border-white/[.2] hover:bg-field',
        )}
      >
        {filled && (
          <motion.div key={url} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="absolute inset-0">
            {kind === 'avatar' ? (
              <div className="grid h-full place-items-center">
                <img src={url} alt="" className="h-[74px] w-[74px] rounded-full object-cover ring-1 ring-white/10" />
              </div>
            ) : kind === 'cursor' ? (
              <div className="bg-checker grid h-full place-items-center opacity-90"><img src={url} alt="" className="max-h-10 max-w-10" /></div>
            ) : isVideo ? (
              <video src={url} muted autoPlay loop playsInline className="h-full w-full object-cover" />
            ) : (
              <img src={url} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-6">
              <span className="text-[12px] font-medium text-white/90">{label}</span>
            </div>
          </motion.div>
        )}

        {!filled && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
            <span className={cx('grid h-8 w-8 place-items-center rounded-[9px] border transition-colors', over ? 'border-accent/50 bg-accent/15 text-accent-soft' : 'border-white/[.08] bg-white/[.03] text-zinc-400 group-hover:text-zinc-200')}>
              {over ? <UploadIcon size={15} /> : <Icon size={15} strokeWidth={1.9} />}
            </span>
            <span>
              <span className="block text-[12.5px] font-medium text-zinc-200">{over ? 'Drop to upload' : label}</span>
              <span className="block text-[11px] text-zinc-500" title={ACCEPT[kind].replace(/(image|video|audio)\//g, '').replace(/,/g, ', ')}>{formats} · up to {mb(kind)}</span>
            </span>
          </div>
        )}

        <button type="button" onClick={() => input.current?.click()} className="absolute inset-0 rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60" aria-label={`${filled ? 'Replace' : 'Upload'} ${label.toLowerCase()}`} />

        {filled && !busy && (
          <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            <button type="button" onClick={() => input.current?.click()} className="grid h-7 w-7 place-items-center rounded-[8px] bg-black/70 text-white/80 backdrop-blur transition hover:text-white" aria-label="Replace" title="Replace">
              <RefreshCw size={13} />
            </button>
            <button type="button" onClick={() => onChange('')} className="grid h-7 w-7 place-items-center rounded-[8px] bg-black/70 text-white/80 backdrop-blur transition hover:text-red-400" aria-label="Remove" title="Remove">
              <Trash2 size={13} />
            </button>
          </div>
        )}

        <AnimatePresence>
          {busy && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-[2px]">
              <span className="text-[12px] font-medium text-zinc-200">Uploading…</span>
              <span className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-white/10">
                <span className="block h-full w-2/5 animate-indeterminate bg-accent" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <input ref={input} type="file" accept={ACCEPT[kind]} hidden onChange={(e) => pick(e.target.files?.[0])} />
      <AnimatePresence>
        {err && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1.5 text-[11.5px] text-red-400">
            {err}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
