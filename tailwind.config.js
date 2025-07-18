/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-400',
    'bg-blue-500',
  ],
  theme: {
    extend: {
      colors: {
        'test-red': '#ff0000',
        'guild-primary': '#2F4F4F', // Deep Forest Green
        'guild-secondary': '#F5E8C7', // Aged Parchment
        'guild-accent': '#B85C38',    // Burnt Orange/Rust
        'guild-neutral': '#6C757D',  // Stone Gray
        'guild-text': '#343A40',      // Dark Charcoal
        'guild-highlight': '#DAA520', // Gold
      }
    },
  },
  plugins: [],
};
