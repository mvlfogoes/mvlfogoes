import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, Users, Images, CalendarCheck, Plus, UserPlus,
  CalendarPlus, Flame, ArrowRight, CircleDollarSign,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from "recharts";
import { api, fmtBRL, fmtData } from "@/lib/api";
import { Badge, SectionTitle } from "@/lib/ui";
import { useApp } from "@/App";

const statusTone = { pendente: "amber", concluida: "green", garantia: "blue" };
const statusLabel = { pendente: "Pendente", concluida: "Concluída", garantia: "Garantia" };

export default function Dashboard() {
  const { go, cfg } = useApp();
  const [stats, setStats] = useState(null);
  const [ordens, setOrdens] = useState([]);
  const [agenda, setAgenda] = useState([]);

  useEffect(() => {
    api.stats().then(setStats);
    api.listOrdens().then(setOrdens);
    api.listAgenda().then(setAgenda);
  }, []);

  const hojeStr = new Date().toISOString().slice(0, 10);
  const agendaHoje = agenda.filter((a) => a.data === hojeStr && a.status === "agendado");

  const metrics = [
    { k: "OS Abertas", v: stats?.os_abertas ?? 0, icon: ClipboardList, go: "os" },
    { k: "Clientes", v: stats?.clientes ?? 0, icon: Users, go: "clientes" },
    { k: "Mídias", v: stats?.midias ?? 0, icon: Images, go: "midias" },
    { k: "Visitas Hoje", v: stats?.ag_hoje ?? 0, icon: CalendarCheck, go: "agenda" },
  ];

  const quick = [
    { k: "Nova OS", icon: Plus, go: "os" },
    { k: "Cliente", icon: UserPlus, go: "clientes" },
    { k: "Agendar", icon: CalendarPlus, go: "agenda" },
    { k: "Garantias", icon: Flame, go: "garantias" },
  ];

  // chart: faturamento por mês (últimos 6 meses) das OS concluídas
  const chart = buildChart(ordens);

  return (
    <div className="space-y-7">
      <div className="anim-up">
        <p className="text-xs font-mono uppercase tracking-widest text-orange-400/80">{saud()}</p>
        <h1 className="font-outfit font-extrabold text-3xl sm:text-4xl mt-1">
          Olá, <span className="fire-text">{cfg.tecnico?.split(" ")[0] || "Técnico"}</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1 capitalize">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <motion.button
            key={m.k}
            data-testid={`stat-${m.go}-card`}
            onClick={() => go(m.go)}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="glass glass-hover rounded-2xl p-4 text-left relative overflow-hidden group"
          >
            <m.icon className="absolute -right-2 -bottom-2 text-orange-500/10 group-hover:text-orange-500/20 transition" size={64} />
            <div className="flame-badge p-2 rounded-xl w-fit mb-3"><m.icon size={18} /></div>
            <div className="font-outfit font-extrabold text-3xl">{m.v}</div>
            <div className="text-xs text-zinc-400 mt-0.5">{m.k}</div>
          </motion.button>
        ))}
      </div>

      <div>
        <SectionTitle>Ações Rápidas</SectionTitle>
        <div className="grid grid-cols-4 gap-3">
          {quick.map((q) => (
            <button
              key={q.k}
              data-testid={`quick-${q.go}-btn`}
              onClick={() => go(q.go)}
              className="glass glass-hover rounded-2xl py-4 flex flex-col items-center gap-2 text-xs font-semibold text-zinc-300"
            >
              <div className="flame-badge p-2.5 rounded-xl"><q.icon size={20} /></div>
              {q.k}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-outfit font-bold flex items-center gap-2"><CircleDollarSign size={18} className="text-orange-400" /> Faturamento (OS)</h3>
          <Badge tone="orange">6 meses</Badge>
        </div>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="fire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF8800" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#FF5500" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#12141D", border: "1px solid rgba(255,85,0,0.3)", borderRadius: 12, fontSize: 12 }}
                formatter={(v) => [fmtBRL(v), "Total"]}
              />
              <Area type="monotone" dataKey="total" stroke="#FF6A00" strokeWidth={2.5} fill="url(#fire)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-outfit font-bold">Agenda de Hoje</h3>
            <button data-testid="see-agenda-btn" onClick={() => go("agenda")} className="text-orange-400 text-xs flex items-center gap-1">
              Ver tudo <ArrowRight size={14} />
            </button>
          </div>
          {agendaHoje.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6 text-center">Nenhuma visita agendada hoje.</p>
          ) : (
            <div className="space-y-2">
              {agendaHoje.map((a) => (
                <div key={a.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="font-mono text-orange-400 text-sm">{a.hora || "--:--"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{a.nomeCli || "Cliente"}</p>
                    <p className="text-xs text-zinc-500 truncate">{a.servico}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-outfit font-bold">Últimas OS</h3>
            <button data-testid="see-os-btn" onClick={() => go("os")} className="text-orange-400 text-xs flex items-center gap-1">
              Ver tudo <ArrowRight size={14} />
            </button>
          </div>
          {ordens.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6 text-center">Nenhuma OS registrada.</p>
          ) : (
            <div className="space-y-2">
              {ordens.slice(0, 4).map((o) => (
                <div key={o.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="font-mono text-zinc-500 text-xs">#{o.num}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{o.nomeCli || "Cliente"}</p>
                    <p className="text-xs text-zinc-500 truncate">{o.servico} · {fmtData(o.data)}</p>
                  </div>
                  <Badge tone={statusTone[o.status]}>{statusLabel[o.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function saud() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function buildChart(ordens) {
  const map = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    map[key] = { mes: d.toLocaleDateString("pt-BR", { month: "short" }), total: 0 };
  }
  ordens.forEach((o) => {
    const key = (o.data || "").slice(0, 7);
    if (map[key] && o.status === "concluida") map[key].total += Number(o.valor) || 0;
  });
  return Object.values(map);
}
