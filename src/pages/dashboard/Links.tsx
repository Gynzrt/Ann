import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion';
import { Copy, GripVertical, Link2, Plus, Search, Trash2, X } from 'lucide-react';
import { PLATFORMS, normalizeLink, platform } from '@/lib/platforms';
import type { SocialLink } from '@/lib/types';
import { cx } from '@/lib/util';
import { Button, EmptyState, Input, Section } from '@/components/ui';
import { useDraft } from './draft';
import { SaveControls } from './SaveControls';
import { Workspace } from './Workspace';

const MAX = 30;
const POPULAR = ['discord', 'discord-user', 'x', 'instagram', 'tiktok', 'youtube', 'twitch', 'github', 'spotify', 'soundcloud', 'steam', 'telegram', 'reddit', 'email', 'website'];

function Row({ link, onRemove, onLabel }: { link: SocialLink; onRemove: () => void; onLabel: (v: string) => void }) {
  const controls = useDragControls();
  const pl = platform(link.platform);
  const shown = pl.copy ? link.url : link.url.replace(/^(https?:\/\/|mailto:)(www\.)?/, '');
  return (
    <Reorder.Item
      value={link}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
      className="group flex items-center gap-2.5 rounded-[12px] border border-white/[.06] bg-field p-2 pr-2.5 transition-colors hover:border-white/[.1]"
      whileDrag={{ scale: 1.02, boxShadow: '0 16px 40px -12px rgba(0,0,0,.8)' }}
    >
      <button type="button" onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none rounded p-0.5 text-zinc-600 transition hover:text-zinc-300 active:cursor-grabbing" aria-label="Drag to reorder">
        <GripVertical size={16} />
      </button>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-white/[.05]">
        <svg viewBox="0 0 24 24" width={17} height={17} fill={pl.color} aria-hidden><path d={pl.path} /></svg>
      </span>
      <div className="min-w-0 flex-1">
        <input
          value={link.label ?? ''}
          onChange={(e) => onLabel(e.target.value)}
          placeholder={pl.name}
          maxLength={40}
          aria-label={`Label for ${pl.name}`}
          className="-ml-1.5 w-full rounded-[7px] border border-transparent bg-transparent px-1.5 py-0.5 text-[13px] font-medium text-zinc-100 outline-none transition placeholder:text-zinc-200 hover:border-white/[.08] focus:border-accent/60 focus:bg-black/20 focus:placeholder:text-zinc-500"
        />
        <p className="flex items-center gap-1.5 truncate text-[11.5px] text-zinc-500">
          {pl.copy && <Copy size={11} className="shrink-0" />}
          <span className="truncate">{shown}</span>
        </p>
      </div>
      <button type="button" onClick={onRemove} className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-zinc-500 opacity-70 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100" aria-label={`Remove ${pl.name}`}>
        <Trash2 size={15} />
      </button>
    </Reorder.Item>
  );
}

