import { useEffect, useMemo, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { PLATFORMS, normalizeLink, platform } from '@/lib/platforms';
import type { SocialLink } from '@/lib/types';
import { Button, Card, Input } from '@/components/ui';

function Row({ link, onRemove, onLabel }: { link: SocialLink; onRemove: () => void; onLabel: (v: string) => void }) {
  const controls = useDragControls();
  const pl = platform(link.platform);
  return (
    <Reorder.Item value={link} dragListener={false} dragControls={controls}
      className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-ink-850 p-3" whileDrag={{ scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,.5)' }}>
      <button onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none text-white/30 hover:text-white/70 active:cursor-grabbing" aria-label="Drag to reorder"><GripVertical size={18} /></button>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[.05]">
        <svg viewBox="0 0 24 24" width={18} height={18} fill={pl.color} aria-hidden><path d={pl.path} /></svg>
      </div>
      <div className="min-w-0 flex-1">
        <input value={link.label ?? ''} onChange={(e) => onLabel(e.target.value)} placeholder={pl.name} maxLength={40}
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-white/80" aria-label="Label" />
        <div className="truncate text-xs text-white/40">{link.url}</div>
      </div>
      <button onClick={onRemove} className="rounded-md p-2 text-white/35 transition hover:bg-red-500/10 hover:text-red-400" aria-label="Remove"><Trash2 size={16} /></button>
    </Reorder.Item>
  );
}

export default function Links() {
  const { profile, setProfile } = useAuth();
  const [links, setLinks] = useState<SocialLink[]>(profile?.links ?? []);
  const [picking, setPicking] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (profile) setLinks(profile.links); }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(() => JSON.stringify(links) !== JSON.stringify(profile?.links ?? []), [links, profile]);

  const add = () => {
    if (!picking) return;
    const url = normalizeLink(picking, value);
    if (!url) return setErr('That doesn’t look like a valid link.');
    if (links.length >= 30) return setErr('You can add up to 30 links.');
    setLinks([...links, { id: crypto.randomUUID(), platform: picking, url, position: links.length }]);
    setPicking(null); setValue(''); setErr('');
  };
  const save = async () => {
    setSaving(true);
    try {
      const saved = await backend.saveLinks(links);
      setLinks(saved);
      if (profile) setProfile({ ...profile, links: saved });
      setSaved(true); setTimeout(() => setSaved(false), 1500);
    } catch (x) { setErr((x as Error).message); }
    finally { setSaving(false); }
  };

  const pl = picking ? platform(picking) : null;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold">Links</h1>
          <p className="mt-1 text-sm text-white/45">Add your socials and drag to change their order.</p>
        </div>
        <Button onClick={save} loading={saving} disabled={!dirty}>{saved ? 'Saved' : 'Save changes'}</Button>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_360px]">
        <Card className="p-4">
          {links.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/40">No links yet. Pick a platform to add your first.</p>
          ) : (
            <Reorder.Group axis="y" values={links} onReorder={setLinks} className="flex flex-col gap-2">
              {links.map((l) => (
                <Row key={l.id} link={l} onRemove={() => setLinks(links.filter((x) => x.id !== l.id))}
                  onLabel={(v) => setLinks(links.map((x) => (x.id === l.id ? { ...x, label: v || undefined } : x)))} />
              ))}
            </Reorder.Group>
          )}
        </Card>

        <Card className="p-4">
          {pl ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <svg viewBox="0 0 24 24" width={18} height={18} fill={pl.color} aria-hidden><path d={pl.path} /></svg>{pl.name}
                </div>
                <button onClick={() => { setPicking(null); setErr(''); }} className="rounded p-1 text-white/50 hover:text-white" aria-label="Cancel"><X size={16} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); add(); }} className="space-y-3">
                <Input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder={pl.placeholder}
                  prefix={pl.template && !pl.copy ? pl.template.split('{}')[0].replace(/^https?:\/\//, '') : undefined} />
                {pl.copy && <p className="text-xs text-white/40">Visitors will copy this instead of opening a link.</p>}
                {err && <p className="text-xs text-red-400">{err}</p>}
                <Button className="w-full"><Plus size={15} />Add</Button>
              </form>
            </div>
          ) : (
            <div>
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search platforms"
                  className="h-9 w-full rounded-lg border border-white/[.08] bg-ink-850 pl-9 pr-3 text-sm outline-none focus:border-brand-500/50" />
              </div>
              <div className="grid max-h-[460px] grid-cols-4 gap-1.5 overflow-y-auto sm:grid-cols-6 lg:grid-cols-4">
                {PLATFORMS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).map((p) => (
                  <button key={p.id} onClick={() => setPicking(p.id)} title={p.name}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg bg-white/[.03] p-1 text-[10px] text-white/50 transition hover:bg-white/[.08] hover:text-white">
                    <svg viewBox="0 0 24 24" width={20} height={20} fill={p.color} aria-hidden><path d={p.path} /></svg>
                    <span className="w-full truncate text-center">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
