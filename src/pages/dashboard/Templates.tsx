import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Eye, X } from 'lucide-react';
import { TEMPLATES } from '@/lib/templates';
import type { Template } from '@/lib/templates';
import type { Appearance } from '@/lib/types';
import { Button, PageHeader, Segmented, useToast } from '@/components/ui';
import { PreviewPane } from '@/components/dashboard/Preview';
import { TemplateCard, withTemplate } from '@/components/dashboard/TemplateCard';
import { useDraft } from './draft';

const isCurrent = (ap: Appearance, t: Template) =>
  Object.entries(t.appearance).every(([k, v]) => ap[k as keyof Appearance] === v);

export default function Templates() {
  const { saved, applyAppearance } = useDraft();
  const toast = useToast();
  const [tag, setTag] = useState('All');
  const [busy, setBusy] = useState('');
  const [preview, setPreview] = useState<Template | null>(null);
  const tags = ['All', ...new Set(TEMPLATES.map((t) => t.tag))];
  const list = TEMPLATES.filter((t) => tag === 'All' || t.tag === tag);

  const apply = async (t: Template) => {
    setBusy(t.id);
    const prev = await applyAppearance(t.appearance);
    setBusy('');
    setPreview(null);
    if (prev)
      toast({
        title: `${t.name} applied`,
        description: 'Your content stays the same.',
        duration: 6000,
        action: { label: 'Undo', run: () => { applyAppearance(prev); } },
      });
  };

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="Templates" description="Apply a look in one click. Your content stays the same, and you can undo." />
      <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-5 lg:p-7">
        <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
          <Segmented size="sm" full={false} value={tag} onChange={setTag} options={tags.map((x) => ({ value: x, label: x }))} />
        </div>
        <p className="mt-3 text-[12.5px] text-zinc-500">Previews use your own name, avatar and links.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {list.map((t) => {
              const current = isCurrent(saved.appearance, t);
              return (
                <TemplateCard
                  key={t.id}
                  t={t}
                  profile={withTemplate(saved, t)}
                  active={current}
                  actions={
                    <>
                      <Button variant="ghost" size="icon-sm" aria-label={`Preview ${t.name}`} title="Preview" onClick={() => setPreview(t)}><Eye size={15} /></Button>
                      <Button size="sm" variant="secondary" loading={busy === t.id} disabled={current} onClick={() => apply(t)}>
                        {current ? <><Check size={14} />Applied</> : 'Apply'}
                      </Button>
                    </>
                  }
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreview(null)}>
            <motion.div
              role="dialog"
              aria-label={`${preview.name} preview`}
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-full max-h-[900px] w-full max-w-[1400px] flex-col rounded-[18px] border border-white/[.08] bg-panel p-4 shadow-2xl"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold">{preview.name}</h2>
                  <p className="text-[12.5px] text-zinc-500">{preview.tag} · {preview.appearance.layout} layout</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" loading={busy === preview.id} disabled={isCurrent(saved.appearance, preview)} onClick={() => apply(preview)}>Apply template</Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => setPreview(null)}><X size={16} /></Button>
                </div>
              </div>
              <PreviewPane profile={withTemplate(saved, preview)} showUrl={false} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
