/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
        colors: {
            primary: '#5D5CDE',
            secondary: '#6366F1',
            accent: '#818CF8',
            background: {
                light: '#FFFFFF',
                dark: '#181818'
            },
            text: {
                light: '#1F2937',
                dark: '#F9FAFB'
            }
        }
    }
  },
  // Add the aspect ratio plugin:
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    // Add forms plugin for better default form styling
    require('@tailwindcss/forms'),
  ],
}
