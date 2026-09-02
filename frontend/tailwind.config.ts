import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      colors: {
        brand: {
          pink: '#F1277B',
          rose: '#FF7BAC',
          green: '#73C76F',
          yellow: '#F6C453',
          cream: '#FFF7F3',
          charcoal: '#2D2E2E',
          dark: '#1A1A1A',
          soft: '#F4F1F2',
        }
      }
    },
  },
  plugins: [],
};

export default config;
