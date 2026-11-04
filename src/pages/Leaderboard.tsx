import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Eye } from 'lucide-react';
import { MarketingPage } from '@/components/layout/SiteNav';
import { backend } from '@/lib/backend';
import type { LeaderboardEntry } from '@/lib/backend';
import { Avatar } from '@/components/profile/Bits';
import { DEFAULT_APPEARANCE } from '@/lib/types';
import { Spinner } from '@/components/layout/Spinner';
import { cx, fmt } from '@/lib/util';

const MEDAL = ['text-yellow-300', 'text-zinc-300', 'text-amber-600'];

export function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => { backend.leaderboard(100).then(setRows).catch(() => setRows([])); }, []);
  const list = (rows ?? []).map((r, i) => ({ ...r, rank: i + 1 })).filter((r) => r.username.includes(q.toLowerCase()));

  return (
    <MarketingPage>
      <section className="px-4 pb-24 pt-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-center text-[36px] font-extrabold tracking-tight sm:text-[46px]">Leaderboard</h1>
          <p className="mx-auto mt-3 max-w-md text-center text-white/50">The most viewed profiles{backend.mode === 'local' ? ' on this device' : ''}.</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search usernames"
            className="mx-auto mt-8 block h-10 w-full max-w-sm rounded-lg border border-white/[.08] bg-ink-900 px-3 text-sm outline-none focus:border-brand-500/50" />
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/[.06] bg-ink-900">
            {!rows ? (
              <div className="grid place-items-center p-12"><Spinner /></div>
            ) : list.length === 0 ? (
              <p className="p-12 text-center text-sm text-white/45">{rows.length ? 'No one matches that search.' : 'No profiles yet. Be the first.'}</p>
            ) : (
              list.map((r) => (
                <Link key={r.username} to={`/${r.username}`} className="flex items-center gap-4 border-b border-white/[.04] px-4 py-3 transition last:border-0 hover:bg-white/[.03]">
                  <span className={cx('w-7 text-center text-sm font-bold tabular-nums', MEDAL[r.rank - 1] ?? 'text-white/40')}>
                    {r.rank <= 3 ? <Crown size={16} className="mx-auto" /> : r.rank}
                  </span>
                  <Avatar src={r.avatarUrl} size={38} ap={{ ...DEFAULT_APPEARANCE, borderWidth: 0 }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{r.displayName || r.username}</div>
                    <div className="truncate text-xs text-white/40">@{r.username} · UID {r.uid}</div>
                  </div>
                  <span className="flex items-center gap-1.5 text-sm tabular-nums text-white/70"><Eye size={14} className="text-white/40" />{fmt(r.views)}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
