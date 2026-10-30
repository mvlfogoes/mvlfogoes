import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CircleDollarSign, Plus, CheckCircle2, Undo2, Trash2, Pencil, MessageCircle, Wallet, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from "recharts";
import { api, fmtBRL, fmtData, hoje, waLink } from "@/lib/api";
import { Modal, Field, inputCls, Btn, Badge, Empty, SectionTitle } from "@/lib/ui";
import { useApp } from "@/App";

const blank = { cliId: "", nome: "", tel: "", valor: "", vencimento: "", obs: "", pago: false };

function buildChart(ordens) {
  const map = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("sv-SE").slice(0, 7);
    map[key] = { mes: d.toLocaleDateString("pt-BR", { month: "short" }), total: 0 };
  }
  ordens.forEach((o) => {
    const key = (o.dataConclusao || o.data || "").slice(0, 7);
    if (map[key] && o.status === "concluida") map[key].total += Number(o.valor) || 0;
  });
  return Object.values(map);
}

const Faturamento = ({ ordens }) => {
  const chart = buildChart(ordens);
  const mes = chart[chart.length - 1]?.total || 0;
  const total6 = chart.reduce((s, c) => s + c.total, 0);
  return (
    <div className="glass rounded-2xl p-5" data-testid="fin-faturamento">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-outfit font-bold flex items-center gap-2"><CircleDollarSign size={18} className="text-sky-300" /> Faturamento (OS concluídas)</h3>
        <Badge tone="blue">6 meses</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3"><p className="text-[11px] text-zinc-400">Este mês</p><p className="font-outfit font-extrabold text-xl" data-testid="fin-mes">{fmtBRL(mes)}</p></div>
        <div className="bg-white/5 rounded-xl p-3"><p className="text-[11px] text-zinc-400">Últimos 6 meses</p><p className="font-outfit font-extrabold text-xl" data-testid="fin-6m">{fmtBRL(total6)}</p></div>
      </div>
      <div style={{ width: "100%", height: 170 }}>
        <ResponsiveContainer>
          <AreaChart data={chart}>
            <defs>
              <linearGradient id="neon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="mes" stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#0B1220", border: "1px solid rgba(56,189,248,0.35)", borderRadius: 12, fontSize: 12 }} formatter={(v) => [fmtBRL(v), "Total"]} />
            <Area type="monotone" dataKey="total" stroke="#38BDF8" strokeWidth={2.5} fill="url(#neon)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const DevedorCard = ({ d, onEdit, onPago, onDel }) => {
  const vencido = !d.pago && d.vencimento && d.vencimento < hoje();
  return (
    <div data-testid={`devedor-${d.id}`} className={`glass rounded-2xl p-4 flex items-center gap-3 ${d.pago ? "opacity-60" : vencido ? "border-red-500/50" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{d.nome}</p>
        <p className="text-xs text-zinc-500 truncate">{d.pago ? `Pago em ${fmtData(d.pagoEm)}` : d.vencimento ? `Vence ${fmtData(d.vencimento)}` : "Sem data"}{d.obs ? ` · ${d.obs}` : ""}</p>
        {vencido && <span className="inline-flex mt-1"><Badge tone="red"><AlertTriangle size={10} className="inline mr-0.5" />Vencido</Badge></span>}
      </div>
      <div className="text-right shrink-0">
        <p className={`font-outfit font-extrabold ${d.pago ? "line-through text-zinc-500" : "text-red-400"}`}>{fmtBRL(d.valor)}</p>
        <div className="flex gap-1 mt-1 justify-end">
          {d.tel && !d.pago && <a href={waLink(d.tel, "")} target="_blank" rel="noreferrer" data-testid={`devedor-wa-${d.id}`} className="p-1.5 rounded-lg text-emerald-400 hover:bg-white/5"><MessageCircle size={15} /></a>}
          <button onClick={() => onPago(d)} data-testid={`devedor-pago-${d.id}`} title={d.pago ? "Desfazer" : "Marcar como pago"} className="p-1.5 rounded-lg text-sky-300 hover:bg-white/5">{d.pago ? <Undo2 size={15} /> : <CheckCircle2 size={15} />}</button>
          <button onClick={() => onEdit(d)} data-testid={`devedor-edit-${d.id}`} className="p-1.5 rounded-lg text-zinc-400 hover:bg-white/5"><Pencil size={15} /></button>
          <button onClick={() => onDel(d)} data-testid={`devedor-delete-${d.id}`} className="p-1.5 rounded-lg text-zinc-500 hover:bg-white/5"><Trash2 size={15} /></button>
        </div>
      </div>
    </div>
  );
};

export default function Financeiro() {
  const { clientes } = useApp();
  const [ordens, setOrdens] = useState([]);
  const [devs, setDevs] = useState([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(blank);
  const [verPagos, setVerPagos] = useState(false);

  const reload = () => api.listDevedores().then(setDevs);
  useEffect(() => { api.listOrdens().then(setOrdens); reload(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const escolherCli = (e) => {
    const c = clientes.find((x) => x.id === e.target.value);
    setForm((f) => ({ ...f, cliId: c?.id || "", nome: c?.nome || f.nome, tel: c?.wa || c?.tel || f.tel }));
  };
  const openNew = () => { setEdit(null); setForm(blank); setOpen(true); };
  const openEdit = (d) => { setEdit(d); setForm({ ...blank, ...d, valor: String(d.valor ?? "") }); setOpen(true); };
  const save = async () => {
    if (!form.nome.trim()) return toast.error("Informe o nome");
    const payload = { ...form, valor: parseFloat(String(form.valor).replace(",", ".")) || 0 };
    try {
      if (edit) await api.updateDevedor(edit.id, payload); else await api.createDevedor(payload);
      toast.success("Salvo"); setOpen(false); reload();
    } catch { toast.error("Erro ao salvar"); }
  };
  const pago = async (d) => { await api.updateDevedor(d.id, { ...d, pago: !d.pago }); toast.success(d.pago ? "Voltou para a lista" : "Marcado como pago"); reload(); };
  const del = async (d) => { if (!window.confirm("Excluir este registro?")) return; await api.deleteDevedor(d.id); reload(); };

  const abertos = devs.filter((d) => !d.pago);
  const total = abertos.reduce((s, d) => s + (d.valor || 0), 0);
  const lista = verPagos ? devs.filter((d) => d.pago) : abertos;

  return (
    <div className="space-y-5">
      <SectionTitle>Financeiro</SectionTitle>
      <Faturamento ordens={ordens} />
      <div className="glass rounded-2xl p-5 flex items-center justify-between" data-testid="fin-receber">
        <div className="flex items-center gap-3"><div className="flame-badge p-2.5 rounded-xl"><Wallet size={20} /></div><div><p className="text-xs text-zinc-400">A receber ({abertos.length})</p><p className="font-outfit font-extrabold text-2xl text-red-400" data-testid="fin-total-receber">{fmtBRL(total)}</p></div></div>
        <Btn onClick={openNew} data-testid="devedor-add-btn"><Plus size={16} /> Devedor</Btn>
      </div>
      <div className="flex gap-2">
        {[[false, "Em aberto"], [true, "Pagos"]].map(([v, l]) => (
          <button key={l} onClick={() => setVerPagos(v)} data-testid={`devedores-filtro-${v ? "pagos" : "abertos"}`} className={`px-4 py-2 rounded-full text-xs font-semibold ${verPagos === v ? "fire-btn text-white" : "bg-white/5 text-zinc-400"}`}>{l}</button>
        ))}
      </div>
      {lista.length === 0 ? <Empty icon={Wallet} title={verPagos ? "Nenhum pagamento" : "Ninguém devendo"} sub={verPagos ? "Os pagos aparecem aqui." : "Toque em + Devedor para anotar um valor a receber."} /> :
        <div className="space-y-2">{lista.map((d) => <DevedorCard key={d.id} d={d} onEdit={openEdit} onPago={pago} onDel={del} />)}</div>}

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "Editar devedor" : "Novo devedor"} testId="devedor-modal">
        <Field label="Cliente cadastrado (opcional)">
          <select data-testid="devedor-cliente-select" value={form.cliId} onChange={escolherCli} className={inputCls}>
            <option value="">Digitar nome abaixo</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Nome *"><input data-testid="devedor-nome-input" value={form.nome} onChange={set("nome")} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$) *"><input data-testid="devedor-valor-input" inputMode="decimal" value={form.valor} onChange={set("valor")} className={inputCls} placeholder="0,00" /></Field>
          <Field label="Vencimento"><input type="date" data-testid="devedor-venc-input" value={form.vencimento} onChange={set("vencimento")} className={inputCls} /></Field>
        </div>
        <Field label="Telefone / WhatsApp"><input data-testid="devedor-tel-input" value={form.tel} onChange={set("tel")} className={inputCls} /></Field>
        <Field label="Referente a"><textarea data-testid="devedor-obs-input" value={form.obs} onChange={set("obs")} rows={2} className={inputCls} /></Field>
        <Btn onClick={save} className="w-full" data-testid="devedor-save-btn">Salvar</Btn>
      </Modal>
    </div>
  );
}
