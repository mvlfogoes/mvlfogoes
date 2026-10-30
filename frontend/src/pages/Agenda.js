import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trash2, Pencil,
  Bell, CalendarDays, List, MapPin, X, Calculator, Receipt, Wrench,
} from "lucide-react";
import { api, fmtData, hoje, waLink, CIDADES } from "@/lib/api";
import { salvarCliente } from "@/lib/clienteSync";
import { LembreteAmanha } from "@/components/LembreteAmanha";
import { Modal, Field, inputCls, Btn, Badge, Empty, SectionTitle } from "@/lib/ui";
import { useApp } from "@/App";
import FlyerModal from "@/components/FlyerModal";

const tone = { agendado: "amber", concluido: "green", cancelado: "red" };
const lbl = { agendado: "Agendado", concluido: "Concluído", cancelado: "Cancelado" };
const TIPOS = [
  { key: "fogao", label: "Fogão" },
  { key: "cooktop", label: "Cooktop" },
  { key: "forno", label: "Forno" },
  { key: "outro", label: "Outro" },
];
const MES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIA = ["D", "S", "T", "Q", "Q", "S", "S"];
const blank = { cliId: "", nomeCli: "", tel: "", wa: "", end: "", cidade: "", servico: "", tipo: "fogao", data: hoje(), hora: "", status: "agendado", valor: "", obs: "" };

const PosSalvar = ({ pos, onClose, onFlyer }) => (
  <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose} data-testid="agenda-pos-salvar">
    <div className="glass w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between">
        <div><p className="font-outfit font-bold text-lg">Agendamento salvo</p><p className="text-xs text-zinc-400">{pos.ag.nomeCli} · dados guardados no cadastro do cliente</p></div>
        <button onClick={onClose} data-testid="agenda-pos-close" className="p-1 text-zinc-400"><X size={20} /></button>
      </div>
      <p className="text-sm text-zinc-300">Abrir flyer para enviar ou imprimir:</p>
      <div className="grid grid-cols-2 gap-2">
        {[["agenda", "Visita", Bell], ["servico", "Serviço", Wrench], ["orcamento", "Orçamento", Calculator], ["recibo", "Recibo", Receipt]].map(([m, l, I]) => (
          <Btn key={m} variant="outline" onClick={() => onFlyer(m)} data-testid={`agenda-pos-${m}`} className="flex-col !py-3"><I size={18} /> {l}</Btn>
        ))}
      </div>
    </div>
  </div>
);

