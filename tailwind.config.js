/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0b", // Very dark void
        surface: "#18181b", // Zinc 900
        primary: {
          DEFAULT: "#3b82f6", // Blue 500
          glow: "#60a5fa", // Blue 400
        },
        border: "#27272a", // Zinc 800
        success: "#22c55e",
        danger: "#ef4444",
        warning: "#eab308",
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        display: ['"DM Serif Display"', 'serif'],
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(59, 130, 246, 0.5)',
        'glow-lg': '0 0 40px -10px rgba(59, 130, 246, 0.5)',
      }
    },
  },
  plugins: [],
}
