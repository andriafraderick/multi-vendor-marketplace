// src/components/product/ProductFilters.jsx
import { useState, useEffect } from "react";
import {
  Box, Typography, Slider, TextField, Select,
  MenuItem, FormControl, InputLabel, Chip,
  Accordion, AccordionSummary, AccordionDetails,
  Button, Divider, Switch, FormControlLabel,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useGetCategoriesQuery } from "@/store/api/productApi";
import GlassCard from "@/components/ui/GlassCard";

const CONDITIONS = [
  { value: "",            label: "All conditions" },
  { value: "new",         label: "New" },
  { value: "used",        label: "Used" },
  { value: "refurbished", label: "Refurbished" },
];

const SORT_OPTIONS = [
  { value: "-created_at",   label: "Newest first" },
  { value: "created_at",    label: "Oldest first" },
  { value: "price",         label: "Price: Low → High" },
  { value: "-price",        label: "Price: High → Low" },
  { value: "-average_rating", label: "Top rated" },
  { value: "-total_sales",  label: "Best selling" },
];

export default function ProductFilters({ filters, onChange, onReset }) {
  const { data: categories = [] } = useGetCategoriesQuery();
  const [priceRange, setPriceRange] = useState([
    filters.min_price || 0,
    filters.max_price || 1000,
  ]);

  useEffect(() => {
    setPriceRange([filters.min_price || 0, filters.max_price || 1000]);
  }, [filters.min_price, filters.max_price]);

  const handlePriceCommit = (_, value) => {
    onChange({ min_price: value[0], max_price: value[1] });
  };

  const activeFilterCount = [
    filters.category, filters.condition,
    filters.min_price, filters.max_price,
    filters.is_featured, filters.in_stock, filters.free_shipping,
    filters.min_rating,
  ].filter(Boolean).length;

  return (
    <GlassCard hover={false} sx={{ p: 2.5, position: "sticky", top: 88 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FilterListIcon sx={{ color: "#4318FF", fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={700}>
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              sx={{
                background: "linear-gradient(135deg, #4318FF, #0075FF)",
                color: "#fff", fontWeight: 700, height: 20, fontSize: "0.7rem",
              }}
            />
          )}
        </Box>
        {activeFilterCount > 0 && (
          <Button
            size="small"
            onClick={onReset}
            sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", "&:hover": { color: "#fff" } }}
          >
            Clear all
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Sort */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1, display: "block" }}>
          Sort by
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={filters.ordering || "-created_at"}
            onChange={(e) => onChange({ ordering: e.target.value })}
            sx={{ borderRadius: "10px", fontSize: "0.875rem" }}
          >
            {SORT_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Category */}
      <Accordion
        defaultExpanded
        disableGutters
        sx={{ background: "transparent", boxShadow: "none", border: "none" }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }} />}
          sx={{ px: 0, minHeight: "36px !important", "& .MuiAccordionSummary-content": { my: "8px !important" } }}
        >
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Category
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box
              onClick={() => onChange({ category: "" })}
              sx={{
                px: 1.5, py: 0.75, borderRadius: "8px", cursor: "pointer",
                background: !filters.category ? "rgba(67,24,255,0.2)" : "transparent",
                border: !filters.category ? "1px solid rgba(67,24,255,0.4)" : "1px solid transparent",
                transition: "all 200ms",
                "&:hover": { background: "rgba(255,255,255,0.06)" },
              }}
            >
              <Typography variant="body2" fontWeight={!filters.category ? 700 : 400}>
                All categories
              </Typography>
            </Box>
            {categories.map((cat) => (
              <Box
                key={cat.id}
                onClick={() => onChange({ category: cat.slug })}
                sx={{
                  px: 1.5, py: 0.75, borderRadius: "8px", cursor: "pointer",
                  background: filters.category === cat.slug ? "rgba(67,24,255,0.2)" : "transparent",
                  border: filters.category === cat.slug ? "1px solid rgba(67,24,255,0.4)" : "1px solid transparent",
                  transition: "all 200ms",
                  "&:hover": { background: "rgba(255,255,255,0.06)" },
                }}
              >
                <Typography variant="body2" fontWeight={filters.category === cat.slug ? 700 : 400}>
                  {cat.name}
                  <Typography component="span" variant="caption" sx={{ ml: 1, color: "rgba(255,255,255,0.35)" }}>
                    ({cat.product_count})
                  </Typography>
                </Typography>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ mb: 0 }} />

      {/* Price range */}
      <Accordion
        defaultExpanded
        disableGutters
        sx={{ background: "transparent", boxShadow: "none", border: "none" }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }} />}
          sx={{ px: 0, minHeight: "36px !important", "& .MuiAccordionSummary-content": { my: "8px !important" } }}
        >
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Price Range
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0, pb: 2 }}>
          <Box sx={{ px: 1 }}>
            <Slider
              value={priceRange}
              onChange={(_, v) => setPriceRange(v)}
              onChangeCommitted={handlePriceCommit}
              min={0} max={1000} step={5}
              sx={{
                color: "#4318FF",
                "& .MuiSlider-thumb": {
                  width: 16, height: 16,
                  "&:hover": { boxShadow: "0 0 0 8px rgba(67,24,255,0.16)" },
                },
                "& .MuiSlider-track": { background: "linear-gradient(90deg, #4318FF, #0075FF)" },
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
              <Typography variant="caption" color="text.secondary">${priceRange[0]}</Typography>
              <Typography variant="caption" color="text.secondary">${priceRange[1]}</Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ mb: 0 }} />

      {/* Rating */}
      <Accordion
        disableGutters
        sx={{ background: "transparent", boxShadow: "none", border: "none" }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }} />}
          sx={{ px: 0, minHeight: "36px !important", "& .MuiAccordionSummary-content": { my: "8px !important" } }}
        >
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Min Rating
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0, pb: 2 }}>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {[4, 3, 2, 1].map((star) => (
              <Chip
                key={star}
                label={`${star}★ & up`}
                size="small"
                onClick={() => onChange({ min_rating: filters.min_rating === star ? "" : star })}
                sx={{
                  cursor: "pointer",
                  background: filters.min_rating === star
                    ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)",
                  border: filters.min_rating === star
                    ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(255,255,255,0.1)",
                  color: filters.min_rating === star ? "#F59E0B" : "rgba(255,255,255,0.65)",
                  fontWeight: filters.min_rating === star ? 700 : 400,
                  transition: "all 200ms",
                }}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ mb: 0 }} />

      {/* Condition */}
      <Accordion
        disableGutters
        sx={{ background: "transparent", boxShadow: "none", border: "none" }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }} />}
          sx={{ px: 0, minHeight: "36px !important", "& .MuiAccordionSummary-content": { my: "8px !important" } }}
        >
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Condition
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0, pb: 2 }}>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {CONDITIONS.map((c) => (
              <Chip
                key={c.value}
                label={c.label}
                size="small"
                onClick={() => onChange({ condition: c.value })}
                sx={{
                  cursor: "pointer",
                  background: filters.condition === c.value ? "rgba(67,24,255,0.2)" : "rgba(255,255,255,0.06)",
                  border: filters.condition === c.value ? "1px solid rgba(67,24,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
                  color: filters.condition === c.value ? "#fff" : "rgba(255,255,255,0.65)",
                  fontWeight: filters.condition === c.value ? 700 : 400,
                  transition: "all 200ms",
                }}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ mb: 2 }} />

      {/* Toggles */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {[
          { key: "is_featured",  label: "Featured only"  },
          { key: "in_stock",     label: "In stock only"  },
          { key: "free_shipping",label: "Free shipping"  },
        ].map(({ key, label }) => (
          <FormControlLabel
            key={key}
            control={
              <Switch
                size="small"
                checked={!!filters[key]}
                onChange={(e) => onChange({ [key]: e.target.checked || "" })}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#4318FF" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#4318FF",
                  },
                }}
              />
            }
            label={<Typography variant="body2" color="text.secondary">{label}</Typography>}
            sx={{ m: 0 }}
          />
        ))}
      </Box>
    </GlassCard>
  );
}