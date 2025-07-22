// src/utils/snapshot.js

// Fiyat da kaydediliyor! Fiyat eksikse snapshot alınmaz!
export function saveDailySnapshot(totalValue, assets) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `snapshot_${today}`;

  // Her varlığın fiyatı varsa (0 veya undefined değilse)
  const allHavePrice = assets.every(
    a => a.price !== undefined && a.price !== null && !isNaN(a.price) && a.price > 0
  );

  // Fiyatlar eksikse snapshot alma!
  if (!allHavePrice) {
    // Eğer portföy boşsa veya fiyatlar eksikse snapshot atla!
    console.warn("Snapshot ALINMADI: Varlık fiyatlarında eksik/0 var!");
    return;
  }

  // Eğer aynı gün snapshot alınmamışsa kaydet
  if (!localStorage.getItem(key)) {
    localStorage.setItem(
      key,
      JSON.stringify({
        total: totalValue,
        date: today,
        assets: assets.map(a => ({
          name: a.name,
          type: a.type,
          amount: a.amount,
          buyPrice: a.buyPrice,
          currency: a.currency,
          price: a.price // Fiyat da kaydedilsin!
        }))
      })
    );
  }
}

export function getAllSnapshots() {
  return Object.keys(localStorage)
    .filter(k => k.startsWith("snapshot_"))
    .map(k => JSON.parse(localStorage.getItem(k)))
    .sort((a, b) => a.date.localeCompare(b.date));
}