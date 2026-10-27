import { useState } from "react";
import { Search, Send, MessageCircle, Sparkles } from "lucide-react";
import { waLink } from "@/lib/api";
import { inputCls, Empty, SectionTitle, Btn } from "@/lib/ui";
import { useApp } from "@/App";

const TEMPLATES = [
  { id: "orcamento", label: "Orçamento Pronto", msg: (n) => `Olá ${n}! Seu orçamento da MVL Fogões está pronto. Posso te enviar os detalhes?` },
  { id: "caminho", label: "Técnico a Caminho", msg: (n) => `Olá ${n}, aqui é da MVL Fogões. Nosso técnico já está a caminho! 🔧🔥` },
  { id: "concluido", label: "Serviço Concluído", msg: (n) => `Olá ${n}! Seu serviço foi concluído com sucesso. Qualquer dúvida estamos à disposição. Obrigado pela confiança! 🔥` },
  { id: "satisfacao", label: "Pesquisa de Satisfação", msg: (n) => `Olá ${n}! Como foi sua experiência com a MVL Fogões? Sua opinião é muito importante para nós! ⭐` },
  { id: "agenda", label: "Confirmar Visita", msg: (n) => `Olá ${n}! Confirmando sua visita técnica da MVL Fogões. Podemos manter o horário combinado?` },
];

export default function WhatsAppCentral() {
  const { clientes } = useApp();
  const [q, setQ] = useState("");
  const [tpl, setTpl] = useState(TEMPLATES[0]);

  const list = clientes.filter((c) => [c.nome, c.tel, c.wa].join(" ").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <SectionTitle>Central WhatsApp</SectionTitle>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-outfit font-bold flex items-center gap-2 mb-3"><Sparkles size={18} className="text-orange-400" /> Mensagem Rápida</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {TEMPLATES.map((t) => (
            <button key={t.id} data-testid={`wa-template-${t.id}`} onClick={() => setTpl(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${tpl.id === t.id ? "fire-btn text-white" : "bg-white/5 text-zinc-400"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-zinc-400 bg-white/5 rounded-xl p-3 italic">"{tpl.msg("[Cliente]")}"</p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input data-testid="wa-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente..." className={`${inputCls} pl-10`} />
      </div>

      {list.length === 0 ? <Empty icon={MessageCircle} title="Nenhum cliente" sub="Cadastre clientes para enviar mensagens." /> : (
        <div className="space-y-2">
          {list.map((c) => (
            <div key={c.id} data-testid={`wa-cli-${c.id}`} className="glass glass-hover rounded-2xl p-4 flex items-center gap-3">
              <div className="flame-badge p-2.5 rounded-xl font-outfit font-bold">{c.nome[0]?.toUpperCase()}</div>
              <div className="flex-1 min-w-0"><p className="font-semibold truncate">{c.nome}</p><p className="text-xs text-zinc-500 truncate">{c.wa || c.tel || "sem número"}</p></div>
              <a href={waLink(c.wa || c.tel, tpl.msg(c.nome))} target="_blank" rel="noreferrer">
                <Btn variant="fire" className="!px-3 !py-2" data-testid={`wa-send-${c.id}`}><Send size={15} /> Enviar</Btn>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
