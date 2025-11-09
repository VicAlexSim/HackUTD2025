const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...fontFamily.sans],
      },
      borderRadius: {
        DEFAULT: "8px",
        secondary: "4px",
        container: "12px",
      },
      boxShadow: {
        DEFAULT: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
        hover: "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
        glow: "0 0 20px rgba(102, 126, 234, 0.4)",
        "glow-lg": "0 0 40px rgba(102, 126, 234, 0.6)",
      },
      colors: {
        primary: {
          DEFAULT: "#667eea",
          hover: "#5568d3",
          dark: "#4a5bb8",
        },
        secondary: {
          DEFAULT: "#764ba2",
          hover: "#6a3f8f",
          dark: "#5e337c",
        },
        accent: {
          DEFAULT: "#f093fb",
          hover: "#e67ff0",
          pink: "#f5576c",
          blue: "#4facfe",
          cyan: "#00f2fe",
        },
        dark: {
          DEFAULT: "#0a0a0f",
          lighter: "#1a1a2e",
          card: "#16213e",
        },
      },
      spacing: {
        "form-field": "16px",
        section: "32px",
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-accent': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
