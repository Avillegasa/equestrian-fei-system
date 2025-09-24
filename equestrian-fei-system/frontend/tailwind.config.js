/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fei-blue': '#1e40af',
        'fei-green': '#059669',
        'fei-gold': '#f59e0b',
      }
    },
  },
  plugins: [],
}