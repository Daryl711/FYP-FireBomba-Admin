/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#e53935',
          hover: '#d32f2f',
          light: '#fff1f2',
        },
      },
    },
  },
  plugins: [],
}
