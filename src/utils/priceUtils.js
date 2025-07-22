import axios from "axios";

export const getLivePrice = async (asset, manualPrices = {}, apiPrices = {}) => {
  if (!asset || !asset.name || !asset.type) return 0;
  const key = asset.name.toUpperCase();

  // 1. Manuel fiyat öncelikli
  const manual = manualPrices[key];
  if (
    manual !== undefined &&
    manual !== null &&
    manual !== "" &&
    !isNaN(parseFloat(manual)) &&
    parseFloat(manual) > 0
  ) {
    return parseFloat(manual);
  }

  // 2. Kripto, Altın, Döviz fiyatı (CoinGecko)
  if (asset.type === "Kripto" && apiPrices[key]) return apiPrices[key];
  if (asset.type === "Altın" && apiPrices.GOLD) return apiPrices.GOLD;
  if (asset.type === "Döviz" && apiPrices[key]) return apiPrices[key];

  // 3. BIST Hisse (Yahoo Finance)
  if (asset.type === "Hisse") {
    try {
      const { data } = await axios.get(`http://localhost:4000/hisse-fiyat?symbol=${key}`);
      const price = data?.price;
      if (price && !isNaN(price)) return parseFloat(price);
      return 0;
    } catch { return 0; }
  }

  // 4. Fon (TEFAS scraping)
  if (asset.type === "Fon") {
    try {
      const { data } = await axios.get(`http://localhost:4000/fon-fiyat?code=${key}`);
      const price = data?.price;
      if (price && !isNaN(price)) return parseFloat(price);
      return 0;
    } catch { return 0; }
  }

  // 5. Hiçbir şey bulunamazsa sıfır
  return 0;
};