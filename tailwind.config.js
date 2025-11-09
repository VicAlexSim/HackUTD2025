const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Hubot Sans", ...fontFamily.sans],
      },
      borderRadius: {
        DEFAULT: "8px",
        secondary: "4px",
        container: "12px",
      },
      boxShadow: {
        DEFAULT: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
        hover: "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
        glow: "0 0 20px rgba(100, 168, 240, 0.4)",
        "glow-lg": "0 0 40px rgba(100, 168, 240, 0.6)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#64A8F0",
          hover: "#4A86C8",
          dark: "#3A6FA8",
        },
        secondary: {
          DEFAULT: "#5A9AE0",
          hover: "#4A86C8",
          dark: "#3A6FA8",
        },
        accent: {
          DEFAULT: "#64A8F0",
          hover: "#4A86C8",
          pink: "#d4dce8",
          blue: "#64A8F0",
          cyan: "#5A9AE0",
        },
        dark: {
          DEFAULT: "#0a0a0a",
          lighter: "#1a1a2e",
          card: "#16213e",
        },
      },
      spacing: {
        "form-field": "16px",
        section: "32px",
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #64A8F0 0%, #4A86C8 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #5A9AE0 0%, #4A86C8 100%)',
        'gradient-accent': 'linear-gradient(135deg, #64A8F0 0%, #5A9AE0 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      },
    },
  },
  variants: {
    extend: {
      boxShadow: ["hover", "active"],
    },
  },
};
