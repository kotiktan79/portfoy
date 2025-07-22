import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  List,
  ListItem,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  Box
} from "@mui/material";

const RISK_DISTRIBUTIONS = {
  Düşük: {
    Hisse: 0.2,
    Kripto: 0.05,
    Fon: 0.3,
    Döviz: 0.15,
    Altın: 0.2,
    Nakit: 0.1
  },
  Orta: {
    Hisse: 0.32,
    Kripto: 0.15,
    Fon: 0.22,
    Döviz: 0.13,
    Altın: 0.12,
    Nakit: 0.06
  },
  Yüksek: {
    Hisse: 0.4,
    Kripto: 0.2,
    Fon: 0.15,
    Döviz: 0.1,
    Altın: 0.1,
    Nakit: 0.05
  }
};

const riskLabels = {
  Düşük: "Düşük Risk – %20-30 yıllık hedef",
  Orta: "Orta Risk – %35-50 yıllık hedef",
  Yüksek: "Yüksek Risk – %60+ yıllık hedef"
};

const RebalancePanel = () => {
  const [assets, setAssets] = useState([]);
  const [manualPrices, setManualPrices] = useState({});
  const [lastFetchedPrices, setLastFetchedPrices] = useState({});
  const [apiPrices, setApiPrices] = useState({});
  const [risk, setRisk] = useState("Orta");
  const [extraNotes, setExtraNotes] = useState([]);

  // Fiyat alma fonksiyonu
  const getPrice = (a) => {
    const key = a.name.toUpperCase();
    return (
      manualPrices[key] ||
      apiPrices[a.type === "Altın" ? "GOLD" : key] ||
      lastFetchedPrices[a.type === "Altın" ? "GOLD" : key] ||
      parseFloat(a.buyPrice) ||
      0
    );
  };

  useEffect(() => {
    setAssets(JSON.parse(localStorage.getItem("taner_assets")) || []);
    setManualPrices(JSON.parse(localStorage.getItem("updatedPrices")) || {});
    setLastFetchedPrices(JSON.parse(localStorage.getItem("lastFetchedPrices")) || {});
    setApiPrices(JSON.parse(localStorage.getItem("lastFetchedPrices")) || {});
  }, []);

  // Portföy toplamı
  const total = assets.reduce(
    (sum, a) => sum + getPrice(a) * parseFloat(a.amount || 0),
    0
  );

  // Gerçek portföy dağılımı
  const realDist = {};
  assets.forEach((a) => {
    const val = getPrice(a) * parseFloat(a.amount || 0);
    if (!realDist[a.type]) realDist[a.type] = 0;
    realDist[a.type] += val;
  });

  // Hedef dağılım
  const TARGET_DISTRIBUTION = RISK_DISTRIBUTIONS[risk];

  // Analiz ve öneriler
  const rebalanceRows = Object.keys(TARGET_DISTRIBUTION).map((type) => {
    const current = realDist[type] || 0;
    const currentPct = total ? current / total : 0;
    const targetPct = TARGET_DISTRIBUTION[type];
    const diffPct = targetPct - currentPct;
    const diffTL = targetPct * total - current;
    let advice = "✔️ Hedefte";
    if (diffTL > 0.01 * total) advice = `➕ ${diffTL.toFixed(0)} TL (%${diffPct > 0 ? "+" : ""}${(diffPct * 100).toFixed(1)}) artır`;
    else if (diffTL < -0.01 * total) advice = `➖ ${Math.abs(diffTL).toFixed(0)} TL (%${(diffPct * 100).toFixed(1)}) azalt`;
    return {
      type,
      current: current.toFixed(0),
      currentPct: (currentPct * 100).toFixed(1),
      targetPct: (targetPct * 100).toFixed(1),
      diffTL: diffTL.toFixed(0),
      diffPct: (diffPct * 100).toFixed(1),
      advice,
    };
  });

  // Ek analiz ve uyarılar
  useEffect(() => {
    const notes = [];
    if ((realDist["Kripto"] || 0) / total > (risk === "Yüksek" ? 0.28 : risk === "Orta" ? 0.17 : 0.08)) {
      notes.push("⚠️ Kripto ağırlığı risk seviyesinin üzerinde!");
    }
    if ((realDist["Hisse"] || 0) / total < (risk === "Düşük" ? 0.15 : risk === "Orta" ? 0.27 : 0.35)) {
      notes.push("⚠️ Hisse oranı düşük, potansiyel getiri sınırlı olabilir.");
    }
    if ((realDist["Nakit"] || 0) / total > 0.12) {
      notes.push("⚠️ Nakit fazla, getiri potansiyeli düşük kalır.");
    }
    if ((realDist["Altın"] || 0) / total < 0.05) {
      notes.push("⚠️ Altın oranı düşük, defansif portföy için yükseltilebilir.");
    }
    if (total === 0) {
      notes.push("⛔ Portföyde hiç varlık yok!");
    }
    setExtraNotes(notes);
  }, [assets, manualPrices, lastFetchedPrices, apiPrices, risk, realDist, total]);

  return (
    <Paper sx={{ mt: 3, p: 3 }}>
      <Typography variant="h6">🔄 Rebalance – Dinamik Risk ve Hedef Dağılım</Typography>
      <Divider sx={{ my: 2 }} />
      <ToggleButtonGroup
        color="primary"
        value={risk}
        exclusive
        onChange={(e, v) => v && setRisk(v)}
        sx={{ mb: 2 }}
      >
        {Object.keys(RISK_DISTRIBUTIONS).map((riskKey) => (
          <ToggleButton key={riskKey} value={riskKey}>
            {riskLabels[riskKey]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Alert severity="info" sx={{ mb: 3 }}>
        <b>Seçili Risk Profili:</b> {riskLabels[risk]}
        <br />
        <b>Hedef Dağılım:</b>{" "}
        {Object.entries(TARGET_DISTRIBUTION)
          .map(([t, p]) => `${t}: %${(p * 100).toFixed(0)}`)
          .join(" | ")}
      </Alert>

      <Table size="small" sx={{ maxWidth: 750 }}>
        <TableHead>
          <TableRow>
            <TableCell>Varlık Türü</TableCell>
            <TableCell>Şu Anki Değer</TableCell>
            <TableCell>Şu Anki %</TableCell>
            <TableCell>Hedef %</TableCell>
            <TableCell>Fark (TL)</TableCell>
            <TableCell>Öneri</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rebalanceRows.map((row, i) => (
            <TableRow key={i}>
              <TableCell>{row.type}</TableCell>
              <TableCell>{parseFloat(row.current).toLocaleString()} TL</TableCell>
              <TableCell>%{row.currentPct}</TableCell>
              <TableCell>%{row.targetPct}</TableCell>
              <TableCell
                style={{
                  color:
                    Math.abs(row.diffTL) > 0.01 * total
                      ? row.diffTL > 0
                        ? "green"
                        : "red"
                      : "gray",
                }}
              >
                {parseFloat(row.diffTL).toLocaleString()}
              </TableCell>
              <TableCell>
                <b>{row.advice}</b>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Divider sx={{ my: 3 }}>Ek Analiz & Uyarılar</Divider>
      <List>
        {extraNotes.length > 0 ? (
          extraNotes.map((n, i) => (
            <ListItem key={i}>
              <ListItemText primary={n} />
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText primary="Portföy dağılımı risk profiline uygun." />
          </ListItem>
        )}
      </List>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="gray">
          Buradaki öneriler ve analizler, portföyünü risk-getiri dengesine göre sürekli optimize
          etmeni sağlar.
          <br />
          Dağılım oranlarını ve risk profilini üstteki seçimle anında değiştirebilirsin.
        </Typography>
      </Box>
    </Paper>
  );
};

export default RebalancePanel;