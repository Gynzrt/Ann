import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Search, Trophy } from 'lucide-react';
import { MarketingPage, PageIntro } from '@/components/layout/SiteNav';
import { backend } from '@/lib/backend';
import type { LeaderboardEntry } from '@/lib/backend';
import { Avatar } from '@/components/profile/Bits';
import { DEFAULT_APPEARANCE } from '@/lib/types';
import { EmptyState, Input } from '@/components/ui';
import { cx, fmt } from '@/lib/util';

const AP = { ...DEFAULT_APPEARANCE, borderWidth: 0 };
const MEDAL = ['#facc15', '#d4d4d8', '#d97706'];

export function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => { backend.leaderboard(100).then(setRows).catch(() => setRows([])); }, []);
  const ranked = (rows ?? []).map((r, i) => ({ ...r, rank: i + 1 }));
  const term = q.trim().toLowerCase();
  const list = term ? ranked.filter((r) => r.username.includes(term) || r.displayName.toLowerCase().includes(term)) : ranked;
  const podium = term ? [] : list.slice(0, 3);
  const rest = term ? list : list.slice(3);

  return (
    <MarketingPage>
      <PageIntro eyebrow="Leaderboard" title="Most viewed pages">
        Ranked by unique daily views{backend.mode === 'local' ? ' on this device' : ''}.
      </PageIntro>
      <section className="px-4 pb-28 pt-12 sm:px-6">
        <div className="mx-auto max-w-[880px]">
          <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" aria-label="Search the leaderboard" wrapperClassName="mx-auto max-w-sm" />

          {!rows ? (
            <div className="mt-8 space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-[14px]" />)}</div>
          ) : list.length === 0 ? (
            <div className="mt-8 rounded-[16px] border border-white/[.06] bg-card">
              <EmptyState icon={Trophy} title={rows.length ? 'No one matches that search' : 'No pages yet'} description={rows.length ? 'Try a different name.' : 'Create a page and be the first on the board.'} />
            </div>
          ) : (
            <>
              {podium.length > 0 && (
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {podium.map((r, i) => (
                    <motion.div key={r.username} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="w-full sm:w-[calc((100%-24px)/3)]">
                      <Link to={`/${r.username}`} className="group relative flex flex-col items-center rounded-[16px] border border-white/[.06] bg-card px-4 pb-5 pt-6 text-center transition-colors hover:border-white/[.12]">
                        <span className="absolute left-3 top-3 flex items-center gap-1 text-[12px] font-semibold tabular-nums" style={{ color: MEDAL[i] }}>
                          <Trophy size={13} />#{r.rank}
                        </span>
                        <Avatar src={r.avatarUrl} name={r.displayName || r.username} size={64} ap={AP} />
                        <div className="mt-3 max-w-full truncate text-[14px] font-semibold text-zinc-100">{r.displayName || r.username}</div>
                        <div className="max-w-full truncate text-[12.5px] text-zinc-500">@{r.username}</div>
                        <div className="mt-3 flex items-center gap-1.5 rounded-full border border-white/[.07] bg-white/[.03] px-2.5 py-1 text-[12.5px] font-medium tabular-nums text-zinc-200">
                          <Eye size={13} className="text-zinc-500" />{fmt(r.views)}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
              {rest.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-[16px] border border-white/[.06] bg-card">
                  {rest.map((r) => (
                    <Link key={r.username} to={`/${r.username}`} className="flex items-center gap-4 border-b border-white/[.04] px-4 py-3 transition-colors last:border-0 hover:bg-white/[.02]">
                      <span className={cx('w-8 text-center text-[13px] font-semibold tabular-nums', r.rank <= 3 ? '' : 'text-zinc-500')} style={r.rank <= 3 ? { color: MEDAL[r.rank - 1] } : undefined}>{r.rank}</span>
                      <Avatar src={r.avatarUrl} name={r.displayName || r.username} size={36} ap={AP} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-medium text-zinc-100">{r.displayName || r.username}</div>
                        <div className="truncate text-[12px] text-zinc-500">@{r.username}</div>
                      </div>
                      <span className="flex items-center gap-1.5 text-[13px] font-medium tabular-nums text-zinc-300"><Eye size={14} className="text-zinc-500" />{fmt(r.views)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </MarketingPage>
  );
}
