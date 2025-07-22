// Charts.jsx (Tüm eski grafik fonksiyonları dahil, adam gibi tam versiyon)
import React, { useEffect, useState, useMemo } from "react";
import {
  Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, IconButton
} from "@mui/material";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { getCryptoPrices } from "../utils/priceService";
import { getLivePrice } from "../utils/priceUtils";

const TYPE_COLORS = {
  Kripto: "#82ca9d",
  Altın: "#ffc658",
  Döviz: "#8884d8",
  Fon: "#ff8042",
  Hisse: "#00C49F",
  Eurobond: "#FFBB28",
  Default: "#a355ff"
};
const COLORS = Object.values(TYPE_COLORS);
const VARLIK_TURLERI = ["Kripto", "Altın", "Döviz", "Fon", "Hisse", "Eurobond"];

const Charts = () => {
  const [data, setData] = useState([]);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("value");
  const [sortDir, setSortDir] = useState("desc");
  const [trendRange, setTrendRange] = useState(7);

  useEffect(() => {
    const load = async () => {
      const prices = await getCryptoPrices();
      const manual = JSON.parse(localStorage.getItem("updatedPrices")) || {};
      const stored = JSON.parse(localStorage.getItem("taner_assets")) || [];
      const allAssets = [];

      await Promise.all(stored.map(async (asset) => {
        const amount = parseFloat(asset.amount);
        let price = manual[asset.name.toUpperCase()] || 0;
        if (!price) {
          if (asset.type === "Altın") price = prices.GOLD;
          else if (asset.type === "Döviz") {
            const code = asset.name.toUpperCase();
            if (code === "USD") price = prices.USD;
            else if (code === "EUR") price = prices.EUR;
          } else if (asset.type === "Kripto") {
            const key = asset.name.toLowerCase();
            if (key.includes("btc")) price = prices.BTC;
            if (key.includes("eth")) price = prices.ETH;
            if (key.includes("sol")) price = prices.SOL;
            if (key.includes("link")) price = prices.LINK;
          } else if (["Hisse", "Fon"].includes(asset.type)) {
            try {
              price = await getLivePrice(asset, manual, prices);
            } catch { price = 0; }
          }
        }
        const value = price * amount;
        if (value > 0) {
          allAssets.push({
            name: asset.name,
            type: asset.type,
            value,
            label: `${asset.name} (${asset.type})`
          });
        }
      }));

      setData(allAssets);

      const keys = Object.keys(localStorage)
        .filter(k => k.startsWith("snapshot_"))
        .sort()
        .slice(-trendRange);
      const historyData = keys.map(key => {
        const snap = JSON.parse(localStorage.getItem(key));
        const total = snap.reduce((sum, item) => sum + item.amount * item.price, 0);
        return {
          name: key.replace("snapshot_", ""),
          value: parseFloat(total.toFixed(2))
        };
      });
      setHistory(historyData);
    };
    load();
  }, [trendRange]);

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const chartData = useMemo(() => {
    if (!filter) {
      const typeTotals = {};
      data.forEach((a) => {
        if (!typeTotals[a.type]) typeTotals[a.type] = 0;
        typeTotals[a.type] += a.value;
      });
      return Object.entries(typeTotals).map(([type, value]) => ({
        name: type,
        value,
        color: TYPE_COLORS[type] || TYPE_COLORS.Default
      }));
    } else {
      const filtered = data.filter(a => a.type === filter);
      return filtered.map(a => ({
        name: a.name,
        value: a.value,
        color: TYPE_COLORS[a.type] || TYPE_COLORS.Default,
        label: `${a.name} (${a.type})`
      }));
    }
  }, [data, filter]);

  const sortedChartData = useMemo(() => {
    return [...chartData].sort((a, b) => {
      let aVal = a[sortBy], bVal = b[sortBy];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [chartData, sortBy, sortDir]);

  const totalValue = sortedChartData.reduce((sum, item) => sum + item.value, 0);

  const healthScore = useMemo(() => {
    let score = 100;
    const typeCount = new Set(data.map(d => d.type)).size;
    const kripto = data.filter(d => d.type === "Kripto").reduce((s, d) => s + d.value, 0);
    const ratio = kripto / totalValue;
    if (typeCount < 3) score -= 20;
    if (ratio > 0.5) score -= 30;
    if (data.length === 0) score = 0;
    return Math.max(score, 0);
  }, [data, totalValue]);

  const gptComment = useMemo(() => {
    if (healthScore >= 80) return "Portföy dengeli görünüyor.";
    if (healthScore >= 60) return "Portföyde dengesizlik başlıyor. Kripto ağırlığına dikkat.";
    if (healthScore >= 40) return "Kripto veya tek bir tür ağırlığı yüksek.";
    return "Portföy yapısı riskli. Dağılım dengesi bozulmuş.";
  }, [healthScore]);

  const renderPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value, label } = payload[0].payload;
      const percent = totalValue > 0 ? ((value / totalValue) * 100).toFixed(2) : 0;
      return (
        <Paper sx={{ p: 1 }}>
          <b>{label || name}</b><br />
          {value.toLocaleString()} TL<br />
          %{percent}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Paper sx={{ mt: 3, p: 3 }}>
      <Typography variant="h6">📊 Portföy Dağılımı ve Trend</Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mt: 2 }}>
        <FormControl size="small">
          <InputLabel>Trend Aralığı</InputLabel>
          <Select
            value={trendRange}
            label="Trend Aralığı"
            onChange={(e) => setTrendRange(parseInt(e.target.value))}
          >
            {[7, 15, 30].map(n => <MenuItem key={n} value={n}>{n} gün</MenuItem>)}
          </Select>
        </FormControl>

        <Box sx={{ ml: 'auto', px: 2, py: 1, borderRadius: 1, bgcolor: healthScore >= 80 ? '#c8e6c9' : healthScore >= 60 ? '#fff9c4' : '#ffcdd2', minWidth: 250 }}>
          <Typography variant="body2"><b>Portföy Skoru:</b> {healthScore}/100</Typography>
          <Typography variant="caption">{gptComment}</Typography>
        </Box>
      </Box>

      <Box sx={{ height: 300, mt: 3 }}>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={sortedChartData}
              dataKey="value"
              nameKey={filter ? "label" : "name"}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, value, label }) => {
                const text = filter ? label : name;
                return `${text} (${((value / totalValue) * 100).toFixed(1)}%)`;
              }}
            >
              {sortedChartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color || COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <ReTooltip content={renderPieTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ height: 300, mt: 5 }}>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={sortedChartData}>
            <XAxis dataKey={filter ? "label" : "name"} />
            <YAxis />
            <ReTooltip formatter={(v, n, props) => {
              const entry = props.payload;
              return [`${v.toLocaleString()} TL`, filter ? entry.label : entry.name];
            }} />
            <Bar dataKey="value">
              {sortedChartData.map((entry, idx) => (
                <Cell key={`bar-${idx}`} fill={entry.color || COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ height: 300, mt: 5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Toplam Portföy Trendi (Son {trendRange} gün)</Typography>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={history}>
            <XAxis dataKey="name" />
            <YAxis />
            <ReTooltip formatter={(v) => `${v.toLocaleString()} TL`} />
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default Charts;