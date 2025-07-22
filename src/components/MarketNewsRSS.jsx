import React, { useEffect, useState } from "react";
import { Paper, Typography, List, ListItem, ListItemText } from "@mui/material";
import axios from "axios";

// Buraya kendi NewsAPI anahtarını yaz!
const NEWS_API_KEY = "BURAYA_KENDİ_API_KEYİNİ_YAZ";

const MarketNewsTurkish = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const url =
          `https://newsapi.org/v2/top-headlines?country=tr&category=business&language=tr&q=ekonomi%20OR%20borsa%20OR%20dolar%20OR%20altın&apiKey=${NEWS_API_KEY}`;
        const res = await axios.get(url);
        setNews(res.data.articles || []);
      } catch (err) {
        setNews([{ title: "Haber alınamadı.", description: "API ya da bağlantı sorunu." }]);
      }
    };
    fetchNews();
  }, []);

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6">📢 Türkçe Ekonomi Haberleri</Typography>
      <List>
        {news.map((n, i) => (
          <ListItem key={i}>
            <ListItemText
              primary={n.title}
              secondary={n.description || ""}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default MarketNewsTurkish;