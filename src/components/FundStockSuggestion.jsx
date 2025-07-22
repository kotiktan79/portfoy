import React, { useEffect, useState } from "react";
import {
  Paper, Typography, Divider, List, ListItem, ListItemText, Box, Button
} from "@mui/material";

const riskLevels = ["Düşük", "Orta", "Yüksek"];

const FundStockSuggestion = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [riskFilter, setRiskFilter] = useState("Orta");
  const [funds, setFunds] = useState([]);

  useEffect(() => {
    fetch("/funds.json")
      .then(res => res.json())
      .then(data => setFunds(data))
      .catch(() => setFunds([]));
  }, []);

  useEffect(() => {
    const filtered = funds.filter(fund =>
      riskLevels.indexOf(fund.risk) >= riskLevels.indexOf(riskFilter) &&
      fund.performance30d > 3.5
    );

    if (filtered.length === 0) {
      setSuggestions(["Portföyüne uygun öneri bulunamadı."]);
    } else {
      const tips = filtered.map(fund =>
        `📌 ${fund.name} (${fund.code}): Son 30 gün getirisi +%${fund.performance30d.toFixed(1)}. Portföyüne uygun olabilir.`
      );
      setSuggestions(tips);
    }
  }, [riskFilter, funds]);

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6">📈 Fon & Hisse Önerileri (Yerel Veri)</Typography>
      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <label htmlFor="risk-select">Risk Seviyesi: </label>
        <select
          id="risk-select"
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value)}
          style={{ padding: 4, marginLeft: 8 }}
        >
          {riskLevels.map(risk => (
            <option key={risk} value={risk}>{risk}</option>
          ))}
        </select>
      </Box>

      <List>
        {suggestions.map((text, i) => (
          <ListItem key={i}>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default FundStockSuggestion;