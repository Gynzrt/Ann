import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Blocks, LayoutTemplate, Music2, Palette, Sparkles, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '@/lib/util';
import { useDraft } from './draft';
import { SaveControls } from './SaveControls';
import { Workspace } from './Workspace';
import type { TabId } from './customize/shared';
import { ProfileTab } from './customize/ProfileTab';
import { StyleTab } from './customize/StyleTab';
import { ColorsTab } from './customize/ColorsTab';
import { EffectsTab } from './customize/EffectsTab';
import { AudioTab } from './customize/AudioTab';
import { WidgetsTab } from './customize/WidgetsTab';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'style', label: 'Style', icon: LayoutTemplate },
  { id: 'colors', label: 'Colors', icon: Palette },
  { id: 'effects', label: 'Effects', icon: Sparkles },
  { id: 'audio', label: 'Audio', icon: Music2 },
  { id: 'widgets', label: 'Widgets', icon: Blocks },
];

function readTab(): TabId {
  try {
    const t = sessionStorage.getItem('halo.customizeTab');
    if (TABS.some((x) => x.id === t)) return t as TabId;
  } catch { /* ignore */ }
  return 'profile';
}

export default function Customize() {
  const { draft } = useDraft();
  const [tab, setTabState] = useState<TabId>(readTab);
  const [replay, setReplay] = useState(0);
  const setTab = (t: TabId) => {
    setTabState(t);
    try { sessionStorage.setItem('halo.customizeTab', t); } catch { /* ignore */ }
  };
  const onReplay = () => setReplay((r) => r + 1);
  const props = { goTo: setTab, onReplay };

  const tabs = (
    <div role="tablist" aria-label="Customize sections" className="flex h-[62px] shrink-0 items-stretch gap-0.5 border-b border-white/[.06] px-2">
      {TABS.map((t) => {
        const on = t.id === tab;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => setTab(t.id)}
            className={cx(
              'group relative my-1.5 flex flex-1 flex-col items-center justify-center gap-1 rounded-[9px] text-[11.5px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent/50',
              on ? 'text-white' : 'text-zinc-500 hover:bg-white/[.03] hover:text-zinc-200',
            )}
          >
            <Icon size={17} strokeWidth={1.85} className={cx('transition-[transform,color] duration-150 group-hover:-translate-y-px', on ? 'text-accent-soft' : '')} />
            {t.label}
            {on && (
              <motion.span
                layoutId="editor-tab"
                className="absolute inset-x-2 -bottom-1.5 h-[2px] rounded-full bg-accent"
                transition={{ type: 'spring', stiffness: 520, damping: 42 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <Workspace
      title="Customize"
      description="Design your page. Every change shows in the preview straight away."
      actions={<SaveControls />}
      toolbar={tabs}
      preview={draft}
      replayKey={replay}
      onReplay={onReplay}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          role="tabpanel"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
          className="space-y-3 p-3 pb-24 sm:p-4 md:pb-6 lg:p-5"
        >
          {tab === 'profile' && <ProfileTab />}
          {tab === 'style' && <StyleTab />}
          {tab === 'colors' && <ColorsTab />}
          {tab === 'effects' && <EffectsTab {...props} />}
          {tab === 'audio' && <AudioTab />}
          {tab === 'widgets' && <WidgetsTab {...props} />}
        </motion.div>
      </AnimatePresence>
    </Workspace>
  );
}
