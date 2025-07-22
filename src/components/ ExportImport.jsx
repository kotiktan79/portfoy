import React from "react";
import { Paper, Typography, Button, Box } from "@mui/material";

// Haftada bir otomatik toplu yedek indir (Panel açıldığında)
function autoWeeklyExport() {
  const week = getWeekKey();
  if (!localStorage.getItem(week)) {
    exportAllSnapshots(true);
    localStorage.setItem(week, "done");
  }
}
function getWeekKey() {
  const now = new Date();
  const year = now.getFullYear();
  // Haftanın numarası
  const onejan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `weekly_export_${year}_w${week}`;
}

// Tek tıkla tüm snapshot + portföy yedeği indir
function exportAllSnapshots(silent = false) {
  const data = {};
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("snapshot_") || key === "taner_assets" || key === "updatedPrices" || key === "lastFetchedPrices") {
      data[key] = localStorage.getItem(key);
    }
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `portfoy_yedek_${new Date().toISOString().slice(0,10)}.json`;
  a.style.display = "none";
  document.body.appendChild(a);
  if (!silent) a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);
}

const ExportImport = () => {
  // Panel açılır açılmaz haftalık otomatik yedek al!
  React.useEffect(() => {
    autoWeeklyExport();
  }, []);

  // Yedekten yükle
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
        window.location.reload();
      } catch {
        alert("Yedek dosyası hatalı!");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6">Veri Yedekleme & Geri Yükleme</Typography>
      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <Button variant="contained" onClick={() => exportAllSnapshots(false)}>
          Şimdi Yedekle (Tüm geçmişi indir)
        </Button>
        <Button variant="outlined" component="label">
          Yedekten Yükle
          <input type="file" accept=".json" hidden onChange={handleImport} />
        </Button>
      </Box>
      <Typography sx={{ mt: 2 }} color="gray">
        Her gün localStorage'da otomatik snapshot tutulur. <br />
        Her hafta (panel açılınca) yedek dosyası otomatik indirilir. <br />
        “Şimdi Yedekle” ile istediğin an geçmişi tek dosyada indirebilirsin.<br />
        “Yedekten Yükle” ile verini her zaman geri getirebilirsin.
      </Typography>
    </Paper>
  );
};

export default ExportImport;