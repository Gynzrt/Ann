import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        // Surfaces, darkest to lightest.
        bg: '#08080a',
        panel: '#0b0b0e',
        card: '#0f0f12',
        field: '#131317',
        raised: '#18181d',
        accent: { DEFAULT: '#8b5cf6', hover: '#9a70ff', soft: '#a78bfa' },
        // Older names, kept so nothing breaks.
        ink: { 950: '#08080a', 900: '#0b0b0e', 850: '#131317', 800: '#18181d', 700: '#1f1f25', 600: '#2a2a31' },
        brand: { DEFAULT: '#8b5cf6', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
      },
      keyframes: {
        rainbow: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        indeterminate: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(250%)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        rainbow: 'rainbow 3s linear infinite',
        floaty: 'floaty 5s ease-in-out infinite',
        indeterminate: 'indeterminate 1.1s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [containerQueries],
};
