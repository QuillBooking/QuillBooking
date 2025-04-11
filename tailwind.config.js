/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}",],
  important: true,
  theme: {
    extend: {
      colors: {
        'color-primary': '#953AE4',
        'color-secondary': '#F1E0FF',
        'color-tertiary': '#FBF9FC',
        'color-primary-text': '#292D32',
        'color-lime-green': '#B7F005' 
      },
    },
  },
  plugins: [],
}

