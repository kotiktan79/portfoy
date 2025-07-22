import React, { useEffect, useState } from "react";
import {
  Paper, Typography, Divider, List, ListItem, ListItemText, Box, Button, Chip
} from "@mui/material";
import axios from "axios";
import { getCryptoPrices } from "../utils/priceService";
import { getLivePrice } from "../utils/priceUtils";

const TARGET_ALLOC = {
  "Kripto": 0.18,
  "Hisse": 0.40,
  "Fon": 0.15,
  "Döviz": 0.10,
  "Altın": 0.10,
  "Nakit": 0.07
};

// Gelişmiş sentiment (başlık ve özet)
function checkPositive(text = "") {
  return /win|surge|rally|break|all time high|positive|strong|inflow|gained|acquire|approval|rekor|yükseldi|artış|alım|yatırım|fon|destek|onay|büyüme|zincir|yeni zirve|başarı|rebound|bull|yatırım aldı|ortaklık|büyüme haberi|partnership|integration|patent|listing|institutional/i.test(text);
}
function checkNegative(text = "") {
  return /loss|crash|hack|fine|lawsuit|drop|negative|panic|dump|scam|selloff|delist|dava|çöküş|kayıp|zarar|hack|çıkış|sataşı|ceza|olumsuz|çöküş|vurgun|geri çekilme|balina satışı|iflas|şüpheli|dolandırıcılık|baskı|delisting|fud|crime|regulation|sec warning/i.test(text);
}
// Son 3-5 başlık/özet analizli etiket
function getSentimentAll(newsArr = []) {
  let positive = false, negative = false;
  for (const news of newsArr.slice(0, 5)) {
    const text = [news.title, news.summary || news.content || ""].join(" ");
    if (checkPositive(text)) positive = true;
    if (checkNegative(text)) negative = true;
  }
  if (positive) return "Pozitif";
  if (negative) return "Negatif";
  return "Nötr";
}

