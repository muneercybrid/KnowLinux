/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00B889',
          hover: '#00D29B',
        },
        dark: {
          bg: '#171918',
          surface: '#1D211F',
          elevated: '#242A27',
          input: '#303532',
          border: '#343B36',
          text: '#F5F5F0',
          muted: '#A3AAA5',
          faint: '#777F79',
        },
        light: {
          bg: '#FDFBF7',
          surface: '#FFFFFF',
          elevated: '#F4F4F4',
          input: '#EEEEEE',
          border: '#E0E0E0',
          text: '#171918',
          muted: '#5D5D5D',
          faint: '#888888',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
