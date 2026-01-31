/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'theory-realism': '#8B0000',
        'theory-liberalism': '#1E90FF',
        'theory-constructivism': '#FFD700',
        'theory-english-school': '#2E8B57',
      },
    },
  },
  plugins: [],
}

