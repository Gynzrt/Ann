/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        ink: { 950: '#07070a', 900: '#0b0b10', 850: '#101017', 800: '#14141c', 700: '#1c1c26', 600: '#262633' },
        brand: { DEFAULT: '#8b5cf6', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
      },
      boxShadow: { glow: '0 0 0 1px rgba(139,92,246,.35), 0 8px 40px -8px rgba(139,92,246,.45)' },
      keyframes: {
        rainbow: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      animation: { rainbow: 'rainbow 3s linear infinite', floaty: 'floaty 4s ease-in-out infinite' },
    },
  },
  plugins: [],
};
