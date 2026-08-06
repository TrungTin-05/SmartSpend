/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2F6F4E",
          dark: "#1F4E33",
          light: "#EAF6EF",
        },
      },
    },
  },
  plugins: [],
};
