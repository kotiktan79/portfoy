// src/App.jsx
import React, { useEffect, useMemo, useState, lazy, Suspense, useCallback } from "react";
import {
  Tabs, Tab, Box, useMediaQuery, Drawer,
  IconButton, AppBar, Toolbar, Typography, useTheme, CircularProgress
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

const sectionConfigs = [
  { label: "Portföyüm",           icon: DashboardIcon,          loader: () => import("./components/Portfolio") },
  { label: "Varlık Ekle",         icon: AddCircleIcon,          loader: () => import("./components/AddAsset") },
  { label: "Grafikler",           icon: PieChartIcon,           loader: () => import("./components/Charts") },
  { label: "Ayarlar",             icon: SettingsIcon,           loader: () => import("./components/Settings") },
  { label: "Fiyat Güncelle",      icon: EditNoteIcon,           loader: () => import("./components/UpdatePrice") },
  { label: "GPT Tavsiye",         icon: AutoAwesomeIcon,        loader: () => import("./components/GptAdvice") },
  { label: "Yedekle / Yükle",     icon: FileUploadIcon,         loader: () => import("./components/ExportImport") },
  { label: "Portföy Özeti",       icon: SummarizeIcon,          loader: () => import("./components/SummaryPanel") },
  { label: "Günlük Değişim",      icon: TodayIcon,              loader: () => import("./components/DailyChange") },
  { label: "Rebalance",           icon: SyncAltIcon,            loader: () => import("./components/RebalancePanel") },
  { label: "Canlı Dashboard",     icon: MonitorIcon,            loader: () => import("./components/LiveDashboard") },
  { label: "Smart Advisor",       icon: TipsAndUpdatesIcon,     loader: () => import("./components/SmartAdvisor") },
  { label: "🔔 Uyarılar",          icon: NotificationsActiveIcon, loader: () => import("./components/AlertSystem") },
  { label: "Haftalık Özet",       icon: DateRangeIcon,          loader: () => import("./components/WeeklySummary") },
  { label: "Fon & Hisse Öneri",   icon: InsightsIcon,           loader: () => import("./components/FundStockSuggestion") },
  { label: "Dashboard",           icon: DashboardIcon,          loader: () => import("./components/DashboardOverview") },
  { label: "GPT Sohbet",          icon: ChatIcon,               loader: () => import("./components/GptChat") },
  { label: "Yerel Sohbet",        icon: ComputerIcon,           loader: () => import("./components/LocalLLMChat") }
];

const withPreloadableLazy = (loader) => {
  let preloadPromise;

  const load = () => {
    if (!preloadPromise) {
      preloadPromise = loader().then((module) => ({
        default: module.default ?? module
      }));
    }
    return preloadPromise;
  };

  const Component = lazy(load);
  Component.preload = load;

  return Component;
};

const sections = sectionConfigs.map(({ loader, icon, ...rest }) => {
  const Component = withPreloadableLazy(loader);

  return {
    ...rest,
    Icon: icon,
    Component
  };
});

export default function App() {
  const theme     = useTheme();
  const isMobile  = useMediaQuery("(max-width:768px)");
  const [tabIdx, setTabIdx] = useState(0);
  const [drawer,  setDrawer] = useState(false);
  const ActiveComponent = useMemo(() => sections[tabIdx].Component, [tabIdx]);

  /* seansı hatırla */
  useEffect(()=>{
    const saved = Number(localStorage.getItem("activeTab"))||0;
    if (saved < sections.length) setTabIdx(saved);
  },[]);
  useEffect(()=>localStorage.setItem("activeTab",tabIdx),[tabIdx]);

  const handleTab = useCallback((_, i) => {
    sections[i]?.Component.preload();
    setTabIdx(i);
    if (isMobile) setDrawer(false);
  }, [isMobile]);

  /* aktif sekmeye ait bileşeni ve bir sonrakini önceden yükle */
  useEffect(() => {
    sections[tabIdx]?.Component.preload();

    const next = tabIdx + 1;
    if (next < sections.length) {
      sections[next].Component.preload();
    }
  }, [tabIdx]);

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
        <Tab key={s.label}
          icon={<s.Icon/>}
          iconPosition="start"
          label={s.label}
          onFocus={() => s.Component.preload()}
          onMouseEnter={() => s.Component.preload()}
          onTouchStart={() => s.Component.preload()}
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
          <Suspense
            fallback={
              <Box sx={{display:"flex",justifyContent:"center",alignItems:"center",height:"100%"}}>
                <CircularProgress size={32}/>
              </Box>
            }
          >
            <ActiveComponent/>
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}
