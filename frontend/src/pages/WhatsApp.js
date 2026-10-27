import { useEffect, useState } from "react";
import { Search, Send, MessageCircle, Sparkles, X, ImageIcon, ClipboardPaste, MapPin } from "lucide-react";
import { api, waLink, hoje } from "@/lib/api";
import { inputCls, Empty, SectionTitle, Btn, Badge } from "@/lib/ui";
import { useApp } from "@/App";
import { CidadeChips } from "@/components/CidadeChips";
import FlyerModal from "@/components/FlyerModal";

const TEMPLATES = [
  { id: "orcamento", label: "Orçamento Pronto", msg: (n) => `Olá ${n}! Seu orçamento da MVL Fogões está pronto. Posso te enviar os detalhes?` },
  { id: "caminho", label: "Técnico a Caminho", msg: (n) => `Olá ${n}, aqui é da MVL Fogões. Nosso técnico já está a caminho! 🔧🔥` },
  { id: "concluido", label: "Serviço Concluído", msg: (n) => `Olá ${n}! Seu serviço foi concluído com sucesso. Qualquer dúvida estamos à disposição. Obrigado pela confiança! 🔥` },
  { id: "satisfacao", label: "Pesquisa de Satisfação", msg: (n) => `Olá ${n}! Como foi sua experiência com a MVL Fogões? Sua opinião é muito importante para nós! ⭐` },
  { id: "agenda", label: "Confirmar Visita", msg: (n) => `Olá ${n}! Confirmando sua visita técnica da MVL Fogões. Podemos manter o horário combinado?` },
];

const proxAg = (agenda, c) =>
  agenda.filter((a) => a.cliId === c.id && a.status === "agendado" && a.data >= hoje()).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))[0]
  || { cliId: c.id, nomeCli: c.nome, servico: "", tipo: "", data: "", hora: "", valor: 0, obs: "" };

const ClienteSheet = ({ c, ag, onClose, onFlyer }) => (
  <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose} data-testid="wa-cli-sheet">
    <div className="glass w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-outfit font-bold text-lg">{c.nome}</p>
          <p className="text-xs text-zinc-400">{c.wa || c.tel || "sem número"}{c.etiqueta ? ` · ${c.etiqueta}` : ""}</p>
          {ag.data && <p className="text-xs text-orange-400 mt-1">Próxima visita: {ag.data.split("-").reverse().join("/")} {ag.hora}</p>}
        </div>
        <button onClick={onClose} data-testid="wa-sheet-close" className="p-1 text-zinc-400"><X size={20} /></button>
      </div>
      <a href={waLink(c.wa || c.tel, "")} target="_blank" rel="noreferrer" data-testid="wa-sheet-open-chat" className="block">
        <Btn variant="fire" className="w-full"><MessageCircle size={17} /> Abrir conversa no WhatsApp</Btn>
      </a>
      <Btn variant="outline" className="w-full" onClick={() => onFlyer(false)} data-testid="wa-sheet-send-flyer"><ImageIcon size={17} /> Enviar flyer</Btn>
      <Btn variant="outline" className="w-full" onClick={() => onFlyer(true)} data-testid="wa-sheet-flyer-from-chat"><ClipboardPaste size={17} /> Montar flyer com dados da conversa</Btn>
    </div>
  </div>
);

export default function WhatsAppCentral() {
  const { clientes, cfg } = useApp();
  const [q, setQ] = useState("");
  const [cidade, setCidade] = useState("");
  const [tpl, setTpl] = useState(TEMPLATES[0]);
  const [agenda, setAgenda] = useState([]);
  const [sel, setSel] = useState(null);
  const [flyer, setFlyer] = useState(null);

  useEffect(() => { api.listAgenda().then(setAgenda); }, []);

  const list = clientes.filter((c) => (!cidade || c.etiqueta === cidade) && [c.nome, c.tel, c.wa, c.end].join(" ").toLowerCase().includes(q.toLowerCase()));

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
        <input data-testid="wa-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente, telefone ou rua..." className={`${inputCls} pl-10`} />
      </div>
      <CidadeChips value={cidade} onChange={setCidade} clientes={clientes} prefix="wa" />

      {list.length === 0 ? <Empty icon={MessageCircle} title="Nenhum cliente" sub={cidade ? `Nenhum cliente com a etiqueta ${cidade}.` : "Cadastre clientes para enviar mensagens."} /> : (
        <div className="space-y-2">
          {list.map((c) => (
            <div key={c.id} data-testid={`wa-cli-${c.id}`} onClick={() => setSel(c)} className="glass glass-hover rounded-2xl p-4 flex items-center gap-3 cursor-pointer">
              <div className="flame-badge p-2.5 rounded-xl font-outfit font-bold">{c.nome[0]?.toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.nome}</p>
                <p className="text-xs text-zinc-500 truncate">{c.wa || c.tel || "sem número"}</p>
                {c.etiqueta && <span className="inline-flex mt-1"><Badge tone="orange"><MapPin size={10} className="inline mr-0.5" />{c.etiqueta}</Badge></span>}
              </div>
              <a href={waLink(c.wa || c.tel, tpl.msg(c.nome))} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                <Btn variant="fire" className="!px-3 !py-2" data-testid={`wa-send-${c.id}`}><Send size={15} /> Enviar</Btn>
              </a>
            </div>
          ))}
        </div>
      )}

      {sel && <ClienteSheet c={sel} ag={proxAg(agenda, sel)} onClose={() => setSel(null)} onFlyer={(colar) => { setFlyer({ cli: sel, ag: proxAg(agenda, sel), colar }); setSel(null); }} />}
      {flyer && <FlyerModal open colar={flyer.colar} onClose={() => setFlyer(null)} ag={flyer.ag} cli={flyer.cli} cfg={cfg} />}
    </div>
  );
}
