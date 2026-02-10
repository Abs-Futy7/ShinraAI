import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#066839", // Deep Forest Green
          50: "#f2f9f5",
          100: "#e1efe6",
          200: "#c4ddce",
          300: "#96c3ad",
          400: "#60a083",
          500: "#3d8266",
          600: "#066839", // Base
          700: "#1f523f",
          800: "#1b4235",
          900: "#17372d",
        },
        sage: {
          50: "#f4f7f4",
          100: "#e3ebe3",
          200: "#c6d8c6",
          300: "#9cb99c",
          500: "#4f7a4f",
        },
        paper: "#F9F9F7", // Alabaster/Off-white background
        surface: "#FFFFFF",
        ink: "#111311", // Deep Charcoal for text
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        serif: ["var(--font-fraunces)", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
