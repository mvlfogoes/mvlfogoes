import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search, Plus, Phone, MapPin, Pencil, Trash2, MessageCircle, Flame, ChevronLeft, Images, CheckCircle2,
} from "lucide-react";
import { api, waLink, CIDADES } from "@/lib/api";
import { CidadeChips } from "@/components/CidadeChips";
import { FotosFogao } from "@/components/FotosFogao";
import { DocsCliente } from "@/components/DocsCliente";
import { Modal, Field, inputCls, Btn, Badge, Empty, SectionTitle } from "@/lib/ui";
import { useApp } from "@/App";

const blank = { nome: "", tel: "", wa: "", end: "", fogao: "", etiqueta: "", obs: "" };

export default function Clientes() {
  const { clientes, reloadClientes, go } = useApp();
  const [q, setQ] = useState("");
  const [cidade, setCidade] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(blank);
  const [sel, setSel] = useState(null);
  const [ordens, setOrdens] = useState([]);
  const [pending, setPending] = useState([]);

  useEffect(() => { api.listOrdens().then(setOrdens); }, [clientes]);

  const list = clientes.filter((c) => (!cidade || c.etiqueta === cidade) &&
    [c.nome, c.tel, c.end, c.etiqueta].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  const openNew = () => { setEdit(null); setForm(blank); setPending([]); setOpen(true); };
  const openEdit = (c) => { setEdit(c); setForm({ ...blank, ...c }); setOpen(true); };

  const save = async () => {
    if (!form.nome.trim()) return toast.error("Informe o nome do cliente");
    const payload = { ...form };
    try {
      if (edit) { await api.updateCliente(edit.id, payload); toast.success("Cliente atualizado"); }
      else {
        const novo = await api.createCliente(payload);
        for (const p of pending) await api.uploadFoto(novo.id, p.blob);
        setPending([]);
        toast.success("Cliente cadastrado");
      }
      setOpen(false); reloadClientes();
      if (sel && edit) setSel({ ...sel, ...payload });
    } catch { toast.error("Erro ao salvar"); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Excluir ${c.nome}? Isso remove OS e mídias vinculadas.`)) return;
    await api.deleteCliente(c.id); toast.success("Cliente excluído"); setSel(null); reloadClientes();
  };

  if (sel) {
    const osDoCli = ordens.filter((o) => o.cliId === sel.id);
    return (
      <div className="space-y-5">
        <button data-testid="back-clientes-btn" onClick={() => setSel(null)} className="flex items-center gap-1 text-sky-300 text-sm font-semibold">
          <ChevronLeft size={18} /> Voltar
        </button>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-outfit font-extrabold text-2xl">{sel.nome}</h2>
              {sel.etiqueta && <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5"><MapPin size={12} className="text-sky-300" /> {sel.etiqueta}</p>}
            </div>
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={() => openEdit(sel)} data-testid="edit-client-btn"><Pencil size={16} /></Btn>
              <Btn variant="danger" onClick={() => remove(sel)} data-testid="delete-client-btn"><Trash2 size={16} /></Btn>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-mono uppercase text-zinc-500 mb-1.5">Fotos do fogão</p>
            <FotosFogao cliId={sel.id} size={64} testid="ficha-fotos" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-5 text-sm">
            <Info icon={Phone} label="Telefone" value={sel.tel} />
            <Info icon={MessageCircle} label="WhatsApp" value={sel.wa || sel.tel} />
            <Info icon={MapPin} label="Endereço" value={sel.end} />
            <Info icon={Flame} label="Fogão" value={sel.fogao} />
          </div>
          {sel.obs && <p className="mt-4 text-sm text-zinc-400 bg-white/5 rounded-xl p-3">{sel.obs}</p>}
          <div className="flex flex-wrap gap-2 mt-5">
            <a href={waLink(sel.wa || sel.tel, `Olá ${sel.nome}, aqui é da MVL Fogões!`)} target="_blank" rel="noreferrer">
              <Btn variant="fire" data-testid="client-whatsapp-btn"><MessageCircle size={16} /> WhatsApp</Btn>
            </a>
            <Btn variant="outline" onClick={() => go("midias")} data-testid="client-midias-btn"><Images size={16} /> Mídias</Btn>
          </div>
        </div>

        <div>
          <SectionTitle>Ordens de Serviço ({osDoCli.length})</SectionTitle>
          {osDoCli.length === 0 ? <Empty icon={Flame} title="Sem OS" sub="Este cliente ainda não tem ordens." /> : (
            <div className="space-y-2">
              {osDoCli.map((o) => (
                <div key={o.id} className="glass rounded-xl p-3 flex items-center justify-between">
                  <div><p className="font-semibold text-sm">#{o.num} · {o.servico}</p><p className="text-xs text-zinc-500">{o.problema}</p></div>
                  <Badge tone={o.status === "concluida" ? "green" : "amber"}>{o.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
        <DocsCliente cli={sel} />
        <ClienteModal {...{ open, setOpen, form, setForm, save, edit, pending, setPending }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle right={<Btn onClick={openNew} data-testid="client-add-new-btn"><Plus size={16} /> Novo</Btn>}>Clientes</SectionTitle>
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input data-testid="client-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, telefone, bairro..." className={`${inputCls} pl-10`} />
      </div>
      <CidadeChips value={cidade} onChange={setCidade} clientes={clientes} prefix="client" />
      {list.length === 0 ? <Empty icon={Search} title="Nenhum cliente" sub={cidade ? `Nenhum cliente com a etiqueta ${cidade}.` : "Cadastre seu primeiro cliente."} /> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {list.map((c) => (
            <button key={c.id} data-testid={`client-card-${c.id}`} onClick={() => setSel(c)} className="glass glass-hover rounded-2xl p-4 text-left">
              <div className="flex items-center gap-3">
                <div className="flame-badge p-2.5 rounded-xl font-outfit font-bold">{c.nome[0]?.toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{c.nome}</p>
                  <p className="text-xs text-zinc-500 truncate flex items-center gap-1"><Phone size={11} /> {c.tel || "—"}</p>
                </div>
                {c.etiqueta && <Badge tone="orange">{c.etiqueta}</Badge>}
              </div>
              {c.end && <p className="text-xs text-zinc-500 mt-2 truncate flex items-center gap-1"><MapPin size={11} /> {c.end}</p>}
            </button>
          ))}
        </div>
      )}
      <ClienteModal {...{ open, setOpen, form, setForm, save, edit, pending, setPending }} />
    </div>
  );
}

const Info = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 bg-white/5 rounded-xl p-3">
    <Icon size={16} className="text-sky-300 mt-0.5" />
    <div><p className="text-[10px] font-mono uppercase text-zinc-500">{label}</p><p className="text-zinc-200">{value || "—"}</p></div>
  </div>
);

function ClienteModal({ open, setOpen, form, setForm, save, edit, pending, setPending }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, ...(k === "tel" && (!f.wa || f.wa === f.tel) ? { wa: e.target.value } : {}) }));
  return (
    <Modal open={open} onClose={() => setOpen(false)} title={edit ? "Editar Cliente" : "Novo Cliente"} testId="client-modal">
      <Field label="Nome *"><input data-testid="client-nome-input" value={form.nome} onChange={set("nome")} className={inputCls} placeholder="Nome completo" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone"><input data-testid="client-tel-input" value={form.tel} onChange={set("tel")} className={inputCls} placeholder="(11) 90000-0000" /></Field>
        <Field label="WhatsApp"><input data-testid="client-wa-input" value={form.wa} onChange={set("wa")} className={inputCls} placeholder="(opcional)" /></Field>
      </div>
      <Field label="Endereço"><input value={form.end} onChange={set("end")} className={inputCls} placeholder="Rua, nº, bairro" /></Field>
      <Field label="Modelo do Fogão"><input value={form.fogao} onChange={set("fogao")} className={inputCls} placeholder="Ex: Brastemp 5 bocas" /></Field>
      <div className="space-y-1.5">
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Fotos do fogão</span>
        <FotosFogao cliId={edit?.id} pending={pending} setPending={setPending} testid="client-fotos" />
      </div>
      <div className="space-y-1.5">
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Cidade onde reside</span>
        <div className="flex flex-wrap gap-2" data-testid="client-cidade-select">
          {CIDADES.map((c) => {
            const on = form.etiqueta === c;
            return (
              <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, etiqueta: on ? "" : c }))}
                data-testid={`client-cidade-opt-${c.toLowerCase().replace(/\s+/g, "-")}`}
                className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${on ? "fire-btn text-white" : "bg-white/5 text-zinc-300 border border-white/10"}`}>
                {on ? <CheckCircle2 size={15} /> : <MapPin size={15} className="text-sky-300" />} {c}
              </button>
            );
          })}
        </div>
      </div>
      <Field label="Observações"><textarea value={form.obs} onChange={set("obs")} rows={2} className={inputCls} /></Field>
      <Btn onClick={save} className="w-full" data-testid="client-save-btn">Salvar Cliente</Btn>
    </Modal>
  );
}
