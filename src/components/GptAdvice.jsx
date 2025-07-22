// src/components/GptAdvice.jsx (Bozulmadan, doğru şekilde düzeltilmiş sürüm)
import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Box,
  Button
} from "@mui/material";
import { getCryptoPrices } from "../utils/priceService";

const GptAdvice = () => {
  const [output, setOutput] = useState([]);

  const generateInsight = async () => {
    const assets = JSON.parse(localStorage.getItem("taner_assets")) || [];
    const prices = await getCryptoPrices();
    const manual = JSON.parse(localStorage.getItem("updatedPrices")) || {};
    const settings = JSON.parse(localStorage.getItem("taner_settings")) || { risk: "Orta", roi: 50, enflasyon: 60 };

    let total = 0;
    let cost = 0;
    const types = {};
    const gainers = [];
    const losers = [];

    assets.forEach((asset) => {
      let price = manual[asset.name.toUpperCase()] || 0;
      if (!price) {
        if (asset.type === "Altın") price = prices.GOLD;
        else if (asset.type === "Döviz") {
          const code = asset.name.toUpperCase();
          if (code === "USD") price = prices.USD;
          else if (code === "EUR") price = prices.EUR;
        } else {
          const name = asset.name.toLowerCase();
          if (name.includes("btc")) price = prices.BTC;
          if (name.includes("eth")) price = prices.ETH;
          if (name.includes("sol")) price = prices.SOL;
          if (name.includes("link")) price = prices.LINK;
        }
      }

      // ✅ Hatalı fiyat verisi varsa geç
      if (!price || isNaN(price) || price <= 0) return;

      const amount = parseFloat(asset.amount);
      const buy = parseFloat(asset.buyPrice);
      const value = price * amount;
      const invested = buy * amount;
      total += value;
      cost += invested;

      if (!types[asset.type]) types[asset.type] = 0;
      types[asset.type] += value;

      const diff = price - buy;
      const profit = diff * amount;
      const pct = (diff / buy) * 100;
      if (pct > 10) gainers.push(`${asset.name}: +%${pct.toFixed(1)} (${profit.toFixed(2)} TL)`);
      else if (pct < -5) losers.push(`${asset.name}: -%${Math.abs(pct).toFixed(1)} (${profit.toFixed(2)} TL)`);
    });

    const nominalGetiri = ((total - cost) / cost) * 100;
    const enflasyon = settings.enflasyon || 60;
    const gercekGetiri = (((1 + nominalGetiri / 100) / (1 + enflasyon / 100)) - 1) * 100;

    const advice = [
      `🎯 Hedef ROI: %${settings.roi}  |  Risk Profili: ${settings.risk}  |  TÜFE: %${enflasyon}`,
      `💼 Toplam portföy: ${total.toFixed(2)} TL | Maliyet: ${cost.toFixed(2)} TL`,
      `📊 Dağılım: ` + Object.entries(types).map(([k, v]) => `${k} %${((v / total) * 100).toFixed(1)}`).join(" | "),
      `📈 Nominal Getiri: %${nominalGetiri.toFixed(2)}  →  📉 Gerçek Getiri (Enflasyon etkisiyle): %${gercekGetiri.toFixed(2)}`
    ];

    if (gainers.length > 0) advice.push("📈 En çok kazandıranlar:", ...gainers);
    if (losers.length > 0) advice.push("📉 En çok zarar ettirenler:", ...losers);

    advice.push("🧠 GPT önerisi:");

    if (!types["Fon"]) advice.push("• Fon eklenmesi önerilir.");
    if ((types["Altın"] || 0) / total < 0.08) advice.push("• Altın oranı düşük. Enflasyona karşı %10 önerilir.");

    if (settings.risk === "Yüksek") {
      if ((types["Kripto"] || 0) / total < 0.25) advice.push("• Kripto oranı hedefinizin altında. %25+ olabilir.");
    }
    if (settings.risk === "Düşük") {
      if ((types["Kripto"] || 0) / total > 0.15) advice.push("• Kripto oranı risk profilinizin üstünde. %15 altına çekebilirsiniz.");
    }

    if (settings.roi >= 50 && (types["Hisse"] || 0) / total < 0.25) {
      advice.push("• Hisse oranı %25 altı. Yıllık %50 hedef için hisse ağırlığı artırılabilir.");
    }

    setOutput(advice);
  };

  useEffect(() => {
    generateInsight();
  }, []);

  return (
    <Paper sx={{ mt: 3, p: 3 }}>
      <Typography variant="h6">🤖 GPT Tavsiye Paneli (Kişisel + Enflasyon Ayarlı)</Typography>
      <Divider sx={{ my: 2 }} />
      <List>
        {output.map((item, i) => (
          <ListItem key={i}>
            <ListItemText primary={item} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Button variant="outlined" onClick={generateInsight}>🔄 Yeniden Hesapla</Button>
      </Box>
    </Paper>
  );
};

export default GptAdvice;