export default function Agenda() {
  const { clientes, cfg, reloadClientes } = useApp();
  const [pos, setPos] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [view, setView] = useState("mes");
  const [cur, setCur] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(blank);
  const [selDay, setSelDay] = useState(hoje());
  const [flyer, setFlyer] = useState(null);

  const reload = () => api.listAgenda().then(setEventos);
  useEffect(() => { reload(); }, []);

  const comCliente = (a) => {
    const c = clientes.find((x) => x.id === a.cliId);
    return { tel: c?.tel || "", wa: c?.wa || "", end: c?.end || "", cidade: c?.etiqueta || "" };
  };
  const openNew = (d) => { setEdit(null); setForm({ ...blank, data: d || hoje() }); setOpen(true); };
  const openEdit = (a) => { setEdit(a); setForm({ ...blank, ...a, ...comCliente(a), tipo: a.tipo || "fogao", valor: String(a.valor ?? "") }); setOpen(true); };
  const escolherCli = (id) => {
    const c = clientes.find((x) => x.id === id);
    setForm((f) => ({ ...f, cliId: id, nomeCli: c?.nome || "", tel: c?.tel || "", wa: c?.wa || "", end: c?.end || "", cidade: c?.etiqueta || "" }));
  };
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, ...(k === "tel" && (!f.wa || f.wa === f.tel) ? { wa: e.target.value } : {}) }));

  const save = async () => {
    if (!form.servico.trim() && !form.nomeCli.trim()) return toast.error("Informe cliente ou serviço");
    try {
      const cli = await salvarCliente({ cliId: form.cliId, nome: form.nomeCli, tel: form.tel, wa: form.wa, end: form.end, cidade: form.cidade }, clientes);
      if (cli) reloadClientes();
      const { tel, wa, end, cidade, ...resto } = form; // eslint-disable-line no-unused-vars
      const payload = { ...resto, cliId: cli?.id || "", nomeCli: cli?.nome || form.nomeCli, valor: parseFloat(form.valor) || 0 };
      const ag = edit ? await api.updateAgenda(edit.id, payload) : await api.createAgenda(payload);
      toast.success("Agendamento salvo"); setOpen(false); reload();
      setPos({ ag, cli });
    } catch { toast.error("Erro ao salvar"); }
  };

  const setStatus = async (a, status) => { await api.updateAgenda(a.id, { ...a, status }); toast.success("Atualizado"); reload(); };
  const remove = async (a) => { if (!window.confirm("Excluir agendamento?")) return; await api.deleteAgenda(a.id); reload(); };
  const abrirFlyer = (a) => setFlyer({ ag: a, cli: clientes.find((c) => c.id === a.cliId) });

  const y = cur.getFullYear(), m = cur.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const mesKey = `${y}-${String(m + 1).padStart(2, "0")}`;
  const doMes = eventos.filter((e) => (e.data || "").startsWith(mesKey));
  const eventosDay = eventos.filter((e) => e.data === selDay).sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
  const hojeStr = hoje();

  return (
    <div className="space-y-5">
      <SectionTitle right={<Btn onClick={() => openNew(selDay)} data-testid="agenda-add-btn"><Plus size={16} /> Novo</Btn>}>Agenda</SectionTitle>
      <LembreteAmanha agenda={eventos} onFlyer={abrirFlyer} />

      <div className="flex gap-2">
        {[{ id: "mes", icon: CalendarDays, l: "Mês" }, { id: "lista", icon: List, l: "Lista" }].map((v) => (
          <button key={v.id} data-testid={`agenda-view-${v.id}`} onClick={() => setView(v.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition ${view === v.id ? "fire-btn text-white" : "bg-white/5 text-zinc-400"}`}>
            <v.icon size={14} /> {v.l}
          </button>
        ))}
      </div>

      {view === "mes" ? (
        <>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <button data-testid="agenda-prev-month" onClick={() => setCur(new Date(y, m - 1, 1))} className="p-2 rounded-lg hover:bg-white/5"><ChevronLeft size={18} /></button>
              <h3 className="font-outfit font-bold">{MES[m]} {y}</h3>
              <button data-testid="agenda-next-month" onClick={() => setCur(new Date(y, m + 1, 1))} className="p-2 rounded-lg hover:bg-white/5"><ChevronRight size={18} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-zinc-500 mb-1">
              {DIA.map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array(first).fill(0).map((_, i) => <div key={`e${i}`} />)}
              {Array(days).fill(0).map((_, i) => {
                const dnum = i + 1;
                const ds = `${mesKey}-${String(dnum).padStart(2, "0")}`;
                const has = doMes.some((e) => e.data === ds);
                const isSel = ds === selDay, isHoje = ds === hojeStr;
                return (
                  <button key={dnum} data-testid={`agenda-day-${dnum}`} onClick={() => setSelDay(ds)}
                    className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center relative transition ${isSel ? "fire-btn text-white" : isHoje ? "bg-sky-400/15 text-sky-300" : "hover:bg-white/5 text-zinc-300"}`}>
                    {dnum}
                    {has && <span className={`w-1 h-1 rounded-full mt-0.5 ${isSel ? "bg-white" : "bg-sky-400"}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-outfit font-bold mb-3 capitalize">{new Date(selDay + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</h3>
            {eventosDay.length === 0 ? <Empty icon={CalendarDays} title="Dia livre" sub="Nenhum compromisso neste dia." /> :
              <div className="space-y-2">{eventosDay.map((a) => <EvCard key={a.id} a={a} {...{ openEdit, setStatus, remove, abrirFlyer }} />)}</div>}
          </div>
        </>
      ) : (
        eventos.length === 0 ? <Empty icon={List} title="Sem agendamentos" /> :
          <div className="space-y-2">{[...eventos].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)).map((a) => <EvCard key={a.id} a={a} showDate {...{ openEdit, setStatus, remove, abrirFlyer }} />)}</div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "Editar Agendamento" : "Novo Agendamento"} testId="agenda-modal">
        <Field label="Cliente cadastrado">
          <select data-testid="agenda-cliente-select" value={form.cliId} onChange={(e) => escolherCli(e.target.value)} className={inputCls}>
            <option value="">Novo cliente (preencha abaixo)</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Nome do cliente"><input data-testid="agenda-nome-input" value={form.nomeCli} onChange={setF("nomeCli")} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone"><input data-testid="agenda-tel-input" type="tel" value={form.tel} onChange={setF("tel")} className={inputCls} /></Field>
          <Field label="WhatsApp"><input data-testid="agenda-wa-input" type="tel" value={form.wa} onChange={setF("wa")} className={inputCls} /></Field>
        </div>
        <Field label="Endereço"><input data-testid="agenda-end-input" value={form.end} onChange={setF("end")} className={inputCls} /></Field>
        <Field label="Cidade">
          <select data-testid="agenda-cidade-select" value={form.cidade} onChange={setF("cidade")} className={inputCls}>
            <option value="">—</option>
            {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Serviço / Descrição"><input data-testid="agenda-servico-input" value={form.servico} onChange={(e) => setForm((f) => ({ ...f, servico: e.target.value }))} className={inputCls} /></Field>
        <Field label="Tipo de Produto">
          <select data-testid="agenda-tipo-select" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} className={inputCls}>
            {TIPOS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data"><input type="date" data-testid="agenda-data-input" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} className={inputCls} /></Field>
          <Field label="Hora"><input type="time" data-testid="agenda-hora-input" value={form.hora} onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))} className={inputCls} /></Field>
        </div>
        <Field label="Taxa de Visita (R$)"><input type="number" data-testid="agenda-valor-input" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} className={inputCls} placeholder="0,00" /></Field>
        <Field label="Observações"><textarea data-testid="agenda-obs-input" value={form.obs} onChange={(e) => setForm((f) => ({ ...f, obs: e.target.value }))} rows={2} className={inputCls} /></Field>
        <Btn onClick={save} className="w-full" data-testid="agenda-save-btn">Salvar</Btn>
      </Modal>

      {flyer && <FlyerModal open modelo={flyer.modelo} onClose={() => setFlyer(null)} ag={flyer.ag} cli={flyer.cli} cfg={cfg} />}
      {pos && <PosSalvar pos={pos} onClose={() => setPos(null)} onFlyer={(modelo) => { setFlyer({ ag: pos.ag, cli: pos.cli, modelo }); setPos(null); }} />}
    </div>
  );
}

function EvCard({ a, showDate, openEdit, setStatus, remove, abrirFlyer }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="flame-badge px-2.5 py-2 rounded-xl font-mono text-xs text-center min-w-[52px]">{a.hora || "--:--"}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{a.nomeCli || a.servico || "Compromisso"}</p>
          <p className="text-xs text-zinc-500 truncate">{a.servico}{showDate ? ` · ${fmtData(a.data)}` : ""}</p>
        </div>
        <Badge tone={tone[a.status]}>{lbl[a.status]}</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {a.status === "agendado" && <>
          <Btn variant="fire" className="!px-2.5 !py-1.5 text-xs" onClick={() => setStatus(a, "concluido")} data-testid={`agenda-done-${a.id}`}><CheckCircle2 size={14} /> Concluir</Btn>
          <Btn variant="danger" className="!px-2.5 !py-1.5 text-xs" onClick={() => setStatus(a, "cancelado")} data-testid={`agenda-cancel-${a.id}`} aria-label="Cancelar"><XCircle size={14} /></Btn>
        </>}
        <Btn variant="outline" className="!px-2.5 !py-1.5 text-xs" onClick={() => abrirFlyer(a)} data-testid={`agenda-flyer-${a.id}`}><Bell size={14} /> Lembrete</Btn>
        <Btn variant="ghost" className="!px-2.5 !py-1.5 text-xs" onClick={() => openEdit(a)} data-testid={`agenda-edit-${a.id}`} aria-label="Editar"><Pencil size={14} /></Btn>
        <Btn variant="ghost" className="!px-2.5 !py-1.5 text-xs" onClick={() => remove(a)} data-testid={`agenda-delete-${a.id}`} aria-label="Excluir"><Trash2 size={14} /></Btn>
      </div>
    </div>
  );
}
