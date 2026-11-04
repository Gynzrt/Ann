import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { Button, Card, Field, Input, PageHeader, useToast } from '@/components/ui';
import { useDraft } from './draft';

function Row({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-4 py-7 first:pt-0 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 className="text-[14px] font-semibold text-zinc-100">{title}</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { account, refresh } = useAuth();
  const { saved: profile } = useDraft();
  const toast = useToast();
  const nav = useNavigate();
  const [email, setEmail] = useState(account?.email ?? '');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState<'' | 'email' | 'password' | 'delete'>('');
  const [pwErr, setPwErr] = useState('');
  if (!account) return null;

  const run = async (kind: typeof busy, fn: () => Promise<unknown>, ok: string, desc?: string) => {
    setBusy(kind);
    try {
      await fn();
      toast({ title: ok, description: desc });
      return true;
    } catch (x) {
      toast({ tone: 'error', title: 'That didn’t work', description: (x as Error).message, duration: 5000 });
      return false;
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="Settings" description="Manage how you sign in and your account." />
      <div className="mx-auto w-full max-w-[1100px] p-3 sm:p-5 lg:p-8">
        <div className="divide-y divide-white/[.06]">
          <Row title="Email" description={backend.mode === 'supabase' ? 'We send a confirmation link to both addresses before the change takes effect.' : 'The address you log in with.'}>
            <Card className="p-5">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  run('email', async () => { await backend.updateEmail(email); await refresh(); }, backend.mode === 'supabase' ? 'Check your inbox' : 'Email updated',
                    backend.mode === 'supabase' ? 'Confirm the change from both inboxes.' : undefined);
                }}
              >
                <Field label="Email address">
                  <Input icon={Mail} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" loading={busy === 'email'} disabled={email.trim().toLowerCase() === account.email}>Update email</Button>
                </div>
              </form>
            </Card>
          </Row>

          <Row title="Password" description="Use at least 8 characters. A longer phrase is stronger than a short one with symbols.">
            <Card className="p-5">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pw !== pw2) return setPwErr('The passwords don’t match.');
                  setPwErr('');
                  run('password', async () => { await backend.updatePassword(pw); setPw(''); setPw2(''); }, 'Password changed');
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="New password">
                    <Input icon={Lock} type="password" autoComplete="new-password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} />
                  </Field>
                  <Field label="Repeat password" error={pwErr || undefined}>
                    <Input icon={Lock} type="password" autoComplete="new-password" minLength={8} required invalid={!!pwErr} value={pw2} onChange={(e) => { setPw2(e.target.value); setPwErr(''); }} />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" loading={busy === 'password'} disabled={!pw || !pw2}>Change password</Button>
                </div>
              </form>
            </Card>
          </Row>

          <Row title="Account" description="Details about your account.">
            <Card className="px-5 py-1">
              <dl className="divide-y divide-white/[.05] text-[13px]">
                {[
                  ['Username', `@${profile.username}`],
                  ['Profile ID', `#${profile.uid}`],
                  ['Joined', new Date(profile.createdAt).toLocaleDateString('en', { dateStyle: 'long' })],
                  ['Plan', 'Free'],
                  ['Storage', backend.mode === 'supabase' ? 'Supabase' : 'This browser (local mode)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-zinc-500">{k}</dt>
                    <dd className="truncate font-medium text-zinc-200">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </Row>

          <Row title="Delete account" description="Removes your page, links, uploads and views for good. This can’t be undone.">
            <Card className="border-red-500/15 p-5">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await run('delete', () => backend.deleteAccount(), 'Account deleted')) nav('/');
                }}
              >
                <div className="flex items-start gap-3 rounded-[10px] border border-red-500/15 bg-red-500/[.05] p-3 text-[12.5px] leading-relaxed text-red-200/80">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-400" />
                  <span>Your username becomes available to anyone straight away.</span>
                </div>
                <Field label={<>Type <span className="font-mono text-zinc-100">{profile.username}</span> to confirm</>}>
                  <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" spellCheck={false} />
                </Field>
                <div className="flex justify-end">
                  <Button type="submit" variant="danger" size="sm" loading={busy === 'delete'} disabled={confirm !== profile.username}>Delete my account</Button>
                </div>
              </form>
            </Card>
          </Row>
        </div>
      </div>
    </div>
  );
}
