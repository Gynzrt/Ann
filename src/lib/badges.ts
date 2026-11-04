import { Bug, Code2, Crown, Gem, Heart, Medal, Rocket, ShieldCheck, Sparkles, Star, Trophy, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  /** Badges users can switch on themselves; the rest are granted by the system. */
  selectable: boolean;
}

export const BADGES: Badge[] = [
  { id: 'staff', name: 'Staff', description: 'A member of the halo team', icon: ShieldCheck, color: '#60a5fa', selectable: false },
  { id: 'verified', name: 'Verified', description: 'A verified creator', icon: Star, color: '#facc15', selectable: false },
  { id: 'premium', name: 'Premium', description: 'Supports halo with Premium', icon: Gem, color: '#a78bfa', selectable: false },
  { id: 'early', name: 'Early Supporter', description: 'One of the first 100 accounts', icon: Rocket, color: '#f472b6', selectable: false },
  { id: 'bug-hunter', name: 'Bug Hunter', description: 'Reported a confirmed bug', icon: Bug, color: '#34d399', selectable: false },
  { id: 'winner', name: 'Winner', description: 'Won a community event', icon: Trophy, color: '#fbbf24', selectable: false },
  { id: 'developer', name: 'Developer', description: 'Writes code', icon: Code2, color: '#38bdf8', selectable: true },
  { id: 'creator', name: 'Creator', description: 'Makes things for the internet', icon: Sparkles, color: '#e879f9', selectable: true },
  { id: 'gamer', name: 'Gamer', description: 'Plays a lot of games', icon: Zap, color: '#4ade80', selectable: true },
  { id: 'supporter', name: 'Kind Soul', description: 'Here to help others', icon: Heart, color: '#fb7185', selectable: true },
  { id: 'og', name: 'OG', description: 'Has been around forever', icon: Crown, color: '#fcd34d', selectable: true },
  { id: 'competitor', name: 'Competitor', description: 'Likes the leaderboard', icon: Medal, color: '#f97316', selectable: true },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.id, b]));
