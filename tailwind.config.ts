import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Cores para o tema dark
        background: "#1A1A1A", // Fundo principal cinza escuro
        foreground: "#E0E0E0", // Texto principal claro
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#969696", // Texto muted cinza médio
          foreground: "#C8C8C8", // Texto muted mais claro
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "#2A2A2A", // Fundo de popover/dropdown
          foreground: "#E0E0E0", // Texto de popover/dropdown
        },
        card: {
          DEFAULT: "#2A2A2A", // Fundo do card cinza escuro
          foreground: "#E0E0E0", // Texto do card
        },
        // Paleta de cores personalizada
        yellow: {
          500: "#FFD700",
        },
        "primary-blue": {
          DEFAULT: "#00BFFF", // Deep Sky Blue
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-blue": {
          "0%, 100%": {
            transform: "scale(1)",
            "box-shadow": "0 0 0 0 rgba(0, 191, 255, 0.7)",
          },
          "50%": {
            transform: "scale(1.02)",
            "box-shadow": "0 0 0 10px rgba(0, 191, 255, 0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-blue": "pulse-blue 1.5s infinite",
      },
      textShadow: {
        "blue-glow": "0 0 8px rgba(0, 191, 255, 0.8), 0 0 15px rgba(0, 191, 255, 0.6)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    ({ addUtilities, theme }: { addUtilities: any; theme: any }) => {
      const newUtilities = {
        ".text-glow-blue": {
          "text-shadow": theme("textShadow.blue-glow"),
        },
      }
      addUtilities(newUtilities, ["responsive", "hover"])
    },
  ],
} satisfies Config

export default config
