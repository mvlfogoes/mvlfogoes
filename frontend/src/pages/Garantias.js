import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Search, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api, fmtData } from "@/lib/api";
import { inputCls, Empty, SectionTitle, Badge } from "@/lib/ui";

export default function Garantias() {
  const [ordens, setOrdens] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => { api.listOrdens().then(setOrdens); }, []);

  const garantias = useMemo(() => {
    const now = new Date();
    return ordens
      .filter((o) => (o.garantia || 0) > 0 && o.data)
      .map((o) => {
        const ini = new Date(o.data + "T00:00:00");
        const fim = new Date(ini); fim.setMonth(fim.getMonth() + (o.garantia || 0));
        const dias = Math.ceil((fim - now) / 86400000);
        let st = "ativa";
        if (dias < 0) st = "expirada";
        else if (dias <= 7) st = "vencendo";
        return { ...o, fim, dias, st };
      })
      .filter((g) => [g.nomeCli, g.servico].join(" ").toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => a.dias - b.dias);
  }, [ordens, q]);

  const stMap = {
    ativa: { tone: "green", icon: CheckCircle2, label: "Ativa" },
    vencendo: { tone: "amber", icon: AlertTriangle, label: "Vencendo" },
    expirada: { tone: "red", icon: Clock, label: "Expirada" },
  };

  return (
    <div className="space-y-5">
      <SectionTitle>Garantias</SectionTitle>
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input data-testid="gar-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente ou OS..." className={`${inputCls} pl-10`} />
      </div>
      {garantias.length === 0 ? <Empty icon={ShieldCheck} title="Sem garantias" sub="OS com garantia definida aparecem aqui." /> : (
        <div className="space-y-2">
          {garantias.map((g) => {
            const S = stMap[g.st];
            return (
              <div key={g.id} data-testid={`gar-card-${g.id}`} className={`glass glass-hover rounded-2xl p-4 flex items-center gap-3 ${g.st === "vencendo" ? "border-amber-500/40" : ""}`}>
                <div className="flame-badge p-2.5 rounded-xl"><S.icon size={18} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">#{g.num} · {g.nomeCli}</p>
                  <p className="text-xs text-zinc-500 truncate">{g.servico} · até {fmtData(g.fim.toISOString().slice(0, 10))}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge tone={S.tone}>{S.label}</Badge>
                  <p className="text-[11px] text-zinc-500 mt-1">{g.dias < 0 ? `há ${-g.dias}d` : `${g.dias}d rest.`}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
