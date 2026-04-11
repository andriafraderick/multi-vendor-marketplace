// src/components/ui/StarRating.jsx
import { Box } from "@mui/material";
import StarIcon         from "@mui/icons-material/Star";
import StarBorderIcon   from "@mui/icons-material/StarBorder";
import StarHalfIcon     from "@mui/icons-material/StarHalf";

export default function StarRating({ rating = 0, size = "small", showNumber = false }) {
  const stars = [];
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  for (let i = 0; i < full;  i++) stars.push("full");
  if (half)                        stars.push("half");
  for (let i = 0; i < empty; i++) stars.push("empty");

  const iconSx = {
    fontSize: size === "large" ? 22 : size === "medium" ? 18 : 14,
    color:    "#F59E0B",
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
      {stars.map((type, i) =>
        type === "full"  ? <StarIcon     key={i} sx={iconSx} /> :
        type === "half"  ? <StarHalfIcon key={i} sx={iconSx} /> :
                           <StarBorderIcon key={i} sx={{ ...iconSx, color: "rgba(255,255,255,0.2)" }} />
      )}
      {showNumber && (
        <Box
          component="span"
          sx={{ ml: 0.5, fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}
        >
          {Number(rating).toFixed(1)}
        </Box>
      )}
    </Box>
  );
}