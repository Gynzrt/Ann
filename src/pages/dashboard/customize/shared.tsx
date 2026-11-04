import { useId } from 'react';
import { shifted } from '@/lib/color';
import { cx } from '@/lib/util';

export type TabId = 'profile' | 'style' | 'colors' | 'effects' | 'audio' | 'widgets';
export interface TabProps { goTo: (t: TabId) => void; onReplay: () => void }

/** Mini diagrams of each layout for the layout picker. */
export function LayoutThumb({ id, active }: { id: string; active: boolean }) {
  const line = active ? 'bg-white/45' : 'bg-white/[.18]';
  const card = cx('rounded-[5px] ring-1 ring-inset', active ? 'bg-white/[.07] ring-white/[.14]' : 'bg-white/[.035] ring-white/[.07]');
  const accent = active ? 'bg-accent/70' : 'bg-white/[.12]';
  const dot = (c = '') => <span className={cx('block rounded-full', line, c)} />;
  return (
    <div className="flex h-full w-full items-center justify-center p-2.5">
      {id === 'default' && (
        <div className={cx(card, 'flex h-[56px] w-[46px] flex-col items-center gap-1 pt-2')}>
          <span className={cx('h-3 w-3 rounded-full', accent)} />
          {dot('h-[3px] w-6')}
          {dot('h-[3px] w-4 opacity-70')}
          <span className="mt-0.5 flex gap-[3px]">{dot('h-1 w-1')}{dot('h-1 w-1')}{dot('h-1 w-1')}</span>
        </div>
      )}
      {id === 'modern' && (
        <div className={cx(card, 'h-[56px] w-[52px] overflow-hidden')}>
          <span className={cx('block h-4', accent)} />
          <span className="-mt-1.5 ml-1.5 block h-3 w-3 rounded-full bg-white/50 ring-2 ring-[#131317]" />
          <span className="ml-1.5 mt-1 block">{dot('h-[3px] w-6')}</span>
          <span className="ml-1.5 mt-1 block">{dot('h-[3px] w-4 opacity-70')}</span>
        </div>
      )}
      {id === 'simplistic' && (
        <div className="flex flex-col items-center gap-1">
          <span className={cx('h-4 w-4 rounded-full', accent)} />
          {dot('h-[3px] w-8')}
          {dot('h-[3px] w-5 opacity-70')}
          <span className="mt-0.5 flex gap-[3px]">{dot('h-1 w-1')}{dot('h-1 w-1')}{dot('h-1 w-1')}{dot('h-1 w-1')}</span>
        </div>
      )}
      {id === 'sleek' && (
        <div className={cx(card, 'h-[46px] w-[70px] p-1.5')}>
          <div className="flex gap-1.5">
            <span className={cx('h-3.5 w-3.5 shrink-0 rounded-[3px]', accent)} />
            <span className="mt-0.5 flex flex-col gap-1">{dot('h-[3px] w-7')}{dot('h-[3px] w-5 opacity-70')}</span>
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1">
            {[0, 1, 2, 3].map((i) => <span key={i} className={cx('h-[5px] rounded-[2px]', active ? 'bg-white/20' : 'bg-white/[.09]')} />)}
          </div>
        </div>
      )}
      {id === 'portfolio' && (
        <div className="flex h-[52px] w-[70px] gap-1">
          <div className={cx(card, 'flex w-[22px] flex-col items-center gap-1 pt-1.5')}>
            <span className={cx('h-2.5 w-2.5 rounded-full', accent)} />
            {dot('h-[2px] w-3')}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <div className={cx(card, 'flex-1 p-1')}>{dot('h-[2px] w-6')}</div>
            <div className={cx(card, 'flex-[1.4] p-1')}><span className="flex flex-col gap-[3px]">{dot('h-[2px] w-7')}{dot('h-[2px] w-5')}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small drawings of each background effect. */
export function FxPreview({ id, color }: { id: string; color: string }) {
  const uid = useId().replace(/:/g, '');
  if (id === 'fluid' || id === 'aurora' || id === 'liquid' || id === 'warp') return <GlPreview id={id} color={color} uid={uid} />;
  const dots = (n: number, seed: number) =>
    Array.from({ length: n }, (_, i) => {
      const x = ((i * 37 + seed * 11) % 100) / 100;
      const y = ((i * 53 + seed * 7) % 100) / 100;
      return { x: 8 + x * 84, y: 6 + y * 40, r: 0.6 + ((i * 13) % 10) / 10 };
    });
  return (
    <svg viewBox="0 0 100 52" className="h-full w-full" aria-hidden>
      {id === 'none' && <line x1="38" y1="38" x2="62" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".5" />}
      {id === 'particles' && dots(16, 1).map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r + 0.4} fill={color} opacity={0.35 + (i % 4) * 0.15} />)}
      {id === 'snow' && dots(18, 3).map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r + 0.5} fill="#fff" opacity={0.4 + (i % 3) * 0.2} />)}
      {id === 'rain' && dots(14, 5).map((d, i) => <line key={i} x1={d.x} y1={d.y - 4} x2={d.x - 1.2} y2={d.y + 4} stroke="#fff" strokeWidth=".8" opacity={0.25 + (i % 3) * 0.15} />)}
      {id === 'stars' && dots(22, 7).map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r * 0.7} fill="#fff" opacity={0.2 + (i % 5) * 0.16} />)}
      {id === 'nightfall' &&
        [[70, 8], [52, 18], [84, 24], [36, 10]].map(([x, y], i) => (
          <line key={i} x1={x} y1={y} x2={x - 16} y2={y + 16} stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity={0.85 - i * 0.15} />
        ))}
      {id === 'blur-orbs' && (
        <>
          <defs><filter id="fxb"><feGaussianBlur stdDeviation="5" /></filter></defs>
          <circle cx="34" cy="30" r="14" fill={color} opacity=".55" filter="url(#fxb)" />
          <circle cx="68" cy="20" r="11" fill={color} opacity=".35" filter="url(#fxb)" />
        </>
      )}
    </svg>
  );
}

