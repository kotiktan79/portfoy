// src/components/ExportImport.jsx
import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Snackbar,
  Alert
} from "@mui/material";

const ExportImport = () => {
  const [open, setOpen] = useState(false);

  const handleExport = () => {
    const data = localStorage.getItem("taner_assets") || "[]";
    const blob = new Blob([data], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "portfoy_yedek.json";
    link.click();
    setOpen(true);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        localStorage.setItem("taner_assets", JSON.stringify(data));
        window.location.reload();
      } catch (err) {
        alert("Geçersiz dosya formatı.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6">💾 Portföy Yedekleme / Geri Yükleme</Typography>
      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Button variant="contained" onClick={handleExport}>📤 Portföyü Yedekle</Button>
        <Button variant="outlined" component="label">
          📥 Geri Yükle (JSON)
          <input type="file" hidden accept="application/json" onChange={handleImport} />
        </Button>
      </Box>

      <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)}>
        <Alert severity="success" variant="filled">Yedek indirildi!</Alert>
      </Snackbar>
    </Paper>
  );
};

export default ExportImport;