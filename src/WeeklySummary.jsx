// src/components/WeeklySummary.jsx
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
  Box
} from "@mui/material";

const WeeklySummary = () => {
  const [summary, setSummary] = useState([]);
  const [totalChange, setTotalChange] = useState(0);

  useEffect(() => {
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith("snapshot_"))
      .sort()
      .slice(-7);

    const data = keys.map(key => {
      const snap = JSON.parse(localStorage.getItem(key));
      const total = snap.reduce((sum, item) => sum + item.amount * item.price, 0);
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
        color: pct >= 0 ? "green" : "red"
      };
    });

    const totalGain = processed.slice(1).reduce((sum, r) => sum + parseFloat(r.change), 0);
    setTotalChange(totalGain.toFixed(2));
    setSummary(processed);
  }, []);

  return (
    <Paper sx={{ mt: 3, p: 3 }}>
      <Typography variant="h6">📅 Haftalık Performans Özeti</Typography>
      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography>
          📈 7 günde toplam net değişim: {totalChange >= 0 ? `+${totalChange}` : totalChange} TL
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
                <TableCell style={{ color: row.color }}>{row.change}</TableCell>
                <TableCell style={{ color: row.color }}>{row.pct}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default WeeklySummary;