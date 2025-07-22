// src/components/SummaryPanel.jsx (Geliştirilmiş sürüm – bozulmadan geliştirme)
import React, { useEffect, useState } from "react";
import {
  Paper, Typography, Divider, Table, TableHead, TableRow, TableCell, TableBody, List, ListItem, ListItemText, Alert, Box
} from "@mui/material";
import { getCryptoPrices } from "../utils/priceService";
import { getLivePrice } from "../utils/priceUtils";
import MarketNewsTurkish from "./MarketNewsTurkish";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as ReTooltip
} from "recharts";

const getWeeklyHistory = () => {
  const keys = Object.keys(localStorage)
    .filter(k => k.startsWith("snapshot_"))
    .sort()
    .slice(-7);
  return keys.map(key => {
    const snap = JSON.parse(localStorage.getItem(key));
    return { date: key.replace("snapshot_", ""), total: snap.total ? parseFloat(snap.total) : 0 };
  });
};

const SummaryPanel = () => {
  const [assets, setAssets] = useState([]);
  const [manualPrices, setManualPrices] = useState({});
  const [lastFetchedPrices, setLastFetchedPrices] = useState({});
  const [apiPrices, setApiPrices] = useState({});
  const [risky, setRisky] = useState([]);
  const [weekly, setWeekly] = useState([]);

  useEffect(() => {
    setAssets(JSON.parse(localStorage.getItem("taner_assets")) || []);
    setManualPrices(JSON.parse(localStorage.getItem("updatedPrices")) || {});
    setLastFetchedPrices(JSON.parse(localStorage.getItem("lastFetchedPrices")) || {});
    setWeekly(getWeeklyHistory());
    getCryptoPrices().then(prices => {
      setApiPrices(prices);
      localStorage.setItem("lastFetchedPrices", JSON.stringify(prices));
      setLastFetchedPrices(prices);
    });
  }, []);

  useEffect(() => {
    const found = [];
    assets.forEach(a => {
      const p = getLivePrice(a, manualPrices, lastFetchedPrices, apiPrices);
      if (!p || !a.buyPrice) return;
      const change = ((p - a.buyPrice) / a.buyPrice) * 100;
      if (change < -15 || (a.type === "Kripto" && Math.abs(change) > 12)) {
        found.push({ name: a.name, change });
      }
    });
    setRisky(found);
  }, [assets, manualPrices, lastFetchedPrices, apiPrices]);

  const net = weekly.length > 1 ? weekly[weekly.length - 1].total - weekly[0].total : 0;
  const percent = weekly.length > 1 && weekly[0].total > 0 ? ((net / weekly[0].total) * 100).toFixed(2) : null;

  return (
    <Paper sx={{ mt: 3, p: 3, maxWidth: 1100 }}>
      <Typography variant="h6">📊 Genel Portföy Özeti & Alarm & Haber (Tek Panel)</Typography>

      <Divider sx={{ my: 2 }}>📢 Gerçek Ekonomi Haberleri</Divider>
      <MarketNewsTurkish />

      <Divider sx={{ my: 2 }}>🚨 Riskli Varlık Alarmı</Divider>
      {risky.length === 0 ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Portföyde ciddi riskli varlık yok.
        </Alert>
      ) : (
        <List>
          {risky.map((item, i) => (
            <ListItem key={i}>
              <ListItemText
                primary={`${item.name} (${item.change.toFixed(1)}%)`}
                primaryTypographyProps={{
                  style: { color: item.change < 0 ? "red" : "orange", fontWeight: 600 }
                }}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Divider sx={{ my: 2 }}>📅 Haftalık Portföy Özeti</Divider>
      <Table size="small" sx={{ maxWidth: 400, mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Tarih</TableCell>
            <TableCell>Toplam (TL)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {weekly.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2}>Henüz günlük snapshot yok!</TableCell>
            </TableRow>
          ) : (
            weekly.map((row, i) => (
              <TableRow key={i}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.total.toLocaleString()}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {weekly.length > 1 && (
        <>
          <Typography sx={{ mt: 2 }}>
            <b>Net değişim:</b> {net >= 0 ? "+" : ""}{net.toLocaleString()} TL
            {percent !== null && (
              <span style={{ marginLeft: 12, color: net >= 0 ? "green" : "red" }}>
                (%{percent})
              </span>
            )}
          </Typography>

          <Box sx={{ height: 220, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <XAxis dataKey="date" />
                <YAxis />
                <ReTooltip formatter={(v) => `${v.toLocaleString()} TL`} />
                <Bar dataKey="total" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default SummaryPanel;