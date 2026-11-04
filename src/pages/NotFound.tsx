import { Link } from 'react-router-dom';
import { validateUsername } from '@/lib/backend';
import { buttonClass, Logo } from '@/components/ui';

export function NotFound({ text = 'This page doesn’t exist.', claim }: { text?: string; claim?: string }) {
  const canClaim = claim && !validateUsername(claim.toLowerCase());
  return (
    <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-bg px-4 text-center">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(45%_45%_at_50%_50%,#000,transparent)]" aria-hidden />
      <div className="relative">
        <Link to="/" className="mx-auto mb-10 flex w-fit" aria-label="ayas.kys home"><Logo /></Link>
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-zinc-600">404</p>
        <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-white">{text}</h1>
        {canClaim && <p className="mt-2 text-[14px] text-zinc-500">Good news: you can have it.</p>}
        <div className="mt-8 flex justify-center gap-2">
          <Link to="/" className={buttonClass('secondary', 'md')}>Go home</Link>
          {canClaim && <Link to={`/register?username=${encodeURIComponent(claim!.toLowerCase())}`} className={buttonClass('white', 'md')}>Claim @{claim!.toLowerCase()}</Link>}
        </div>
      </div>
    </div>
  );
}
