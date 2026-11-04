export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function hexA(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export const fmt = (n: number) => new Intl.NumberFormat('en', { notation: n >= 10000 ? 'compact' : 'standard' }).format(n);

export const FONT_URLS: Record<string, string> = {
  Poppins: 'Poppins:wght@400;500;600;700',
  'Space Grotesk': 'Space+Grotesk:wght@400;500;600;700',
  'JetBrains Mono': 'JetBrains+Mono:wght@400;500;700',
  'Playfair Display': 'Playfair+Display:wght@400;600;700',
  'Press Start 2P': 'Press+Start+2P',
};

export function loadFont(font: string) {
  const spec = FONT_URLS[font];
  if (!spec || document.querySelector(`link[data-font="${font}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  l.dataset.font = font;
  document.head.appendChild(l);
}
