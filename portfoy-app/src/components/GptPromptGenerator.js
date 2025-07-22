import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Snackbar,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { format } from 'date-fns';
import trLocale from 'date-fns/locale/tr';

export default function GptPromptGenerator({
  totalValue,
  riskLevel,
  chartData,
  assetTargets,
  portfolioHistory,
}) {
  const [copied, setCopied] = useState(false);

  // Format today with locale
  const today = useMemo(
    () => format(new Date(), 'yyyy-MM-dd', { locale: trLocale }),
    []
  );

  // Build prompt string
  const prompt = useMemo(() => {
    const header = `Sen deneyimli bir yatırım danışmanısın. Aşağıdaki veriler ${today} tarihi itibarıyla bana ait portföy bilgilerini temsil ediyor. Lütfen 3 maddelik sade yatırım önerisi üret:`;
    const summary = [
      `Toplam Portföy Değeri: ${totalValue.toLocaleString('tr-TR')} ₺`,
      `Risk Seviyesi: ${riskLevel} / 10`,
    ].join('\n');

    const allocation = ['Varlık Dağılımı:']
      .concat(
        chartData.map(item =>
          `- ${item.name}: %${item.percentage.toFixed(1)} (Hedef: %${
            assetTargets[item.name]?.target ?? 0
          })`
        )
      )
      .join('\n');

    const history = ['Portföy Değeri Geçmişi (Son 5 gün):']
      .concat(
        portfolioHistory.slice(-5).map(h =>
          `- ${h.date}: ${h.value.toLocaleString('tr-TR')} ₺`
        )
      )
      .join('\n');

    const footer = [
      'Yorumların şunları kapsamalı:',
      '- Hangi varlıklardan azaltılmalı/artırılmalı?',
      '- Risk seviyesi uygun mu?',
      '- Rebalance yapılmalı mı?',
    ].join('\n');

    return [header, summary, allocation, history, footer].join('\n\n');
  }, [today, totalValue, riskLevel, chartData, assetTargets, portfolioHistory]);

  // Reset copy state after snackbar auto-hide
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <Card elevation={4} sx={{ borderRadius: 2, overflow: 'visible' }}>
      <CardContent sx={{ p: 3 }}>        
        <Typography variant="h6" gutterBottom>
          GPT Yatırım Tavsiyesi İçin Prompt Oluştur
        </Typography>

        <Box component={TextField}
          multiline
          fullWidth
          rows={14}
          value={prompt}
          variant="outlined"
          InputProps={{ sx: { fontFamily: 'monospace', whiteSpace: 'pre-wrap' } }}
        />

        <Button
          variant="contained"
          onClick={handleCopy}
          startIcon={<ContentCopyIcon />}
          sx={{ mt: 2 }}
        >
          Panoya Kopyala
        </Button>

        <Snackbar
          open={copied}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          autoHideDuration={3000}
        >
          <Alert severity="success" elevation={6} variant="filled">
            Prompt panoya kopyalandı!
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}

GptPromptGenerator.propTypes = {
  totalValue: PropTypes.number.isRequired,
  riskLevel: PropTypes.number.isRequired,
  chartData: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string, percentage: PropTypes.number })
  ).isRequired,
  assetTargets: PropTypes.objectOf(
    PropTypes.shape({ target: PropTypes.number })
  ),
  portfolioHistory: PropTypes.arrayOf(
    PropTypes.shape({ date: PropTypes.string, value: PropTypes.number })
  ).isRequired,
};

GptPromptGenerator.defaultProps = {
  assetTargets: {},
};