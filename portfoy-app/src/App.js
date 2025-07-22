// src/App.js
import React, { useState, useEffect } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GptPromptGenerator from './components/GptPromptGenerator';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import RebalanceTab from './components/RebalanceTab';
import axios from 'axios';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Container, 
  Tabs, 
  Tab, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  InputAdornment,
  LinearProgress,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Label
} from 'recharts';
import * as XLSX from 'xlsx';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import RiskAnalysisIcon from '@mui/icons-material/Assessment';

// Temel tema oluşturma
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32',
    },
    secondary: {
      main: '#ff6f00',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 'bold',
        }
      }
    }
  }
});

// Varlık tipleri ve hedef yüzdeleri
const DEFAULT_ASSET_TYPES = {
  Hisse: { target: 35, color: '#0088FE' },
  Kripto: { target: 10, color: '#00C49F' },
  USD: { target: 20, color: '#FFBB28' },
  Altın: { target: 10, color: '#FF8042' },
  Fon: { target: 10, color: '#8884D8' },
  Eurobond: { target: 15, color: '#82CA9D' },
};

const COLORS = Object.values(DEFAULT_ASSET_TYPES).map(type => type.color);

// Ana uygulama bileşeni
function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [assets, setAssets] = useState([]);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: Object.keys(DEFAULT_ASSET_TYPES)[0],
    amount: '',
    price: '',
    target: '',
  });
  const [totalValue, setTotalValue] = useState(0);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [assetTargets, setAssetTargets] = useState(() => {
    const savedTargets = localStorage.getItem('assetTargets');
    return savedTargets ? JSON.parse(savedTargets) : DEFAULT_ASSET_TYPES;
  });
  const [portfolioHistory, setPortfolioHistory] = useState(() => {
    const savedHistory = localStorage.getItem('portfolioHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  // Sayfa yüklendiğinde localStorage'dan verileri çek
  useEffect(() => {
    const savedAssets = localStorage.getItem('portfolioAssets');
    if (savedAssets) {
      setAssets(JSON.parse(savedAssets));
    }
    
    const savedTargets = localStorage.getItem('assetTargets');
    if (savedTargets) {
      setAssetTargets(JSON.parse(savedTargets));
    }
    
    const savedHistory = localStorage.getItem('portfolioHistory');
    if (savedHistory) {
      setPortfolioHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Varlıklar değiştiğinde localStorage'a kaydet ve toplam değeri hesapla
  useEffect(() => {
    localStorage.setItem('portfolioAssets', JSON.stringify(assets));
    
    // Sadece amount > 0 olan varlıkları hesapla
    const validAssets = assets.filter(asset => parseFloat(asset.amount) > 0);
    const total = validAssets.reduce((sum, asset) => 
      sum + (parseFloat(asset.amount) * parseFloat(asset.price)), 0);
    setTotalValue(total);
    
    // Portföy geçmişini güncelle
    if (validAssets.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const historyEntry = {
        date: today,
        value: total,
        distribution: prepareChartData(validAssets, total)
      };
      
      const existingIndex = portfolioHistory.findIndex(entry => entry.date === today);
      let newHistory = [...portfolioHistory];
      
      if (existingIndex >= 0) {
        newHistory[existingIndex] = historyEntry;
      } else {
        newHistory = [...portfolioHistory, historyEntry];
      }
      
      setPortfolioHistory(newHistory);
      localStorage.setItem('portfolioHistory', JSON.stringify(newHistory));
    }
  }, [assets]);

  // Sekme değişimi
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Form input değişiklikleri
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAsset({
      ...newAsset,
      [name]: value,
    });
  };

  // Yeni varlık ekleme
  const handleAddAsset = () => {
    if (!newAsset.name || !newAsset.amount || !newAsset.price) {
      showToast('Lütfen zorunlu alanları doldurun!', 'error');
      return;
    }
    
    // Target boşsa varsayılan değeri kullan
    const targetValue = newAsset.target || assetTargets[newAsset.type]?.target || DEFAULT_ASSET_TYPES[newAsset.type].target;
    
    const asset = {
      ...newAsset,
      id: Date.now(),
      target: parseFloat(targetValue),
      amount: parseFloat(newAsset.amount),
      price: parseFloat(newAsset.price),
      dateAdded: new Date().toISOString().split('T')[0]
    };
    
    setAssets([...assets, asset]);
    
    // Formu sıfırla
    setNewAsset({
      name: '',
      type: Object.keys(assetTargets)[0],
      amount: '',
      price: '',
      target: '',
    });
    
    showToast('Varlık başarıyla eklendi!', 'success');
  };

  // Varlık silme
  const handleDeleteAsset = (id) => {
    setAssets(assets.filter(asset => asset.id !== id));
    showToast('Varlık silindi!', 'info');
  };

  // Toast göster
  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Toast kapat
  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  // Excel dosyası yükleme
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const newAssets = jsonData
        .filter(row => {
          const miktar = parseFloat(row.miktar);
          const satisMiktar = parseFloat(row.satisMiktar);
          const satildiMi = row.satisTarihi && !isNaN(satisMiktar) && satisMiktar >= miktar;
          
          return assetTargets[row.varlikTipi] && !isNaN(miktar) && miktar > 0 && !satildiMi;
        })        
          .map(row => ({
            id: Date.now() + Math.random(),
            name: row.kod,
            type: row.varlikTipi,
            amount: parseFloat(row.miktar),
            price: parseFloat(row.guncelFiyat),
            target: row.target || assetTargets[row.varlikTipi]?.target || DEFAULT_ASSET_TYPES[row.varlikTipi].target,
            dateAdded: new Date().toISOString().split('T')[0]
          }));

        setAssets([...assets, ...newAssets]);
        e.target.value = null; // Aynı dosyayı tekrar yükleyebilmek için
        showToast(`${newAssets.length} varlık başarıyla yüklendi!`, 'success');
      } catch (error) {
        showToast('Excel dosyası okunurken hata oluştu!', 'error');
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

// --- Rebalance hesaplamaları ---
const calculateRebalanceData = () => {
  const valid = assets.filter(a => parseFloat(a.amount) > 0);

  // 1) Tip bazında toplam yüzdeleri hesapla
  const typeTotals = {};
  valid.forEach(asset => {
    const value = asset.amount * asset.price;
    if (!typeTotals[asset.type]) typeTotals[asset.type] = 0;
    typeTotals[asset.type] += value;
  });
  // normalize ederek yüzdeye çevir
  Object.keys(typeTotals).forEach(type => {
    typeTotals[type] = totalValue > 0
      ? (typeTotals[type] / totalValue) * 100
      : 0;
  });

  // 2) Varlık bazında rebalance
  const assetRebalance = valid.map(asset => {
    const currentValue = asset.amount * asset.price;
    const currentPercentage = totalValue > 0
      ? (currentValue / totalValue) * 100
      : 0;

    // Tip hedefi
    const typeTarget = assetTargets[asset.type].target; // örn. 35%
    // O tipin toplam mevcut yüzdesi
    const typeCurrentPct = typeTotals[asset.type] || 0;

    // O varlığın hedef yüzdesi = tip hedefi * (varlığın payı / tipin toplam payı)
    const targetPercentage = typeCurrentPct > 0
      ? typeTarget * (currentPercentage / typeCurrentPct)
      : 0;

    const difference = currentPercentage - targetPercentage;

    let action = 'TUT';
    if (difference > 2)  action = `%${difference.toFixed(2)} azalt (SAT)`;
    if (difference < -2) action = `%${Math.abs(difference).toFixed(2)} artır (AL)`;

    const tradeAmount = (totalValue > 0 && !isNaN(difference))
      ? (totalValue * difference) / 100
      : 0;

    return {
      ...asset,
      currentValue,
      currentPercentage,
      targetPercentage,
      difference,
      tradeAmount,
      action
    };
  });

  // 3) Varlık tipleri bazında rebalance (değişmedi)
  const typeRebalance = Object.keys(assetTargets).map(type => {
    const arr = valid.filter(a => a.type === type);
    const typeCurrentValue = arr.reduce((sum, a) => sum + a.amount * a.price, 0);
    const currentPercentage = totalValue > 0
      ? (typeCurrentValue / totalValue) * 100
      : 0;
    const targetPercentage = assetTargets[type].target;
    const difference = currentPercentage - targetPercentage;

    let action = 'TUT';
    if (difference > 2)  action = `%${difference.toFixed(2)} azalt (SAT)`;
    if (difference < -2) action = `%${Math.abs(difference).toFixed(2)} artır (AL)`;

    const tradeAmount = (totalValue > 0 && !isNaN(difference))
      ? (totalValue * difference) / 100
      : 0;

    return {
      type,
      currentPercentage,
      targetPercentage,
      difference,
      tradeAmount,
      action,
      currentValue: typeCurrentValue
    };
  });

  return { assetRebalance, typeRebalance };
};
// -----------------------------------

// Risk analizi
const prepareChartData = (assetsToUse = assets, totalVal = totalValue) => {
  const tipRiskleri = {
    Hisse: 8,
    Kripto: 9,
    USD: 2,
    Altın: 4,
    Fon: 6,
    Eurobond: 3
  };

  const validAssets = assetsToUse.filter(asset => parseFloat(asset.amount) > 0);

  const typeValues = {};
  validAssets.forEach(asset => {
    const value = asset.amount * asset.price;
    if (typeValues[asset.type]) {
      typeValues[asset.type] += value;
    } else {
      typeValues[asset.type] = value;
    }
  });

  return Object.keys(typeValues).map(type => ({
    name: type,
    value: typeValues[type],
    percentage: totalVal > 0 ? (typeValues[type] / totalVal * 100) : 0,
    target: assetTargets[type]?.target || DEFAULT_ASSET_TYPES[type].target,
    color: assetTargets[type]?.color || DEFAULT_ASSET_TYPES[type].color,
    risk: tipRiskleri[type] ?? 5
  }));
}; 

const calculateProfitLoss = () => {
  // Satılmış varlıkları bul
  const soldAssets = assets.filter(asset =>
    asset.satisMiktar !== undefined &&
    asset.satisTarihi &&
    parseFloat(asset.satisMiktar) > 0
  );
  // Her biri için kâr/zarar hesapla
  return soldAssets.map(asset => {
    const alisFiyat = parseFloat(asset.alisFiyat || asset.alis || asset.price); // alış fiyatı
    const satisFiyat = parseFloat(asset.satisFiyat || asset.satis || asset.price); // satış fiyatı
    const satisMiktar = parseFloat(asset.satisMiktar); // ne kadar satıldı
    if (!alisFiyat || !satisFiyat || !satisMiktar) return null;
    const karTL = (satisFiyat - alisFiyat) * satisMiktar; // kaç TL kazanç/zarar
    const karYuzde = ((satisFiyat - alisFiyat) / alisFiyat) * 100; // yüzde kâr/zarar
    return {
      name: asset.name,
      alisFiyat,
      satisFiyat,
      satisMiktar,
      karTL,
      karYuzde,
      tarih: asset.satisTarihi
    };
  }).filter(Boolean);
};



const calculateRiskAnalysis = () => {
  const tipRiskleri = {
    Hisse: 8,
    Kripto: 9,
    USD: 2,
    Altın: 4,
    Fon: 6,
    Eurobond: 3
  };

  const dagilim = prepareChartData();
  if (dagilim.length === 0 || totalValue === 0) return 0;

  let toplamRisk = 0;
  dagilim.forEach(tip => {
    const agirlik = tip.value / totalValue;
    const riskPuani = tipRiskleri[tip.name] ?? 5;
    toplamRisk += agirlik * riskPuani;
  });

  return toplamRisk.toFixed(1);
};

  const chartData = prepareChartData();
  const rebalanceData = calculateRebalanceData();
  const riskLevel = calculateRiskAnalysis();
  const profitLossData = calculateProfitLoss();

  // Hedef ayarlarını güncelle
  const handleTargetChange = (type, value) => {
    setAssetTargets(prev => ({
      ...prev,
      [type]: { ...prev[type], target: parseFloat(value) }
    }));
  };

  // Hedef ayarlarını kaydet
  const saveTargetSettings = () => {
    localStorage.setItem('assetTargets', JSON.stringify(assetTargets));
    setSettingsOpen(false);
    showToast('Hedef ayarları güncellendi!', 'success');
    
    // Varlıklardaki hedef yüzdelerini güncelle
    setAssets(prev => prev.map(asset => {
      if (assetTargets[asset.type]) {
        return { ...asset, target: assetTargets[asset.type].target };
      }
      return asset;
    }));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Portföy Yöneticisi
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Varlıklarınızı takip edin ve optimize edin
            </Typography>
          </Box>
          
          <Box>
            <Tooltip title="Portföy Geçmişi">
              <IconButton 
                color="primary" 
                sx={{ mr: 1 }}
                onClick={() => setHistoryOpen(true)}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Hedef Ayarları">
              <IconButton 
                color="primary" 
                sx={{ mr: 1 }}
                onClick={() => setSettingsOpen(true)}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Risk Analizi">
              <IconButton color="primary">
                <RiskAnalysisIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              bgcolor: 'background.paper', 
              borderRadius: 2, 
              boxShadow: 1,
              px: 2,
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: '2px 2px 0 0',
              }
            }}
          >
            <Tab label="Portföy" sx={{ fontWeight: 'bold', py: 2 }} />
            <Tab label="Rebalance" sx={{ fontWeight: 'bold', py: 2 }} />
            <Tab label="Risk Analizi" sx={{ fontWeight: 'bold', py: 2 }} />
            <Tab label="GPT Önerisi" icon={<SmartToyIcon />} sx={{ fontWeight: 'bold', py: 2 }} />
          </Tabs>
        </Box>

        {activeTab === 0 && (
  <>
    <PortfolioTab
      assets={assets}
      newAsset={newAsset}
      handleInputChange={handleInputChange}
      handleAddAsset={handleAddAsset}
      handleDeleteAsset={handleDeleteAsset}
      handleFileUpload={handleFileUpload}
      chartData={chartData}
      totalValue={totalValue}
      assetTypes={Object.keys(assetTargets)}
    />
    {/* --- Kar/Zarar Tablosu Portföy'ün Altında --- */}
    <ProfitLossTable profitLossData={profitLossData} />
  </>
)} 

      {activeTab === 3 && (
  <GptPromptGenerator 
    totalValue={totalValue}
    riskLevel={riskLevel}
    chartData={chartData}
    assetTargets={assetTargets}
    portfolioHistory={portfolioHistory}
  />
)}  

        {activeTab === 1 && (
          <RebalanceTab 
            rebalanceData={rebalanceData}
            totalValue={totalValue}
            assetTargets={assetTargets}
          />
        )}

        {activeTab === 2 && (
          <RiskAnalysisTab 
            riskLevel={riskLevel}
            chartData={chartData}
          />
        )}

        <Box sx={{ mt: 4, textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>
          <Typography variant="body2">
            © {new Date().getFullYear()} Portföy Yönetim Uygulaması - Tüm veriler tarayıcınızda saklanır
          </Typography>
        </Box>
        
        {/* Toast bildirim */}
        <Snackbar
          open={toast.open}
          autoHideDuration={3000}
          onClose={handleCloseToast}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseToast} 
            severity={toast.severity}
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
        
        {/* Hedef ayarları dialog */}
        <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
          <DialogTitle>Varlık Tipi Hedef Ayarları</DialogTitle>
          <DialogContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Varlık Tipi</TableCell>
                    <TableCell align="right">Hedef (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(assetTargets).map(([type, data]) => (
                    <TableRow key={type}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            bgcolor: data.color, 
                            borderRadius: '50%',
                            mr: 1
                          }} />
                          {type}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={data.target}
                          onChange={(e) => handleTargetChange(type, e.target.value)}
                          size="small"
                          sx={{ width: 100 }}
                          inputProps={{ min: 0, max: 100, step: 0.1 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsOpen(false)}>İptal</Button>
            <Button 
              variant="contained" 
              onClick={saveTargetSettings}
              sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Portföy geçmişi dialog */}
        <Dialog 
          open={historyOpen} 
          onClose={() => setHistoryOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            Portföy Geçmişi
            <IconButton
              aria-label="close"
              onClick={() => setHistoryOpen(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {portfolioHistory.length > 0 ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Değer Değişimi</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={portfolioHistory}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date">
                      <Label value="Tarih" position="bottom" offset={0} />
                    </XAxis>
                    <YAxis>
                      <Label value="Portföy Değeri (₺)" angle={-90} position="left" offset={-10} />
                    </YAxis>
                    <RechartsTooltip 
                      formatter={(value) => [`${value.toLocaleString('tr-TR')} ₺`, 'Değer']}
                      labelFormatter={(value) => `Tarih: ${value}`}
                    />
                    <Bar dataKey="value" fill="#2e7d32" name="Portföy Değeri" />
                  </BarChart>
                </ResponsiveContainer>
                
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Dağılım Değişimi</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {portfolioHistory.map((entry, index) => (
                    <Box key={index} sx={{ flex: '1 1 200px' }}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>{entry.date}</Typography>
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie
                            data={entry.distribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={50}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                          >
                            {entry.distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => [`${value.toLocaleString('tr-TR')} ₺`, 'Değer']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6">Portföy geçmişi bulunamadı</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Portföyünüze varlık ekleyerek geçmiş veri oluşturabilirsiniz
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}

// Portföy Sekmesi
function PortfolioTab({
  assets, 
  newAsset, 
  handleInputChange, 
  handleAddAsset, 
  handleDeleteAsset, 
  handleFileUpload,
  chartData,
  totalValue,
  assetTypes
}) {
  // Sadece amount > 0 olan varlıkları göster
  const validAssets = assets.filter(asset => parseFloat(asset.amount) > 0);

  return (
    <Box>
      <Box sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 3, 
        bgcolor: 'background.paper', 
        boxShadow: 3,
        borderLeft: '4px solid',
        borderColor: 'primary.main'
      }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Yeni Varlık Ekle</Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
          gap: 2,
          mb: 2
        }}>
          <TextField
            label="Varlık Adı"
            name="name"
            value={newAsset.name}
            onChange={handleInputChange}
            size="small"
            required
          />
          
          <TextField
            select
            label="Varlık Tipi"
            name="type"
            value={newAsset.type}
            onChange={handleInputChange}
            SelectProps={{ native: true }}
            size="small"
          >
            {assetTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </TextField>
          
          <TextField
            label="Miktar"
            name="amount"
            type="number"
            value={newAsset.amount}
            onChange={handleInputChange}
            size="small"
            required
          />
          
          <TextField
            label="Fiyat (₺)"
            name="price"
            type="number"
            value={newAsset.price}
            onChange={handleInputChange}
            size="small"
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">₺</InputAdornment>,
            }}
          />
          
          <TextField
            label="Hedef % (Opsiyonel)"
            name="target"
            type="number"
            value={newAsset.target}
            onChange={handleInputChange}
            size="small"
            inputProps={{ min: 0, max: 100 }}
          />
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-end',
            gap: 1
          }}>
            <Button 
              variant="contained" 
              onClick={handleAddAsset}
              sx={{ flexGrow: 1, height: 40 }}
            >
              Varlık Ekle
            </Button>
            
            <Button 
              variant="outlined" 
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ height: 40 }}
            >
              Excel
              <input 
                type="file" 
                hidden 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload} 
              />
            </Button>
          </Box>
        </Box>
      </Box>

      {validAssets.length > 0 ? (
        <>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            gap: 3, 
            mb: 3 
          }}>
            <Box sx={{ 
              flex: 1, 
              p: 3, 
              borderRadius: 3, 
              bgcolor: 'background.paper', 
              boxShadow: 3,
              borderTop: '4px solid',
              borderColor: 'primary.light'
            }}>
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>Portföy Dağılımı</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value.toLocaleString('tr-TR')} ₺`, 'Değer']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            
            <Box sx={{ 
              flex: 1, 
              p: 3, 
              borderRadius: 3, 
              bgcolor: 'background.paper', 
              boxShadow: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box>
                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>Portföy Özeti</Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: 2,
                  mb: 3
                }}>
                  <Box>
                    <Typography variant="subtitle1" color="text.secondary">Toplam Değer:</Typography>
                    <Typography variant="h4" color="primary">
                      {totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" color="text.secondary">Varlık Sayısı:</Typography>
                    <Typography variant="h4">{validAssets.length}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" color="text.secondary">Varlık Tipleri:</Typography>
                    <Typography variant="h4">{Object.keys(DEFAULT_ASSET_TYPES).length}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" color="text.secondary">Ortalama Hedef:</Typography>
                    <Typography variant="h4">
                      {(validAssets.reduce((sum, asset) => sum + asset.target, 0) / validAssets.length).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                  Hedef Dağılımına Uyum:
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={70} 
                  sx={{ 
                    height: 10,
                    borderRadius: 5,
                    mb: 1,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4caf50',
                      borderRadius: 5
                    }
                  }} 
                />
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                  %70 Uyum
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ 
            mb: 3, 
            boxShadow: 3,
            borderRadius: 3,
            overflow: 'hidden'
          }}>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="Varlık tablosu">
                <TableHead sx={{ bgcolor: 'primary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Varlık Adı</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tip</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Miktar</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Fiyat (₺)</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Değer (₺)</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Hedef (%)</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>İşlem</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validAssets.map((asset) => (
                    <TableRow 
                      key={asset.id} 
                      sx={{ 
                        '&:nth-of-type(even)': { bgcolor: 'action.hover' },
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 10, 
                            height: 10, 
                            bgcolor: DEFAULT_ASSET_TYPES[asset.type].color, 
                            borderRadius: '50%',
                            mr: 1
                          }} />
                          {asset.type}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{asset.amount}</TableCell>
                      <TableCell align="right">{asset.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {(asset.amount * asset.price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                      </TableCell>
                      <TableCell align="right">{asset.target}%</TableCell>
                      <TableCell align="center">
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          onClick={() => handleDeleteAsset(asset.id)}
                          startIcon={<DeleteIcon />}
                        >
                          Sil
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      ) : (
        <Box sx={{ 
          p: 4, 
          textAlign: 'center', 
          bgcolor: 'background.paper', 
          borderRadius: 3, 
          boxShadow: 3,
          border: '1px dashed',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Portföyünüzde henüz varlık bulunmamaktadır</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Yeni varlık ekleyerek veya Excel dosyası yükleyerek başlayın.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<CloudUploadIcon />}
            component="label"
          >
            Excel Yükle
            <input 
              type="file" 
              hidden 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload} 
            />
          </Button>
        </Box>
      )}
    </Box>
  );
}

// Rebalance Sekmesi

// Risk Analizi Sekmesi
function RiskAnalysisTab({ riskLevel, chartData }) {
  const riskColor = riskLevel > 6 ? '#f44336' : riskLevel > 4 ? '#ff9800' : '#4caf50';
  const riskLabel = riskLevel > 6 ? 'Yüksek Risk' : riskLevel > 4 ? 'Orta Risk' : 'Düşük Risk';
  
  const riskDescription = {
    low: 'Portföyünüz düşük risk seviyesindedir. Bu, genellikle daha istikrarlı getiriler sağlar, ancak büyüme potansiyeli sınırlı olabilir.',
    medium: 'Portföyünüz orta risk seviyesindedir. Risk ve getiri dengesi iyi kurulmuş, çeşitlendirilmiş bir portföye sahipsiniz.',
    high: 'Portföyünüz yüksek risk seviyesindedir. Potansiyel getiriler yüksek olabilir, ancak dalgalanmalara hazırlıklı olun.'
  };
  
  const currentDescription = riskLevel > 6 ? riskDescription.high : 
                            riskLevel > 4 ? riskDescription.medium : riskDescription.low;

  return (
    <Box>
      <Box sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 3, 
        bgcolor: 'background.paper', 
        boxShadow: 3,
        borderLeft: '4px solid',
        borderColor: '#9c27b0'
      }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Risk Analizi</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Risk analizi, portföyünüzün risk seviyesini 1 (en düşük) ile 10 (en yüksek) arasında değerlendirir. 
          Bu değerlendirme, varlık tiplerinizin risk profiline ve portföyünüzdeki ağırlıklarına göre hesaplanır.
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 2,
          p: 1.5,
          bgcolor: 'grey.100',
          borderRadius: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: '50%' }}></Box>
            <Typography variant="body2" sx={{ ml: 1 }}>Düşük Risk (1-4)</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#ff9800', borderRadius: '50%' }}></Box>
            <Typography variant="body2" sx={{ ml: 1 }}>Orta Risk (5-7)</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', borderRadius: '50%' }}></Box>
            <Typography variant="body2" sx={{ ml: 1 }}>Yüksek Risk (8-10)</Typography>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 3, 
        mb: 3 
      }}>
        <Box sx={{ 
          flex: 1, 
          p: 3, 
          borderRadius: 3, 
          bgcolor: 'background.paper', 
          boxShadow: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>Portföy Risk Seviyesi</Typography>
          
          <Box sx={{ 
            position: 'relative', 
            width: 200, 
            height: 200, 
            mb: 3
          }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: `conic-gradient(
                #4caf50 0% 40%,
                #ff9800 40% 70%,
                #f44336 70% 100%
              )`,
              mask: 'radial-gradient(white 55%, transparent 56%)',
              WebkitMask: 'radial-gradient(white 55%, transparent 56%)'
            }} />
            
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <Typography variant="h2" sx={{ 
                fontWeight: 'bold', 
                color: riskColor,
                lineHeight: 1
              }}>
                {riskLevel}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: riskColor }}>
                {riskLabel}
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            {currentDescription}
          </Typography>
        </Box>
        
        <Box sx={{ 
          flex: 1, 
          p: 3, 
          borderRadius: 3, 
          bgcolor: 'background.paper', 
          boxShadow: 3
        }}>
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>Risk Dağılımı</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 10]} />
              <RechartsTooltip />
              <Bar dataKey="risk" fill="#8884d8" name="Risk Seviyesi">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={
                    entry.risk > 7 ? '#f44336' : 
                    entry.risk > 4 ? '#ff9800' : '#4caf50'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Varlık Tipi Riskleri:</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
              {chartData.map((asset, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  p: 1,
                  bgcolor: 'grey.50',
                  borderRadius: 1
                }}>
                  <Box sx={{ 
                    width: 10, 
                    height: 10, 
                    bgcolor: asset.color, 
                    borderRadius: '50%',
                    mr: 1
                  }} />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>{asset.name}</Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'bold',
                    color: asset.risk > 7 ? '#f44336' : 
                           asset.risk > 4 ? '#ff9800' : '#4caf50'
                  }}>
                    {asset.risk}/10
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ 
        p: 3, 
        borderRadius: 3, 
        bgcolor: 'background.paper', 
        boxShadow: 3
      }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Risk Azaltma Önerileri</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Portföyünüzün risk seviyesini düşürmek için aşağıdaki önerileri göz önünde bulundurabilirsiniz:
        </Typography>
        
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <li><Typography variant="body1">Yüksek riskli varlıkların (Kripto, Hisse) ağırlığını azaltın</Typography></li>
          <li><Typography variant="body1">Düşük riskli varlıkların (USD, Eurobond) ağırlığını artırın</Typography></li>
          <li><Typography variant="body1">Portföyünüzü daha fazla çeşitlendirin</Typography></li>
          <li><Typography variant="body1">Düzenli rebalance işlemleri yapın</Typography></li>
          <li><Typography variant="body1">Hedef dağılımınızı gözden geçirin</Typography></li>
        </Box>
        
        <Button 
          variant="contained" 
          sx={{ 
            bgcolor: 'primary.main', 
            '&:hover': { bgcolor: 'primary.dark' },
            px: 4,
            py: 1.5
          }}
        >
          Risk Optimizasyon Planı Oluştur
        </Button>
      </Box>
    </Box>
  );
}

function ProfitLossTable({ profitLossData }) {
  if (!profitLossData.length) {
    return <Typography sx={{ m: 2 }}>Henüz satış işlemi bulunamadı.</Typography>
  }
  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Gerçekleşen Kâr/Zarar Analizi</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Varlık</TableCell>
              <TableCell align="right">Alış Fiyatı</TableCell>
              <TableCell align="right">Satış Fiyatı</TableCell>
              <TableCell align="right">Miktar</TableCell>
              <TableCell align="right">Kâr/Zarar (₺)</TableCell>
              <TableCell align="right">Kâr/Zarar (%)</TableCell>
              <TableCell align="right">Tarih</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profitLossData.map((row, i) => (
              <TableRow key={i}>
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">{row.alisFiyat}</TableCell>
                <TableCell align="right">{row.satisFiyat}</TableCell>
                <TableCell align="right">{row.satisMiktar}</TableCell>
                <TableCell align="right" style={{ color: row.karTL >= 0 ? '#4caf50' : '#f44336', fontWeight: 600 }}>
                  {row.karTL.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell align="right" style={{ color: row.karYuzde >= 0 ? '#4caf50' : '#f44336', fontWeight: 600 }}>
                  {row.karYuzde.toFixed(2)}%
                </TableCell>
                <TableCell align="right">{row.tarih}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default App;