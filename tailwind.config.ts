import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12141C",
        paper: "#F7F7F5",
        accent: "#1d4ed8",      // Signal Blue — primary brand colour
        accentSoft: "#DBE7FB",
        warn: "#B4551F",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
