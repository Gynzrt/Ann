import type { Appearance } from './types';

export interface Template {
  id: string;
  name: string;
  tag: string;
  appearance: Partial<Appearance>;
}

/** Presets users can apply in one click. Only visual settings, never content. */
export const TEMPLATES: Template[] = [
  { id: 'void', name: 'Void', tag: 'Minimal', appearance: { layout: 'simplistic', accentColor: '#ffffff', backgroundColor: '#000000', backgroundEffect: 'stars', usernameEffect: 'none', glowUsername: false, font: 'Inter' } },
  { id: 'amethyst', name: 'Amethyst', tag: 'Glow', appearance: { layout: 'default', accentColor: '#a855f7', backgroundColor: '#0a0612', backgroundEffect: 'blur-orbs', usernameEffect: 'glow', glowUsername: true, glowSocials: true, profileOpacity: 35, profileBlur: 16 } },
  { id: 'sakura', name: 'Sakura', tag: 'Soft', appearance: { layout: 'modern', accentColor: '#f472b6', backgroundColor: '#140a10', backgroundEffect: 'particles', usernameEffect: 'sparkle', font: 'Poppins', borderRadius: 24 } },
  { id: 'terminal', name: 'Terminal', tag: 'Dev', appearance: { layout: 'sleek', accentColor: '#22c55e', backgroundColor: '#030805', textColor: '#d1fae5', iconColor: '#86efac', font: 'JetBrains Mono', backgroundEffect: 'rain', usernameEffect: 'typewriter', borderRadius: 6 } },
  { id: 'frost', name: 'Frost', tag: 'Winter', appearance: { layout: 'default', accentColor: '#7dd3fc', backgroundColor: '#06101a', backgroundEffect: 'snow', usernameEffect: 'shimmer', profileOpacity: 25, profileBlur: 20 } },
  { id: 'arcade', name: 'Arcade', tag: 'Retro', appearance: { layout: 'default', accentColor: '#facc15', backgroundColor: '#0c0a1a', font: 'Press Start 2P', backgroundEffect: 'stars', usernameEffect: 'rainbow', borderRadius: 0, borderWidth: 2, borderColor: '#facc15' } },
  { id: 'studio', name: 'Studio', tag: 'Portfolio', appearance: { layout: 'portfolio', accentColor: '#f97316', backgroundColor: '#0b0b0b', font: 'Space Grotesk', backgroundEffect: 'none', usernameEffect: 'none', glowUsername: false, monochromeIcons: true, profileOpacity: 70, profileBlur: 0 } },
  { id: 'nightfall', name: 'Nightfall', tag: 'Moody', appearance: { layout: 'sleek', accentColor: '#818cf8', backgroundColor: '#05050f', backgroundEffect: 'nightfall', usernameEffect: 'glow', font: 'Playfair Display' } },
];
