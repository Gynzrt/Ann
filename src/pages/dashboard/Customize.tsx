import { useEffect, useMemo, useState } from 'react';
import { Monitor, Plus, RotateCcw, Smartphone, Trash2, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { backend } from '@/lib/backend';
import type { Appearance, Profile } from '@/lib/types';
import { DEFAULT_APPEARANCE } from '@/lib/types';
import { BADGES } from '@/lib/badges';
import { LAYOUT_INFO } from '@/components/profile/Layouts';
import { ProfileView } from '@/components/profile/ProfileView';
import { Upload } from '@/components/dashboard/Upload';
import { Button, Card, ColorInput, Field, Input, Segmented, Select, Slider, Textarea, Toggle } from '@/components/ui';
import { cx } from '@/lib/util';

const TABS = ['Profile', 'Layout', 'Colors', 'Effects', 'Audio', 'Widgets'] as const;
type Tab = (typeof TABS)[number];

const FONTS = ['Inter', 'Poppins', 'Space Grotesk', 'JetBrains Mono', 'Playfair Display', 'Press Start 2P'] as const;

export default function Customize() {
  const { profile, setProfile } = useAuth();
  const [draft, setDraft] = useState<Profile | null>(profile);
  const [tab, setTab] = useState<Tab>('Profile');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [replay, setReplay] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { if (profile && !draft) setDraft(profile); }, [profile, draft]);

  const dirty = useMemo(() => {
    if (!draft || !profile) return false;
    const pick = (p: Profile) => JSON.stringify([p.username, p.displayName, p.bio, p.location, p.avatarUrl, p.badges, p.appearance]);
    return pick(draft) !== pick(profile);
  }, [draft, profile]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!draft || !profile) return null;
  const ap = draft.appearance;
  const set = (patch: Partial<Profile>) => setDraft({ ...draft, ...patch });
  const setAp = (patch: Partial<Appearance>) => setDraft({ ...draft, appearance: { ...ap, ...patch } });

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const own = BADGES.filter((b) => b.selectable).map((b) => b.id);
      // Only user-selectable badges are sent; system badges stay as they are.
      const badges = [...profile.badges.filter((b) => !own.includes(b)), ...draft.badges.filter((b) => own.includes(b))];
      const next = await backend.updateProfile({
        username: draft.username !== profile.username ? draft.username : undefined,
        displayName: draft.displayName.slice(0, 32),
        bio: draft.bio.slice(0, 500),
        location: draft.location.slice(0, 60),
        avatarUrl: draft.avatarUrl,
        badges,
        appearance: ap,
      });
      setProfile(next);
      setDraft(next);
      setMsg({ ok: true, text: 'Saved' });
      setTimeout(() => setMsg(null), 1800);
    } catch (x) {
      setMsg({ ok: false, text: (x as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const preview = (
    <div className={cx('relative mx-auto overflow-hidden rounded-2xl border border-white/[.08] transition-all duration-300', device === 'mobile' ? 'h-[680px] w-[340px]' : 'h-[680px] w-full')}>
      <ProfileView p={draft} preview replayKey={replay} />
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold">Customize</h1>
          <p className="mt-1 text-sm text-white/45">Changes show in the preview right away. Save to publish them.</p>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className={cx('text-sm', msg.ok ? 'text-emerald-400' : 'text-red-400')} role="status">{msg.text}</span>}
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} className="xl:hidden"><Eye size={15} />{showPreview ? 'Editor' : 'Preview'}</Button>
          <Button variant="secondary" disabled={!dirty} onClick={() => setDraft(profile)}>Discard</Button>
          <Button onClick={save} loading={saving} disabled={!dirty}>Save</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[440px_1fr]">
        <div className={cx(showPreview && 'hidden xl:block')}>
          <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl border border-white/[.06] bg-ink-900 p-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cx('flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition', tab === t ? 'bg-white/[.08] text-white' : 'text-white/50 hover:text-white')}>
                {t}
              </button>
            ))}
          </div>
          <Card className="space-y-5 p-5">
            {tab === 'Profile' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Upload kind="avatar" label="Avatar" round value={draft.avatarUrl} onChange={(u) => set({ avatarUrl: u })} />
                  <Upload kind="banner" label="Banner (Modern layout)" value={ap.bannerUrl} onChange={(u) => setAp({ bannerUrl: u })} />
                </div>
                <Field label="Username" hint={`${location.host}/${draft.username}`}>
                  <Input value={draft.username} maxLength={20} onChange={(e) => set({ username: e.target.value.toLowerCase() })} />
                </Field>
                <Field label="Display name"><Input value={draft.displayName} maxLength={32} onChange={(e) => set({ displayName: e.target.value })} /></Field>
                <Field label="Description" hint={`${draft.bio.length}/500`}>
                  <Textarea value={draft.bio} maxLength={500} onChange={(e) => set({ bio: e.target.value })} placeholder="Tell people about yourself" />
                </Field>
                <Field label="Location"><Input value={draft.location} maxLength={60} onChange={(e) => set({ location: e.target.value })} placeholder="City, country" /></Field>
                <div>
                  <span className="mb-2 block text-[13px] font-medium text-white/80">Badges</span>
                  <div className="grid grid-cols-2 gap-2">
                    {BADGES.map((b) => {
                      const on = draft.badges.includes(b.id);
                      const locked = !b.selectable;
                      return (
                        <button key={b.id} type="button" disabled={locked} title={locked ? (on ? 'Granted by halo' : 'Earned, not selectable') : b.description}
                          onClick={() => set({ badges: on ? draft.badges.filter((x) => x !== b.id) : [...draft.badges, b.id] })}
                          className={cx('flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[13px] transition',
                            on ? 'border-brand-500/50 bg-brand-500/10' : 'border-white/[.06] bg-ink-850', locked ? 'cursor-not-allowed' : 'hover:border-white/20', locked && !on && 'opacity-40')}>
                          <b.icon size={15} style={{ color: b.color }} /> {b.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Toggle label="Show badges" checked={ap.showBadges} onChange={(v) => setAp({ showBadges: v })} />
                <Toggle label="Show view count" checked={ap.showViews} onChange={(v) => setAp({ showViews: v })} />
                <Field label="Browser tab title" hint="Leave empty to use @username"><Input value={ap.tabTitle} maxLength={60} onChange={(e) => setAp({ tabTitle: e.target.value })} /></Field>
              </>
            )}

            {tab === 'Layout' && (
              <>
                <div className="grid gap-2">
                  {LAYOUT_INFO.map((l) => (
                    <button key={l.id} onClick={() => setAp({ layout: l.id })}
                      className={cx('flex items-center gap-3 rounded-xl border p-3 text-left transition', ap.layout === l.id ? 'border-brand-500/60 bg-brand-500/10' : 'border-white/[.06] bg-ink-850 hover:border-white/15')}>
                      <LayoutThumb id={l.id} />
                      <span><span className="block text-sm font-semibold">{l.name}</span><span className="block text-xs text-white/45">{l.description}</span></span>
                    </button>
                  ))}
                </div>
                <Select label="Font" value={ap.font} onChange={(v) => setAp({ font: v })} options={FONTS.map((f) => ({ value: f, label: f }))} />
                {ap.layout !== 'simplistic' && (
                  <>
                    <Slider label="Card opacity" value={ap.profileOpacity} min={0} max={100} unit="%" onChange={(v) => setAp({ profileOpacity: v })} />
                    <Slider label="Card blur" value={ap.profileBlur} min={0} max={40} unit="px" onChange={(v) => setAp({ profileBlur: v })} />
                    <Slider label="Corner radius" value={ap.borderRadius} min={0} max={40} unit="px" onChange={(v) => setAp({ borderRadius: v })} />
                    <Slider label="Border width" value={ap.borderWidth} min={0} max={4} unit="px" onChange={(v) => setAp({ borderWidth: v })} />
                  </>
                )}
                <Toggle label="3D tilt" hint="The profile leans toward the mouse" checked={ap.tilt} onChange={(v) => setAp({ tilt: v })} />
                <div>
                  <span className="mb-2 block text-[13px] font-medium text-white/80">Entrance animation</span>
                  <Segmented value={ap.entrance} onChange={(v) => setAp({ entrance: v })}
                    options={[{ value: 'fade', label: 'Fade' }, { value: 'slide', label: 'Slide' }, { value: 'zoom', label: 'Zoom' }, { value: 'none', label: 'None' }]} />
                </div>
              </>
            )}

            {tab === 'Colors' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <ColorInput label="Accent" value={ap.accentColor} onChange={(v) => setAp({ accentColor: v })} />
                  <ColorInput label="Background" value={ap.backgroundColor} onChange={(v) => setAp({ backgroundColor: v })} />
                  <ColorInput label="Text" value={ap.textColor} onChange={(v) => setAp({ textColor: v })} />
                  <ColorInput label="Icons" value={ap.iconColor} onChange={(v) => setAp({ iconColor: v })} />
                  <ColorInput label="Border" value={ap.borderColor} onChange={(v) => setAp({ borderColor: v })} />
                </div>
                <Toggle label="Monochrome icons" hint="Use the icon colour instead of each brand's colour" checked={ap.monochromeIcons} onChange={(v) => setAp({ monochromeIcons: v })} />
                <div className="space-y-1 border-t border-white/[.06] pt-4">
                  <span className="block text-[13px] font-semibold text-white/80">Glow</span>
                  <Toggle label="Username" checked={ap.glowUsername} onChange={(v) => setAp({ glowUsername: v })} />
                  <Toggle label="Social icons" checked={ap.glowSocials} onChange={(v) => setAp({ glowSocials: v })} />
                  <Toggle label="Badges" checked={ap.glowBadges} onChange={(v) => setAp({ glowBadges: v })} />
                  <Slider label="Glow strength" value={ap.glowStrength} min={0} max={100} unit="%" onChange={(v) => setAp({ glowStrength: v })} />
                </div>
                <Button variant="secondary" size="sm" onClick={() => setAp({
                  accentColor: DEFAULT_APPEARANCE.accentColor, backgroundColor: DEFAULT_APPEARANCE.backgroundColor, textColor: DEFAULT_APPEARANCE.textColor,
                  iconColor: DEFAULT_APPEARANCE.iconColor, borderColor: DEFAULT_APPEARANCE.borderColor })}>
                  <RotateCcw size={14} />Reset colours
                </Button>
              </>
            )}

            {tab === 'Effects' && (
              <>
                <Upload kind="background" label="Background image or video" value={ap.backgroundUrl}
                  onChange={(u, f) => setAp({ backgroundUrl: u, backgroundKind: f?.type.startsWith('video') ? 'video' : u ? ap.backgroundKind : 'image' })} />
                {ap.backgroundUrl && <Slider label="Background dim" value={ap.backgroundDim} min={0} max={90} unit="%" onChange={(v) => setAp({ backgroundDim: v })} />}
                <Select label="Background effect" value={ap.backgroundEffect} onChange={(v) => setAp({ backgroundEffect: v })} options={[
                  { value: 'none', label: 'None' }, { value: 'particles', label: 'Particles' }, { value: 'snow', label: 'Snow' }, { value: 'rain', label: 'Rain' },
                  { value: 'stars', label: 'Twinkling stars' }, { value: 'nightfall', label: 'Shooting stars' }, { value: 'blur-orbs', label: 'Floating orbs' }]} />
                <Select label="Username effect" value={ap.usernameEffect} onChange={(v) => setAp({ usernameEffect: v })} options={[
                  { value: 'none', label: 'None' }, { value: 'glow', label: 'Pulsing glow' }, { value: 'rainbow', label: 'Rainbow' },
                  { value: 'shimmer', label: 'Shimmer' }, { value: 'sparkle', label: 'Sparkles' }, { value: 'typewriter', label: 'Typewriter' }]} />
                <div className="space-y-3 border-t border-white/[.06] pt-4">
                  <Toggle label="Typewriter description" hint="Cycles through the lines below instead of showing your description" checked={ap.typewriterBio} onChange={(v) => setAp({ typewriterBio: v })} />
                  {ap.typewriterBio && (
                    <Textarea value={ap.typewriterLines.join('\n')} placeholder={'one line per row\nlike this'}
                      onChange={(e) => setAp({ typewriterLines: e.target.value.split('\n').slice(0, 8).map((s) => s.slice(0, 100)) })} />
                  )}
                </div>
                <div className="space-y-3 border-t border-white/[.06] pt-4">
                  <Select label="Cursor" value={ap.cursor} onChange={(v) => setAp({ cursor: v })} options={[
                    { value: 'default', label: 'System default' }, { value: 'dot', label: 'Dot' }, { value: 'ring', label: 'Dot and ring' },
                    { value: 'trail', label: 'Trail' }, { value: 'custom', label: 'Custom image' }]} />
                  {ap.cursor === 'custom' && <Upload kind="cursor" label="Cursor image (32×32 PNG works best)" value={ap.cursorUrl} onChange={(u) => setAp({ cursorUrl: u })} />}
                </div>
                <div className="space-y-3 border-t border-white/[.06] pt-4">
                  <Toggle label="Click-to-enter screen" hint="Needed for music to autoplay" checked={ap.enterScreen} onChange={(v) => setAp({ enterScreen: v })} />
                  {ap.enterScreen && <Input value={ap.enterText} maxLength={40} onChange={(e) => setAp({ enterText: e.target.value })} />}
                  <Button variant="secondary" size="sm" onClick={() => setReplay(replay + 1)}><RotateCcw size={14} />Replay in preview</Button>
                </div>
              </>
            )}

            {tab === 'Audio' && <AudioTab ap={ap} setAp={setAp} />}

            {tab === 'Widgets' && (
              <>
                <Toggle label="Discord presence" hint="Shows your live status, game or Spotify track" checked={ap.showDiscord} onChange={(v) => setAp({ showDiscord: v })} />
                {ap.showDiscord && (
                  <Field label="Discord user ID" hint={<>Turn on Developer Mode in Discord, right-click yourself and choose Copy User ID. Presence comes from Lanyard, so you need to join <a className="text-brand-400 underline" href="https://discord.gg/lanyard" target="_blank" rel="noreferrer">its server</a>.</>}>
                    <Input value={ap.discordId} inputMode="numeric" onChange={(e) => setAp({ discordId: e.target.value.replace(/\D/g, '').slice(0, 21) })} placeholder="123456789012345678" />
                  </Field>
                )}
                <Toggle label="Music player" hint="Shown when you have tracks in Audio" checked={ap.showPlayer} onChange={(v) => setAp({ showPlayer: v })} />
              </>
            )}
          </Card>
        </div>

        <div className={cx('xl:sticky xl:top-6 xl:self-start', !showPreview && 'hidden xl:block')}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-white/60">Live preview</span>
            <div className="flex gap-1 rounded-lg border border-white/[.06] bg-ink-900 p-1">
              <button onClick={() => setDevice('desktop')} className={cx('rounded-md p-1.5', device === 'desktop' ? 'bg-white/10' : 'text-white/45')} aria-label="Desktop preview"><Monitor size={15} /></button>
              <button onClick={() => setDevice('mobile')} className={cx('rounded-md p-1.5', device === 'mobile' ? 'bg-white/10' : 'text-white/45')} aria-label="Mobile preview"><Smartphone size={15} /></button>
            </div>
          </div>
          {preview}
        </div>
      </div>
    </div>
  );
}

function AudioTab({ ap, setAp }: { ap: Appearance; setAp: (p: Partial<Appearance>) => void }) {
  const tracks = ap.audio;
  const update = (i: number, patch: Partial<(typeof tracks)[number]>) => setAp({ audio: tracks.map((t, n) => (n === i ? { ...t, ...patch } : t)) });
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= tracks.length) return;
    const a = [...tracks];
    [a[i], a[j]] = [a[j], a[i]];
    setAp({ audio: a });
  };
  return (
    <>
      <p className="text-xs text-white/45">Upload up to 10 tracks. Music starts when a visitor clicks the enter screen.</p>
      {tracks.map((t, i) => (
        <div key={t.id} className="space-y-3 rounded-xl border border-white/[.06] bg-ink-850 p-3">
          <div className="flex items-center gap-2">
            <Input value={t.title} maxLength={60} onChange={(e) => update(i, { title: e.target.value })} placeholder="Track title" />
            <button onClick={() => move(i, -1)} className="rounded p-1.5 text-white/40 hover:text-white" aria-label="Move up"><ChevronUp size={16} /></button>
            <button onClick={() => move(i, 1)} className="rounded p-1.5 text-white/40 hover:text-white" aria-label="Move down"><ChevronDown size={16} /></button>
            <button onClick={() => setAp({ audio: tracks.filter((_, n) => n !== i) })} className="rounded p-1.5 text-white/40 hover:text-red-400" aria-label="Remove track"><Trash2 size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Upload kind="audio" label={t.url ? 'Audio file ✓' : 'Audio file'} value={t.url} onChange={(u, f) => update(i, { url: u, title: t.title || f?.name.replace(/\.[^.]+$/, '') || '' })} />
            <Upload kind="avatar" label="Cover" value={t.cover ?? ''} onChange={(u) => update(i, { cover: u })} />
          </div>
        </div>
      ))}
      {tracks.length < 10 && (
        <Button variant="secondary" className="w-full" onClick={() => setAp({ audio: [...tracks, { id: crypto.randomUUID(), title: '', url: '' }] })}>
          <Plus size={15} />Add track
        </Button>
      )}
      <Toggle label="Shuffle" checked={ap.audioShuffle} onChange={(v) => setAp({ audioShuffle: v })} />
      <Slider label="Starting volume" value={ap.audioVolume} min={0} max={100} unit="%" onChange={(v) => setAp({ audioVolume: v })} />
    </>
  );
}

