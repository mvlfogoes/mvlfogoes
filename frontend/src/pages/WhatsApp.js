import { useEffect, useState } from "react";
import { Search, Send, MessageCircle, X, ImageIcon, ClipboardPaste, MapPin, Calculator, Receipt, Wrench } from "lucide-react";
import { api, waLink, hoje } from "@/lib/api";
import { inputCls, Empty, SectionTitle, Btn, Badge } from "@/lib/ui";
import { useApp } from "@/App";
import { CidadeChips } from "@/components/CidadeChips";
import FlyerModal from "@/components/FlyerModal";
import { MensagensRapidas, TEMPLATES_PADRAO, preencher } from "@/components/MensagensRapidas";

const proxAg = (agenda, c) =>
  agenda.filter((a) => a.cliId === c.id && a.status === "agendado" && a.data >= hoje()).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))[0]
  || { cliId: c.id, nomeCli: c.nome, servico: "", tipo: "", data: "", hora: "", valor: 0, obs: "" };

const ultOS = (ordens, c) => ordens.filter((o) => o.cliId === c.id).sort((a, b) => (b.data || b.criadoEm || "").localeCompare(a.data || a.criadoEm || ""))[0] || { nomeCli: c.nome };

const ClienteSheet = ({ c, ag, onClose, onFlyer }) => (
  <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose} data-testid="wa-cli-sheet">
    <div className="glass w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-outfit font-bold text-lg">{c.nome}</p>
          <p className="text-xs text-zinc-400">{c.wa || c.tel || "sem número"}{c.etiqueta ? ` · ${c.etiqueta}` : ""}</p>
          {ag.data && <p className="text-xs text-sky-300 mt-1">Próxima visita: {ag.data.split("-").reverse().join("/")} {ag.hora}</p>}
        </div>
        <button onClick={onClose} data-testid="wa-sheet-close" className="p-1 text-zinc-400"><X size={20} /></button>
      </div>
      <a href={waLink(c.wa || c.tel, "")} target="_blank" rel="noreferrer" data-testid="wa-sheet-open-chat" className="block">
        <Btn variant="fire" className="w-full"><MessageCircle size={17} /> Abrir conversa no WhatsApp</Btn>
      </a>
      <Btn variant="outline" className="w-full" onClick={() => onFlyer(false, "agenda")} data-testid="wa-sheet-send-flyer"><ImageIcon size={17} /> Agendamento de visita</Btn>
      <Btn variant="outline" className="w-full" onClick={() => onFlyer(false, "servico")} data-testid="wa-sheet-servico"><Wrench size={17} /> Agendamento de serviço</Btn>
      <Btn variant="outline" className="w-full" onClick={() => onFlyer(true, "agenda")} data-testid="wa-sheet-flyer-from-chat"><ClipboardPaste size={17} /> Montar flyer com dados da conversa</Btn>
      <div className="grid grid-cols-2 gap-2">
        <Btn variant="outline" className="w-full" onClick={() => onFlyer(false, "orcamento")} data-testid="wa-sheet-orcamento"><Calculator size={17} /> Orçamento</Btn>
        <Btn variant="outline" className="w-full" onClick={() => onFlyer(false, "recibo")} data-testid="wa-sheet-recibo"><Receipt size={17} /> Recibo</Btn>
      </div>
    </div>
  </div>
);

export default function WhatsAppCentral() {
  const { clientes, cfg, setCfg } = useApp();
  const [q, setQ] = useState("");
  const [cidade, setCidade] = useState("");
  const tpls = cfg.templates?.length ? cfg.templates : TEMPLATES_PADRAO;
  const [tplId, setTplId] = useState(null);
  const tpl = tpls.find((t) => t.id === tplId) || tpls[0];
  const setTpl = (t) => setTplId(t?.id || null);
  const [agenda, setAgenda] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [sel, setSel] = useState(null);
  const [flyer, setFlyer] = useState(null);

  useEffect(() => { api.listAgenda().then(setAgenda); api.listOrdens().then(setOrdens); }, []);

  const list = clientes.filter((c) => (!cidade || c.etiqueta === cidade) && [c.nome, c.tel, c.wa, c.end].join(" ").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <SectionTitle>Central WhatsApp</SectionTitle>

      <MensagensRapidas cfg={cfg} setCfg={setCfg} tpls={tpls} tpl={tpl} setTpl={setTpl} />

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
              <a href={waLink(c.wa || c.tel, preencher(tpl, c.nome))} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                <Btn variant="fire" className="!px-3 !py-2" data-testid={`wa-send-${c.id}`}><Send size={15} /> Enviar</Btn>
              </a>
            </div>
          ))}
        </div>
      )}

      {sel && <ClienteSheet c={sel} ag={proxAg(agenda, sel)} onClose={() => setSel(null)} onFlyer={(colar, modelo) => { setFlyer({ cli: sel, ag: modelo === "agenda" || modelo === "servico" ? proxAg(agenda, sel) : ultOS(ordens, sel), colar, modelo }); setSel(null); }} />}
      {flyer && <FlyerModal open colar={flyer.colar} modelo={flyer.modelo} onClose={() => setFlyer(null)} ag={flyer.ag} cli={flyer.cli} cfg={cfg} />}
    </div>
  );
}
