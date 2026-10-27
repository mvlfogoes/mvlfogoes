import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus, Search, ChevronLeft, Pencil, Trash2, CheckCircle2, MessageCircle, Printer, Flame,
} from "lucide-react";
import { api, fmtBRL, fmtData, hoje, waLink } from "@/lib/api";
import { Modal, Field, inputCls, Btn, Badge, Empty, SectionTitle } from "@/lib/ui";
import { useApp } from "@/App";

const tone = { pendente: "amber", concluida: "green", garantia: "blue" };
const lbl = { pendente: "Pendente", concluida: "Concluída", garantia: "Garantia" };
const FILTERS = [
  { id: "todas", label: "Todas" },
  { id: "pendente", label: "Pendentes" },
  { id: "concluida", label: "Concluídas" },
  { id: "garantia", label: "Garantia" },
];

const blank = {
  cliId: "", nomeCli: "", servico: "", problema: "", pecas: "", valor: "",
  garantia: 3, data: hoje(), hora: "", status: "pendente", obs: "",
};

export default function Ordens() {
  const { clientes, cfg } = useApp();
  const [ordens, setOrdens] = useState([]);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(blank);
  const [sel, setSel] = useState(null);

  const reload = () => api.listOrdens().then(setOrdens);
  useEffect(() => { reload(); }, []);

  const list = ordens
    .filter((o) => filtro === "todas" || o.status === filtro)
    .filter((o) => [o.nomeCli, o.servico, o.problema, String(o.num)].join(" ").toLowerCase().includes(q.toLowerCase()));

  const openNew = () => { setEdit(null); setForm(blank); setOpen(true); };
  const openEdit = (o) => { setEdit(o); setForm({ ...blank, ...o, valor: String(o.valor ?? "") }); setOpen(true); };

  const save = async () => {
    if (!form.cliId) return toast.error("Selecione o cliente");
    if (!form.servico.trim()) return toast.error("Informe o serviço");
    const cli = clientes.find((c) => c.id === form.cliId);
    const payload = { ...form, nomeCli: cli?.nome || "", valor: parseFloat(form.valor) || 0, garantia: parseInt(form.garantia) || 0 };
    try {
      if (edit) { const r = await api.updateOrdem(edit.id, payload); toast.success("OS atualizada"); if (sel) setSel(r); }
      else { await api.createOrdem(payload); toast.success("OS criada"); }
      setOpen(false); reload();
    } catch { toast.error("Erro ao salvar"); }
  };

  const concluir = async (o) => {
    const r = await api.updateOrdem(o.id, { ...o, status: "concluida" });
    toast.success("OS concluída!"); setSel(r); reload();
  };

  const remove = async (o) => {
    if (!window.confirm(`Excluir OS #${o.num}?`)) return;
    await api.deleteOrdem(o.id); toast.success("OS excluída"); setSel(null); reload();
  };

  const comprovante = (o) => {
    const cli = clientes.find((c) => c.id === o.cliId);
    const msg = `*COMPROVANTE DE SERVIÇO - MVL FOGÕES*%0A%0A` +
      `OS: #${o.num}%0ACliente: ${o.nomeCli}%0AServiço: ${o.servico}%0A` +
      (o.problema ? `Defeito: ${o.problema}%0A` : "") +
      (o.pecas ? `Peças: ${o.pecas}%0A` : "") +
      `Valor: ${fmtBRL(o.valor)}%0AGarantia: ${o.garantia} meses%0AData: ${fmtData(o.data)}%0A%0A` +
      `Técnico: ${cfg.tecnico}`;
    window.open(waLink(cli?.wa || cli?.tel, decodeURIComponent(msg)), "_blank");
  };

  if (sel) {
    return (
      <div className="space-y-5">
        <button data-testid="back-os-btn" onClick={() => setSel(null)} className="flex items-center gap-1 text-orange-400 text-sm font-semibold">
          <ChevronLeft size={18} /> Voltar
        </button>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-zinc-500 text-sm">OS #{sel.num}</p>
              <h2 className="font-outfit font-extrabold text-2xl">{sel.servico}</h2>
              <p className="text-zinc-400">{sel.nomeCli}</p>
            </div>
            <Badge tone={tone[sel.status]}>{lbl[sel.status]}</Badge>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-5 text-sm">
            <Row label="Defeito" value={sel.problema} />
            <Row label="Peças" value={sel.pecas} />
            <Row label="Valor" value={fmtBRL(sel.valor)} />
            <Row label="Garantia" value={`${sel.garantia} meses`} />
            <Row label="Data" value={fmtData(sel.data)} />
            <Row label="Hora" value={sel.hora || "—"} />
          </div>
          {sel.obs && <p className="mt-4 text-sm text-zinc-400 bg-white/5 rounded-xl p-3">{sel.obs}</p>}
          <div className="flex flex-wrap gap-2 mt-5">
            {sel.status !== "concluida" && <Btn variant="fire" onClick={() => concluir(sel)} data-testid="os-conclude-btn"><CheckCircle2 size={16} /> Concluir</Btn>}
            <Btn variant="outline" onClick={() => comprovante(sel)} data-testid="os-receipt-btn"><Printer size={16} /> Comprovante</Btn>
            <Btn variant="ghost" onClick={() => openEdit(sel)} data-testid="os-edit-btn"><Pencil size={16} /> Editar</Btn>
            <Btn variant="danger" onClick={() => remove(sel)} data-testid="os-delete-btn"><Trash2 size={16} /></Btn>
          </div>
        </div>
        <OSModal {...{ open, setOpen, form, setForm, save, edit, clientes }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle right={<Btn onClick={openNew} data-testid="os-add-new-btn"><Plus size={16} /> Nova OS</Btn>}>Ordens de Serviço</SectionTitle>
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input data-testid="os-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar OS, cliente, serviço..." className={`${inputCls} pl-10`} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button key={f.id} data-testid={`os-filter-${f.id}`} onClick={() => setFiltro(f.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${filtro === f.id ? "fire-btn text-white" : "bg-white/5 text-zinc-400"}`}>
            {f.label}
          </button>
        ))}
      </div>
      {list.length === 0 ? <Empty icon={Flame} title="Nenhuma OS" sub="Crie uma nova ordem de serviço." /> : (
        <div className="space-y-2">
          {list.map((o) => (
            <button key={o.id} data-testid={`os-card-${o.id}`} onClick={() => setSel(o)} className="glass glass-hover rounded-2xl p-4 w-full text-left flex items-center gap-3">
              <div className="flame-badge px-2.5 py-2 rounded-xl font-mono text-xs">#{o.num}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{o.servico} <span className="text-zinc-500 font-normal">· {o.nomeCli}</span></p>
                <p className="text-xs text-zinc-500 truncate">{o.problema || "Sem descrição"} · {fmtData(o.data)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-outfit font-bold text-sm">{fmtBRL(o.valor)}</p>
                <Badge tone={tone[o.status]}>{lbl[o.status]}</Badge>
              </div>
            </button>
          ))}
        </div>
      )}
      <OSModal {...{ open, setOpen, form, setForm, save, edit, clientes }} />
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="bg-white/5 rounded-xl p-3"><p className="text-[10px] font-mono uppercase text-zinc-500">{label}</p><p className="text-zinc-200">{value || "—"}</p></div>
);

function OSModal({ open, setOpen, form, setForm, save, edit, clientes }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open={open} onClose={() => setOpen(false)} title={edit ? `Editar OS #${edit.num}` : "Nova OS"} testId="os-modal">
      <Field label="Cliente *">
        <select data-testid="os-cliente-select" value={form.cliId} onChange={set("cliId")} className={inputCls}>
          <option value="">Selecione...</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </Field>
      <Field label="Serviço *"><input data-testid="os-servico-input" value={form.servico} onChange={set("servico")} className={inputCls} placeholder="Ex: Troca de válvula" /></Field>
      <Field label="Defeito relatado"><input value={form.problema} onChange={set("problema")} className={inputCls} /></Field>
      <Field label="Peças trocadas"><input value={form.pecas} onChange={set("pecas")} className={inputCls} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor (R$)"><input data-testid="os-valor-input" type="number" value={form.valor} onChange={set("valor")} className={inputCls} placeholder="0,00" /></Field>
        <Field label="Garantia (meses)"><input type="number" value={form.garantia} onChange={set("garantia")} className={inputCls} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data"><input type="date" value={form.data} onChange={set("data")} className={inputCls} /></Field>
        <Field label="Hora"><input type="time" value={form.hora} onChange={set("hora")} className={inputCls} /></Field>
      </div>
      <Field label="Status">
        <select data-testid="os-status-select" value={form.status} onChange={set("status")} className={inputCls}>
          <option value="pendente">Pendente</option>
          <option value="concluida">Concluída</option>
          <option value="garantia">Em Garantia</option>
        </select>
      </Field>
      <Field label="Observações"><textarea value={form.obs} onChange={set("obs")} rows={2} className={inputCls} /></Field>
      <Btn onClick={save} className="w-full" data-testid="os-save-btn">Salvar OS</Btn>
    </Modal>
  );
}
