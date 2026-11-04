import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { backend, MAX_UPLOAD } from '@/lib/backend';
import { useMedia } from '@/hooks/useMedia';

type Kind = 'avatar' | 'background' | 'banner' | 'audio' | 'cursor';
const ACCEPT: Record<Kind, string> = {
  avatar: 'image/png,image/jpeg,image/gif,image/webp',
  banner: 'image/png,image/jpeg,image/gif,image/webp',
  cursor: 'image/png,image/x-icon,image/vnd.microsoft.icon,image/gif',
  background: 'image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm',
  audio: 'audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/webm',
};

/** Upload area that shows the current file and lets the user replace or remove it. */
export function Upload({ kind, value, onChange, label, round }: { kind: Kind; value: string; onChange: (url: string, file?: File) => void; label: string; round?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const url = useMedia(value);
  const isVid = /video/.test(value) || /\.(mp4|webm)$/i.test(value);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setErr('');
    if (f.size > MAX_UPLOAD[kind]) return setErr(`That file is too big (max ${MAX_UPLOAD[kind] / 1024 / 1024} MB).`);
    if (!ACCEPT[kind].split(',').includes(f.type)) return setErr('That file type is not supported.');
    setBusy(true);
    try { onChange(await backend.upload(f, kind), f); }
    catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-white/80">{label}</span>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
        className="group relative flex h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/[.12] bg-ink-850 transition hover:border-brand-500/50"
      >
        {url && kind !== 'audio' ? (
          isVid ? <video src={url} muted autoPlay loop className="h-full w-full object-cover" /> :
          <img src={url} alt="" className={round ? 'h-20 w-20 rounded-full object-cover' : 'h-full w-full object-cover'} />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-xs text-white/40"><ImagePlus size={20} />Drop a file or click</span>
        )}
        <button type="button" onClick={() => input.current?.click()} className="absolute inset-0" aria-label={`Upload ${label}`} />
        {busy && <div className="absolute inset-0 grid place-items-center bg-black/60"><Loader2 className="animate-spin" size={20} /></div>}
        {value && !busy && (
          <button type="button" onClick={() => onChange('')} className="absolute right-2 top-2 rounded-md bg-black/70 p-1.5 text-white/70 opacity-0 transition hover:text-red-400 group-hover:opacity-100" aria-label="Remove">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <input ref={input} type="file" accept={ACCEPT[kind]} hidden onChange={(e) => pick(e.target.files?.[0])} />
      {err && <p className="mt-1.5 text-xs text-red-400">{err}</p>}
    </div>
  );
}
