// src/components/product/ProductImageGallery.jsx
import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import ChevronLeft  from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ZoomInIcon   from "@mui/icons-material/ZoomOutMapOutlined";

export default function ProductImageGallery({ images = [] }) {
  const [active, setActive]   = useState(0);
  const [zoomed, setZoomed]   = useState(false);

  const primaryIndex = images.findIndex((i) => i.is_primary);
  const ordered      = primaryIndex > 0
    ? [images[primaryIndex], ...images.filter((_, i) => i !== primaryIndex)]
    : images;

  if (!ordered.length) {
    return (
      <Box
        sx={{
          height:       480,
          borderRadius: "20px",
          background:   "linear-gradient(135deg, rgba(67,24,255,0.1), rgba(0,117,255,0.05))",
          border:       "1px solid rgba(255,255,255,0.08)",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          color:        "rgba(255,255,255,0.2)",
          fontSize:     "5rem",
        }}
      >
        🖼️
      </Box>
    );
  }

  const current = ordered[active];

  return (
    <Box>
      {/* Main image */}
      <Box
        sx={{
          position:     "relative",
          borderRadius: "20px",
          overflow:     "hidden",
          border:       "1px solid rgba(255,255,255,0.1)",
          background:   "rgba(255,255,255,0.03)",
          mb:           1.5,
          cursor:       "zoom-in",
        }}
        onClick={() => setZoomed(!zoomed)}
      >
        <Box
          component="img"
          src={current.image}
          alt={current.alt_text || "Product image"}
          sx={{
            width:      "100%",
            height:     { xs: 300, md: 460 },
            objectFit:  "contain",
            transition: "transform 400ms cubic-bezier(0.4,0,0.2,1)",
            transform:  zoomed ? "scale(1.6)" : "scale(1)",
          }}
        />

        {/* Zoom hint */}
        <Box
          sx={{
            position:   "absolute",
            bottom:     12,
            right:      12,
            background: "rgba(15,12,41,0.7)",
            backdropFilter: "blur(8px)",
            border:     "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            p:          0.75,
            display:    "flex",
            alignItems: "center",
            opacity:    zoomed ? 0 : 0.8,
            transition: "opacity 200ms",
          }}
        >
          <ZoomInIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.6)" }} />
        </Box>

        {/* Prev / Next arrows for multi-image */}
        {ordered.length > 1 && (
          <>
            <IconButton
              onClick={(e) => { e.stopPropagation(); setActive((a) => (a - 1 + ordered.length) % ordered.length); }}
              sx={{
                position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                background: "rgba(15,12,41,0.7)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", p: 0.75,
                "&:hover": { background: "rgba(67,24,255,0.4)" },
              }}
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              onClick={(e) => { e.stopPropagation(); setActive((a) => (a + 1) % ordered.length); }}
              sx={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "rgba(15,12,41,0.7)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", p: 0.75,
                "&:hover": { background: "rgba(67,24,255,0.4)" },
              }}
            >
              <ChevronRight />
            </IconButton>
          </>
        )}
      </Box>

      {/* Thumbnails */}
      {ordered.length > 1 && (
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5 }}>
          {ordered.map((img, idx) => (
            <Box
              key={idx}
              onClick={() => setActive(idx)}
              component="img"
              src={img.image}
              alt={img.alt_text || `Thumbnail ${idx + 1}`}
              sx={{
                width:        70, height: 70, flexShrink: 0,
                borderRadius: "10px",
                objectFit:    "cover",
                cursor:       "pointer",
                border:       idx === active
                  ? "2px solid #4318FF"
                  : "2px solid rgba(255,255,255,0.1)",
                transition:   "border-color 200ms, transform 200ms, box-shadow 200ms",
                "&:hover":    {
                  borderColor: idx === active ? "#4318FF" : "rgba(255,255,255,0.3)",
                  transform:   "translateY(-2px)",
                  boxShadow:   "0 4px 12px rgba(0,0,0,0.4)",
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}