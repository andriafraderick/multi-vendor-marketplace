// src/theme/index.js
import { createTheme } from "@mui/material/styles";
import palette    from "./palette.js";
import typography from "./typography.js";
import components from "./components.js";

const theme = createTheme({
  palette,
  typography,
  components,
  shape: { borderRadius: 12 },
  spacing: 8,
  shadows: [
    "none",
    "0 2px 8px rgba(0,0,0,0.30)",
    "0 4px 16px rgba(0,0,0,0.35)",
    "0 8px 24px rgba(0,0,0,0.40)",
    "0 12px 32px rgba(0,0,0,0.45)",
    "0 16px 48px rgba(0,0,0,0.50)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
    "0 20px 60px rgba(0,0,0,0.55)",
  ],
});

export default theme;