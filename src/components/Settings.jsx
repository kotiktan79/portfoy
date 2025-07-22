// src/components/Settings.jsx
import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Divider,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  TextField,
  Button,
  Snackbar,
  Alert
} from "@mui/material";

const Settings = () => {
  const [risk, setRisk] = useState("Orta");
  const [roi, setRoi] = useState(50);
  const [currency, setCurrency] = useState("TRY");
  const [enflasyon, setEnflasyon] = useState(60);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("taner_settings")) || {};
    if (stored.risk) setRisk(stored.risk);
    if (stored.roi) setRoi(stored.roi);
    if (stored.currency) setCurrency(stored.currency);
    if (stored.enflasyon) setEnflasyon(stored.enflasyon);
  }, []);

  const handleSave = () => {
    const config = { risk, roi, currency, enflasyon };
    localStorage.setItem("taner_settings", JSON.stringify(config));
    setOpen(true);
  };

  return (
    <Paper sx={{ mt: 3, p: 3 }}>
      <Typography variant="h6">⚙️ Ayarlar</Typography>
      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "grid", gap: 2, maxWidth: 300 }}>
        <FormControl fullWidth>
          <InputLabel>Risk Profili</InputLabel>
          <Select value={risk} label="Risk Profili" onChange={(e) => setRisk(e.target.value)}>
            <MenuItem value="Düşük">Düşük</MenuItem>
            <MenuItem value="Orta">Orta</MenuItem>
            <MenuItem value="Yüksek">Yüksek</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Hedef Getiri (ROI %)"
          type="number"
          value={roi}
          onChange={(e) => setRoi(parseFloat(e.target.value))}
        />

        <TextField
          label="Yıllık Enflasyon (TÜFE %)"
          type="number"
          value={enflasyon}
          onChange={(e) => setEnflasyon(parseFloat(e.target.value))}
        />

        <FormControl fullWidth>
          <InputLabel>Para Birimi</InputLabel>
          <Select value={currency} label="Para Birimi" onChange={(e) => setCurrency(e.target.value)}>
            <MenuItem value="TRY">TL</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="EUR">EUR</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleSave}>Kaydet</Button>
      </Box>

      <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)}>
        <Alert severity="success" variant="filled">Ayarlar kaydedildi</Alert>
      </Snackbar>
    </Paper>
  );
};

export default Settings;