/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in-left': 'slide-in-left 0.3s ease-out',
      },
      colors: {
        brand: {
          dark: '#0f172a',    // Dark Navy
          primary: '#f97316', // Orange 500
          accent: '#10b981',  // Emerald 500
        }
      },
    },
  },
  plugins: [],
};
