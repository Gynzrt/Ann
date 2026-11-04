/**
 * Local backend: a working implementation of the Backend interface that keeps
 * every account, profile and upload in this browser (IndexedDB). It exists so the
 * app is fully usable without a Supabase project. Data is not shared between
 * browsers, and the UI says so wherever it matters.
 */
import type { Backend, LeaderboardEntry, ProfilePatch } from './index';
import { validateUsername } from './index';
import type { Account, Profile, SocialLink } from '../types';
import { DEFAULT_APPEARANCE, withDefaults } from '../types';
import { idbGet, idbSet, idbDel, idbKeys } from './idb';

interface StoredUser {
  id: string;
  email: string;
  salt: string;
  hash: string;
}

interface DB {
  users: StoredUser[];
  profiles: Profile[];
  views: { username: string; visitor: string; day: string }[];
  nextUid: number;
}

const SESSION_KEY = 'halo.session';
const DB_KEY = 'db';

async function sha(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function uuid() {
  return crypto.randomUUID();
}

async function load(): Promise<DB> {
  const db = await idbGet<DB>(DB_KEY);
  return db ?? { users: [], profiles: [], views: [], nextUid: 1 };
}
async function save(db: DB) {
  await idbSet(DB_KEY, db);
}

function visitorId() {
  let v = '';
  try {
    v = localStorage.getItem('halo.visitor') ?? '';
    if (!v) {
      v = uuid();
      localStorage.setItem('halo.visitor', v);
    }
  } catch {
    v = 'anon';
  }
  return v;
}

const today = () => new Date().toISOString().slice(0, 10);

export function createLocalBackend(): Backend {
  const listeners = new Set<(a: Account | null) => void>();

  function sessionId(): string | null {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  }
  function setSession(id: string | null) {
    try {
      if (id) localStorage.setItem(SESSION_KEY, id);
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }
  async function account(): Promise<Account | null> {
    const id = sessionId();
    if (!id) return null;
    const db = await load();
    const u = db.users.find((x) => x.id === id);
    return u ? { id: u.id, email: u.email } : null;
  }
  async function emit() {
    const a = await account();
    listeners.forEach((l) => l(a));
  }
  async function requireUser() {
    const a = await account();
    if (!a) throw new Error('You need to be signed in.');
    return a;
  }

  const api: Backend = {
    mode: 'local',
    getAccount: account,
    onAuthChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    async signUp(email, password, username) {
      email = email.trim().toLowerCase();
      username = username.trim().toLowerCase();
      const err = validateUsername(username);
      if (err) throw new Error(err);
      if (password.length < 8) throw new Error('Password must be at least 8 characters.');
      const db = await load();
      if (db.users.some((u) => u.email === email)) throw new Error('An account with that email already exists.');
      if (db.profiles.some((p) => p.username === username)) throw new Error('That username is taken.');
      const salt = uuid();
      const id = uuid();
      db.users.push({ id, email, salt, hash: await sha(salt + password) });
      db.profiles.push({
        id,
        username,
        displayName: username,
        bio: '',
        location: '',
        avatarUrl: '',
        badges: db.nextUid <= 100 ? ['early'] : [],
        views: 0,
        uid: db.nextUid++,
        premium: false,
        createdAt: new Date().toISOString(),
        appearance: { ...DEFAULT_APPEARANCE },
        links: [],
      });
      await save(db);
      setSession(id);
      await emit();
    },
    async signIn(email, password) {
      email = email.trim().toLowerCase();
      const db = await load();
      const u = db.users.find((x) => x.email === email);
      if (!u || (await sha(u.salt + password)) !== u.hash) throw new Error('Invalid email or password.');
      setSession(u.id);
      await emit();
    },
    async signOut() {
      setSession(null);
      await emit();
    },
    async updateEmail(email) {
      const a = await requireUser();
      email = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email.');
      const db = await load();
      if (db.users.some((u) => u.email === email && u.id !== a.id)) throw new Error('That email is in use.');
      db.users = db.users.map((u) => (u.id === a.id ? { ...u, email } : u));
      await save(db);
      await emit();
    },
    async updatePassword(password) {
      const a = await requireUser();
      if (password.length < 8) throw new Error('Password must be at least 8 characters.');
      const db = await load();
      const salt = uuid();
      const hash = await sha(salt + password);
      db.users = db.users.map((u) => (u.id === a.id ? { ...u, salt, hash } : u));
      await save(db);
    },
    async deleteAccount() {
      const a = await requireUser();
      const db = await load();
      const p = db.profiles.find((x) => x.id === a.id);
      db.users = db.users.filter((u) => u.id !== a.id);
      db.profiles = db.profiles.filter((x) => x.id !== a.id);
      if (p) db.views = db.views.filter((v) => v.username !== p.username);
      await save(db);
      for (const k of await idbKeys()) if (k.startsWith(`file:${a.id}:`)) await idbDel(k);
      setSession(null);
      await emit();
    },

    async getMyProfile() {
      const a = await account();
      if (!a) return null;
      const db = await load();
      const p = db.profiles.find((x) => x.id === a.id);
      return p ? { ...p, appearance: withDefaults(p.appearance) } : null;
    },
    async getProfile(username) {
      const db = await load();
      const p = db.profiles.find((x) => x.username === username.toLowerCase());
      return p ? { ...p, appearance: withDefaults(p.appearance) } : null;
    },
    async isUsernameAvailable(username) {
      const a = await account();
      const db = await load();
      return !db.profiles.some((p) => p.username === username && p.id !== a?.id);
    },
    async updateProfile(patch: ProfilePatch) {
      const a = await requireUser();
      const db = await load();
      const i = db.profiles.findIndex((x) => x.id === a.id);
      if (i < 0) throw new Error('Profile not found.');
      if (patch.username !== undefined) {
        const u = patch.username.trim().toLowerCase();
        const err = validateUsername(u);
        if (err) throw new Error(err);
        if (db.profiles.some((p) => p.username === u && p.id !== a.id)) throw new Error('That username is taken.');
        const old = db.profiles[i].username;
        db.views = db.views.map((v) => (v.username === old ? { ...v, username: u } : v));
        patch.username = u;
      }
      const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
      db.profiles[i] = { ...db.profiles[i], ...defined };
      await save(db);
      return { ...db.profiles[i], appearance: withDefaults(db.profiles[i].appearance) };
    },
    async saveLinks(links: SocialLink[]) {
      const a = await requireUser();
      const db = await load();
      const i = db.profiles.findIndex((x) => x.id === a.id);
      const clean = links.map((l, n) => ({ ...l, id: l.id || uuid(), position: n }));
      db.profiles[i] = { ...db.profiles[i], links: clean };
      await save(db);
      return clean;
    },
    async recordView(username) {
      const db = await load();
      const p = db.profiles.find((x) => x.username === username);
      if (!p) return 0;
      const visitor = visitorId();
      const day = today();
      if (!db.views.some((v) => v.username === username && v.visitor === visitor && v.day === day)) {
        db.views.push({ username, visitor, day });
        p.views += 1;
        await save(db);
      }
      return p.views;
    },
    async viewsByDay(days) {
      const a = await requireUser();
      const db = await load();
      const p = db.profiles.find((x) => x.id === a.id);
      const out: { day: string; views: number }[] = [];
      for (let n = days - 1; n >= 0; n--) {
        const d = new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
        out.push({ day: d, views: db.views.filter((v) => v.username === p?.username && v.day === d).length });
      }
      return out;
    },
    async leaderboard(limit) {
      const db = await load();
      return [...db.profiles]
        .sort((a, b) => b.views - a.views || a.uid - b.uid)
        .slice(0, limit)
        .map<LeaderboardEntry>((p) => ({
          username: p.username,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          views: p.views,
          uid: p.uid,
          badges: p.badges,
        }));
    },
    async upload(file, kind) {
      const a = await requireUser();
      const key = `file:${a.id}:${kind}:${uuid()}`;
      await idbSet(key, file);
      return `idb://${key}`;
    },
  };
  return api;
}
