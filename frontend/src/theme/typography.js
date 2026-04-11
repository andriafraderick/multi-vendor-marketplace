// src/theme/typography.js
const typography = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  fontWeightLight:   300,
  fontWeightRegular: 400,
  fontWeightMedium:  500,
  fontWeightBold:    700,

  h1: { fontSize: "2.5rem",  fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em" },
  h2: { fontSize: "2rem",    fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.015em" },
  h3: { fontSize: "1.5rem",  fontWeight: 700, lineHeight: 1.3,  letterSpacing: "-0.01em" },
  h4: { fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.4 },
  h5: { fontSize: "1rem",    fontWeight: 600, lineHeight: 1.5 },
  h6: { fontSize: "0.875rem",fontWeight: 600, lineHeight: 1.5 },

  subtitle1: { fontSize: "1rem",    fontWeight: 500, lineHeight: 1.6 },
  subtitle2: { fontSize: "0.875rem",fontWeight: 500, lineHeight: 1.57 },

  body1: { fontSize: "1rem",    fontWeight: 400, lineHeight: 1.6 },
  body2: { fontSize: "0.875rem",fontWeight: 400, lineHeight: 1.57 },

  button: {
    fontSize:      "0.875rem",
    fontWeight:    600,
    letterSpacing: "0.02em",
    textTransform: "none",
  },

  caption:   { fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.66 },
  overline:  { fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" },
};

export default typography;