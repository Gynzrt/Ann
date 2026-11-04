export type LayoutId = 'default' | 'modern' | 'simplistic' | 'sleek' | 'portfolio';

export type BackgroundEffect = 'none' | 'particles' | 'snow' | 'rain' | 'stars' | 'blur-orbs' | 'nightfall';
export type UsernameEffect = 'none' | 'glow' | 'rainbow' | 'sparkle' | 'typewriter' | 'shimmer';
export type CursorStyle = 'default' | 'dot' | 'ring' | 'trail' | 'custom';
export type Font = 'Inter' | 'Poppins' | 'Space Grotesk' | 'JetBrains Mono' | 'Playfair Display' | 'Press Start 2P';
export type Entrance = 'fade' | 'slide' | 'zoom' | 'none';

export interface Track {
  id: string;
  title: string;
  url: string;
  cover?: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  label?: string;
  position: number;
}

export interface Appearance {
  layout: LayoutId;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  iconColor: string;
  monochromeIcons: boolean;
  font: Font;
  profileOpacity: number; // 0-100
  profileBlur: number; // px 0-40
  borderRadius: number; // px
  borderWidth: number; // px
  borderColor: string;
  glowUsername: boolean;
  glowSocials: boolean;
  glowBadges: boolean;
  glowStrength: number; // 0-100
  backgroundEffect: BackgroundEffect;
  usernameEffect: UsernameEffect;
  cursor: CursorStyle;
  cursorUrl: string;
  entrance: Entrance;
  tilt: boolean;
  typewriterBio: boolean;
  typewriterLines: string[];
  enterScreen: boolean;
  enterText: string;
  showViews: boolean;
  showBadges: boolean;
  showUsername: boolean;
  backgroundUrl: string;
  backgroundKind: 'image' | 'video';
  backgroundDim: number; // 0-100
  bannerUrl: string;
  audio: Track[];
  audioShuffle: boolean;
  audioVolume: number; // 0-100
  showPlayer: boolean;
  discordId: string;
  showDiscord: boolean;
  tabTitle: string;
}

export interface Profile {
  id: string; // user id
  username: string;
  displayName: string;
  bio: string;
  location: string;
  avatarUrl: string;
  badges: string[];
  views: number;
  uid: number; // sequential public id like "#1"
  premium: boolean;
  createdAt: string;
  appearance: Appearance;
  links: SocialLink[];
}

export interface Account {
  id: string;
  email: string;
}

export const DEFAULT_APPEARANCE: Appearance = {
  layout: 'default',
  accentColor: '#8b5cf6',
  backgroundColor: '#07070a',
  textColor: '#ffffff',
  iconColor: '#ffffff',
  monochromeIcons: true,
  font: 'Inter',
  profileOpacity: 45,
  profileBlur: 14,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#ffffff14',
  glowUsername: false,
  glowSocials: false,
  glowBadges: false,
  glowStrength: 50,
  backgroundEffect: 'particles',
  usernameEffect: 'none',
  cursor: 'default',
  cursorUrl: '',
  entrance: 'fade',
  tilt: true,
  typewriterBio: false,
  typewriterLines: [],
  enterScreen: true,
  enterText: 'click to enter...',
  showViews: true,
  showBadges: true,
  showUsername: true,
  backgroundUrl: '',
  backgroundKind: 'image',
  backgroundDim: 40,
  bannerUrl: '',
  audio: [],
  audioShuffle: false,
  audioVolume: 50,
  showPlayer: true,
  discordId: '',
  showDiscord: false,
  tabTitle: '',
};

export function withDefaults(a: Partial<Appearance> | null | undefined): Appearance {
  return { ...DEFAULT_APPEARANCE, ...(a ?? {}) };
}
