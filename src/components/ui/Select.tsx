import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover } from './Popover';
import { fieldShell } from './Field';
import { cx } from '@/lib/util';

export interface SelectOption<T extends string> { value: T; label: string; hint?: string }

/** A listbox with keyboard support. Focus stays on the trigger while the list is open. */
export function Select<T extends string>({ value, options, onChange, renderOption, onOpen, ariaLabel }: {
  value: T;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  renderOption?: (o: SelectOption<T>) => ReactNode;
  onOpen?: () => void;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const btn = useRef<HTMLButtonElement>(null);
  const current = options.find((o) => o.value === value);
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  const show = () => { setActive(index); setOpen(true); onOpen?.(); };
  const choose = (v: T) => { onChange(v); setOpen(false); btn.current?.focus(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); show(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(options[active].value); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        className={cx(
          'flex h-10 w-full items-center justify-between gap-2 px-3 text-left text-[13.5px] text-zinc-100 outline-none',
          fieldShell,
          open ? 'border-accent/70 ring-[3px] ring-accent/[.14] hover:border-accent/70' : 'focus-visible:border-accent/70 focus-visible:ring-[3px] focus-visible:ring-accent/[.14]',
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">{current ? renderOption?.(current) ?? current.label : 'Select…'}</span>
        <ChevronsUpDown size={14} className="shrink-0 text-zinc-500" />
      </button>
      <Popover anchorRef={btn} open={open} onClose={() => setOpen(false)} matchWidth>
        <div role="listbox" aria-label={ariaLabel} className="max-h-72 overflow-y-auto p-1">
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <div
                key={o.value}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(o.value)}
                className={cx(
                  'flex h-9 cursor-pointer items-center justify-between gap-2 rounded-[8px] px-2.5 text-[13px] transition-colors',
                  i === active ? 'bg-white/[.06] text-white' : 'text-zinc-300',
                )}
              >
                <span className="flex min-w-0 items-center gap-2 truncate">{renderOption?.(o) ?? o.label}</span>
                {selected && <Check size={14} className="shrink-0 text-accent-soft" />}
              </div>
            );
          })}
        </div>
      </Popover>
    </>
  );
}
