// src/utils/yahooService.js

export const fetchYahooPrice = async (symbol) => {
    try {
      const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`);
      const json = await response.json();
      const result = json.quoteResponse.result[0];
  
      return {
        price: result.regularMarketPrice,
        changePercent: result.regularMarketChangePercent
      };
    } catch (err) {
      console.error("Yahoo fiyat verisi alınamadı:", err);
      return {
        price: 0,
        changePercent: 0
      };
    }
  };