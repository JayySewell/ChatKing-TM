import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
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
        // Core ChatKing cyberpunk colors
        "cyber-blue": {
          DEFAULT: "#00F5FF",
          dark: "#00D4E0",
          light: "#CCF7FF",
        },
        "neon-green": "#00FF00",
        "neon-red": "#FF3333",
        "neon-amber": "#FFD700",
        "neon-purple": "#B366FF",
        "main-bg": "#0A0A0F",
        "secondary-bg": "#141420",
        "glass-bg": "rgba(26, 26, 46, 0.7)",
        "border-glow": "#282829",
        "text-primary": "#FAFAFA",
        "text-muted": "#A3A3A5",

        // Legacy compatibility colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        orbitron: ["Orbitron", "monospace"],
        "fira-code": ["Fira Code", "monospace"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(0, 245, 255, 0.5)",
        "neon-green": "0 0 20px rgba(0, 255, 0, 0.5)",
        "neon-amber": "0 0 20px rgba(255, 215, 0, 0.5)",
        glow: "0 0 40px rgba(0, 245, 255, 0.3)",
      },
      animation: {
        "pulse-neon": "pulse-neon 2s ease-in-out infinite alternate",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pulse-neon": {
          "0%": {
            boxShadow: "0 0 20px rgba(0, 245, 255, 0.5)",
            textShadow: "0 0 20px rgba(0, 245, 255, 0.5)",
          },
          "100%": {
            boxShadow: "0 0 40px rgba(0, 245, 255, 0.8)",
            textShadow: "0 0 40px rgba(0, 245, 255, 0.8)",
          },
        },
        glow: {
          "0%": { opacity: "0.7" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite alternate",
        glow: "glow 2s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
