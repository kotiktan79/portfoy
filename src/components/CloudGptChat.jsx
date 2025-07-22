// src/components/CloudGptChat.jsx
import React, { useState } from "react";
import { Paper, Typography, TextField, Button, Box, Divider, CircularProgress } from "@mui/material";
import axios from "axios";

const OPENAI_API_KEY = "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"; // Buraya kendi anahtarını yapıştır!

const CloudGptChat = () => {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const history = chat.map(c => `User: ${c.q}\nAssistant: ${c.a}`).join("\n");
    const prompt = `${history}\nUser: ${input}\nAssistant:`;
    try {
      const res = await axios.post(
        "https://api.openai.com/v1/completions",
        {
          model: "gpt-3.5-turbo-instruct", // en hızlısı, istersen GPT-4 de olur
          prompt,
          max_tokens: 256,
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      const answer = res.data.choices?.[0]?.text?.trim() || "Cevap yok!";
      setChat([...chat, { q: input, a: answer }]);
    } catch (e) {
      setChat([...chat, { q: input, a: "GPT'den yanıt alınamadı. API key ve internet bağlantını kontrol et!" }]);
    }
    setInput("");
    setLoading(false);
  };

  return (
    <Paper sx={{ p: 3, mt: 3, maxWidth: 800 }}>
      <Typography variant="h6">☁️ Cloud GPT (OpenAI) Sohbet</Typography>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Sorunuzu yazın"
          value={input}
          onChange={e => setInput(e.target.value)}
          fullWidth
          onKeyDown={e => e.key === "Enter" && !loading ? handleSend() : undefined}
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()} sx={{ mt: 1 }}>Sor</Button>
      </Box>
      {loading && (
        <Box sx={{ py: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Yanıt bekleniyor...</Typography>
        </Box>
      )}
      <Box sx={{ minHeight: 200 }}>
        {chat.map((item, i) => (
          <Box key={i} sx={{ mb: 2 }}>
            <Typography color="primary"><b>Sen:</b> {item.q}</Typography>
            <Typography color="success.main"><b>GPT:</b> {item.a}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default CloudGptChat;