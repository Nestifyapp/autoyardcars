import type { Config } from 'tailwindcss';

/** Design tokens. Colours are semantic so a rebrand is a token change. */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#101A18', muted: '#5A6B66' },
        yard: { 50: '#FFF4EB', 100: '#FED7AA', 500: '#F97316', 600: '#EA580C', 900: '#9A3412' },
        signal: { DEFAULT: '#FF8A1F', soft: '#FFF1E6' },
        line: '#D7E1E5',
        surface: '#F1F5F7',
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '14px' },
    },
  },
  plugins: [],
} satisfies Config;
