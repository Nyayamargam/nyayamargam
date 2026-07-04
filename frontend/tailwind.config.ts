import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1B4F72',
          light: '#2E86C1',
          dark: '#154360',
        },
        accent: '#F39C12',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Telugu', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
