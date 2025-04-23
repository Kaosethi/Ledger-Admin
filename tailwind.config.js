// tailwind.config.js
/** @type {import('tailwindcss').Config} */
// MODIFIED: Use require for consistency with module.exports
const aspectRatio = require("@tailwindcss/aspect-ratio");
const forms = require("@tailwindcss/forms");
// MODIFIED: Removed the direct import of 'colors'. Tailwind v3 makes colors available by default.
// const colors = require("tailwindcss/colors"); // No longer needed to spread

module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // MODIFIED: Removed the spread of '...colors'.
      // Tailwind v3 includes default colors automatically.
      // We only need to define our custom extensions/overrides here.
      colors: {
        // Your custom colors remain:
        primary: "#5D5CDE",
        secondary: "#6366F1",
        accent: "#818CF8",
        background: {
          light: "#FFFFFF",
          dark: "#181818", // Example dark mode background
        },
        text: {
          light: "#1F2937", // Example light mode text
          dark: "#F9FAFB",   // Example dark mode text
        },
        // You could explicitly define replacements here if needed,
        // but simply removing the spread `...colors` is usually sufficient
        // as Tailwind v3 provides the modern defaults (`sky`, `stone`, etc.) automatically.
        // Example (likely unnecessary):
        // sky: colors.sky,
        // stone: colors.stone,
        // neutral: colors.neutral,
        // gray: colors.gray,
        // slate: colors.slate,
      },
    },
  },
  plugins: [
    // MODIFIED: Use the required variables
    aspectRatio,
    forms
  ],
};