/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "##314158",
        slate: {
          900: "#0f172a",
          500: "#64748b",
          200: "#e2e8f0",
        },
      },
      fontFamily: {
        sans: ["Lexend"],
      },
    },
  },
  plugins: [],
};
