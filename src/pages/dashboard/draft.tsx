import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { backend } from '@/lib/backend';
import { useAuth } from '@/lib/auth';
import { BADGES } from '@/lib/badges';
import type { Appearance, Profile, SocialLink } from '@/lib/types';
import { useToast } from '@/components/ui';

/**
 * The dashboard edits one shared draft of the profile. Customize and Links both
 * write to it, so switching pages never loses work, and one Save (or ⌘/Ctrl+S)
 * publishes everything.
 */
interface DraftState {
  draft: Profile;
  saved: Profile;
  set: (p: Partial<Profile>) => void;
  setAp: (p: Partial<Appearance> | ((a: Appearance) => Partial<Appearance>)) => void;
  setLinks: (l: SocialLink[]) => void;
  dirty: boolean;
  dirtyProfile: boolean;
  dirtyLinks: boolean;
  saving: boolean;
  save: () => Promise<boolean>;
  discard: () => void;
  /** Changes the appearance and saves only that, right away. Returns the previous appearance. */
  applyAppearance: (patch: Partial<Appearance>) => Promise<Appearance | null>;
}

const Ctx = createContext<DraftState | null>(null);

const SELECTABLE = BADGES.filter((b) => b.selectable).map((b) => b.id);
const profileKey = (p: Profile) => JSON.stringify([p.username, p.displayName, p.bio, p.location, p.avatarUrl, p.badges, p.appearance]);
const linksKey = (p: Profile) => JSON.stringify(p.links.map((l) => [l.platform, l.url, l.label ?? '']));

export function DraftProvider({ children }: { children: ReactNode }) {
  const { profile, setProfile } = useAuth();
  const toast = useToast();
  const saved = profile!;
  const [draft, setDraft] = useState<Profile>(saved);
  const [saving, setSaving] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // A different account signed in: start over.
  useEffect(() => { setDraft(saved); }, [saved.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirtyProfile = profileKey(draft) !== profileKey(saved);
  const dirtyLinks = linksKey(draft) !== linksKey(saved);
  const dirty = dirtyProfile || dirtyLinks;

  const set = useCallback((p: Partial<Profile>) => setDraft((d) => ({ ...d, ...p })), []);
  const setAp = useCallback(
    (p: Partial<Appearance> | ((a: Appearance) => Partial<Appearance>)) =>
      setDraft((d) => ({ ...d, appearance: { ...d.appearance, ...(typeof p === 'function' ? p(d.appearance) : p) } })),
    [],
  );
  const setLinks = useCallback((links: SocialLink[]) => setDraft((d) => ({ ...d, links })), []);
  const discard = useCallback(() => setDraft(saved), [saved]);

  const save = useCallback(async () => {
    const d = draftRef.current;
    setSaving(true);
    try {
      let next = saved;
      if (profileKey(d) !== profileKey(saved)) {
        const badges = [...saved.badges.filter((b) => !SELECTABLE.includes(b)), ...d.badges.filter((b) => SELECTABLE.includes(b))];
        next = await backend.updateProfile({
          username: d.username !== saved.username ? d.username : undefined,
          displayName: d.displayName.trim().slice(0, 32) || d.username,
          bio: d.bio.slice(0, 500),
          location: d.location.trim().slice(0, 60),
          avatarUrl: d.avatarUrl,
          badges,
          appearance: d.appearance,
        });
        next = { ...next, links: saved.links };
        setProfile(next);
        setDraft((cur) => ({ ...next, links: cur.links }));
      }
      if (linksKey(d) !== linksKey(saved)) {
        const links = await backend.saveLinks(d.links);
        next = { ...next, links };
        setProfile(next);
        setDraft((cur) => ({ ...cur, links }));
      }
      toast({ title: 'Changes saved', description: 'Your page is up to date.' });
      return true;
    } catch (x) {
      toast({ tone: 'error', title: 'Couldn’t save your changes', description: (x as Error).message, duration: 5000 });
      return false;
    } finally {
      setSaving(false);
    }
  }, [saved, setProfile, toast]);

  const applyAppearance = useCallback(async (patch: Partial<Appearance>) => {
    const prev = saved.appearance;
    const appearance = { ...prev, ...patch };
    try {
      const next = await backend.updateProfile({ appearance });
      setProfile({ ...next, links: saved.links });
      setDraft((d) => ({ ...d, appearance }));
      return prev;
    } catch (x) {
      toast({ tone: 'error', title: 'Couldn’t apply that', description: (x as Error).message });
      return null;
    }
  }, [saved, setProfile, toast]);

  // ⌘/Ctrl+S saves from anywhere in the dashboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [dirty, saving, save]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [dirty]);

  const value = useMemo(
    () => ({ draft, saved, set, setAp, setLinks, dirty, dirtyProfile, dirtyLinks, saving, save, discard, applyAppearance }),
    [draft, saved, set, setAp, setLinks, dirty, dirtyProfile, dirtyLinks, saving, save, discard, applyAppearance],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDraft() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDraft outside DraftProvider');
  return c;
}
