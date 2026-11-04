import { Link } from 'react-router-dom';
import { validateUsername } from '@/lib/backend';

export function NotFound({ text = "This page doesn't exist.", claim }: { text?: string; claim?: string }) {
  const canClaim = claim && !validateUsername(claim.toLowerCase());
  return (
    <div className="grid min-h-screen place-items-center bg-ink-950 px-4 text-center">
      <div>
        <div className="text-[72px] font-extrabold leading-none text-white/10">404</div>
        <p className="mt-4 text-white/60">{text}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/" className="rounded-lg bg-white/[.06] px-4 py-2 text-sm font-medium hover:bg-white/10">Home</Link>
          {canClaim && <Link to={`/register?username=${encodeURIComponent(claim!.toLowerCase())}`} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium hover:bg-brand-600">Claim it</Link>}
        </div>
      </div>
    </div>
  );
}
