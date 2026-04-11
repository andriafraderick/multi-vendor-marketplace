// src/theme/components.js
// MUI component overrides — Vision UI inspired glassmorphism

const components = {

  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundImage:
          "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        minHeight: "100vh",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.2) rgba(255,255,255,0.05)",
      },
    },
  },

  // ── Paper / Card ──────────────────────────────────────────────────────────
  MuiPaper: {
    defaultProps:  { elevation: 0 },
    styleOverrides: {
      root: {
        background:       "rgba(255, 255, 255, 0.05)",
        backdropFilter:   "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border:           "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius:     "16px",
        transition:
          "transform 250ms cubic-bezier(0.4,0,0.2,1), box-shadow 250ms cubic-bezier(0.4,0,0.2,1)",
        "&:hover": {
          borderColor: "rgba(255, 255, 255, 0.18)",
        },
      },
    },
  },

  MuiCard: {
    styleOverrides: {
      root: {
        background:     "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border:         "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius:   "16px",
        transition:
          "transform 250ms cubic-bezier(0.4,0,0.2,1), box-shadow 250ms cubic-bezier(0.4,0,0.2,1), border-color 250ms",
        cursor: "pointer",
        "&:hover": {
          transform:    "translateY(-4px)",
          boxShadow:    "0 16px 48px rgba(67, 24, 255, 0.35)",
          borderColor:  "rgba(67, 24, 255, 0.4)",
        },
        "&:active, &.active": {
          transform: "scale(1.02)",
          zIndex:    10,
          boxShadow: "0 20px 60px rgba(67, 24, 255, 0.45)",
        },
      },
    },
  },

  // ── Button ────────────────────────────────────────────────────────────────
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        borderRadius: "12px",
        fontWeight:   600,
        fontSize:     "0.875rem",
        padding:      "10px 24px",
        transition:
          "transform 150ms cubic-bezier(0.4,0,0.2,1), box-shadow 150ms cubic-bezier(0.4,0,0.2,1), background 200ms",
        "&:hover": { transform: "translateY(-1px)" },
        "&:active":{ transform: "scale(0.98)" },
      },
      containedPrimary: {
        background:  "linear-gradient(135deg, #4318FF 0%, #0075FF 100%)",
        boxShadow:   "0 4px 20px rgba(67, 24, 255, 0.4)",
        "&:hover": {
          background: "linear-gradient(135deg, #5B2FFF 0%, #1A8AFF 100%)",
          boxShadow:  "0 8px 30px rgba(67, 24, 255, 0.5)",
        },
      },
      containedSecondary: {
        background: "linear-gradient(135deg, #7B2FF7 0%, #F72585 100%)",
        boxShadow:  "0 4px 20px rgba(123, 47, 247, 0.4)",
        "&:hover": {
          boxShadow: "0 8px 30px rgba(123, 47, 247, 0.55)",
        },
      },
      outlined: {
        border:       "1px solid rgba(255,255,255,0.2)",
        background:   "rgba(255,255,255,0.04)",
        backdropFilter: "blur(10px)",
        "&:hover": {
          background:  "rgba(255,255,255,0.08)",
          borderColor: "rgba(67,24,255,0.6)",
        },
      },
    },
  },

  // ── TextField ─────────────────────────────────────────────────────────────
  MuiTextField: {
    defaultProps: { variant: "outlined" },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius:   "12px",
        background:     "rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
        transition:     "box-shadow 200ms, border-color 200ms",
        "& fieldset": {
          borderColor: "rgba(255,255,255,0.15)",
          transition:  "border-color 200ms",
        },
        "&:hover fieldset": {
          borderColor: "rgba(255,255,255,0.30)",
        },
        "&.Mui-focused fieldset": {
          borderColor: "#4318FF",
          borderWidth: "2px",
        },
        "&.Mui-focused": {
          boxShadow: "0 0 0 3px rgba(67,24,255,0.20)",
        },
      },
      input: {
        color: "#fff",
        "&::placeholder": { color: "rgba(255,255,255,0.35)", opacity: 1 },
      },
    },
  },

  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: "rgba(255,255,255,0.5)",
        "&.Mui-focused": { color: "#4318FF" },
      },
    },
  },

  // ── Chip ──────────────────────────────────────────────────────────────────
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius:   "8px",
        background:     "rgba(255,255,255,0.08)",
        border:         "1px solid rgba(255,255,255,0.12)",
        color:          "rgba(255,255,255,0.85)",
        fontWeight:     500,
        transition:     "background 200ms, transform 150ms",
        "&:hover": {
          background: "rgba(255,255,255,0.14)",
          transform:  "translateY(-1px)",
        },
      },
    },
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  MuiAvatar: {
    styleOverrides: {
      root: {
        border: "2px solid rgba(255,255,255,0.15)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
      },
    },
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  MuiDivider: {
    styleOverrides: {
      root: { borderColor: "rgba(255,255,255,0.08)" },
    },
  },

  // ── Table ─────────────────────────────────────────────────────────────────
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        color:        "rgba(255,255,255,0.85)",
      },
      head: {
        background:  "rgba(255,255,255,0.04)",
        fontWeight:  600,
        fontSize:    "0.75rem",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color:       "rgba(255,255,255,0.5)",
      },
    },
  },

  // ── Menu / Select ─────────────────────────────────────────────────────────
  MuiMenu: {
    styleOverrides: {
      paper: {
        background:     "rgba(26, 23, 80, 0.95)",
        backdropFilter: "blur(20px)",
        border:         "1px solid rgba(255,255,255,0.12)",
        borderRadius:   "12px",
        boxShadow:      "0 8px 32px rgba(0,0,0,0.5)",
      },
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: "8px",
        margin:       "2px 6px",
        transition:   "background 150ms",
        "&:hover":    { background: "rgba(255,255,255,0.08)" },
        "&.Mui-selected": {
          background: "rgba(67,24,255,0.20)",
          "&:hover":  { background: "rgba(67,24,255,0.28)" },
        },
      },
    },
  },

  // ── Tooltip ───────────────────────────────────────────────────────────────
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        background:   "rgba(15,12,41,0.95)",
        border:       "1px solid rgba(255,255,255,0.12)",
        borderRadius: "8px",
        fontSize:     "0.75rem",
        padding:      "6px 12px",
        backdropFilter: "blur(10px)",
      },
    },
  },

  // ── LinearProgress ────────────────────────────────────────────────────────
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: "999px",
        background:   "rgba(255,255,255,0.08)",
        height:       6,
      },
      bar: {
        borderRadius: "999px",
        background:   "linear-gradient(90deg, #4318FF, #0075FF)",
      },
    },
  },

  // ── Drawer ────────────────────────────────────────────────────────────────
  MuiDrawer: {
    styleOverrides: {
      paper: {
        background:     "rgba(15, 12, 41, 0.97)",
        backdropFilter: "blur(20px)",
        borderRight:    "1px solid rgba(255,255,255,0.08)",
      },
    },
  },

  // ── AppBar ────────────────────────────────────────────────────────────────
  MuiAppBar: {
    styleOverrides: {
      root: {
        background:     "rgba(15, 12, 41, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom:   "1px solid rgba(255,255,255,0.08)",
        boxShadow:      "none",
      },
    },
  },

  // ── Tab ───────────────────────────────────────────────────────────────────
  MuiTab: {
    styleOverrides: {
      root: {
        fontWeight:    600,
        fontSize:      "0.875rem",
        textTransform: "none",
        color:         "rgba(255,255,255,0.5)",
        transition:    "color 200ms",
        "&.Mui-selected": { color: "#4318FF" },
      },
    },
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  MuiBadge: {
    styleOverrides: {
      badge: {
        background: "linear-gradient(135deg, #4318FF, #0075FF)",
        fontWeight: 700,
        fontSize:   "0.65rem",
      },
    },
  },

  // ── Alert ─────────────────────────────────────────────────────────────────
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius:   "12px",
        backdropFilter: "blur(10px)",
        border:         "1px solid",
      },
      standardError:   { background: "rgba(244,67,54,0.12)",  borderColor: "rgba(244,67,54,0.25)" },
      standardSuccess: { background: "rgba(76,175,80,0.12)",  borderColor: "rgba(76,175,80,0.25)" },
      standardWarning: { background: "rgba(255,152,0,0.12)",  borderColor: "rgba(255,152,0,0.25)" },
      standardInfo:    { background: "rgba(0,117,255,0.12)",  borderColor: "rgba(0,117,255,0.25)" },
    },
  },
};

export default components;