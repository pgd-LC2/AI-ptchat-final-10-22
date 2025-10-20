
/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-jetbrains-mono)", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        'neon-purple': '#7C3AED',
        'neon-cyan': '#22D3EE',
        'neon-pink': '#F472B6',
        'dark-bg': {
          'start': '#0B1020',
          'via': '#0E1530',
          'end': '#00030A',
        }
      },
      boxShadow: {
        'neon-purple': '0 0 5px #7C3AED, 0 0 10px #7C3AED, 0 0 20px #7C3AED',
        'neon-cyan': '0 0 5px #22D3EE, 0 0 10px #22D3EE, 0 0 20px #22D3EE',
        'neon-pink': '0 0 5px #F472B6, 0 0 10px #F472B6, 0 0 20px #F472B6',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        }
      }
    },
  },
  plugins: [],
}
  