import React, { useState, useEffect } from "react";
import {
  Paper, Typography, TextField, Button, Divider,
  Box, List, ListItem, ListItemText, IconButton, CircularProgress
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { getCryptoPrices } from "../utils/priceService";
import { getLivePrice } from "../utils/priceUtils";

const SORU_ORNEKLERI = [
  "Toplam portföy büyüklüğüm ne?",
  "En çok kazandıran varlıklarım hangileri?",
  "En çok zararda olan varlıklarım hangileri?",
  "Kripto oranım ne?",
  "Portföyümün dağılımı nasıl?",
  "Riskli varlıklarım var mı?"
];

export default function GptChat() {
  const [input, setInput] = useState("");
  const [chat, setChat]   = useState([]);
  const [assets, setAssets]         = useState([]);
  const [manualPrices, setManual]   = useState({});
  const [apiPrices, setApi]         = useState({});
  const [livePrices, setLive]       = useState({});
  const [loading, setLoading]       = useState(false);

  /* -------------------------------------------------- */
  /* 1) LOCAL DATA + API PRICES                         */
  /* -------------------------------------------------- */
  useEffect(() => {
    setAssets(JSON.parse(localStorage.getItem("taner_assets")) || []);
    setManual(JSON.parse(localStorage.getItem("updatedPrices")) || {});
    getCryptoPrices().then(setApi);           // Altın / Döviz / Kripto API
  }, []);

  /* -------------------------------------------------- */
  /* 2) BULK LIVE PRICES (hisse & fon vs.)              */
  /* -------------------------------------------------- */
  useEffect(() => {
    async function fetchAll() {
      const obj = {};
      for (const a of assets) {
        obj[a.name.toUpperCase()] = await getLivePrice(a, manualPrices, apiPrices);
      }
      setLive(obj);
    }
    if (assets.length) fetchAll();
  }, [assets, manualPrices, apiPrices]);

  /* -------------------------------------------------- */
  /* 3) YARDIMCI HESAPLAR                               */
  /* -------------------------------------------------- */
  const f = (a) => {
    const k = a.name.toUpperCase();
    return livePrices[k] || manualPrices[k] || apiPrices[k] || parseFloat(a.buyPrice) || 0;
  };
  const totalTL = assets.reduce((s, a) => s + f(a) * a.amount, 0);

  const pctOf = (type) => {
    const part = assets.filter(x => x.type === type)
                       .reduce((s, a) => s + f(a) * a.amount, 0);
    return totalTL ? (part / totalTL * 100).toFixed(1) : "0.0";
  };

  /* -------------------------------------------------- */
  /* 4) SORU-CEVAP MOTORU                               */
  /* -------------------------------------------------- */
  const answerMe = () => {
    if (!input.trim()) return;
    const q = input.toLowerCase();
    let a  = "";

    if (q.includes("toplam")) {
      a = `📊 Toplam portföy: ${totalTL.toLocaleString()} TL.`;
    }
    else if (q.includes("kripto oran")) {
      a = `💹 Kripto oranınız ≈ %${pctOf("Kripto")}.`;
    }
    else if (q.includes("dağılım")) {
      const types = ["Kripto","Hisse","Fon","Döviz","Altın"];
      a = "Portföy dağılımı: " + types.map(t=>`${t} %${pctOf(t)}`).join(" | ");
    }
    else if (q.includes("kazandıran")) {
      const g = assets.map(a=>{
                 const p=f(a), diff=((p-a.buyPrice)/a.buyPrice)*100;
                 return {...a,pct:diff};
               }).filter(x=>x.pct>5)
                 .sort((x,y)=>y.pct-x.pct)
                 .map(x=>`${x.name} +%${x.pct.toFixed(1)}`);
      a = g.length? `🚀 Kazananlar: ${g.join(", ")}` : "Şu an %5 üstü kazanan yok.";
    }
    else if (q.includes("zarar")) {
      const l = assets.map(a=>{
                 const p=f(a), diff=((p-a.buyPrice)/a.buyPrice)*100;
                 return {...a,pct:diff};
               }).filter(x=>x.pct<-5)
                 .sort((x,y)=>x.pct-y.pct)
                 .map(x=>`${x.name} -%${Math.abs(x.pct).toFixed(1)}`);
      a = l.length? `📉 Zarardakiler: ${l.join(", ")}` : "Önemli zararda varlık yok.";
    }
    else if (q.includes("riskli")) {
      const r = assets.filter(a=>{
                 const p=f(a), diff=((p-a.buyPrice)/a.buyPrice)*100;
                 return diff<-15 || (a.type==="Kripto" && Math.abs(diff)>12);
               }).map(x=>x.name);
      a = r.length? `⚠️ Riskli varlık(lar): ${r.join(", ")}` : "Öne çıkan riskli varlık yok.";
    }
    else a = "Daha spesifik bir soru sorabilirsiniz.";

    setChat(c=>[...c,{q:input,a}]);
    setInput("");
  };

  /* -------------------------------------------------- */
  /* 5) UI                                              */
  /* -------------------------------------------------- */
  return (
    <Paper sx={{p:3,mt:3,maxWidth:950}}>
      <Typography variant="h6">🤖 GPT-Benzeri Yerel Portföy Asistanı</Typography>
      <Divider sx={{my:2}}/>
      <Box sx={{display:"flex",gap:2}}>
        <TextField
          fullWidth label="Soru"
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter" && answerMe()}
        />
        <Button variant="contained" onClick={answerMe}>Sor</Button>
        <IconButton color="error" onClick={()=>setChat([])}><DeleteIcon/></IconButton>
      </Box>

      {!Object.keys(livePrices).length && assets.length>0 && (
        <Box sx={{py:2,display:"flex",gap:1,alignItems:"center"}}>
          <CircularProgress size={18}/><Typography>Canlı fiyatlar alınıyor…</Typography>
        </Box>
      )}

      <Typography sx={{mt:2,mb:1,fontWeight:600}}>Örnek sorular:</Typography>
      <Box sx={{display:"flex",flexWrap:"wrap",gap:1,mb:2}}>
        {SORU_ORNEKLERI.map((q,i)=>(
          <Button key={i} size="small" variant="outlined"
                  onClick={()=>setInput(q)}>
            {q}
          </Button>
        ))}
      </Box>

      <List>
        {[...chat].reverse().map((item,i)=>(
          <ListItem key={i} sx={{flexDirection:"column",alignItems:"flex-start"}}>
            <ListItemText primary="❓ Soru" secondary={item.q}/>
            <ListItemText primary="💬 Yanıt" secondary={item.a} sx={{color:"#1976d2"}}/>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}