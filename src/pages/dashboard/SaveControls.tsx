import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Button, Kbd } from '@/components/ui';
import { useDraft } from './draft';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/** Save status and actions shown in the header of every editing page. */
export function SaveControls() {
  const { dirty, saving, save, discard } = useDraft();
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={dirty ? 'dirty' : 'clean'}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.14 }}
          className="mr-1 hidden items-center gap-2 text-[12.5px] md:flex"
        >
          {dirty ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,.15)]" />
              <span className="text-zinc-300">Unsaved changes</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} className="text-zinc-500" />
              <span className="text-zinc-500">All changes saved</span>
            </>
          )}
        </motion.span>
      </AnimatePresence>
      <Button variant="ghost" size="sm" onClick={discard} disabled={!dirty || saving}>Discard</Button>
      <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>
        Save<span className="hidden sm:inline"> changes</span>
        <Kbd className="ml-0.5">{isMac ? '⌘S' : 'Ctrl S'}</Kbd>
      </Button>
    </div>
  );
}
