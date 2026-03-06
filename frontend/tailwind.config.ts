import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        kite: {
          gold: "#C4A96A",
          "gold-light": "#DBC993",
          "gold-dim": "#8B7A4E",
          "gold-faint": "rgba(196, 169, 106, 0.07)",
          bg: "#09090B",
          surface: "#111113",
          "surface-hover": "#19180F",
          border: "#1E1D18",
          "border-light": "#2A2820",
          text: "#F5F0E8",
          "text-secondary": "#9B9488",
          "text-muted": "#5C574E",
        },
      },
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
