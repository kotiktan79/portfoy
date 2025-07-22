import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

function GptPromptGenerator({ totalValue, riskLevel, chartData, assetTargets, portfolioHistory }) {
  const today = new Date().toISOString().split('T')[0];

  const prompt = `
Sen deneyimli bir yatırım danışmanısın. Aşağıdaki veriler ${today} tarihi itibarıyla bana ait portföy bilgilerini temsil ediyor. Lütfen 3 maddelik sade yatırım önerisi üret:

Toplam Portföy Değeri: ${totalValue.toLocaleString('tr-TR')} ₺
Risk Seviyesi: ${riskLevel} / 10

Varlık Dağılımı:
${chartData.map(item => `- ${item.name}: %${item.percentage.toFixed(1)} (Hedef: %${assetTargets[item.name]?.target ?? 0})`).join('\n')}

Portföy Değeri Geçmişi (Son 5 gün):
${portfolioHistory.slice(-5).map(h => `- ${h.date}: ${h.value.toLocaleString('tr-TR')} ₺`).join('\n')}

Yorumların şunları kapsamalı:
- Hangi varlıklardan azaltılmalı/artırılmalı?
- Risk seviyesi uygun mu?
- Rebalance yapılmalı mı?
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        GPT Yatırım Tavsiyesi İçin Prompt Oluştur
      </Typography>

      <TextField
        multiline
        fullWidth
        rows={14}
        value={prompt}
        variant="outlined"
        sx={{ fontFamily: 'monospace' }}
      />

      <Button 
        variant="contained" 
        onClick={handleCopy} 
        startIcon={<ContentCopyIcon />} 
        sx={{ mt: 2 }}
      >
        Panoya Kopyala
      </Button>
    </Box>
  );
}

export default GptPromptGenerator;