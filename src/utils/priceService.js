// src/utils/priceService.js
import axios from "axios";

// Hata durumunda cache'den oku
function getCacheFallback() {
  try {
    const cached = JSON.parse(localStorage.getItem("lastFetchedPrices")) || {};
    return {
      BTC: cached.BTC || 0,
      ETH: cached.ETH || 0,
      SOL: cached.SOL || 0,
      LINK: cached.LINK || 0,
      GOLD: cached.GOLD || 2500,
      USD: cached.USD || 32,
      EUR: cached.EUR || 35
    };
  } catch (e) {
    return {
      BTC: 0, ETH: 0, SOL: 0, LINK: 0,
      GOLD: 2500, USD: 32, EUR: 35
    };
  }
}

export const getCryptoPrices = async () => {
  try {
    const goldUrl = `https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd`;
    const usdTryUrl = `https://api.coingecko.com/api/v3/simple/price?ids=usd,euro,tether&vs_currencies=try`;
    const cryptoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,chainlink&vs_currencies=try`;

    const [goldRes, usdTryRes, cryptoRes] = await Promise.all([
      axios.get(goldUrl),
      axios.get(usdTryUrl),
      axios.get(cryptoUrl)
    ]);

    const onsUSD = goldRes.data["tether-gold"]?.usd;
    const usdToTry = usdTryRes.data["tether"]?.try;
    const gramAltin = onsUSD && usdToTry ? ((onsUSD / 31.1) * usdToTry).toFixed(2) : null;

    // Sonuçları hazırla
    const prices = {
      BTC: cryptoRes.data.bitcoin?.try || 0,
      ETH: cryptoRes.data.ethereum?.try || 0,
      SOL: cryptoRes.data.solana?.try || 0,
      LINK: cryptoRes.data.chainlink?.try || 0,
      GOLD: gramAltin ? parseFloat(gramAltin) : 2500,
      USD: usdTryRes.data.usd?.try || 32,
      EUR: usdTryRes.data.euro?.try || 35
    };

    // Son başarılı fiyatları cache'e yaz
    localStorage.setItem("lastFetchedPrices", JSON.stringify(prices));

    return prices;
  } catch (err) {
    console.error("Fiyat verisi alınamadı, cache kullanılacak:", err);
    // Fallback: cache'deki son fiyatı döndür
    return getCacheFallback();
  }
};