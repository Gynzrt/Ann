import { createClient } from '@supabase/supabase-js';
import type { Backend, ProfilePatch } from './index';
import { validateUsername } from './index';
import type { Profile, SocialLink } from '../types';
import { withDefaults } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function toProfile(r: Row, links: Row[]): Profile {
  return {
    id: r.id,
    username: r.username,
    displayName: r.display_name,
    bio: r.bio,
    location: r.location,
    avatarUrl: r.avatar_url,
    badges: r.badges ?? [],
    views: r.views,
    uid: r.uid,
    premium: r.premium,
    createdAt: r.created_at,
    appearance: withDefaults(r.appearance),
    links: links
      .map((l) => ({ id: l.id, platform: l.platform, url: l.url, label: l.label ?? undefined, position: l.position }))
      .sort((a, b) => a.position - b.position),
  };
}

function visitorId() {
  try {
    let v = localStorage.getItem('halo.visitor');
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem('halo.visitor', v);
    }
    return v;
  } catch {
    return crypto.randomUUID();
  }
}

export function createSupabaseBackend(url: string, key: string): Backend {
  const sb = createClient(url, key);

  async function uid() {
    const { data } = await sb.auth.getUser();
    if (!data.user) throw new Error('You need to be signed in.');
    return data.user.id;
  }
  async function fetchProfile(column: 'id' | 'username', value: string) {
    const { data, error } = await sb.from('profiles').select('*, links(*)').eq(column, value).maybeSingle();
    if (error) throw error;
    return data ? toProfile(data, data.links ?? []) : null;
  }

  return {
    mode: 'supabase',
    async getAccount() {
      const { data } = await sb.auth.getUser();
      return data.user ? { id: data.user.id, email: data.user.email ?? '' } : null;
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, s) => cb(s?.user ? { id: s.user.id, email: s.user.email ?? '' } : null));
      return () => data.subscription.unsubscribe();
    },
    async signUp(email, password, username) {
      username = username.trim().toLowerCase();
      const err = validateUsername(username);
      if (err) throw new Error(err);
      const { data: ok } = await sb.rpc('username_available', { p_username: username });
      if (ok === false) throw new Error('That username is taken.');
      const { error } = await sb.auth.signUp({ email, password, options: { data: { username } } });
      if (error) throw error;
    },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signOut() {
      await sb.auth.signOut();
    },
    async updateEmail(email) {
      const { error } = await sb.auth.updateUser({ email });
      if (error) throw error;
    },
    async updatePassword(password) {
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
    },
    async deleteAccount() {
      const { error } = await sb.rpc('delete_me');
      if (error) throw error;
      await sb.auth.signOut();
    },
    async getMyProfile() {
      const { data } = await sb.auth.getUser();
      return data.user ? fetchProfile('id', data.user.id) : null;
    },
    getProfile: (username) => fetchProfile('username', username.toLowerCase()),
    async isUsernameAvailable(username) {
      const { data } = await sb.rpc('username_available', { p_username: username });
      return data !== false;
    },
    async updateProfile(patch: ProfilePatch) {
      const id = await uid();
      const row: Row = {};
      if (patch.username !== undefined) {
        const u = patch.username.trim().toLowerCase();
        const err = validateUsername(u);
        if (err) throw new Error(err);
        row.username = u;
      }
      if (patch.displayName !== undefined) row.display_name = patch.displayName;
      if (patch.bio !== undefined) row.bio = patch.bio;
      if (patch.location !== undefined) row.location = patch.location;
      if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
      if (patch.badges !== undefined) row.badges = patch.badges;
      if (patch.appearance !== undefined) row.appearance = patch.appearance;
      const { error } = await sb.from('profiles').update(row).eq('id', id);
      if (error) throw new Error(error.code === '23505' ? 'That username is taken.' : error.message);
      return (await fetchProfile('id', id))!;
    },
    async saveLinks(links: SocialLink[]) {
      const id = await uid();
      const { error: delErr } = await sb.from('links').delete().eq('user_id', id);
      if (delErr) throw delErr;
      if (!links.length) return [];
      const { data, error } = await sb
        .from('links')
        .insert(links.map((l, n) => ({ user_id: id, platform: l.platform, url: l.url, label: l.label ?? null, position: n })))
        .select();
      if (error) throw error;
      return (data ?? []).map((l) => ({ id: l.id, platform: l.platform, url: l.url, label: l.label ?? undefined, position: l.position }));
    },
    async recordView(username) {
      const { data } = await sb.rpc('record_view', { p_username: username, p_visitor: visitorId() });
      return (data as number) ?? 0;
    },
    async viewsByDay(days) {
      const id = await uid();
      const since = new Date(Date.now() - (days - 1) * 864e5).toISOString().slice(0, 10);
      const { data } = await sb.from('profile_views').select('day').eq('profile_id', id).gte('day', since);
      const out: { day: string; views: number }[] = [];
      for (let n = days - 1; n >= 0; n--) {
        const d = new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
        out.push({ day: d, views: (data ?? []).filter((r) => r.day === d).length });
      }
      return out;
    },
    async leaderboard(limit) {
      const { data } = await sb
        .from('profiles')
        .select('username, display_name, avatar_url, views, uid, badges')
        .order('views', { ascending: false })
        .limit(limit);
      return (data ?? []).map((r) => ({
        username: r.username,
        displayName: r.display_name,
        avatarUrl: r.avatar_url,
        views: r.views,
        uid: r.uid,
        badges: r.badges ?? [],
      }));
    },
    async upload(file, kind) {
      const id = await uid();
      const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
      const path = `${id}/${kind}-${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from('media').upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
    },
  };
}
