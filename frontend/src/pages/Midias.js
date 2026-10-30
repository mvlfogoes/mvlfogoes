import { useEffect, useState } from "react";
import { Images, Search, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { inputCls, Empty, SectionTitle, Badge } from "@/lib/ui";
import { useApp } from "@/App";
import { FotosFogao } from "@/components/FotosFogao";

export default function Midias() {
  const { clientes } = useApp();
  const [q, setQ] = useState("");
  const [aberto, setAberto] = useState(null);
  const [contagem, setContagem] = useState({});

  useEffect(() => {
    Promise.all(clientes.map((c) => api.listFotos(c.id).then((f) => [c.id, f.length]))).then((r) => setContagem(Object.fromEntries(r)));
  }, [clientes, aberto]);

  const list = clientes.filter((c) => [c.nome, c.tel, c.wa, c.end, c.etiqueta].join(" ").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <SectionTitle>Mídias</SectionTitle>
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input data-testid="midia-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente, telefone, rua ou cidade..." className={`${inputCls} pl-10`} />
      </div>
      {list.length === 0 ? <Empty icon={Images} title="Nenhum cliente" sub={q ? "Nenhum cliente encontrado na busca." : "Cadastre clientes para adicionar fotos e vídeos."} /> : (
        <div className="space-y-2">
          {list.map((c) => {
            const open = aberto === c.id;
            const n = contagem[c.id] || 0;
            return (
              <div key={c.id} className="glass rounded-2xl" data-testid={`midia-cli-${c.id}`}>
                <button onClick={() => setAberto(open ? null : c.id)} data-testid={`midia-cli-toggle-${c.id}`} className="w-full p-4 flex items-center gap-3 text-left">
                  <div className="flame-badge p-2.5 rounded-xl"><Images size={18} /></div>
                  <div className="flex-1 min-w-0"><p className="font-semibold truncate">{c.nome}</p><p className="text-xs text-zinc-500 truncate">{c.etiqueta || c.tel || "—"}</p></div>
                  {n > 0 && <Badge tone="blue">{n}</Badge>}
                  <ChevronRight size={18} className={`text-zinc-500 transition-transform ${open ? "rotate-90" : ""}`} />
                </button>
                {open && <div className="px-4 pb-4"><FotosFogao cliId={c.id} size={84} videos testid={`midia-fotos-${c.id}`} /></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
