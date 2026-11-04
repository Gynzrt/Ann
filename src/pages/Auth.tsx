import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AtSign, Lock, Mail } from 'lucide-react';
import { backend, validateUsername } from '@/lib/backend';
import { useAuth } from '@/lib/auth';
import { Button, Logo } from '@/components/ui';

function Shell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-950 px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-[130px]" aria-hidden />
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        className="relative w-full max-w-[400px] rounded-2xl border border-white/[.07] bg-ink-900/90 p-7 backdrop-blur">
        <Link to="/" className="mb-6 inline-block text-[18px]"><Logo /></Link>
        <h1 className="text-[22px] font-bold">{title}</h1>
        <p className="mt-1 text-sm text-white/50">{sub}</p>
        {backend.mode === 'local' && (
          <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200/80">
            Local mode: accounts are stored in this browser only. Connect Supabase to share profiles publicly.
          </p>
        )}
        <div className="mt-6">{children}</div>
      </motion.div>
    </div>
  );
}

function IconInput({ icon: I, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { icon: typeof Mail }) {
  return (
    <div className="relative">
      <I size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
      <input {...rest} className="h-11 w-full rounded-lg border border-white/[.08] bg-ink-850 pl-10 pr-3 text-sm outline-none transition placeholder:text-white/30 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20" />
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
    setErr(''); setBusy(true);
    try { await backend.signIn(email, pw); await refresh(); }
    catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <Shell title="Welcome back" sub="Log in to edit your page.">
      <form onSubmit={submit} className="space-y-3">
        <IconInput icon={Mail} type="email" required placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <IconInput icon={Lock} type="password" required placeholder="Password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="text-sm text-red-400" role="alert">{err}</p>}
        <Button className="h-11 w-full" loading={busy}>Log in</Button>
      </form>
      <p className="mt-5 text-center text-sm text-white/50">No account? <Link to="/register" className="font-medium text-brand-400 hover:underline">Sign up</Link></p>
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

  useEffect(() => {
    const u = username.trim().toLowerCase();
    if (validateUsername(u)) { setAvail(null); return; }
    const t = setTimeout(() => backend.isUsernameAvailable(u).then(setAvail).catch(() => setAvail(null)), 300);
    return () => clearTimeout(t);
  }, [username]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    const v = validateUsername(u);
    if (v) return setErr(v);
    if (pw.length < 8) return setErr('Password must be at least 8 characters.');
    setErr(''); setBusy(true);
    try {
      await backend.signUp(email, pw, u);
      if (backend.mode === 'supabase' && !(await backend.getAccount())) setSent(true);
      else await refresh();
    } catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  };

  if (sent)
    return <Shell title="Check your inbox" sub={`We sent a confirmation link to ${email}. Open it to finish creating your account.`}><Link to="/login" className="text-sm text-brand-400">Back to login</Link></Shell>;

  const u = username.trim().toLowerCase();
  return (
    <Shell title="Create your page" sub="Pick a username. You can change it later.">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <IconInput icon={AtSign} required placeholder="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} maxLength={20} />
          {u && (
            <p className={`mt-1.5 text-xs ${validateUsername(u) || avail === false ? 'text-red-400' : avail ? 'text-emerald-400' : 'text-white/40'}`}>
              {validateUsername(u) ?? (avail === false ? 'That username is taken.' : avail ? `${location.host}/${u} is available` : 'Checking…')}
            </p>
          )}
        </div>
        <IconInput icon={Mail} type="email" required placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <IconInput icon={Lock} type="password" required placeholder="Password (8+ characters)" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="text-sm text-red-400" role="alert">{err}</p>}
        <Button className="h-11 w-full" loading={busy} disabled={avail === false}>Create account</Button>
      </form>
      <p className="mt-5 text-center text-sm text-white/50">Already have one? <Link to="/login" className="font-medium text-brand-400 hover:underline">Log in</Link></p>
    </Shell>
  );
}
