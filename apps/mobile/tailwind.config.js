/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "'Space Grotesk'", 'sans-serif'],
        body: ["var(--font-body)", 'Inter', 'sans-serif'],
        mono: ["var(--font-mono)", "'Space Mono'", 'monospace'],
      },
      colors: {
        'aadda-purple': {
          DEFAULT: '#24183B',
          light: '#352454',
          dark: '#160E24',
        },
        'aadda-lime': {
          DEFAULT: '#D9FF67',
          hover: '#C7F54B',
        },
        'aadda-coral': {
          DEFAULT: '#FF786B',
          hover: '#FF5C4D',
        },
        'aadda-lavender': {
          DEFAULT: '#F4F0FF',
          dark: '#E2D9FC',
        },
      },
    },
  },
  plugins: [],
};

