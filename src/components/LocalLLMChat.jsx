import React, { useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  CircularProgress,
} from "@mui/material";
import axios from "axios";

const OPENAI_API_KEY = "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"; // Buraya kendi anahtarını yapıştır!


const CloudGptChat = () => {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);

    const historyText = chat
      .map((entry) => `User: ${entry.q}\nAssistant: ${entry.a}`)
      .join("\n");

    const prompt = `${historyText}\nUser: ${input}\nAssistant:`;

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/completions",
        {
          model: "gpt-3.5-turbo-instruct",
          prompt: prompt,
          max_tokens: 256,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const answer = response.data.choices?.[0]?.text?.trim() || "Cevap yok!";
      setChat([...chat, { q: input, a: answer }]);
    } catch (error) {
      setChat([
        ...chat,
        {
          q: input,
          a: "GPT'den yanıt alınamadı. API anahtarını ve internet bağlantını kontrol et.",
        },
      ]);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ padding: 3, marginTop: 3, maxWidth: 800 }}>
      <Typography variant="h6">☁️ Cloud GPT Sohbet</Typography>
      <Divider sx={{ marginY: 2 }} />
      <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
        <TextField
          fullWidth
          label="Sorunuzu yazın"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              handleSend();
            }
          }}
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          Gönder
        </Button>
      </Box>

      {loading && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            paddingY: 3,
            justifyContent: "center",
          }}
        >
          <CircularProgress size={24} />
          <Typography>Yanıt bekleniyor...</Typography>
        </Box>
      )}

      <Box sx={{ minHeight: 200 }}>
        {chat.map((entry, index) => (
          <Box key={index} sx={{ marginBottom: 2 }}>
            <Typography color="primary">
              <strong>Sen:</strong> {entry.q}
            </Typography>
            <Typography color="success.main">
              <strong>GPT:</strong> {entry.a}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default CloudGptChat;







