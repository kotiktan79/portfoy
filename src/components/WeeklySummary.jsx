import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Alert
} from "@mui/material";

const getSnapshotTotal = (snap) => {
  if (!snap) return 0;
  if (typeof snap === "object" && snap.total !== undefined) return parseFloat(snap.total) || 0;
  if (Array.isArray(snap)) {
    return snap.reduce(
      (sum, item) => sum + (parseFloat(item.amount || 0) * parseFloat(item.price || 0)),
      0
    );
  }
  return 0;
};

const WeeklySummary = () => {
  const [summary, setSummary] = useState([]);
  const [totalChange, setTotalChange] = useState(0);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith("snapshot_"))
      .sort()
      .slice(-7);

    const data = keys.map(key => {
      const snap = JSON.parse(localStorage.getItem(key));
      const total = getSnapshotTotal(snap);
      return {
        date: key.replace("snapshot_", ""),
        total: parseFloat(total.toFixed(2))
      };
    });

    const processed = data.map((entry, i) => {
      const prev = data[i - 1]?.total || entry.total;
      const diff = entry.total - prev;
      const pct = prev > 0 ? (diff / prev) * 100 : 0;
      return {
        ...entry,
        change: diff.toFixed(2),
        pct: pct.toFixed(2),
        color: pct >= 0 ? "#2e7d32" : "#c62828" // canlı yeşil ve kırmızı
      };
    });

    const totalGain = processed.slice(1).reduce((sum, r) => sum + parseFloat(r.change), 0);
    setTotalChange(totalGain.toFixed(2));
    setSummary(processed);

    // Ani dalgalanma uyarısı
    const bigMoves = processed.filter((p, i) => i > 0 && Math.abs(parseFloat(p.pct)) >= 5);
    if (bigMoves.length > 0) {
      const messages = bigMoves.map(m => `⚠️ ${m.date} tarihinde %${m.pct} değişim var.`);
      setAlerts(messages);
    } else {
      setAlerts([]);
    }
  }, []);

  return (
    <Paper sx={{ mt: 3, p: 3 }}>
      <Typography variant="h6">📅 Haftalık Performans Özeti</Typography>
      <Divider sx={{ my: 2 }} />

      {alerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {alerts.map((msg, i) => <div key={i}>{msg}</div>)}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography>
          📈 7 günde toplam net değişim: {totalChange >= 0 ? `+${totalChange}` : totalChange} TL{" "}
          {summary.length > 1 && (
            <span>
              (Toplam % değişim:{" "}
              {((summary[summary.length - 1].total - summary[0].total) / summary[0].total * 100).toFixed(2)}
              %)
            </span>
          )}
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Toplam Değer (TL)</TableCell>
              <TableCell>Günlük Değişim</TableCell>
              <TableCell>Yüzde</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summary.map((row, i) => (
              <TableRow key={i}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.total.toFixed(2)}</TableCell>
                <TableCell style={{ color: row.color, fontWeight: "bold" }}>{row.change}</TableCell>
                <TableCell style={{ color: row.color, fontWeight: "bold" }}>{row.pct}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default WeeklySummary;