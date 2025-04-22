/** @type {import('tailwindcss').Config} */
import aspectRatio from "@tailwindcss/aspect-ratio";
import forms from "@tailwindcss/forms";
import colors from "tailwindcss/colors";

module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ...colors,
        primary: "#5D5CDE",
        secondary: "#6366F1",
        accent: "#818CF8",
        background: {
          light: "#FFFFFF",
          dark: "#181818",
        },
        text: {
          light: "#1F2937",
          dark: "#F9FAFB",
        },
      },
    },
  },
  plugins: [aspectRatio, forms],
};
