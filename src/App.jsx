// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  Tabs, Tab, Box, useMediaQuery, Drawer,
  IconButton, AppBar, Toolbar, Typography, useTheme
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

/* ---- ikonlar ---- */
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import PieChartIcon from "@mui/icons-material/PieChart";
import SettingsIcon from "@mui/icons-material/Settings";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import SummarizeIcon from "@mui/icons-material/Summarize";
import TodayIcon from "@mui/icons-material/Today";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import MonitorIcon from "@mui/icons-material/Monitor";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import DateRangeIcon from "@mui/icons-material/DateRange";
import InsightsIcon from "@mui/icons-material/Insights";
import ChatIcon from "@mui/icons-material/Chat";
import ComputerIcon from "@mui/icons-material/Computer";

/* ---- bileşenler ---- */
import Portfolio from "./components/Portfolio";
import AddAsset from "./components/AddAsset";
import Charts from "./components/Charts";
import Settings from "./components/Settings";
import UpdatePrice from "./components/UpdatePrice";
import GptAdvice from "./components/GptAdvice";
import ExportImport from "./components/ExportImport";
import SummaryPanel from "./components/SummaryPanel";
import DailyChange from "./components/DailyChange";
import RebalancePanel from "./components/RebalancePanel";
import LiveDashboard from "./components/LiveDashboard";
import SmartAdvisor from "./components/SmartAdvisor";
import AlertSystem from "./components/AlertSystem";
import WeeklySummary from "./components/WeeklySummary";
import FundStockSuggestion from "./components/FundStockSuggestion";
import DashboardOverview from "./components/DashboardOverview";
import GptChat from "./components/GptChat";
import LocalLLMChat from "./components/LocalLLMChat";

const sections = [
  { label: "Portföyüm",           icon: <DashboardIcon/>,        comp: <Portfolio/> },
  { label: "Varlık Ekle",         icon: <AddCircleIcon/>,        comp: <AddAsset/> },
  { label: "Grafikler",           icon: <PieChartIcon/>,         comp: <Charts/> },
  { label: "Ayarlar",             icon: <SettingsIcon/>,         comp: <Settings/> },
  { label: "Fiyat Güncelle",      icon: <EditNoteIcon/>,         comp: <UpdatePrice/> },
  { label: "GPT Tavsiye",         icon: <AutoAwesomeIcon/>,      comp: <GptAdvice/> },
  { label: "Yedekle / Yükle",     icon: <FileUploadIcon/>,       comp: <ExportImport/> },
  { label: "Portföy Özeti",       icon: <SummarizeIcon/>,        comp: <SummaryPanel/> },
  { label: "Günlük Değişim",      icon: <TodayIcon/>,            comp: <DailyChange/> },
  { label: "Rebalance",           icon: <SyncAltIcon/>,          comp: <RebalancePanel/> },
  { label: "Canlı Dashboard",     icon: <MonitorIcon/>,          comp: <LiveDashboard/> },
  { label: "Smart Advisor",       icon: <TipsAndUpdatesIcon/>,   comp: <SmartAdvisor/> },
  { label: "🔔 Uyarılar",          icon: <NotificationsActiveIcon/>, comp: <AlertSystem/> },
  { label: "Haftalık Özet",       icon: <DateRangeIcon/>,        comp: <WeeklySummary/> },
  { label: "Fon & Hisse Öneri",   icon: <InsightsIcon/>,         comp: <FundStockSuggestion/> },
  { label: "Dashboard",           icon: <DashboardIcon/>,        comp: <DashboardOverview/> },
  { label: "GPT Sohbet",          icon: <ChatIcon/>,             comp: <GptChat/> },
  { label: "Yerel Sohbet",        icon: <ComputerIcon/>,         comp: <LocalLLMChat/> }
];

export default function App() {
  const theme     = useTheme();
  const isMobile  = useMediaQuery("(max-width:768px)");
  const [tabIdx, setTabIdx] = useState(0);
  const [drawer,  setDrawer] = useState(false);

  /* seansı hatırla */
  useEffect(()=>{
    const saved = Number(localStorage.getItem("activeTab"))||0;
    if (saved < sections.length) setTabIdx(saved);
  },[]);
  useEffect(()=>localStorage.setItem("activeTab",tabIdx),[tabIdx]);

  const handleTab = (_,i)=>{ setTabIdx(i); if(isMobile) setDrawer(false); };

  /* Tab list */
  const TabList = (
    <Tabs
      orientation={isMobile?"horizontal":"vertical"}
      value={tabIdx}
      onChange={handleTab}
      variant={isMobile?"scrollable":"standard"}
      scrollButtons="auto"
      sx={{
        borderRight: isMobile?0:1, borderColor:"divider",
        minWidth:isMobile?"100%":200,
        pt:isMobile?0:4,
        background:isMobile?"inherit":theme.palette.background.paper
      }}
    >
      {sections.map((s,i)=>(
        <Tab key={s.label} icon={s.icon} iconPosition="start" label={s.label}
          sx={{
            alignItems:"flex-start", justifyContent:"flex-start", px:2,
            ...(tabIdx===i && { bgcolor: theme.palette.action.selected })
          }}
        />
      ))}
    </Tabs>
  );

  return (
    <Box sx={{height:"100vh",display:"flex",flexDirection:"column"}}>
      {/* Mobil AppBar */}
      {isMobile && (
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <IconButton edge="start" onClick={()=>setDrawer(true)}><MenuIcon/></IconButton>
            <Typography variant="h6">Portföy Yönetimi</Typography>
          </Toolbar>
        </AppBar>
      )}

      <Box sx={{flex:1,display:"flex",height:"100%"}}>
        {/* Sol menü */}
        {isMobile
          ? <Drawer anchor="left" open={drawer} onClose={()=>setDrawer(false)}>
              <Box sx={{width:"80vw",p:1}}>{TabList}</Box>
            </Drawer>
          : <Box sx={{minWidth:200}}>{TabList}</Box>
        }

        {/* İçerik */}
        <Box sx={{flex:1,p:2,overflowY:"auto",minWidth:0}}>
          {sections[tabIdx].comp}
        </Box>
      </Box>
    </Box>
  );
}