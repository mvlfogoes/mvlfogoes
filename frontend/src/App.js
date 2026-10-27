import { useEffect, useState, createContext, useContext, useCallback } from "react";
import "@/App.css";
import { Toaster } from "sonner";
import { motion } from "framer-motion";
import {
  Flame, LayoutDashboard, Users, ClipboardList, CalendarDays,
  Images, MessageCircle, ShieldCheck, Settings,
} from "lucide-react";
import { api } from "@/lib/api";
import InstallPrompt from "@/components/InstallPrompt";
import Dashboard from "@/pages/Dashboard";
import Clientes from "@/pages/Clientes";
import Ordens from "@/pages/Ordens";
import Agenda from "@/pages/Agenda";
import Midias from "@/pages/Midias";
import WhatsAppCentral from "@/pages/WhatsApp";
import Garantias from "@/pages/Garantias";
import Config from "@/pages/Config";

export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

const NAV = [
  { id: "dashboard", label: "Início", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "os", label: "Ordens", icon: ClipboardList },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "midias", label: "Mídias", icon: Images },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "garantias", label: "Garantias", icon: ShieldCheck },
  { id: "config", label: "Config", icon: Settings },
];

const MOBILE_NAV = ["dashboard", "clientes", "os", "agenda", "whatsapp"];

function App() {
  const [tab, setTab] = useState("dashboard");
  const [clientes, setClientes] = useState([]);
  const [cfg, setCfg] = useState({ tecnico: "MVL Fogões", versao: "2.0" });

  const reloadClientes = useCallback(async () => {
    setClientes(await api.listClientes());
  }, []);

  useEffect(() => {
    reloadClientes();
    api.getConfig().then(setCfg).catch(() => {});
  }, [reloadClientes]);

  const go = (t) => setTab(t);

  const pages = {
    dashboard: <Dashboard />,
    clientes: <Clientes />,
    os: <Ordens />,
    agenda: <Agenda />,
    midias: <Midias />,
    whatsapp: <WhatsAppCentral />,
    garantias: <Garantias />,
    config: <Config />,
  };

  return (
    <AppCtx.Provider value={{ clientes, reloadClientes, cfg, setCfg, go }}>
      <Toaster position="bottom-center" offset={96} mobileOffset={{ bottom: 96 }} theme="dark" richColors />
      <InstallPrompt />
      <div className="min-h-screen md:pl-64 pb-24 md:pb-0">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-64 fixed top-0 bottom-0 left-0 z-40 glass border-r border-orange-500/15 p-5">
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="flame-badge p-2.5 rounded-2xl" style={{ animation: "flamePulse 2.5s ease-in-out infinite" }}>
              <Flame size={24} />
            </div>
            <div>
              <h1 className="font-cond font-extrabold text-2xl leading-none fire-text">MVL FOGÕES</h1>
              <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Gestão Técnica</p>
            </div>
          </div>
          <nav className="space-y-1 flex-1">
            {NAV.map((n) => {
              const act = tab === n.id;
              return (
                <button
                  key={n.id}
                  data-testid={`nav-${n.id}-button`}
                  onClick={() => go(n.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    act ? "fire-btn text-white" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                  }`}
                >
                  <n.icon size={19} /> {n.label}
                </button>
              );
            })}
          </nav>
          <button
            data-testid="nav-config-button-footer"
            onClick={() => go("config")}
            className="text-[11px] font-mono text-zinc-600 px-3 pt-4 border-t border-white/5 text-left"
          >
            v{cfg.versao} · {cfg.tecnico}
          </button>
        </aside>

        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 glass border-b border-orange-500/15 px-4 py-3 flex items-center gap-3">
          <div className="flame-badge p-2 rounded-xl"><Flame size={20} /></div>
          <h1 className="font-cond font-extrabold text-xl fire-text flex-1">MVL FOGÕES</h1>
          <button onClick={() => go("config")} data-testid="mobile-config-button" aria-label="Configurações" className={`p-2 rounded-xl ${tab === "config" ? "text-orange-500 bg-orange-500/10" : "text-zinc-400"}`}><Settings size={20} /></button>
        </header>

        <main className="px-4 md:px-8 py-5 md:py-8 max-w-6xl mx-auto">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {pages[tab]}
          </motion.div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-orange-500/20 px-2 py-2 flex justify-around items-center">
          {NAV.filter((n) => MOBILE_NAV.includes(n.id)).map((n) => {
            const act = tab === n.id;
            return (
              <button
                key={n.id}
                data-testid={`mnav-${n.id}-button`}
                onClick={() => go(n.id)}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold transition ${
                  act ? "text-orange-500 bg-orange-500/10 scale-105" : "text-zinc-500"
                }`}
              >
                <n.icon size={21} /> {n.label}
              </button>
            );
          })}
        </nav>
      </div>
    </AppCtx.Provider>
  );
}

export default App;
