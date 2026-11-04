import type { Account, Appearance, Profile, SocialLink } from '../types';
import { createLocalBackend } from './local';
import { createSupabaseBackend } from './supabase';

export interface ProfilePatch {
  username?: string;
  displayName?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  badges?: string[];
  appearance?: Appearance;
}

export interface LeaderboardEntry {
  username: string;
  displayName: string;
  avatarUrl: string;
  views: number;
  uid: number;
  badges: string[];
}

export interface Backend {
  /** 'supabase' when connected to a real project, 'local' when data lives in this browser only. */
  mode: 'supabase' | 'local';
  getAccount(): Promise<Account | null>;
  onAuthChange(cb: (a: Account | null) => void): () => void;
  signUp(email: string, password: string, username: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  updateEmail(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  deleteAccount(): Promise<void>;

  getMyProfile(): Promise<Profile | null>;
  getProfile(username: string): Promise<Profile | null>;
  isUsernameAvailable(username: string): Promise<boolean>;
  updateProfile(patch: ProfilePatch): Promise<Profile>;
  saveLinks(links: SocialLink[]): Promise<SocialLink[]>;
  /** Records one view per visitor per day; returns the new total. */
  recordView(username: string): Promise<number>;
  viewsByDay(days: number): Promise<{ day: string; views: number }[]>;
  leaderboard(limit: number): Promise<LeaderboardEntry[]>;
  /** Uploads a file and returns its public URL. */
  upload(file: File, kind: 'avatar' | 'background' | 'banner' | 'audio' | 'cursor'): Promise<string>;
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const backend: Backend = url && key ? createSupabaseBackend(url, key) : createLocalBackend();

export const USERNAME_RE = /^[a-z0-9_.]{1,20}$/;
export const RESERVED = new Set([
  'login', 'register', 'signup', 'dashboard', 'pricing', 'templates', 'leaderboard', 'help', 'api', 'admin',
  'settings', 'account', 'about', 'terms', 'privacy', 'discord', 'assets', 'static',
]);

export function validateUsername(u: string): string | null {
  if (!USERNAME_RE.test(u)) return 'Use 1–20 lowercase letters, numbers, dots or underscores.';
  if (RESERVED.has(u)) return 'That username is reserved.';
  return null;
}

export const MAX_UPLOAD: Record<string, number> = {
  avatar: 4 * 1024 * 1024,
  banner: 6 * 1024 * 1024,
  cursor: 512 * 1024,
  background: 20 * 1024 * 1024,
  audio: 15 * 1024 * 1024,
};
