// src/components/Portfolio.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box, MenuItem, Select, FormControl, InputLabel,
  TextField, InputAdornment, IconButton, Snackbar, Alert, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Stack, Grid
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import UndoIcon from "@mui/icons-material/Undo";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SellIcon from "@mui/icons-material/Sell";

import { getCryptoPrices } from "../utils/priceService";
import { getLivePrice } from "../utils/priceUtils";
import { saveDailySnapshot } from "../utils/snapshot";

const VARLIK_TURLERI = ["Kripto", "Hisse", "Fon", "Altın", "Döviz", "Eurobond", "Nakit"];
const PARA_BIRIMLERI = ["TL", "USD", "EUR", "GBP", "ALTIN", "BTC", "ETH"];
const emptyAsset = { name: "", type: "", amount: "", buyPrice: "", currency: "TL" };

export default function Portfolio() {
  /* ------------------ STATE ------------------ */
  const [assets, setAssets] = useState([]);
  const [manualPrices, setManualPrices] = useState({});
  const [lastFetchedPrices, setLastFetchedPrices] = useState({});
  const [apiPrices, setApiPrices] = useState({});
  const [assetsWithLivePrices, setAssetsWithLivePrices] = useState([]);

  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const [editIndex, setEditIndex] = useState(null);
  const [editForm, setEditForm] = useState(emptyAsset);
  const [addOpen, setAddOpen] = useState(false);
  const [delIndex, setDelIndex] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [undoData, setUndoData] = useState(null);

  /* ---- alış / satış ---- */
  const [buyIndex, setBuyIndex] = useState(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [buyPriceForBuyIndex, setBuyPriceForBuyIndex] = useState("");

  const [sellIndex, setSellIndex] = useState(null);
  const [sellAmount, setSellAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");

  /* ------------------ EFECT: ilk yükleme ------------------ */
  useEffect(() => {
    setAssets(JSON.parse(localStorage.getItem("taner_assets")) || []);
    setManualPrices(JSON.parse(localStorage.getItem("updatedPrices")) || {});
    setLastFetchedPrices(JSON.parse(localStorage.getItem("lastFetchedPrices")) || {});
    getCryptoPrices().then((prices) => {
      setApiPrices(prices);
      localStorage.setItem("lastFetchedPrices", JSON.stringify(prices));
      setLastFetchedPrices(prices);
    });
  }, []);

  /* ------------------ canlı fiyat güncelle ------------------ */
  useEffect(() => {
    async function updatePrices() {
      const updated = await Promise.all(
        assets.map(async (asset) => ({
          ...asset,
          livePrice: await getLivePrice(asset, manualPrices, apiPrices)
        }))
      );
      setAssetsWithLivePrices(updated);
    }
    if (assets.length) updatePrices();
  }, [assets, manualPrices, apiPrices]);

  /* ------------------ snapshot ------------------ */
  useEffect(() => {
    const updateSnapshot = async () => {
      const manual = JSON.parse(localStorage.getItem("updatedPrices")) || {};
      const api    = await getCryptoPrices();
      const raw    = JSON.parse(localStorage.getItem("taner_assets")) || [];

      const withPrices = await Promise.all(
        raw.map(async (a) => ({
          ...a,
          price: await getLivePrice(a, manual, lastFetchedPrices, api)
        }))
      );
      const total = withPrices.reduce(
        (s, a) => s + (a.price || 0) * (parseFloat(a.amount) || 0), 0
      );
      saveDailySnapshot(total, withPrices);
    };
    updateSnapshot();
  }, []); // sadece mount

  /* ------------------ MEMO’lar ------------------ */
  const filteredAssets = useMemo(() => {
    return assetsWithLivePrices.filter(a => {
      const t = filter ? a.type === filter : true;
      const s = search ? a.name.toLowerCase().includes(search.toLowerCase()) : true;
      return t && s;
    });
  }, [assetsWithLivePrices, filter, search]);

  const totalValue = useMemo(
    () => assetsWithLivePrices.reduce((s,a)=>s+(a.livePrice||0)*parseFloat(a.amount||0),0),
    [assetsWithLivePrices]
  );
  const totalProfit = useMemo(
    () => assetsWithLivePrices.reduce((s,a)=>{
      if(!a.livePrice||!a.buyPrice) return s;
      return s + (a.livePrice - parseFloat(a.buyPrice)) * parseFloat(a.amount||0);
    },0),
    [assetsWithLivePrices]
  );
  const totalPct = totalValue
    ? ((totalProfit / (totalValue - totalProfit)) * 100).toFixed(2)
    : "0.00";

  const portfolioSums = useMemo(() => {
    const t = {};
    filteredAssets.forEach(a=>{
      const cur=a.currency||"TL";
      const p=a.livePrice; const amt=parseFloat(a.amount||0);
      const buy=parseFloat(a.buyPrice||0);
      if(!p||!buy) return;
      if(!t[cur]) t[cur]={value:0,profit:0,buyTotal:0};
      t[cur].value+=p*amt;
      t[cur].profit+=(p-buy)*amt;
      t[cur].buyTotal+=buy*amt;
    });
    Object.values(t).forEach(x=>{
      x.pct=x.buyTotal?((x.value-x.buyTotal)/x.buyTotal)*100:0;
    });
    return t;
  },[filteredAssets]);

  /* ------------------ CRUD helpers ------------------ */
  const handleFormChange = (f,v)=>setEditForm(p=>({...p,[f]:v}));

  const handleEditSave = () => {
    if(!editForm.name||!editForm.amount||!editForm.buyPrice||!editForm.type){
      setSnack({open:true,msg:"Tüm alanlar zorunlu!",severity:"warning"});
      return;
    }
    const up=[...assets]; up[editIndex]=editForm;
    setAssets(up); localStorage.setItem("taner_assets",JSON.stringify(up));
    setEditIndex(null);
    setSnack({open:true,msg:"Varlık güncellendi.",severity:"success"});
  };

  const handleAdd = () => {
    if(!editForm.name||!editForm.amount||!editForm.buyPrice||!editForm.type){
      setSnack({open:true,msg:"Tüm alanlar zorunlu!",severity:"warning"});
      return;
    }
    const up=[...assets,editForm];
    setAssets(up); localStorage.setItem("taner_assets",JSON.stringify(up));
    setAddOpen(false); setEditForm(emptyAsset);
    setSnack({open:true,msg:"Varlık eklendi.",severity:"success"});
  };

  const handleDeleteConfirm = () => {
    const up=[...assets]; const removed=up.splice(delIndex,1)[0];
    setUndoData({index:delIndex,asset:removed});
    setAssets(up); localStorage.setItem("taner_assets",JSON.stringify(up));
    setDelIndex(null);
    setSnack({open:true,msg:"Varlık silindi.",severity:"info"});
  };

  const handleUndo = () => {
    if(!undoData) return;
    const up=[...assets]; up.splice(undoData.index,0,undoData.asset);
    setAssets(up); localStorage.setItem("taner_assets",JSON.stringify(up));
    setUndoData(null);
    setSnack({open:true,msg:"Silme geri alındı.",severity:"success"});
  };

  /* ---- BUY & SELL (kısaltılmadan) ---- */
  const handleBuy = () => {
    const idx = buyIndex;
    if(idx===null || !buyAmount || parseFloat(buyAmount)<=0) return;
    const up=[...assets]; const a=up[idx];
    const amt=parseFloat(a.amount||0); const extra=parseFloat(buyAmount);
    const price = (buyPriceForBuyIndex && parseFloat(buyPriceForBuyIndex)>0)
      ? parseFloat(buyPriceForBuyIndex)
      : (assetsWithLivePrices[idx]?.livePrice || 0);
    if(price<=0){
      setSnack({open:true,msg:"Alış fiyatı yok!",severity:"warning"}); return;
    }
    const totalCost = amt*parseFloat(a.buyPrice||0) + extra*price;
    const newAmt = amt+extra;
    a.amount=newAmt; a.buyPrice=(totalCost/newAmt).toFixed(4);
    setAssets(up); localStorage.setItem("taner_assets",JSON.stringify(up));
    setBuyIndex(null); setBuyAmount(""); setBuyPriceForBuyIndex("");
    setSnack({open:true,msg:"Alım başarılı.",severity:"success"});
  };

  const handleSell = () => {
    const idx=sellIndex;
    if(idx===null || !sellAmount || parseFloat(sellAmount)<=0) return;
    const up=[...assets]; const a=up[idx];
    const amt=parseFloat(a.amount||0); const sell=parseFloat(sellAmount);
    if(sell>amt){
      setSnack({open:true,msg:"Satış miktarı fazla!",severity:"warning"}); return;
    }
    a.amount=(amt-sell).toString();
    if(parseFloat(a.amount)===0) up.splice(idx,1);
    setAssets(up); localStorage.setItem("taner_assets",JSON.stringify(up));
    setSellIndex(null); setSellAmount(""); setSellPrice("");
    setSnack({open:true,msg:"Satış işlemi tamam.",severity:"success"});
  };

  /* ========================================================= RENDER */
  return (
    <Paper sx={{ mt:3, p:2 }}>
      {/* ------------- ÜST KUTULAR ------------- */}
      <Box sx={{ display:"flex", gap:2, flexWrap:"wrap", mb:3 }}>
        <Paper elevation={3} sx={{ p:2, minWidth:180, bgcolor:"#e3f2fd" }}>
          <Typography variant="subtitle2" color="text.secondary">Toplam Değer</Typography>
          <Typography variant="h6" fontWeight={700}>
            {totalValue.toLocaleString()} TL
          </Typography>
        </Paper>
        <Paper elevation={3} sx={{
          p:2, minWidth:180, bgcolor: totalProfit>=0?"#e8f5e9":"#ffebee"
        }}>
          <Typography variant="subtitle2" color="text.secondary">Toplam K/Z</Typography>
          <Typography variant="h6" fontWeight={700}
            color={totalProfit>=0?"green":"red"}>
            {totalProfit>=0?"+":""}{totalProfit.toLocaleString()} TL
          </Typography>
          <Typography variant="body2" color={totalProfit>=0?"green":"red"}>
            %{totalPct}
          </Typography>
        </Paper>
      </Box>

      {/* ---------- Başlık + yeni varlık ---------- */}
      <Box sx={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <Typography variant="h6">📋 Portföyüm</Typography>
        <Button startIcon={<AddCircleIcon/>} variant="contained" size="small"
          onClick={()=>{setAddOpen(true);setEditForm(emptyAsset);}}>
          Yeni Varlık
        </Button>
      </Box>

      {undoData && (
        <Button startIcon={<UndoIcon/>} onClick={handleUndo} sx={{ mt:2 }}>
          Son Silmeyi Geri Al
        </Button>
      )}

      {/* ---------- Filtre / Arama ---------- */}
      <Stack direction="row" spacing={2} sx={{ my:2, flexWrap:"wrap" }}>
        <FormControl size="small" sx={{ minWidth:120 }}>
          <InputLabel>Tür</InputLabel>
          <Select value={filter} label="Tür" onChange={e=>setFilter(e.target.value)}>
            <MenuItem value="">Tümü</MenuItem>
            {VARLIK_TURLERI.map(t=><MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Varlık ara" value={search}
          onChange={e=>setSearch(e.target.value)}
          InputProps={{
            startAdornment:<InputAdornment position="start"><SearchIcon/></InputAdornment>
          }}
        />
      </Stack>

      {/* ---------- TABLO ---------- */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Varlık</TableCell>
              <TableCell>Tür</TableCell>
              <TableCell>Miktar</TableCell>
              <TableCell>Alış</TableCell>
              <TableCell>Güncel</TableCell>
              <TableCell>Toplam</TableCell>
              <TableCell>K/Z</TableCell>
              <TableCell>% K/Z</TableCell>
              <TableCell>Aksiyon</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredAssets.length===0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">Kayıt yok.</TableCell>
              </TableRow>
            )}

            {filteredAssets.map((a,idx)=>{
              const profit = a.livePrice && a.buyPrice
                ? (a.livePrice - parseFloat(a.buyPrice)) * parseFloat(a.amount)
                : 0;
              const buy=parseFloat(a.buyPrice||0);
              const pct = buy && a.livePrice ? ((a.livePrice-buy)/buy)*100 : 0;
              const amt=parseFloat(a.amount||0);
              const tot=a.livePrice ? a.livePrice*amt : 0;
              return (
                <TableRow key={idx} sx={{
                  bgcolor:profit>0?"#e8f5e9":profit<0?"#ffebee":undefined
                }}>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell>{a.amount}</TableCell>
                  <TableCell>{a.buyPrice} {a.currency}</TableCell>
                  <TableCell>
                    {a.livePrice ? `${a.livePrice.toFixed(2)} ${a.currency}` : "-"}
                  </TableCell>
                  <TableCell>
                    {a.livePrice ? `${tot.toFixed(2)} ${a.currency}` : "-"}
                  </TableCell>
                  <TableCell sx={{color:profit>=0?"green":"red"}}>
                    {profit.toFixed(2)} {a.currency}
                  </TableCell>
                  <TableCell sx={{color:pct>=0?"green":"red"}}>
                    {buy ? `${pct.toFixed(2)}%` : "-"}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={()=>handleEdit(idx)}><EditIcon fontSize="small"/></IconButton>
                    <IconButton color="error" onClick={()=>setDelIndex(idx)}><DeleteIcon fontSize="small"/></IconButton>
                    <IconButton color="success" onClick={()=>{setBuyIndex(idx);setBuyAmount("");}}>
                      <ShoppingCartIcon fontSize="small"/></IconButton>
                    <IconButton color="warning" onClick={()=>{setSellIndex(idx);setSellAmount("");}}>
                      <SellIcon fontSize="small"/></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ---------- ALT TOPLAM KUTULARI ---------- */}
      <Box sx={{ mt:3 }}>
        <Typography variant="subtitle1"><b>Alt Toplamlar</b></Typography>
        <Grid container spacing={2}>
          {Object.entries(portfolioSums).map(([cur,v])=>(
            <Grid item key={cur}>
              <Paper sx={{ p:2, minWidth:200 }}>
                <Typography><b>{cur}</b> cinsi</Typography>
                <Typography>Değer: {v.value.toFixed(2)} {cur}</Typography>
                <Typography>
                  K/Z:
                  <span style={{color:v.profit>=0?"green":"red"}}>
                    {v.profit.toFixed(2)} {cur} ({v.pct.toFixed(2)}%)
                  </span>
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ------------------ DIALOG & SNACKBAR ------------------ */}
      {/* ---- Edit ---- */}
      <Dialog open={editIndex!==null} onClose={()=>setEditIndex(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Varlık Düzenle</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt:1 }}>
            <TextField label="Varlık Adı" value={editForm.name}
              onChange={e=>handleFormChange("name",e.target.value)} fullWidth/>
            <FormControl fullWidth>
              <InputLabel>Tür</InputLabel>
              <Select value={editForm.type} label="Tür"
                onChange={e=>handleFormChange("type",e.target.value)}>
                {VARLIK_TURLERI.map(t=><MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Miktar" type="number" value={editForm.amount}
              onChange={e=>handleFormChange("amount",e.target.value)} fullWidth/>
            <TextField label="Alış Fiyatı" type="number" value={editForm.buyPrice}
              onChange={e=>handleFormChange("buyPrice",e.target.value)} fullWidth/>
            <FormControl fullWidth>
              <InputLabel>Para Birimi</InputLabel>
              <Select value={editForm.currency} label="Para Birimi"
                onChange={e=>handleFormChange("currency",e.target.value)}>
                {PARA_BIRIMLERI.map(c=><MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setEditIndex(null)}>İptal</Button>
          <Button variant="contained" onClick={handleEditSave}>Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* ---- Add ---- */}
      <Dialog open={addOpen} onClose={()=>setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Yeni Varlık Ekle</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt:1 }}>
            <TextField label="Varlık Adı" value={editForm.name}
              onChange={e=>handleFormChange("name",e.target.value)} fullWidth/>
            <FormControl fullWidth>
              <InputLabel>Tür</InputLabel>
              <Select value={editForm.type} label="Tür"
                onChange={e=>handleFormChange("type",e.target.value)}>
                {VARLIK_TURLERI.map(t=><MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Miktar" type="number" value={editForm.amount}
              onChange={e=>handleFormChange("amount",e.target.value)} fullWidth/>
            <TextField label="Alış Fiyatı" type="number" value={editForm.buyPrice}
              onChange={e=>handleFormChange("buyPrice",e.target.value)} fullWidth/>
            <FormControl fullWidth>
              <InputLabel>Para Birimi</InputLabel>
              <Select value={editForm.currency} label="Para Birimi"
                onChange={e=>handleFormChange("currency",e.target.value)}>
                {PARA_BIRIMLERI.map(c=><MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setAddOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleAdd}>Ekle</Button>
        </DialogActions>
      </Dialog>

      {/* ---- Delete ---- */}
      <Dialog open={delIndex!==null} onClose={()=>setDelIndex(null)}>
        <DialogTitle>Silme Onayı</DialogTitle>
        <DialogContent>
          <Typography>
            {assets[delIndex]?.name} varlığını silmek istediğinize emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDelIndex(null)}>İptal</Button>
          <Button color="error" onClick={handleDeleteConfirm}>Sil</Button>
        </DialogActions>
      </Dialog>

      {/* ---- Buy ---- */}
      <Dialog open={buyIndex!==null} onClose={()=>setBuyIndex(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Varlık Alımı</DialogTitle>
        <DialogContent>
          <TextField label="Alınacak Miktar" type="number" fullWidth
            value={buyAmount} onChange={e=>setBuyAmount(e.target.value)} sx={{ mt:2 }}/>
          <TextField label="Alış Fiyatı (opsiyonel)" type="number" fullWidth
            value={buyPriceForBuyIndex} onChange={e=>setBuyPriceForBuyIndex(e.target.value)} sx={{ mt:2 }}/>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setBuyIndex(null)}>İptal</Button>
          <Button variant="contained" onClick={handleBuy}>Al</Button>
        </DialogActions>
      </Dialog>

      {/* ---- Sell ---- */}
      <Dialog open={sellIndex!==null} onClose={()=>setSellIndex(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Varlık Satışı</DialogTitle>
        <DialogContent>
          <TextField label="Satış Miktarı" type="number" fullWidth
            value={sellAmount} onChange={e=>setSellAmount(e.target.value)} sx={{ mt:2 }}/>
          <TextField label="Satış Fiyatı (opsiyonel)" type="number" fullWidth
            value={sellPrice} onChange={e=>setSellPrice(e.target.value)} sx={{ mt:2 }}/>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setSellIndex(null)}>İptal</Button>
          <Button variant="contained" onClick={handleSell}>Sat</Button>
        </DialogActions>
      </Dialog>

      {/* ---- Snackbar ---- */}
      <Snackbar open={snack.open} autoHideDuration={3500}
        onClose={()=>setSnack(s=>({...s,open:false}))}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Paper>
  );
}