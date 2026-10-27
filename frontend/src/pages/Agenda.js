import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trash2, Pencil,
  Bell, CalendarDays, List, MapPin,
} from "lucide-react";
import { api, fmtData, hoje, waLink } from "@/lib/api";
import { Modal, Field, inputCls, Btn, Badge, Empty, SectionTitle } from "@/lib/ui";
import { useApp } from "@/App";

const tone = { agendado: "amber", concluido: "green", cancelado: "red" };
const lbl = { agendado: "Agendado", concluido: "Concluído", cancelado: "Cancelado" };
const MES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIA = ["D", "S", "T", "Q", "Q", "S", "S"];
const blank = { cliId: "", nomeCli: "", servico: "", data: hoje(), hora: "", status: "agendado", valor: "", obs: "" };

export default function Agenda() {
  const { clientes } = useApp();
  const [eventos, setEventos] = useState([]);
  const [view, setView] = useState("mes");
  const [cur, setCur] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(blank);
  const [selDay, setSelDay] = useState(hoje());

  const reload = () => api.listAgenda().then(setEventos);
  useEffect(() => { reload(); }, []);

  const openNew = (d) => { setEdit(null); setForm({ ...blank, data: d || hoje() }); setOpen(true); };
  const openEdit = (a) => { setEdit(a); setForm({ ...blank, ...a, valor: String(a.valor ?? "") }); setOpen(true); };

  const save = async () => {
    if (!form.servico.trim() && !form.cliId) return toast.error("Informe cliente ou serviço");
    const cli = clientes.find((c) => c.id === form.cliId);
    const payload = { ...form, nomeCli: cli?.nome || form.nomeCli, valor: parseFloat(form.valor) || 0 };
    try {
      if (edit) await api.updateAgenda(edit.id, payload);
      else await api.createAgenda(payload);
      toast.success("Agendamento salvo"); setOpen(false); reload();
    } catch { toast.error("Erro ao salvar"); }
  };

  const setStatus = async (a, status) => { await api.updateAgenda(a.id, { ...a, status }); toast.success("Atualizado"); reload(); };
  const remove = async (a) => { if (!window.confirm("Excluir agendamento?")) return; await api.deleteAgenda(a.id); reload(); };
  const lembrete = (a) => {
    const cli = clientes.find((c) => c.id === a.cliId);
    window.open(waLink(cli?.wa || cli?.tel, `Olá ${a.nomeCli}! Lembrete da sua visita técnica MVL Fogões em ${fmtData(a.data)} às ${a.hora}. Serviço: ${a.servico}.`), "_blank");
  };

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
                    className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center relative transition ${isSel ? "fire-btn text-white" : isHoje ? "bg-orange-500/15 text-orange-400" : "hover:bg-white/5 text-zinc-300"}`}>
                    {dnum}
                    {has && <span className={`w-1 h-1 rounded-full mt-0.5 ${isSel ? "bg-white" : "bg-orange-500"}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-outfit font-bold mb-3 capitalize">{new Date(selDay + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</h3>
            {eventosDay.length === 0 ? <Empty icon={CalendarDays} title="Dia livre" sub="Nenhum compromisso neste dia." /> :
              <div className="space-y-2">{eventosDay.map((a) => <EvCard key={a.id} a={a} {...{ openEdit, setStatus, remove, lembrete }} />)}</div>}
          </div>
        </>
      ) : (
        eventos.length === 0 ? <Empty icon={List} title="Sem agendamentos" /> :
          <div className="space-y-2">{[...eventos].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)).map((a) => <EvCard key={a.id} a={a} showDate {...{ openEdit, setStatus, remove, lembrete }} />)}</div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "Editar Agendamento" : "Novo Agendamento"} testId="agenda-modal">
        <Field label="Cliente">
          <select data-testid="agenda-cliente-select" value={form.cliId} onChange={(e) => setForm((f) => ({ ...f, cliId: e.target.value }))} className={inputCls}>
            <option value="">Selecione...</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Serviço / Descrição"><input data-testid="agenda-servico-input" value={form.servico} onChange={(e) => setForm((f) => ({ ...f, servico: e.target.value }))} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data"><input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} className={inputCls} /></Field>
          <Field label="Hora"><input type="time" value={form.hora} onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))} className={inputCls} /></Field>
        </div>
        <Field label="Observações"><textarea value={form.obs} onChange={(e) => setForm((f) => ({ ...f, obs: e.target.value }))} rows={2} className={inputCls} /></Field>
        <Btn onClick={save} className="w-full" data-testid="agenda-save-btn">Salvar</Btn>
      </Modal>
    </div>
  );
}

function EvCard({ a, showDate, openEdit, setStatus, remove, lembrete }) {
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
          <Btn variant="danger" className="!px-2.5 !py-1.5 text-xs" onClick={() => setStatus(a, "cancelado")}><XCircle size={14} /></Btn>
        </>}
        <Btn variant="outline" className="!px-2.5 !py-1.5 text-xs" onClick={() => lembrete(a)} data-testid={`agenda-remind-${a.id}`}><Bell size={14} /> Lembrete</Btn>
        <Btn variant="ghost" className="!px-2.5 !py-1.5 text-xs" onClick={() => openEdit(a)}><Pencil size={14} /></Btn>
        <Btn variant="ghost" className="!px-2.5 !py-1.5 text-xs" onClick={() => remove(a)}><Trash2 size={14} /></Btn>
      </div>
    </div>
  );
}