function LayoutThumb({ id }: { id: string }) {
  const b = 'bg-white/25';
  return (
    <div className="grid h-12 w-16 shrink-0 place-items-center rounded-md bg-ink-950 p-1.5">
      {id === 'default' && <div className="flex h-full w-8 flex-col items-center gap-0.5 rounded bg-white/10 p-1"><div className={`h-2 w-2 rounded-full ${b}`} /><div className={`h-0.5 w-5 ${b}`} /><div className={`h-0.5 w-4 ${b}`} /></div>}
      {id === 'modern' && <div className="h-full w-10 overflow-hidden rounded bg-white/10"><div className="h-3 bg-brand-500/60" /><div className={`-mt-1 ml-1 h-2 w-2 rounded-full ${b}`} /><div className={`ml-1 mt-0.5 h-0.5 w-5 ${b}`} /></div>}
      {id === 'simplistic' && <div className="flex flex-col items-center gap-0.5"><div className={`h-3 w-3 rounded-full ${b}`} /><div className={`h-0.5 w-6 ${b}`} /><div className="flex gap-0.5"><div className={`h-1 w-1 ${b}`} /><div className={`h-1 w-1 ${b}`} /><div className={`h-1 w-1 ${b}`} /></div></div>}
      {id === 'sleek' && <div className="flex h-full w-12 flex-col gap-0.5 rounded bg-white/10 p-1"><div className="flex gap-1"><div className={`h-2.5 w-2.5 rounded-sm ${b}`} /><div className={`mt-0.5 h-0.5 w-5 ${b}`} /></div><div className="grid grid-cols-2 gap-0.5"><div className={`h-1 ${b}`} /><div className={`h-1 ${b}`} /><div className={`h-1 ${b}`} /><div className={`h-1 ${b}`} /></div></div>}
      {id === 'portfolio' && <div className="flex h-full w-12 gap-0.5"><div className="w-4 rounded bg-white/10" /><div className="flex flex-1 flex-col gap-0.5"><div className="flex-1 rounded bg-white/10" /><div className="flex-1 rounded bg-white/10" /></div></div>}
    </div>
  );
}
