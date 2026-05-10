import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        museum: {
          ink: "#1a1a2e",
          paper: "#f4f1ea",
          accent: "#c45c26",
          muted: "#6b7280",
        },
      },
    },
  },
  plugins: [],
};
export default config;
