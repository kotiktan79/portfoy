import React, { useEffect, useState } from "react";
import {
  Paper, Typography, List, ListItem, ListItemText, Divider, Chip, Button, Box
} from "@mui/material";

// Snapshot toplamını güvenli hesaplayan yardımcı fonksiyon
const getSnapshotTotal = (snap) => {
  if (!snap) return 0;
  // Yeni format: { total: 12345, assets: [...] }
  if (typeof snap === "object" && snap.total !== undefined) return parseFloat(snap.total) || 0;
  // Eski format: doğrudan array
  if (Array.isArray(snap)) {
    return snap.reduce(
      (t, i) => t + (parseFloat(i.amount || 0) * parseFloat(i.price || 0)),
      0
    );
  }
  return 0;
};

const AlertSystem = () => {
  const [alerts, setAlerts] = useState([]);
  const [checkedAt, setCheckedAt] = useState(null);

  const generateAlerts = () => {
    const tips = [];
    const now = new Date();
    setCheckedAt(now.toLocaleString("tr-TR"));

    const snapshotKeys = Object.keys(localStorage)
      .filter((k) => k.startsWith("snapshot_"))
      .sort();

    if (snapshotKeys.length >= 2) {
      let prevSnap, currSnap;
      try {
        prevSnap = JSON.parse(localStorage.getItem(snapshotKeys[snapshotKeys.length - 2]));
        currSnap = JSON.parse(localStorage.getItem(snapshotKeys[snapshotKeys.length - 1]));
      } catch (e) {
        console.error("Snapshot verisi bozuk:", e);
        setAlerts([{ text: "❌ Snapshot verisi bozuk veya eksik.", type: "danger" }]);
        return;
      }

      const prevTotal = getSnapshotTotal(prevSnap);
      const currTotal = getSnapshotTotal(currSnap);

      if (prevTotal > 0) {
        const change = ((currTotal - prevTotal) / prevTotal) * 100;
        if (change <= -3) tips.push({ text: `📉 Portföy değeriniz son 24 saatte %${change.toFixed(1)} azaldı.`, type: "danger" });
        if (change >= 5) tips.push({ text: `📈 Portföyünüz son 24 saatte %${change.toFixed(1)} arttı.`, type: "success" });
      }
    }

    const assets = JSON.parse(localStorage.getItem("taner_assets")) || [];
    const types = {};
    assets.forEach((a) => {
      if (!types[a.type]) types[a.type] = 0;
      types[a.type] += 1;
    });
    if (!types["Fon"]) tips.push({ text: "⚠️ Portföyünüzde hiç yatırım fonu bulunmuyor.", type: "warning" });
    if (!types["Döviz"]) tips.push({ text: "⚠️ Portföyünüzde döviz varlığı yok. Kur dalgalanmasına karşı korumasız olabilirsiniz.", type: "warning" });

    const prices = JSON.parse(localStorage.getItem("updatedPrices")) || {};
    const kriptoOran = assets
      .filter((a) => a.type === "Kripto")
      .reduce((sum, a) => {
        const p = prices[a.name?.toUpperCase?.() || ""] || 1;
        return sum + (parseFloat(a.amount || 0) * p);
      }, 0);
    const total = assets.reduce((sum, a) => {
      const p = prices[a.name?.toUpperCase?.() || ""] || 1;
      return sum + (parseFloat(a.amount || 0) * p);
    }, 0);
    if (total > 0 && kriptoOran / total > 0.4)
      tips.push({ text: "⚠️ Kripto varlıklar toplam portföyün %40'ından fazla. Aşırı risk taşıyor olabilir.", type: "warning" });

    if (total > 0 && total < 10000)
      tips.push({ text: "💡 Portföy toplam değeri düşük. Daha fazla çeşitlendirme ile risk azaltılabilir.", type: "info" });

    setAlerts(tips);
  };

  React.useEffect(() => {
    generateAlerts();
  }, []);

  const exportAlerts = () => {
    const exportData = alerts.map(a => (typeof a === "string" ? a : a.text)).join("\n");
    const blob = new Blob([exportData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uyarilar.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getColor = (type) => {
    if (type === "danger") return "#d32f2f";
    if (type === "warning") return "#f57c00";
    if (type === "success") return "green";
    return "#555";
  };

  return (
    <Paper sx={{ mt: 3, p: 3 }}>
      <Typography variant="h6">🔔 Otomatik Uyarılar</Typography>
      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Chip label={`Son kontrol: ${checkedAt || "-"}`} size="small" variant="outlined" />
        <Box>
          <Button onClick={generateAlerts} variant="outlined" size="small" sx={{ mr: 1 }}>🔄 Yenile</Button>
          <Button onClick={exportAlerts} variant="contained" size="small">⬇️ İndir</Button>
        </Box>
      </Box>

      <List>
        {alerts.length > 0 ? (
          alerts.map((a, i) => (
            <ListItem key={i}>
              <ListItemText
                primary={typeof a === "string" ? a : a.text}
                primaryTypographyProps={{ style: { color: getColor(a.type), fontWeight: 500 } }}
              />
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText primary="Her şey normal görünüyor. 📘" />
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default AlertSystem;