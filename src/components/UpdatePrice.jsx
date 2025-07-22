import React, { useState, useEffect } from "react";
import {
  Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, TextField, Button, Box
} from "@mui/material";
import { getCryptoPrices } from "../utils/priceService";
import axios from "axios";

const CACHE_KEY = "lastFetchedPrices";

const getLivePriceSync = async (asset) => {
  const key = asset.name.toUpperCase();
  if (asset.type === "Hisse") {
    try {
      const { data } = await axios.get(`http://localhost:4000/hisse-fiyat?symbol=${key}`);
      return data?.price || "-";
    } catch { return "-"; }
  }
  if (asset.type === "Fon") {
    try {
      const { data } = await axios.get(`http://localhost:4000/fon-fiyat?code=${key}`);
      return data?.price || "-";
    } catch { return "-"; }
  }
  // Kripto/döviz/altın api ile zaten geliyor
  return "-";
};

const UpdatePrice = () => {
  const [assets, setAssets] = useState([]);
  const [manual, setManual] = useState({});
  const [auto, setAuto] = useState({});
  const [lastFetched, setLastFetched] = useState({});
  const [livePrices, setLivePrices] = useState({});

  useEffect(() => {
    setAssets(JSON.parse(localStorage.getItem("taner_assets")) || []);
    setManual(JSON.parse(localStorage.getItem("updatedPrices")) || {});
    setLastFetched(JSON.parse(localStorage.getItem(CACHE_KEY)) || {});
    fetchAuto();
  }, []);

  // Otomatik fiyatlar (kripto, döviz, altın)
  const fetchAuto = async () => {
    const prices = await getCryptoPrices();
    setAuto(prices);
    localStorage.setItem(CACHE_KEY, JSON.stringify(prices));
    setLastFetched(prices);
  };

  // Manuel fiyat değişimi
  const handleManualChange = (key, value) => {
    const updated = { ...manual };
    if (value === "" || isNaN(parseFloat(value))) {
      delete updated[key];
    } else {
      updated[key] = parseFloat(value);
    }
    setManual(updated);
    localStorage.setItem("updatedPrices", JSON.stringify(updated));
  };

  // Panelde gösterilecek fiyatı belirle (manuel > api > cache > canlı scraping)
  const getDisplayPrice = (a) => {
    const key = a.name.toUpperCase();
    if (manual && manual[key] && manual[key] > 0)
      return { value: manual[key], source: "Manuel" };
    if (
      auto && (
        (a.type === "Altın" && auto.GOLD) ||
        (a.type === "Döviz" && auto[key]) ||
        (a.type === "Kripto" && auto[key])
      )
    ) {
      let v = a.type === "Altın" ? auto.GOLD : auto[key];
      return { value: v, source: "API (Online)" };
    }
    if (lastFetched && lastFetched[key] && lastFetched[key] > 0)
      return { value: lastFetched[key], source: "Cache (Son Online)" };
    if (livePrices[key]) return { value: livePrices[key], source: "Canlı Scraping" };
    return { value: "-", source: "-" };
  };

  // Hisse/fonların canlı fiyatını bulk olarak al
  const fetchAllLive = async () => {
    const updated = { ...livePrices };
    for (let asset of assets) {
      if ((asset.type === "Hisse" || asset.type === "Fon")) {
        updated[asset.name.toUpperCase()] = await getLivePriceSync(asset);
      }
    }
    setLivePrices(updated);
  };

  useEffect(() => {
    fetchAllLive();
    // eslint-disable-next-line
  }, [assets]);

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>🔄 Fiyat Güncelleme Paneli</Typography>
        <Button variant="contained" onClick={fetchAuto}>Tüm Kripto/Döviz/Altın Fiyatlarını Yenile (API)</Button>
        <Button variant="outlined" sx={{ ml: 2 }} onClick={fetchAllLive}>Tüm Hisse/Fon Fiyatlarını Yenile (Canlı)</Button>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Varlık</TableCell>
            <TableCell>Canlı Fiyat</TableCell>
            <TableCell>API (Kripto/Döviz/Altın)</TableCell>
            <TableCell>Cache (Son Fiyat)</TableCell>
            <TableCell>Manuel Fiyat</TableCell>
            <TableCell style={{ fontWeight: "bold" }}>Kullanılan</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assets.map((a, i) => {
            const key = a.name.toUpperCase();
            const apiPrice =
              a.type === "Altın" ? auto.GOLD
              : a.type === "Döviz" ? auto[key]
              : a.type === "Kripto" ? auto[key]
              : undefined;
            const cachePrice = lastFetched[key];
            const manualPrice = manual[key];
            const live = livePrices[key];
            const used = getDisplayPrice(a);

            return (
              <TableRow key={key}>
                <TableCell>{key}</TableCell>
                <TableCell>
                  {(a.type === "Hisse" || a.type === "Fon")
                    ? (live !== undefined ? live : <Button size="small" onClick={async () => {
                        const val = await getLivePriceSync(a);
                        setLivePrices(lp => ({ ...lp, [key]: val }));
                      }}>Çek</Button>)
                    : "-"}
                </TableCell>
                <TableCell>{apiPrice !== undefined ? apiPrice : "-"}</TableCell>
                <TableCell>{cachePrice !== undefined ? cachePrice : "-"}</TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={manualPrice !== undefined && manualPrice !== null ? manualPrice : ""}
                    onChange={e => handleManualChange(key, e.target.value)}
                    placeholder="Manuel fiyat"
                  />
                  {manualPrice !== undefined && manualPrice !== null && (
                    <Button color="warning" size="small" sx={{ ml: 1, minWidth: 28 }} onClick={() => handleManualChange(key, "")}>Sil</Button>
                  )}
                </TableCell>
                <TableCell style={{ fontWeight: "bold" }}>
                  {used.source}: {used.value}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Typography sx={{ mt: 2, color: "#888" }} variant="body2">
        * Her satırda "Canlı Fiyat" güncel scraping ile, "API" CoinGecko ile gelir.<br />
        * Kripto/döviz/altın satırları için otomatik çekilir.<br />
        * Hisse/fon için "Çek" tuşu veya "Tüm Hisse/Fon Fiyatlarını Yenile" kullanabilirsin.<br />
        * Manuel fiyat yazarsan önce o kullanılır, silersen canlı/online/cache sırayla kullanılır.<br />
      </Typography>
    </Paper>
  );
};

export default UpdatePrice;