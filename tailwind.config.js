/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        skyforce: {
          dark: '#080d1a',
          panel: '#10192e',
          accent: '#00d2ff',
          gold: '#ffd200',
          danger: '#ff3366',
        }
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        tech: ['Rajdhani', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