export default function Links() {
  const { draft, setLinks } = useDraft();
  const links = draft.links;
  const [picking, setPicking] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const [err, setErr] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term) return PLATFORMS.filter((p) => p.name.toLowerCase().includes(term));
    return all ? PLATFORMS : POPULAR.map((id) => platform(id));
  }, [q, all]);
  const pl = picking ? platform(picking) : null;

  const choose = (id: string) => {
    setPicking(id);
    setValue('');
    setErr('');
  };
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!picking) return;
    const url = normalizeLink(picking, value);
    if (!url) return setErr('That doesn’t look like a valid link.');
    if (links.length >= MAX) return setErr(`You can add up to ${MAX} links.`);
    setLinks([...links, { id: crypto.randomUUID(), platform: picking, url, position: links.length }]);
    setPicking(null);
    setValue('');
    setErr('');
  };

  return (
    <Workspace title="Links" description="Add your socials and drag them into the order you like." actions={<SaveControls />} preview={draft}>
      <div className="space-y-3 p-3 pb-24 sm:p-4 md:pb-6 lg:p-5">
        <Section title="Your links" description={links.length ? 'Drag the handle to reorder. Click a name to rename it.' : undefined} action={<span className="text-[12px] tabular-nums text-zinc-500">{links.length}/{MAX}</span>}>
          {links.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-white/[.1]">
              <EmptyState icon={Link2} title="No links yet" description="Pick a platform below to add your first link." />
            </div>
          ) : (
            <Reorder.Group axis="y" values={links} onReorder={setLinks} className="space-y-2">
              <AnimatePresence initial={false}>
                {links.map((l) => (
                  <Row
                    key={l.id}
                    link={l}
                    onRemove={() => setLinks(links.filter((x) => x.id !== l.id))}
                    onLabel={(v) => setLinks(links.map((x) => (x.id === l.id ? { ...x, label: v || undefined } : x)))}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}
        </Section>
        <Section title="Add a link" description="Pick a platform, then paste a link or type your username.">
          <AnimatePresence initial={false} mode="popLayout">
            {pl ? (
              <motion.form
                key="compose"
                onSubmit={add}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="rounded-[12px] border border-white/[.08] bg-white/[.02] p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2.5 text-[13px] font-medium text-zinc-100">
                    <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-white/[.06]">
                      <svg viewBox="0 0 24 24" width={15} height={15} fill={pl.color} aria-hidden><path d={pl.path} /></svg>
                    </span>
                    {pl.name}
                  </span>
                  <button type="button" onClick={() => setPicking(null)} className="grid h-7 w-7 place-items-center rounded-[7px] text-zinc-500 transition hover:bg-white/[.06] hover:text-white" aria-label="Cancel">
                    <X size={15} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Input
                    ref={input}
                    autoFocus
                    value={value}
                    onChange={(e) => { setValue(e.target.value); setErr(''); }}
                    placeholder={pl.placeholder}
                    invalid={!!err}
                    prefix={pl.template && !pl.copy ? pl.template.split('{}')[0].replace(/^https?:\/\//, '') : undefined}
                  />
                  <Button type="submit" className="h-10" disabled={!value.trim()}><Plus size={15} />Add</Button>
                </div>
                <p className={cx('mt-2 text-[12px]', err ? 'text-red-400' : 'text-zinc-500')}>
                  {err || (pl.copy ? 'Visitors copy this to their clipboard instead of opening a link.' : 'You can also paste a full link.')}
                </p>
              </motion.form>
            ) : (
              <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="space-y-3">
                <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${PLATFORMS.length} platforms`} aria-label="Search platforms" />
                <div className="@container">
                  <div className="grid grid-cols-4 gap-1.5 @[420px]:grid-cols-5 @[480px]:grid-cols-6">
                    {list.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => choose(p.id)}
                        title={p.name}
                        className="group flex aspect-[1/0.92] flex-col items-center justify-center gap-1.5 rounded-[10px] border border-white/[.05] bg-field px-1 outline-none transition-[border-color,background-color,transform] duration-150 hover:-translate-y-px hover:border-white/[.13] hover:bg-white/[.04] focus-visible:ring-2 focus-visible:ring-accent/50"
                      >
                        <svg viewBox="0 0 24 24" width={19} height={19} fill={p.color} className="transition-transform duration-150 group-hover:scale-110" aria-hidden><path d={p.path} /></svg>
                        <span className="w-full truncate text-center text-[10.5px] font-medium text-zinc-500 group-hover:text-zinc-300">{p.name}</span>
                      </button>
                    ))}
                  </div>
                  {list.length === 0 && <p className="py-6 text-center text-[12.5px] text-zinc-500">No platform matches “{q}”. Try Website for any other link.</p>}
                  {!q.trim() && (
                    <button type="button" onClick={() => setAll(!all)} className="mt-2.5 w-full rounded-[9px] py-2 text-[12.5px] font-medium text-zinc-400 transition hover:bg-white/[.03] hover:text-zinc-100">
                      {all ? 'Show fewer' : `Show all ${PLATFORMS.length} platforms`}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>
      </div>
    </Workspace>
  );
}
