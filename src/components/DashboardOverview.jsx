import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F", "#FFBB28"];

const parseSafe = (value) => {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
};

const DashboardOverview = () => {
  const [summary, setSummary] = useState({ total: 0, profit: 0 });
  const [distribution, setDistribution] = useState([]);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [gpt, setGpt] = useState([]);

  useEffect(() => {
    const assets = JSON.parse(localStorage.getItem("taner_assets")) || [];
    const manualPrices = JSON.parse(localStorage.getItem("updatedPrices")) || {};
    const lastFetched = JSON.parse(localStorage.getItem("lastFetchedPrices")) || {};

    let totalValue = 0;
    let totalProfit = 0;
    const typeTotals = {};

    assets.forEach(a => {
      const price = parseSafe(manualPrices[a.name.toUpperCase()] ?? lastFetched[a.name.toUpperCase()] ?? a.buyPrice);
      const buyPrice = parseSafe(a.buyPrice);
      const amount = parseSafe(a.amount);

      if (price > 0 && amount > 0) {
        totalValue += price * amount;
        totalProfit += (price - buyPrice) * amount;
        typeTotals[a.type] = (typeTotals[a.type] || 0) + price * amount;
      }
    });

    const dist = Object.entries(typeTotals).map(([type, val]) => ({
      name: type,
      value: parseFloat(val.toFixed(2))
    }));

    setDistribution(dist);

    const warnings = [];
    if (!typeTotals["Fon"]) warnings.push({ text: "⚠️ Fon bulunmuyor", severity: "warning" });
    if (!typeTotals["Döviz"]) warnings.push({ text: "⚠️ Döviz eksik", severity: "warning" });
    if (typeTotals["Kripto"] && totalValue && (typeTotals["Kripto"] / totalValue) > 0.4) {
      warnings.push({ text: "⚠️ Kripto %40'tan fazla, risk yüksek olabilir", severity: "warning" });
    }

    setSummary({ total: totalValue.toFixed(2), profit: totalProfit.toFixed(2) });
    setAlerts(warnings);

    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith("snapshot_"))
      .sort()
      .slice(-7);

    const histData = keys.map(k => {
      const snap = JSON.parse(localStorage.getItem(k));
      let t = 0;
      if (snap) {
        if (typeof snap === "object" && snap.total !== undefined) {
          t = parseSafe(snap.total);
        } else if (Array.isArray(snap)) {
          t = snap.reduce((sum, i) => sum + (parseSafe(i.amount) * parseSafe(i.price)), 0);
        }
      }
      return { name: k.replace("snapshot_", ""), value: parseFloat(t.toFixed(2)) };
    });

    setHistory(histData);

    const advice = [];
    if (typeTotals["Kripto"] && totalValue && (typeTotals["Kripto"] / totalValue) > 0.35) {
      advice.push("• Kripto fazla, azalt önerilir");
    }
    if (!typeTotals["Fon"]) {
      advice.push("• Fon eklenmesi önerilir");
    }
    if (typeTotals["Altın"] && totalValue && (typeTotals["Altın"] / totalValue) < 0.08) {
      advice.push("• Altın oranı düşük. %10 hedeflenebilir");
    }
    setGpt(advice);
  }, []);

  const getSeverityColor = (sev) => {
    switch (sev) {
      case "warning": return "#f57c00";
      case "error": return "#d32f2f";
      case "info": return "#0288d1";
      default: return "#555";
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6">📊 Dashboard – Genel Bakış</Typography>
      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography>💼 Toplam Değer: {summary.total} TL</Typography>
        <Typography>📈 Toplam Kâr/Zarar: {summary.profit} TL</Typography>
      </Box>

      <Box sx={{ height: 250, mt: 4 }}>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={distribution}
              dataKey="value"
              nameKey="name"
              label
              outerRadius={100}
            >
              {distribution.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ height: 250, mt: 4 }}>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={history}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Divider sx={{ my: 3 }}>🔔 Uyarılar</Divider>
      <List>
        {alerts.length > 0 ? alerts.map((a, i) => (
          <ListItem key={i}>
            <ListItemText
              primary={a.text}
              primaryTypographyProps={{ style: { color: getSeverityColor(a.severity), fontWeight: 600 } }}
            />
          </ListItem>
        )) : <ListItem><ListItemText primary="📘 Her şey dengede görünüyor." /></ListItem>}
      </List>

      <Divider sx={{ my: 3 }}>🧠 GPT Tavsiye</Divider>
      <List>
        {gpt.length > 0 ? gpt.map((g, i) => (
          <ListItem key={i}><ListItemText primary={g} /></ListItem>
        )) : <ListItem><ListItemText primary="Portföyün dağılımı dengeli." /></ListItem>}
      </List>
    </Paper>
  );
};

export default DashboardOverview;