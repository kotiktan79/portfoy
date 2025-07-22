import React, { useState, useEffect } from "react";
import {
  Box, TextField, MenuItem, Button, Typography, Paper, IconButton,
  Tooltip, Snackbar, Alert, Stack
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import { getCryptoPrices } from "../utils/priceService";

const VARLIK_TURLERI = ["Kripto", "Hisse", "Altın", "Döviz", "Fon", "Eurobond"];
const PARA_BIRIMLERI = ["TRY", "USD", "EUR", "GBP", "BTC", "ETH", "GOLD"];

const AddAsset = () => {
  const [form, setForm] = useState({
    name: "",
    type: "",
    amount: "",
    buyPrice: "",
    currentPrice: "",
    currency: "TRY"
  });
  const [autoPrices, setAutoPrices] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    getCryptoPrices().then(setAutoPrices);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...form, [name]: value };

    if (name === "name" || name === "type") {
      const key = (name === "name" ? value : form.name).toLowerCase();
      const type = name === "type" ? value : form.type;

      let guess = 0;
      if (type === "Kripto") {
        if (key.includes("btc")) guess = autoPrices.BTC;
        else if (key.includes("eth")) guess = autoPrices.ETH;
        else if (key.includes("sol")) guess = autoPrices.SOL;
        else if (key.includes("link")) guess = autoPrices.LINK;
      } else if (type === "Altın") {
        guess = autoPrices.GOLD;
      } else if (type === "Döviz") {
        if (key.includes("usd")) guess = autoPrices.USD;
        else if (key.includes("eur")) guess = autoPrices.EUR;
        else if (key.includes("gbp")) guess = autoPrices.GBP;
      }
      updated.currentPrice = guess || "";
    }

    setForm(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, type, amount, buyPrice } = form;

    if (!name || !type || !amount || !buyPrice) {
      setSnack({ open: true, msg: "Lütfen tüm zorunlu alanları doldurun.", severity: "warning" });
      return;
    }

    const stored = JSON.parse(localStorage.getItem("taner_assets")) || [];
    stored.push(form);
    localStorage.setItem("taner_assets", JSON.stringify(stored));
    setForm({ name: "", type: "", amount: "", buyPrice: "", currentPrice: "", currency: "TRY" });
    setSnack({ open: true, msg: "✅ Varlık başarıyla eklendi.", severity: "success" });
  };

  const handleTemplate = (type, name, currency = "TRY") => {
    const guess = autoPrices[name.toUpperCase()] || "";
    setForm({
      name,
      type,
      amount: 1,
      buyPrice: guess,
      currentPrice: guess,
      currency
    });
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">➕ Yeni Varlık Ekle</Typography>
        <Tooltip title="ETH / USD / Altın şablonu">
          <IconButton onClick={() => handleTemplate("Kripto", "ETH")}>
            <ReplayIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "grid", gap: 2, mt: 2, maxWidth: 400 }}
      >
        <TextField
          label="Varlık Adı"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <TextField
          label="Tür"
          name="type"
          select
          value={form.type}
          onChange={handleChange}
          required
        >
          {VARLIK_TURLERI.map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Miktar"
          name="amount"
          type="number"
          value={form.amount}
          onChange={handleChange}
          required
        />
        <TextField
          label="Alış Fiyatı"
          name="buyPrice"
          type="number"
          value={form.buyPrice}
          onChange={handleChange}
          required
        />
        <TextField
          label="Güncel Fiyat (isteğe bağlı)"
          name="currentPrice"
          type="number"
          value={form.currentPrice}
          onChange={handleChange}
        />
        <TextField
          label="Para Birimi"
          name="currency"
          select
          value={form.currency}
          onChange={handleChange}
        >
          {PARA_BIRIMLERI.map((cur) => (
            <MenuItem key={cur} value={cur}>{cur}</MenuItem>
          ))}
        </TextField>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => setForm({ name: "", type: "", amount: "", buyPrice: "", currentPrice: "", currency: "TRY" })}>
            Temizle
          </Button>
          <Button variant="contained" type="submit">
            Kaydet
          </Button>
        </Stack>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Paper>
  );
};

export default AddAsset;