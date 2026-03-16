/** @type {import('tailwindcss').Config} */
export default {
  // darkMode: 'class' means dark mode is toggled by adding the class "dark"
  // to the <html> element — we control it with a button, not the OS setting
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
