import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AtSign, Check, Info, Loader2, Lock, Mail, X } from 'lucide-react';
import { backend, validateUsername } from '@/lib/backend';
import { useAuth } from '@/lib/auth';
import { Button, Field, Input, Logo } from '@/components/ui';

function Shell({ title, sub, children, footer }: { title: string; sub: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-bg px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px]" style={{ background: 'radial-gradient(50% 100% at 50% 0%, rgba(139,92,246,.10), transparent 70%)' }} aria-hidden />
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(50%_50%_at_50%_40%,#000,transparent)]" aria-hidden />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }} className="relative w-full max-w-[400px]">
        <Link to="/" className="mx-auto mb-8 flex w-fit rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/50" aria-label="halo home"><Logo size={28} className="text-[18px]" /></Link>
        <div className="rounded-[18px] border border-white/[.07] bg-card/90 p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,.8),inset_0_1px_0_rgba(255,255,255,.03)] backdrop-blur">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-white">{title}</h1>
          <p className="mt-1.5 text-[13.5px] text-zinc-500">{sub}</p>
          {backend.mode === 'local' && (
            <p className="mt-5 flex gap-2.5 rounded-[10px] border border-amber-300/15 bg-amber-300/[.04] px-3 py-2.5 text-[12px] leading-relaxed text-amber-100/75">
              <Info size={14} className="mt-px shrink-0 text-amber-300/80" />
              Local mode: accounts are stored in this browser only. Connect Supabase to share pages publicly.
            </p>
          )}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-6 text-center text-[13px] text-zinc-500">{footer}</p>}
      </motion.div>
    </div>
  );
}

export function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { account, refresh } = useAuth();
  const next = sp.get('next')?.startsWith('/') ? sp.get('next')! : '/dashboard';
  useEffect(() => { if (account) nav(next, { replace: true }); }, [account, nav, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try { await backend.signIn(email, pw); await refresh(); }
    catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <Shell title="Welcome back" sub="Log in to edit your page." footer={<>No account yet? <Link to="/register" className="font-medium text-zinc-200 hover:text-white hover:underline">Sign up free</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><Input icon={Mail} inputSize="lg" type="email" required placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><Input icon={Lock} inputSize="lg" type="password" required placeholder="••••••••" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} invalid={!!err} /></Field>
        {err && <p className="text-[13px] text-red-400" role="alert">{err}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>Log in</Button>
      </form>
    </Shell>
  );
}

export function Register() {
  const [sp] = useSearchParams();
  const [username, setUsername] = useState(sp.get('username') ?? '');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [avail, setAvail] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const nav = useNavigate();
  const { account, refresh } = useAuth();
  useEffect(() => { if (account) nav('/dashboard', { replace: true }); }, [account, nav]);

  const u = username.trim().toLowerCase();
  const uErr = u ? validateUsername(u) : null;
  useEffect(() => {
    setAvail(null);
    if (!u || validateUsername(u)) return;
    const t = setTimeout(() => backend.isUsernameAvailable(u).then(setAvail).catch(() => setAvail(null)), 300);
    return () => clearTimeout(t);
  }, [u]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateUsername(u);
    if (v) return setErr(v);
    if (pw.length < 8) return setErr('Your password needs at least 8 characters.');
    setErr('');
    setBusy(true);
    try {
      await backend.signUp(email, pw, u);
      if (backend.mode === 'supabase' && !(await backend.getAccount())) setSent(true);
      else await refresh();
    } catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  };

  if (sent)
    return (
      <Shell title="Check your inbox" sub={`We sent a confirmation link to ${email}. Open it to finish creating your account.`}>
        <Link to="/login" className="text-[13.5px] font-medium text-zinc-200 hover:underline">Back to log in</Link>
      </Shell>
    );

  const status = !u ? null : uErr ? 'bad' : avail === null ? 'checking' : avail ? 'ok' : 'taken';
  return (
    <Shell title="Create your page" sub="Pick a username. You can change it later." footer={<>Already have an account? <Link to="/login" className="font-medium text-zinc-200 hover:text-white hover:underline">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Username"
          error={uErr ?? (status === 'taken' ? 'That username is taken.' : undefined)}
          hint={status === 'ok' ? <span className="text-emerald-400">{location.host}/{u} is yours to claim</span> : undefined}
        >
          <Input
            icon={AtSign}
            inputSize="lg"
            required
            placeholder="yourname"
            autoComplete="username"
            spellCheck={false}
            value={username}
            maxLength={20}
            invalid={status === 'bad' || status === 'taken'}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
            suffix={
              status === 'checking' ? <Loader2 size={15} className="animate-spin text-zinc-500" />
                : status === 'ok' ? <Check size={15} className="text-emerald-400" />
                : status ? <X size={15} className="text-red-400" /> : null
            }
          />
        </Field>
        <Field label="Email"><Input icon={Mail} inputSize="lg" type="email" required placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input icon={Lock} inputSize="lg" type="password" required placeholder="••••••••" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        {err && <p className="text-[13px] text-red-400" role="alert">{err}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy} disabled={status === 'taken'}>Create account</Button>
      </form>
    </Shell>
  );
}
