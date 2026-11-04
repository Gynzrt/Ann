import { useEffect, useState } from 'react';
import { Check, Loader2, Lock, MapPin, X } from 'lucide-react';
import { backend, validateUsername } from '@/lib/backend';
import { BADGES } from '@/lib/badges';
import { cx, hexA } from '@/lib/util';
import { Field, Input, Rows, Section, SwitchRow, Textarea } from '@/components/ui';
import { Upload } from '@/components/dashboard/Upload';
import { useDraft } from '../draft';

export function ProfileTab() {
  const { draft, saved, set, setAp } = useDraft();
  const ap = draft.appearance;
  const [avail, setAvail] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const uname = draft.username;
  const changed = uname !== saved.username;
  const unameErr = changed ? validateUsername(uname) : null;

  useEffect(() => {
    if (!changed || validateUsername(uname)) { setAvail('idle'); return; }
    setAvail('checking');
    const t = setTimeout(() => {
      backend.isUsernameAvailable(uname).then((ok) => setAvail(ok ? 'ok' : 'taken')).catch(() => setAvail('idle'));
    }, 350);
    return () => clearTimeout(t);
  }, [uname, changed]);

  const owned = new Set(draft.badges);
  const badges = [...BADGES].sort((a, b) => Number(b.selectable) - Number(a.selectable) || Number(owned.has(b.id)) - Number(owned.has(a.id)));

  return (
    <>
      <Section title="Assets" description="Images and video used on your page. Drop a file on a tile or click it.">
        <div className="grid grid-cols-2 gap-2.5">
          <Upload kind="avatar" label="Avatar" value={draft.avatarUrl} onChange={(u) => set({ avatarUrl: u })} />
          <Upload kind="banner" label="Banner" value={ap.bannerUrl} onChange={(u) => setAp({ bannerUrl: u })} />
          <Upload
            kind="background"
            label="Background"
            value={ap.backgroundUrl}
            isVideo={ap.backgroundKind === 'video'}
            onChange={(u, f) => setAp({ backgroundUrl: u, backgroundKind: f ? (f.type.startsWith('video') ? 'video' : 'image') : ap.backgroundKind })}
          />
          <Upload
            kind="cursor"
            label="Cursor"
            value={ap.cursorUrl}
            onChange={(u) => setAp((a) => ({ cursorUrl: u, cursor: u ? 'custom' : a.cursor === 'custom' ? 'default' : a.cursor }))}
          />
        </div>
        <p className="!mt-3 text-[12px] text-zinc-500">The banner appears in the Modern layout. A custom cursor replaces the pointer on your page.</p>
      </Section>

      <Section title="Details">
        <Field
          label="Username"
          error={unameErr ?? (avail === 'taken' ? 'That username is taken.' : undefined)}
          hint={changed && avail === 'ok' ? 'Available. Your old link stops working once you save.' : 'Lowercase letters, numbers, dots and underscores.'}
        >
          <Input
            prefix={`${location.host}/`}
            value={uname}
            maxLength={20}
            spellCheck={false}
            autoCapitalize="none"
            invalid={!!unameErr || avail === 'taken'}
            onChange={(e) => set({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') })}
            suffix={
              avail === 'checking' ? <Loader2 size={15} className="animate-spin text-zinc-500" />
                : avail === 'ok' ? <Check size={15} className="text-emerald-400" />
                : avail === 'taken' || unameErr ? <X size={15} className="text-red-400" />
                : null
            }
          />
        </Field>
        <Field label="Display name" aside={`${draft.displayName.length}/32`}>
          <Input value={draft.displayName} maxLength={32} onChange={(e) => set({ displayName: e.target.value })} placeholder={draft.username} />
        </Field>
        <Field label="Description">
          <Textarea value={draft.bio} maxLength={500} rows={3} showCount onChange={(e) => set({ bio: e.target.value })} placeholder="Tell visitors a little about yourself" />
        </Field>
        <Field label="Location">
          <Input icon={MapPin} value={draft.location} maxLength={60} onChange={(e) => set({ location: e.target.value })} placeholder="City, country" />
        </Field>
      </Section>

      <Section title="Badges" description="Pick the badges shown on your profile. Locked badges are awarded by halo.">
        <div className="grid grid-cols-2 gap-2">
          {badges.map((b) => {
            const on = owned.has(b.id);
            const locked = !b.selectable;
            const I = b.icon;
            return (
              <button
                key={b.id}
                type="button"
                disabled={locked}
                aria-pressed={on}
                title={b.description}
                onClick={() => set({ badges: on ? draft.badges.filter((x) => x !== b.id) : [...draft.badges, b.id] })}
                className={cx(
                  'group flex items-center gap-2.5 rounded-[11px] border p-2 text-left outline-none transition-[border-color,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-accent/50',
                  on ? 'border-accent/50 bg-accent/[.06]' : 'border-white/[.06] bg-field',
                  locked ? 'cursor-default' : !on && 'hover:border-white/[.13]',
                  locked && !on && 'opacity-45',
                )}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px]" style={{ background: hexA(b.color, 0.13), color: b.color }}>
                  <I size={15} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-zinc-200">{b.name}</span>
                  <span className="block truncate text-[11px] text-zinc-500">{locked ? (on ? 'Earned' : 'Locked') : on ? 'Shown' : 'Hidden'}</span>
                </span>
                {locked ? (
                  <Lock size={13} className="mr-1 shrink-0 text-zinc-600" />
                ) : (
                  <span className={cx('mr-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border transition', on ? 'border-accent bg-accent text-white' : 'border-white/20 text-transparent group-hover:border-white/35')}>
                    <Check size={10} strokeWidth={3.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Visibility" bodyClassName="pt-2">
        <Rows>
          <SwitchRow title="Show @username" description="Under your display name." checked={ap.showUsername} onChange={(v) => setAp({ showUsername: v })} />
          <SwitchRow title="Show badges" checked={ap.showBadges} onChange={(v) => setAp({ showBadges: v })} />
          <SwitchRow title="Show view count" checked={ap.showViews} onChange={(v) => setAp({ showViews: v })} />
        </Rows>
      </Section>
    </>
  );
}
