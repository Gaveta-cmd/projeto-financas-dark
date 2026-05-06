/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#ef233c',
        dark: {
          bg: '#000000',
          surface: '#18181b', // zinc-900
          border: '#27272a', // zinc-800
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Manrope', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 4s linear infinite',
        'fade-in-slide': 'fadeSlideIn 0.8s ease-out forwards',
        'column-reveal': 'columnReveal 0.6s ease-out forwards',
      },
      keyframes: {
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        columnReveal: {
          '0%': { opacity: '0', transform: 'translateY(30px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
