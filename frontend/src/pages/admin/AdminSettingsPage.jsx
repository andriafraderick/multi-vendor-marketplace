// src/pages/admin/AdminSettingsPage.jsx
import {
  Box, Typography, Grid, TextField, Divider,
  Switch, FormControlLabel, Button,
} from "@mui/material";
import { useState }  from "react";
import { useSnackbar } from "notistack";
import GlassCard     from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import SettingsIcon  from "@mui/icons-material/SettingsOutlined";
import SecurityIcon  from "@mui/icons-material/SecurityOutlined";
import PaymentIcon   from "@mui/icons-material/PaymentOutlined";
import NotificationsIcon from "@mui/icons-material/NotificationsOutlined";

export default function AdminSettingsPage() {
  const { enqueueSnackbar } = useSnackbar();

  const [commission,      setCommission]      = useState("10");
  const [minPayout,       setMinPayout]       = useState("50");
  const [autoApprove,     setAutoApprove]     = useState(false);
  const [emailReviews,    setEmailReviews]    = useState(true);
  const [emailOrders,     setEmailOrders]     = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = () => {
    enqueueSnackbar("Platform settings saved! ✅", { variant: "success" });
  };

  const Section = ({ title, icon, children }) => (
    <GlassCard hover={false} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Box sx={{ color: "#4318FF" }}>{icon}</Box>
        <Typography variant="h6" fontWeight={700}>{title}</Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />
      {children}
    </GlassCard>
  );

  const Toggle = ({ label, desc, checked, onChange }) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.05)", "&:last-child": { borderBottom: "none" } }}>
      <Box>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        {desc && <Typography variant="caption" color="text.secondary">{desc}</Typography>}
      </Box>
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        sx={{
          "& .MuiSwitch-switchBase.Mui-checked": { color: "#4318FF" },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#4318FF" },
        }}
      />
    </Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900}>Platform Settings</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Configure global marketplace settings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>

          {/* Commission */}
          <Section title="Commission & Payouts" icon={<PaymentIcon />}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Default Commission Rate (%)"
                  type="number" fullWidth
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  inputProps={{ min: 0, max: 50, step: 0.5 }}
                  helperText="Applied to new vendors unless overridden"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Minimum Payout Amount ($)"
                  type="number" fullWidth
                  value={minPayout}
                  onChange={(e) => setMinPayout(e.target.value)}
                  inputProps={{ min: 1 }}
                  helperText="Vendors cannot request below this amount"
                />
              </Grid>
            </Grid>
          </Section>

          {/* Vendor settings */}
          <Section title="Vendor Settings" icon={<SettingsIcon />}>
            <Toggle
              label="Auto-approve vendor applications"
              desc="Vendors go live immediately without manual review"
              checked={autoApprove}
              onChange={setAutoApprove}
            />
            <Toggle
              label="Require Stripe onboarding before selling"
              desc="Vendors must connect Stripe before listing products"
              checked={true}
              onChange={() => {}}
            />
            <Toggle
              label="Auto-approve products from verified vendors"
              desc="Skip moderation queue for established vendors"
              checked={false}
              onChange={() => {}}
            />
          </Section>

          {/* Notifications */}
          <Section title="Email Notifications" icon={<NotificationsIcon />}>
            <Toggle
              label="Notify admin on new vendor application"
              checked={true} onChange={() => {}}
            />
            <Toggle
              label="Notify admin on new review flagged"
              checked={emailReviews} onChange={setEmailReviews}
            />
            <Toggle
              label="Daily order summary email"
              checked={emailOrders} onChange={setEmailOrders}
            />
          </Section>

          {/* Security */}
          <Section title="Security & Maintenance" icon={<SecurityIcon />}>
            <Toggle
              label="Maintenance Mode"
              desc="Buyers cannot browse or purchase while enabled"
              checked={maintenanceMode}
              onChange={setMaintenanceMode}
            />
            <Toggle
              label="Force email verification"
              desc="Users must verify email before placing orders"
              checked={true} onChange={() => {}}
            />
          </Section>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <GradientButton onClick={handleSave} sx={{ px: 5, py: 1.5 }}>
              Save All Settings
            </GradientButton>
          </Box>
        </Grid>

        {/* Right info panel */}
        <Grid item xs={12} lg={4}>
          <GlassCard hover={false} sx={{ p: 3, position: "sticky", top: 88 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Quick Reference
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {[
              { label: "Django Admin",   link: "http://127.0.0.1:8000/admin/",          desc: "Full database admin panel" },
              { label: "API Docs",       link: "http://127.0.0.1:8000/api/v1/",         desc: "REST API root" },
              { label: "Backend Repo",   link: "#",                                      desc: "Django + DRF" },
              { label: "Frontend Repo",  link: "#",                                      desc: "React + MUI" },
            ].map(({ label, link, desc }) => (
              <Box
                key={label}
                component="a"
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: "block", py: 1.5,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  "&:last-child": { borderBottom: "none" },
                  textDecoration: "none",
                  "&:hover .link-label": { color: "#4318FF" },
                }}
              >
                <Typography className="link-label" variant="body2" fontWeight={700} sx={{ transition: "color 200ms" }}>
                  {label} →
                </Typography>
                <Typography variant="caption" color="text.secondary">{desc}</Typography>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ p: 2, borderRadius: "10px", background: "rgba(67,24,255,0.08)", border: "1px solid rgba(67,24,255,0.2)" }}>
              <Typography variant="caption" color="text.secondary">
                💡 Most settings take effect immediately. Commission rate changes only affect new orders.
              </Typography>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
}