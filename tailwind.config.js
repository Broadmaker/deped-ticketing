/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#e8f5f1',
          100: '#c5e5da',
          200: '#8fcbba',
          300: '#5aaf98',
          400: '#2f9479',
          500: '#0B4E3D',
          600: '#094434',
          700: '#07372a',
          800: '#052a20',
          900: '#031d15',
        },
        gold: {
          400: '#FFD54F',
          500: '#FFC107',
          600: '#FFB300',
        },
      },
      fontFamily: {
        sans:  ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"DM Serif Display"', 'serif'],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        pulseRing: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(11,78,61,0.3)' },
          '50%':     { boxShadow: '0 0 0 8px rgba(11,78,61,0)' },
        },
      },
      animation: {
        fadeUp:    'fadeUp 0.45s ease both',
        slideIn:   'slideIn 0.35s ease both',
        pulseRing: 'pulseRing 2s infinite',
      },
    },
  },
  plugins: [],
}
