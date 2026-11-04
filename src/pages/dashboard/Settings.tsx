import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { Button, Card, Field, Input } from '@/components/ui';

function useAction() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg({ ok: true, text: ok }); }
    catch (x) { setMsg({ ok: false, text: (x as Error).message }); }
    finally { setBusy(false); }
  };
  const note = msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`} role="status">{msg.text}</p>;
  return { busy, run, note };
}

export default function Settings() {
  const { account, profile, refresh } = useAuth();
  const [email, setEmail] = useState(account?.email ?? '');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [confirm, setConfirm] = useState('');
  const e = useAction();
  const p = useAction();
  const d = useAction();
  const nav = useNavigate();
  if (!account || !profile) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-[22px] font-bold">Account settings</h1>
      <p className="mt-1 text-sm text-white/45">Manage how you sign in.</p>

      <Card className="mt-6 p-5">
        <h2 className="font-semibold">Email</h2>
        <form className="mt-4 space-y-3" onSubmit={(ev) => { ev.preventDefault(); e.run(async () => { await backend.updateEmail(email); await refresh(); },
          backend.mode === 'supabase' ? 'Check both inboxes to confirm the change.' : 'Email updated.'); }}>
          <Field label="Email address"><Input type="email" required value={email} onChange={(x) => setEmail(x.target.value)} /></Field>
          {e.note}
          <Button loading={e.busy} disabled={email === account.email}>Update email</Button>
        </form>
      </Card>

      <Card className="mt-3 p-5">
        <h2 className="font-semibold">Password</h2>
        <form className="mt-4 space-y-3" onSubmit={(ev) => {
          ev.preventDefault();
          if (pw !== pw2) return p.run(() => Promise.reject(new Error('Passwords do not match.')), '');
          p.run(async () => { await backend.updatePassword(pw); setPw(''); setPw2(''); }, 'Password changed.');
        }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="New password"><Input type="password" autoComplete="new-password" minLength={8} required value={pw} onChange={(x) => setPw(x.target.value)} /></Field>
            <Field label="Repeat password"><Input type="password" autoComplete="new-password" minLength={8} required value={pw2} onChange={(x) => setPw2(x.target.value)} /></Field>
          </div>
          {p.note}
          <Button loading={p.busy}>Change password</Button>
        </form>
      </Card>

      <Card className="mt-3 p-5">
        <h2 className="font-semibold">Account</h2>
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-white/45">UID</dt><dd>#{profile.uid}</dd>
          <dt className="text-white/45">Joined</dt><dd>{new Date(profile.createdAt).toLocaleDateString()}</dd>
          <dt className="text-white/45">Storage</dt><dd>{backend.mode === 'supabase' ? 'Supabase' : 'This browser (local mode)'}</dd>
        </dl>
      </Card>

      <Card className="mt-3 border-red-500/20 p-5">
        <h2 className="flex items-center gap-2 font-semibold text-red-400"><AlertTriangle size={16} />Delete account</h2>
        <p className="mt-1.5 text-sm text-white/50">This removes your page, links, uploads and views. It can't be undone.</p>
        <form className="mt-4 space-y-3" onSubmit={(ev) => { ev.preventDefault(); d.run(async () => { await backend.deleteAccount(); nav('/'); }, 'Account deleted.'); }}>
          <Field label={`Type ${profile.username} to confirm`}><Input value={confirm} onChange={(x) => setConfirm(x.target.value)} /></Field>
          {d.note}
          <Button variant="danger" loading={d.busy} disabled={confirm !== profile.username}>Delete my account</Button>
        </form>
      </Card>
    </div>
  );
}
