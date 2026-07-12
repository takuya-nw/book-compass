import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        paper: "#fffdf7",
        ink: "#28241d",
        muted: "#70685c",
        line: "#e7dece",
        sage: "#607d6f",
        clay: "#a05f4b",
        gold: "#b8860b"
      },
      boxShadow: {
        soft: "0 14px 35px rgba(44, 37, 25, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
