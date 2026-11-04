import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type Tone = 'success' | 'error' | 'info';
interface ToastItem { id: number; title: string; description?: string; tone: Tone; action?: { label: string; run: () => void } }
type Push = (t: Omit<ToastItem, 'id' | 'tone'> & { tone?: Tone; duration?: number }) => void;

const Ctx = createContext<Push>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const push = useCallback<Push>(({ duration = 3200, tone = 'success', ...t }) => {
    const id = ++seq.current;
    setItems((x) => [...x.slice(-2), { id, tone, ...t }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), duration);
  }, []);
  const Icon = { success: CheckCircle2, error: AlertCircle, info: Info };
  const color = { success: 'text-emerald-400', error: 'text-red-400', info: 'text-zinc-300' };
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6" aria-live="polite">
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const I = Icon[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                className="pointer-events-auto flex w-full max-w-[360px] items-start gap-3 rounded-[12px] border border-white/[.08] bg-[#141418]/95 p-3 pr-3.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,.8)] backdrop-blur"
              >
                <I size={17} className={`mt-px shrink-0 ${color[t.tone]}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-zinc-100">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-[12px] text-zinc-500">{t.description}</p>}
                </div>
                {t.action && (
                  <button
                    type="button"
                    onClick={() => { t.action!.run(); setItems((x) => x.filter((i) => i.id !== t.id)); }}
                    className="shrink-0 rounded-[7px] px-2 py-1 text-[12px] font-medium text-zinc-200 transition hover:bg-white/[.08]"
                  >
                    {t.action.label}
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
