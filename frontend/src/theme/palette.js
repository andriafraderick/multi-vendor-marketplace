// src/theme/palette.js
const palette = {
  mode: "dark",

  primary: {
    main:        "#4318FF",
    light:       "#6B4FFF",
    dark:        "#2D0ECC",
    contrastText: "#ffffff",
  },

  secondary: {
    main:        "#0075FF",
    light:       "#3395FF",
    dark:        "#0055CC",
    contrastText: "#ffffff",
  },

  error: {
    main:  "#F44336",
    light: "#EF5350",
    dark:  "#C62828",
  },

  warning: {
    main:  "#FF9800",
    light: "#FFB74D",
    dark:  "#E65100",
  },

  success: {
    main:  "#4CAF50",
    light: "#81C784",
    dark:  "#2E7D32",
  },

  info: {
    main:  "#0075FF",
    light: "#3395FF",
    dark:  "#0055CC",
  },

  background: {
    default: "#0f0c29",
    paper:   "rgba(255, 255, 255, 0.05)",
  },

  text: {
    primary:   "#ffffff",
    secondary: "rgba(255, 255, 255, 0.6)",
    disabled:  "rgba(255, 255, 255, 0.35)",
  },

  divider: "rgba(255, 255, 255, 0.10)",

  action: {
    hover:           "rgba(255, 255, 255, 0.06)",
    selected:        "rgba(67, 24, 255, 0.16)",
    disabledBackground: "rgba(255, 255, 255, 0.08)",
    focus:           "rgba(67, 24, 255, 0.20)",
  },
};

export default palette;