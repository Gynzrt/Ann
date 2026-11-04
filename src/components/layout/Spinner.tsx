export function Spinner({ full }: { full?: boolean }) {
  const s = <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-brand-500" role="status" aria-label="Loading" />;
  return full ? <div className="grid min-h-screen place-items-center bg-ink-950">{s}</div> : s;
}
