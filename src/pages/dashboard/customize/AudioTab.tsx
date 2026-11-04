import { useRef, useState } from 'react';
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion';
import { GripVertical, ImagePlus, Loader2, Music2, Plus, Trash2 } from 'lucide-react';
import type { Track } from '@/lib/types';
import { useMedia } from '@/hooks/useMedia';
import { Button, EmptyState, Rows, Section, Slider, SwitchRow } from '@/components/ui';
import { ACCEPT, uploadChecked } from '@/components/dashboard/Upload';
import { useDraft } from '../draft';

const MAX = 10;

function TrackRow({ t, n, onChange, onRemove }: { t: Track; n: number; onChange: (p: Partial<Track>) => void; onRemove: () => void }) {
  const controls = useDragControls();
  const cover = useMedia(t.cover);
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pickCover = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try { onChange({ cover: await uploadChecked(f, 'avatar') }); }
    catch { /* the tile shows nothing new; keep it quiet */ }
    finally { setBusy(false); }
  };
  return (
    <Reorder.Item
      value={t}
      dragListener={false}
      dragControls={controls}
      className="group flex items-center gap-2.5 rounded-[12px] border border-white/[.06] bg-field p-2 pr-2.5"
      whileDrag={{ scale: 1.02, boxShadow: '0 16px 40px -12px rgba(0,0,0,.8)' }}
    >
      <button type="button" onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none rounded p-0.5 text-zinc-600 transition hover:text-zinc-300 active:cursor-grabbing" aria-label="Drag to reorder">
        <GripVertical size={16} />
      </button>
      <button
        type="button"
        onClick={() => file.current?.click()}
        aria-label="Change cover"
        className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[9px] bg-white/[.05] text-zinc-500"
      >
        {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <Music2 size={16} />}
        <span className="absolute inset-0 grid place-items-center bg-black/60 opacity-0 transition group-hover:opacity-100">
          {busy ? <Loader2 size={14} className="animate-spin text-white" /> : <ImagePlus size={14} className="text-white" />}
        </span>
      </button>
      <input ref={file} type="file" accept={ACCEPT.avatar} hidden onChange={(e) => pickCover(e.target.files?.[0])} />
      <div className="min-w-0 flex-1">
        <input
          value={t.title}
          maxLength={60}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Untitled"
          aria-label="Track title"
          className="-ml-1.5 w-full rounded-[7px] border border-transparent bg-transparent px-1.5 py-0.5 text-[13px] font-medium text-zinc-100 outline-none transition placeholder:text-zinc-500 hover:border-white/[.08] focus:border-accent/60 focus:bg-black/20"
        />
        <p className="text-[11.5px] text-zinc-500">Track {n}</p>
      </div>
      <button type="button" onClick={onRemove} className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400" aria-label="Remove track">
        <Trash2 size={15} />
      </button>
    </Reorder.Item>
  );
}

export function AudioTab() {
  const { draft, setAp } = useDraft();
  const ap = draft.appearance;
  const tracks = ap.audio;
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr('');
    setBusy(true);
    try {
      for (const f of [...files].slice(0, MAX - tracks.length)) {
        const url = await uploadChecked(f, 'audio');
        const track = { id: crypto.randomUUID(), title: f.name.replace(/\.[^.]+$/, '').slice(0, 60), url };
        setAp((a) => ({ audio: [...a.audio, track].slice(0, MAX) }));
      }
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
      if (file.current) file.current.value = '';
    }
  };
  const update = (id: string, p: Partial<Track>) => setAp((a) => ({ audio: a.audio.map((t) => (t.id === id ? { ...t, ...p } : t)) }));

  return (
    <>
      <Section
        title="Playlist"
        description={`Up to ${MAX} tracks. They start when a visitor clicks the enter screen.`}
        action={
          tracks.length > 0 && tracks.length < MAX ? (
            <Button variant="secondary" size="sm" onClick={() => file.current?.click()} loading={busy}><Plus size={14} />Add</Button>
          ) : null
        }
      >
        <input ref={file} type="file" accept={ACCEPT.audio} multiple hidden onChange={(e) => add(e.target.files)} />
        {tracks.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-white/[.1]">
            <EmptyState icon={Music2} title="No tracks yet" description="Upload MP3, OGG or WAV files up to 15 MB each.">
              <Button onClick={() => file.current?.click()} loading={busy}><Plus size={15} />Upload tracks</Button>
            </EmptyState>
          </div>
        ) : (
          <Reorder.Group axis="y" values={tracks} onReorder={(t) => setAp({ audio: t })} className="space-y-2">
            {tracks.map((t, i) => (
              <TrackRow key={t.id} t={t} n={i + 1} onChange={(p) => update(t.id, p)} onRemove={() => setAp((a) => ({ audio: a.audio.filter((x) => x.id !== t.id) }))} />
            ))}
          </Reorder.Group>
        )}
        <AnimatePresence>
          {err && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[12px] text-red-400">
              {err}
            </motion.p>
          )}
        </AnimatePresence>
      </Section>

      <Section title="Playback">
        <Rows>
          <SwitchRow title="Show player" description="Turn off to play music without visible controls." checked={ap.showPlayer} onChange={(v) => setAp({ showPlayer: v })} />
          <SwitchRow title="Shuffle" description="Start from a random track." checked={ap.audioShuffle} onChange={(v) => setAp({ audioShuffle: v })} />
        </Rows>
        <Slider label="Starting volume" value={ap.audioVolume} min={0} max={100} unit="%" onChange={(v) => setAp({ audioVolume: v })} />
      </Section>
    </>
  );
}
