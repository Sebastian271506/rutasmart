import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ruta: {
          black: "#111111",
          orange: "#F26B1D",
          deepOrange: "#C2410C",
          asphalt: "#4A4A4A",
          bone: "#F7F5F2"
        }
      },
      fontFamily: {
        heading: ["Montserrat", "Arial", "sans-serif"],
        sans: ["Inter", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
