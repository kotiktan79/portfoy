// src/components/DailyChange.jsx (Geliştirilmiş sürüm – grafik, uyarı, analiz, export eklendi)
import React, { useEffect, useState } from "react";
import {
  Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Alert, Button
} from "@mui/material";
import { getAllSnapshots } from "../utils/snapshot";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer
} from "recharts";

const DailyChange = () => {
  const [snapshots, setSnapshots] = useState([]);
  const [volatileDays, setVolatileDays] = useState([]);
  const [biggestGain, setBiggestGain] = useState(null);
  const [biggestLoss, setBiggestLoss] = useState(null);

  useEffect(() => {
    const data = getAllSnapshots();
    setSnapshots(data);

    let maxPct = -Infinity;
    let minPct = Infinity;
    let maxSnap = null;
    let minSnap = null;
    const volDays = [];

    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      const change = curr.total - prev.total;
      const pct = (change / prev.total) * 100;

      if (Math.abs(pct) > 10) {
        volDays.push({ date: curr.date, pct: pct.toFixed(2) });
      }
      if (pct > maxPct) {
        maxPct = pct;
        maxSnap = { date: curr.date, pct };
      }
      if (pct < minPct) {
        minPct = pct;
        minSnap = { date: curr.date, pct };
      }
    }

    setVolatileDays(volDays);
    setBiggestGain(maxSnap);
    setBiggestLoss(minSnap);
  }, []);

  const handleExport = () => {
    const csv = ["Tarih,Toplam,Değişim %,Değişim TL"];
    snapshots.forEach((snap, i) => {
      const prev = i > 0 ? snapshots[i - 1] : null;
      const change = prev ? snap.total - prev.total : 0;
      const pct = prev ? (change / prev.total) * 100 : 0;
      csv.push(`${snap.date},${snap.total},${pct.toFixed(2)},${change.toFixed(2)}`);
    });
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gunluk_degisim.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Paper sx={{ mt: 3, p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>📅 Günlük Portföy Değişim Tablosu</Typography>

      {volatileDays.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⚠️ Aşırı oynaklık yaşanan günler: {volatileDays.map(d => `${d.date} (%${d.pct})`).join(" • ")}
        </Alert>
      )}

      {(biggestGain || biggestLoss) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          📈 En yüksek artış: {biggestGain?.date} (%{biggestGain?.pct.toFixed(2)}) &nbsp;&nbsp;|
          📉 En büyük düşüş: {biggestLoss?.date} (%{biggestLoss?.pct.toFixed(2)})
        </Alert>
      )}

      <Button variant="outlined" sx={{ mb: 2 }} onClick={handleExport}>⬇️ CSV olarak indir</Button>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Portföy Değeri (TL)</TableCell>
              <TableCell>Değişim (%)</TableCell>
              <TableCell>Değişim (TL)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {snapshots.map((snap, i) => {
              const prev = i > 0 ? snapshots[i - 1] : null;
              const change = prev ? snap.total - prev.total : 0;
              const pct = prev ? (change / prev.total) * 100 : 0;
              return (
                <TableRow key={snap.date}>
                  <TableCell>{snap.date}</TableCell>
                  <TableCell>{snap.total.toLocaleString()}</TableCell>
                  <TableCell style={{ color: pct >= 0 ? "green" : "red" }}>
                    {prev ? pct.toFixed(2) + "%" : "-"}
                  </TableCell>
                  <TableCell style={{ color: change >= 0 ? "green" : "red" }}>
                    {prev ? change.toFixed(2) : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ height: 250, mt: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={snapshots}>
            <XAxis dataKey="date" />
            <YAxis />
            <ReTooltip formatter={(v) => `${v.toLocaleString()} TL`} />
            <Line type="monotone" dataKey="total" stroke="#1976d2" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default DailyChange;