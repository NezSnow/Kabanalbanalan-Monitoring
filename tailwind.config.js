/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#D4AF37',
        brand:   '#D4AF37',
        secondary: '#991B1B',
        danger:    '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        custom: '8px',
      },
    },
  },
  plugins: [],
}
