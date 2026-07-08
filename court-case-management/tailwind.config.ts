import type { Config } from "tailwindcss";

// Design tokens for the Court Case Management System.
// Direction: "judicial ledger" — ink navy + brass, Fraunces display / Inter body /
// IBM Plex Mono for docket numbers and timestamps. Deliberately not the
// cream+terracotta or near-black+neon defaults.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#EEF1F6",
          100: "#D6DCE7",
          200: "#AEB9CE",
          300: "#8595B2",
          400: "#5C7093",
          500: "#3E5273",
          600: "#2C3D58",
          700: "#1E2C40",
          800: "#14213D", // primary
          900: "#0B1424",
        },
        brass: {
          50: "#FBF3E3",
          100: "#F3E0B4",
          200: "#E7C67C",
          300: "#D6AC52",
          400: "#B98B36", // accent
          500: "#96702A",
          600: "#795A22",
        },
        success: {
          50: "#E9F3EE",
          400: "#2F6B4F",
          600: "#204A37",
        },
        warning: {
          50: "#FBF1E4",
          400: "#B9791E",
          600: "#8A5A14",
        },
        danger: {
          50: "#FBEAE8",
          400: "#B3261E",
          600: "#841D17",
        },
        paper: "#F7F7F5",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
