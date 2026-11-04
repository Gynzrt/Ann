import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Minus, Plus } from 'lucide-react';
import { MarketingPage, PageIntro } from '@/components/layout/SiteNav';
import { buttonClass } from '@/components/ui';
import { cx } from '@/lib/util';

const FEATURES: [string, boolean | string, boolean | string][] = [
  ['Custom username', true, true],
  ['All five layouts', true, true],
  ['Background effects and cursors', true, true],
  ['Music playlist', 'Up to 10 tracks', 'Up to 25 tracks'],
  ['Uploads', '20 MB per file', '100 MB per file'],
  ['Discord presence', true, true],
  ['Analytics', '30 days', '1 year'],
  ['Premium badge', false, true],
  ['Custom domain', false, true],
];

const FAQ = [
  ['Is the free plan really free?', 'Yes. Every feature marked for Free works today with no time limit, and your page never shows ads.'],
  ['Why can’t I buy Premium?', 'Payments aren’t connected in this version, so the Premium button is turned off. Nothing on the Free plan is held back because of it.'],
  ['Can I change my username later?', 'Yes, from Customize. Your old link stops working as soon as you save the new one.'],
  ['What counts as a view?', 'One view per visitor per day. Refreshing your own page over and over won’t inflate the number.'],
];

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[.06]">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-6 py-5 text-left text-[15px] font-medium text-zinc-100">
        {q}
        <Plus size={16} className={cx('shrink-0 text-zinc-500 transition-transform duration-200', open && 'rotate-45')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <p className="pb-5 pr-10 text-[14px] leading-relaxed text-zinc-400">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Pricing() {
  return (
    <MarketingPage>
      <PageIntro eyebrow="Pricing" title="Simple, honest pricing">Everything you need is free. Premium is for people who want a little more.</PageIntro>
      <section className="px-4 pb-20 pt-14 sm:px-6">
        <div className="mx-auto grid max-w-[880px] gap-3 md:grid-cols-2">
          {[
            { name: 'Free', price: '$0', sub: 'forever', blurb: 'Everything you need for a great page.' },
            { name: 'Premium', price: '$5', sub: 'one time', blurb: 'More room for media, longer analytics and a badge.' },
          ].map((p, col) => (
            <div
              key={p.name}
              className={cx(
                'relative flex flex-col rounded-[18px] border p-7',
                col ? 'border-accent/30 bg-[linear-gradient(180deg,rgba(139,92,246,.07),transparent_45%)] shadow-[0_0_0_1px_rgba(139,92,246,.08)]' : 'border-white/[.07] bg-card',
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-zinc-100">{p.name}</h2>
                {col === 1 && <span className="rounded-full border border-white/[.1] bg-white/[.04] px-2.5 py-0.5 text-[11.5px] font-medium text-zinc-300">Coming soon</span>}
              </div>
              <p className="mt-1.5 text-[13px] text-zinc-500">{p.blurb}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-[44px] font-semibold leading-none tracking-[-0.03em] text-white">{p.price}</span>
                <span className="text-[13.5px] text-zinc-500">{p.sub}</span>
              </div>
              {col === 0 ? (
                <Link to="/register" className={buttonClass('white', 'lg', 'mt-7 w-full')}>Get started</Link>
              ) : (
                <button type="button" disabled className={buttonClass('secondary', 'lg', 'mt-7 w-full')} title="Payments aren’t connected in this version">Not available yet</button>
              )}
              <ul className="mt-7 space-y-3 border-t border-white/[.06] pt-6 text-[13.5px]">
                {FEATURES.map(([label, ...vals]) => {
                  const v = vals[col];
                  return (
                    <li key={label} className="flex items-start gap-3">
                      {v === false ? <Minus size={16} className="mt-0.5 shrink-0 text-zinc-700" /> : <Check size={16} className="mt-0.5 shrink-0 text-zinc-300" />}
                      <span className={v === false ? 'text-zinc-600' : 'text-zinc-300'}>
                        {label}
                        {typeof v === 'string' && <span className="text-zinc-500"> · {v}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section className="px-4 pb-28 sm:px-6">
        <div className="mx-auto max-w-[720px]">
          <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white">Questions</h2>
          <div className="mt-4 border-t border-white/[.06]">{FAQ.map(([q, a]) => <Faq key={q} q={q} a={a} />)}</div>
        </div>
      </section>
    </MarketingPage>
  );
}
