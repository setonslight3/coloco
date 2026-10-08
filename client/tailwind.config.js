/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#080d1a',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155'
        },
        coloco: {
          blue: '#0284c7',
          lightBlue: '#38bdf8',
          red: '#f43f5e',
          green: '#10b981',
          brushWood: '#854d0e'
        }
      }
    },
  },
  plugins: [],
};
