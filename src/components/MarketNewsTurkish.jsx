import React, { useEffect, useState } from "react";
import { Paper, Typography, List, ListItem, ListItemText } from "@mui/material";
import axios from "axios";

const NEWS_API_KEY = "a32039279e7747179143020d58af17d9"; // NewsAPI'den aldığın KEY

const MarketNewsTurkish = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const url = `https://newsapi.org/v2/everything?language=tr&q=ekonomi OR borsa OR dolar OR altın OR enflasyon&sortBy=publishedAt&pageSize=8&apiKey=${NEWS_API_KEY}`;
        const { data } = await axios.get(url);
        setNews(data.articles || []);
      } catch (err) {
        setNews([{ title: "Haber alınamadı.", description: "NewsAPI veya bağlantı sorunu." }]);
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