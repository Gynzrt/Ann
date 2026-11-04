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
