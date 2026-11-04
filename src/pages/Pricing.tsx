import { Check, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MarketingPage } from '@/components/layout/SiteNav';
import { cx } from '@/lib/util';

const ROWS: [string, boolean | string, boolean | string][] = [
  ['Custom username', true, true],
  ['All five layouts', true, true],
  ['Background effects and cursors', true, true],
  ['Music playlist', '1 track', 'Up to 10 tracks'],
  ['Uploads', '20 MB', '100 MB'],
  ['Discord presence', true, true],
  ['Profile analytics', '14 days', '90 days'],
  ['Premium badge', false, true],
  ['Custom domain', false, true],
];

export function Pricing() {
  return (
    <MarketingPage>
      <section className="px-4 pb-24 pt-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-[36px] font-extrabold tracking-tight sm:text-[46px]">Simple pricing</h1>
          <p className="mx-auto mt-3 max-w-md text-white/50">Everything you need is free. Premium is for people who want a little more.</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
          {[
            { name: 'Free', price: '$0', sub: 'forever', cta: 'Get started', to: '/register', hl: false },
            { name: 'Premium', price: '$5', sub: 'one-time', cta: 'Not available yet', to: '', hl: true },
          ].map((p, col) => (
            <div key={p.name} className={cx('relative rounded-2xl border p-7', p.hl ? 'border-brand-500/40 bg-gradient-to-b from-brand-500/10 to-ink-900' : 'border-white/[.06] bg-ink-900')}>
              {p.hl && <span className="absolute -top-3 left-7 rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-semibold">Popular</span>}
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <div className="mt-3 flex items-baseline gap-1.5"><span className="text-[40px] font-extrabold">{p.price}</span><span className="text-white/45">{p.sub}</span></div>
              {p.to ? (
                <Link to={p.to} className="mt-6 block rounded-lg bg-white/[.08] py-2.5 text-center text-sm font-semibold transition hover:bg-white/[.12]">{p.cta}</Link>
              ) : (
                <button disabled className="mt-6 block w-full cursor-not-allowed rounded-lg bg-brand-500/60 py-2.5 text-center text-sm font-semibold text-white/80" title="Payments are not connected in this build">{p.cta}</button>
              )}
              <ul className="mt-7 space-y-3 text-sm">
                {ROWS.map(([label, ...vals]) => {
                  const v = vals[col];
                  return (
                    <li key={label} className="flex items-center gap-3">
                      {v === false ? <Minus size={16} className="text-white/25" /> : <Check size={16} className="text-brand-400" />}
                      <span className={v === false ? 'text-white/35' : 'text-white/80'}>{label}{typeof v === 'string' && <span className="text-white/45"> · {v}</span>}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-4xl text-center text-xs text-white/35">Payments are not connected in this build, so Premium can't be bought yet. Every feature above marked for Free works today.</p>
      </section>
    </MarketingPage>
  );
}