/** Drawings for the WebGL effects, in the accent colour and two neighbouring hues. */
function GlPreview({ id, color, uid }: { id: 'fluid' | 'aurora' | 'liquid' | 'warp'; color: string; uid: string }) {
  const a = shifted(color, 0);
  const b = shifted(color, 50);
  const c = shifted(color, -55);
  return (
    <svg viewBox="0 0 100 58" className="h-full w-full" aria-hidden>
      <defs>
        <filter id={`b${uid}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" /></filter>
        <filter id={`s${uid}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" /></filter>
        <linearGradient id={`g${uid}`} x1="0" x2="1"><stop offset="0" stopColor={a} /><stop offset=".55" stopColor={b} /><stop offset="1" stopColor={c} /></linearGradient>
        <linearGradient id={`v${uid}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={b} stopOpacity="0" /><stop offset=".55" stopColor={a} stopOpacity=".9" /><stop offset="1" stopColor={a} stopOpacity="0" /></linearGradient>
      </defs>
      {id === 'fluid' && (
        <g filter={`url(#b${uid})`} fill="none" strokeLinecap="round">
          <path d="M8 40 C 24 6, 40 54, 56 26 S 82 8, 94 30" stroke={`url(#g${uid})`} strokeWidth="7" opacity=".9" />
          <path d="M14 18 C 30 34, 44 4, 62 22 S 84 50, 92 46" stroke={c} strokeWidth="4" opacity=".55" />
          <circle cx="56" cy="27" r="7" fill={b} opacity=".5" />
        </g>
      )}
      {id === 'aurora' && (
        <g filter={`url(#b${uid})`}>
          <path d="M0 30 C 20 16, 40 34, 60 20 S 90 22, 100 14 L100 4 C 80 12, 60 2, 40 12 S 12 8, 0 18 Z" fill={`url(#v${uid})`} opacity=".95" />
          <path d="M0 38 C 24 26, 46 40, 70 28 S 92 32, 100 26 L100 18 C 78 26, 56 16, 34 26 S 10 22, 0 28 Z" fill={c} opacity=".35" />
        </g>
      )}
      {id === 'liquid' && (
        <g filter={`url(#s${uid})`}>
          <circle cx="32" cy="24" r="17" fill={a} opacity=".85" />
          <circle cx="66" cy="36" r="16" fill={b} opacity=".7" />
          <circle cx="58" cy="14" r="10" fill={c} opacity=".65" />
        </g>
      )}
      {id === 'warp' && (
        <g strokeLinecap="round">
          <circle cx="50" cy="29" r="8" fill={a} opacity=".35" filter={`url(#s${uid})`} />
          {Array.from({ length: 18 }, (_, i) => {
            const t = (i / 18) * Math.PI * 2 + (i % 3) * 0.13;
            const r1 = 7 + (i % 4) * 3;
            const r2 = r1 + 10 + (i % 5) * 5;
            return (
              <line key={i} x1={50 + Math.cos(t) * r1} y1={29 + Math.sin(t) * r1 * 0.62} x2={50 + Math.cos(t) * r2} y2={29 + Math.sin(t) * r2 * 0.62}
                stroke={i % 3 ? '#fff' : b} strokeWidth={i % 2 ? 0.8 : 1.2} opacity={0.35 + (i % 4) * 0.15} />
            );
          })}
        </g>
      )}
    </svg>
  );
}
