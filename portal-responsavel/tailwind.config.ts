import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta "Confiança" — azul profundo institucional + branco
        navy: {
          950: "#0B1F3A",
          900: "#122A4D",
          800: "#1B3A63",
          700: "#234A7D",
          600: "#2C5A96",
        },
        sky: {
          600: "#3E7FC4",
          500: "#4F92D9",
          400: "#75AEE6",
          100: "#E7F0FA",
          50: "#F4F8FD",
        },
        paper: "#F7F9FC",
        ink: "#152238",
        success: "#1D9A6C",
        warn: "#C77C1E",
        danger: "#C4433B",
        // Paleta "brand" — roxo corporativo da Central de Ajuda (Academicum)
        brand: {
          950: "#211A3E",
          900: "#2E2459",
          800: "#3D3178",
          700: "#4C3D97",
          600: "#5E4EB8",
          500: "#7565CE",
          100: "#EEEAFA",
          50: "#F7F5FD",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 31, 58, 0.06), 0 4px 16px rgba(11, 31, 58, 0.06)",
        nav: "0 -2px 16px rgba(11, 31, 58, 0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
