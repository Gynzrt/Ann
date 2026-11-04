import { useEffect, useState } from 'react';

/** Types each line, pauses, deletes it, moves to the next. */
export function Typewriter({ lines, className }: { lines: string[]; className?: string }) {
  const list = lines.filter(Boolean);
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    if (!list.length) return;
    const line = list[i % list.length];
    let t: number;
    if (!del && n < line.length) t = window.setTimeout(() => setN(n + 1), 70);
    else if (!del) t = window.setTimeout(() => setDel(true), 1800);
    else if (n > 0) t = window.setTimeout(() => setN(n - 1), 35);
    else t = window.setTimeout(() => { setDel(false); setI(i + 1); }, 300);
    return () => clearTimeout(t);
  }, [n, del, i, list.join("\n")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!list.length) return null;
  return (
    <span className={className}>
      {list[i % list.length].slice(0, n)}
      <span className="tw-caret">|</span>
    </span>
  );
}
