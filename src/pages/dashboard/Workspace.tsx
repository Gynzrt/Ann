import { useState } from 'react';
import type { ReactNode } from 'react';
import { Eye } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { PreviewPane, PreviewSheet } from '@/components/dashboard/Preview';
import { PageHeader } from '@/components/ui';

/**
 * The editing layout shared by Customize and Links: a page header, an editor
 * column that scrolls on its own and a live preview filling the rest.
 * Below 768px the preview moves into a full-screen sheet.
 */
export function Workspace({ title, description, actions, toolbar, preview, replayKey, onReplay, children }: {
  title: string;
  description: string;
  actions: ReactNode;
  toolbar?: ReactNode;
  preview: Profile;
  replayKey?: number;
  onReplay?: () => void;
  children: ReactNode;
}) {
  const [sheet, setSheet] = useState(false);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={title} description={description} actions={actions} />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 w-full flex-col md:w-[384px] md:shrink-0 md:border-r md:border-white/[.06] lg:w-[420px] xl:w-[468px] 2xl:w-[520px]">
          {toolbar}
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
        <div className="hidden min-w-0 flex-1 bg-bg p-4 md:flex lg:p-5">
          <PreviewPane profile={preview} replayKey={replayKey} onReplay={onReplay} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setSheet(true)}
        className="fixed bottom-5 left-1/2 z-30 flex h-11 -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#18181d]/95 px-5 text-[13px] font-medium text-zinc-100 shadow-[0_16px_40px_-10px_rgba(0,0,0,.8)] backdrop-blur transition active:scale-95 md:hidden"
      >
        <Eye size={16} /> Preview
      </button>
      <PreviewSheet open={sheet} onClose={() => setSheet(false)} profile={preview} replayKey={replayKey} />
    </div>
  );
}
