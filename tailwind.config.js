/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false, // Disable Tailwind's reset to avoid conflicts with Docusaurus
  },
  content: [
    "./src/**/*.{js,jsx,ts,tsx,md,mdx}",
    "./docs/**/*.{md,mdx}",
    "./blog/**/*.{md,mdx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'], // Support Docusaurus dark mode
  theme: {
    extend: {
      colors: {
        // Spritz brand colors
        primary: {
          DEFAULT: '#FF5500',
          dark: '#e04d00',
          darker: '#d44800',
          darkest: '#ae3b00',
          light: '#ff6619',
          lighter: '#ff6f26',
          lightest: '#ff8f4d',
        },
        secondary: '#FB8D22',
        accent: {
          light: '#ffbba7',
          cream: '#fff0e0',
          green: '#004921',
        },
      },
    },
  },
  plugins: [],
};