const SmartAdvisor = () => {
  const [coinTrends, setCoinTrends] = useState([]);
  const [stockTrends, setStockTrends] = useState([]);
  const [yourSymbols, setYourSymbols] = useState([]);
  const [typeTotals, setTypeTotals] = useState({});
  const [totalValue, setTotalValue] = useState(0);
  const [apiError, setApiError] = useState("");
  const [alarms, setAlarms] = useState([]);
  const [coinNews, setCoinNews] = useState({});

  // Haber çekici (özete de bak)
  const fetchNews = async (symbol) => {
    try {
      const r = await axios.get(`http://localhost:4000/haber?symbol=${symbol}`);
      // Eğer summary/content vs. yoksa title ile yetiniriz.
      setCoinNews(news => ({
        ...news,
        [symbol]: (r.data.haberler || []).map(x => ({
          title: x.title,
          summary: x.summary || x.content || "", // Yoksa ""
          link: x.link,
        }))
      }));
    } catch {
      setCoinNews(news => ({ ...news, [symbol]: [] }));
    }
  };

  // Fiyat/trend veri çekici
  const fetchTrends = async () => {
    setApiError("");
    try {
      const cg = await axios.get("http://localhost:4000/kripto-trend");
      setCoinTrends(
        Array.isArray(cg.data)
          ? cg.data
              .filter(c => c.price_change_percentage_30d_in_currency)
              .map(c => ({
                symbol: c.symbol.toUpperCase(),
                name: c.name,
                pct: c.price_change_percentage_30d_in_currency.toFixed(1)
              }))
          : []
      );
    } catch (e) {
      setCoinTrends([]);
      setApiError("Kripto canlı veri çekilemedi: " + e.message);
    }
    try {
      const bistResp = await axios.get("http://localhost:4000/bist-gainers");
      setStockTrends(
        bistResp.data && bistResp.data.bistGainers && bistResp.data.bistGainers.length > 0
          ? bistResp.data.bistGainers
          : []
      );
    } catch (e) {
      setStockTrends([]);
      setApiError("BIST canlı veri çekilemedi: " + e.message);
    }
  };

  // Portföy dağılımı ve analiz
  const updatePortfolioStats = async () => {
    const stored = JSON.parse(localStorage.getItem("taner_assets")) || [];
    const manual = JSON.parse(localStorage.getItem("updatedPrices")) || {};
    const lastFetched = JSON.parse(localStorage.getItem("lastFetchedPrices")) || {};
    const prices = await getCryptoPrices();
  
    const syms = stored.map(a => (a.symbol || a.name || "").toUpperCase());
    setYourSymbols(syms);
  
    const totals = {};
    let total = 0;
  
    // Fiyatları asenkron toplamak için Promise.all!
    await Promise.all(stored.map(async (asset) => {
      const type = asset.type || "";
      const current = await getLivePrice(asset, manual, lastFetched, prices);
      const amount = parseFloat(asset.amount) || 0;
      const value = (current || 0) * amount;
      if (!totals[type]) totals[type] = 0;
      totals[type] += value;
      total += value;
    }));
  
    setTypeTotals(totals);
    setTotalValue(total);
  };

  const getTypePct = (type) =>
    totalValue && typeTotals[type]
      ? ((typeTotals[type] / totalValue) * 100).toFixed(1)
      : "0.0";

  // Portföy alarmı üret
  const createAlarms = () => {
    const alarmList = [];
    Object.keys(TARGET_ALLOC).forEach(type => {
      const oran = parseFloat(getTypePct(type));
      const hedef = (TARGET_ALLOC[type] * 100);
      if (oran > hedef * 1.3) {
        alarmList.push(
          `⚠️ ${type} oranı hedefin (%${hedef.toFixed(1)}) %30'dan fazla ÜZERİNDE (%${oran.toFixed(1)}) — Risk arttı!`
        );
      }
      if (oran < hedef * 0.5) {
        alarmList.push(
          `⚠️ ${type} oranı hedefin (%${hedef.toFixed(1)}) %50'den fazla ALTINDA (%${oran.toFixed(1)}) — Potansiyel düşük!`
        );
      }
    });
    setAlarms(alarmList);
  };

  // Eksik kriptolar için haberleri çek
  useEffect(() => {
    coinTrends
      .filter(t => !yourSymbols.includes(t.symbol))
      .slice(0, 3)
      .forEach(t => fetchNews(t.symbol));
    // eslint-disable-next-line
  }, [coinTrends, yourSymbols]);

  useEffect(() => {
    fetchTrends();
    updatePortfolioStats();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    createAlarms();
    // eslint-disable-next-line
  }, [typeTotals, totalValue]);

  // Mini öneri
  function getMiniSpot() {
    let minGap = -9999, typeName = "";
    Object.keys(TARGET_ALLOC).forEach(type => {
      const oran = parseFloat(getTypePct(type));
      const hedef = (TARGET_ALLOC[type] * 100);
      const gap = oran - hedef;
      if (gap < minGap) {
        minGap = gap;
        typeName = type;
      }
    });
    if (typeName && Math.abs(minGap) > 3)
      return `Dikkat: Portföyünde en eksik kalan tür: ${typeName} (%${getTypePct(typeName)}), hedefin (%${(TARGET_ALLOC[typeName]*100).toFixed(1)}).`;
    return "Portföy dağılımın hedefe oldukça yakın.";
  }

  // Badge
  const SentBadge = ({ sent }) => (
    <Chip
      label={sent}
      size="small"
      sx={{
        ml: 1,
        bgcolor: sent === "Pozitif" ? "#d0ffd6" : sent === "Negatif" ? "#ffd2d2" : "#ececec",
        color: sent === "Pozitif" ? "#14933d" : sent === "Negatif" ? "#e53935" : "#555"
      }}
    />
  );

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6">🧠 Smart Advisor – Haber Analizli, Gelişmiş Panel</Typography>
      <Box sx={{ mb: 1, mt: 1 }}>
        <Chip label={getMiniSpot()} color="primary" sx={{ fontWeight: "bold", bgcolor: "#eceaff" }} />
      </Box>
      {alarms.length > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: "#fffbe6", border: "1.5px solid #ffbb33", borderRadius: 2 }}>
          {alarms.map((alarm, idx) => (
            <Typography key={idx} variant="body2" sx={{ color: "#f57c00", fontWeight: "bold" }}>
              {alarm}
            </Typography>
          ))}
        </Box>
      )}
      <Divider sx={{ my: 2 }}>Canlı Kripto Fırsatları (Portföyünde Yoksa)</Divider>
      <List>
        {coinTrends
          .filter(t => !yourSymbols.includes(t.symbol))
          .slice(0, 3)
          .map((t, k) => {
            const newsArr = coinNews[t.symbol] || [];
            const haberSatiri = newsArr.length > 0 ? newsArr[0].title : "Haber yok";
            const haberLink = newsArr.length > 0 ? newsArr[0].link : "";
            const sent = getSentimentAll(newsArr);
            const renk = sent === "Pozitif" ? "green" : sent === "Negatif" ? "red" : "gray";
            const kriptoPct = getTypePct("Kripto");
            const kriptoHedef = (TARGET_ALLOC["Kripto"] * 100).toFixed(1);
            const gerekce =
              parseFloat(kriptoPct) < parseFloat(kriptoHedef)
                ? `Portföyünde kripto oranı (%${kriptoPct}) hedefin (%${kriptoHedef}) altında.`
                : `Trendde olduğu için önerildi.`;
            return (
              <ListItem key={k} sx={{ mb: 2 }}>
                <ListItemText
                  primary={
                    <span>
                      <b>EKLE:</b> <span style={{ color: renk }}>{t.symbol}</span> (%{t.pct}){" "}
                      <SentBadge sent={sent} />
                      <br />
                      {newsArr.length > 0 && newsArr[0].title !== "Haber yok" && (
                        <span style={{ color: "#1976d2" }}>
                          <a href={haberLink} target="_blank" rel="noreferrer">
                            {haberSatiri.length > 68 ? haberSatiri.slice(0, 65) + "..." : haberSatiri}
                          </a>
                        </span>
                      )}
                      <br />
                      <span style={{ color: "#666" }}>
                        <small>
                          Gerekçe: {gerekce} <span style={{ color: "#bbb" }}>• Kaynak: CoinGecko / Cointelegraph</span>
                        </small>
                      </span>
                    </span>
                  }
                />
              </ListItem>
            );
          })}
      </List>
      <Divider sx={{ my: 2 }}>Canlı BIST Fırsatları (Portföyünde Yoksa)</Divider>
      <List>
        {stockTrends
          .filter(t => !yourSymbols.includes(t))
          .slice(0, 3)
          .map((t, k) => (
            <ListItem key={k}>
              <ListItemText
                primary={
                  <span style={{ color: "blue" }}>
                    <b>EKLE:</b> {t} — BIST’te bugün en çok artanlardan.
                    <br />
                    <span style={{ color: "#666" }}>
                      <small>
                        Gerekçe: Portföyünde eksik. <span style={{ color: "#bbb" }}>• Kaynak: TradingView</span>
                      </small>
                    </span>
                  </span>
                }
              />
            </ListItem>
          ))}
        {stockTrends.filter(t => !yourSymbols.includes(t)).length === 0 && (
          <ListItem>
            <ListItemText
              primary={
                <span style={{ color: "#999" }}>
                  Portföyünde olmayan canlı BIST fırsatı yok.
                </span>
              }
            />
          </ListItem>
        )}
      </List>
      <Divider sx={{ my: 2 }}>Portföy Dağılımı</Divider>
      <Box sx={{ pl: 2 }}>
        {Object.keys(TARGET_ALLOC).map(type => (
          <Typography key={type} variant="body2">
            <b>{type}:</b> %{getTypePct(type)} —{" "}
            <span style={{ color: "#888" }}>Hedef: %{(TARGET_ALLOC[type]*100).toFixed(1)}</span>
          </Typography>
        ))}
      </Box>
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Button
          variant="outlined"
          onClick={() => {
            fetchTrends();
            setYourSymbols([]);
            updatePortfolioStats();
          }}
        >
          🔄 Yenile
        </Button>
      </Box>
      {apiError && (
        <Box sx={{ mt: 2, color: "red", fontWeight: "bold" }}>
          {apiError}
        </Box>
      )}
    </Paper>
  );
};

export default SmartAdvisor;