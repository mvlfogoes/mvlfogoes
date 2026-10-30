import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Pencil, Plus, Trash2, Check } from "lucide-react";
import { api } from "@/lib/api";
import { inputCls, Btn } from "@/lib/ui";

export const TEMPLATES_PADRAO = [
  { id: "orcamento", label: "Orçamento Pronto", texto: "Olá {nome}! Seu orçamento da MVL Fogões está pronto. Posso te enviar os detalhes?" },
  { id: "caminho", label: "Técnico a Caminho", texto: "Olá {nome}, aqui é da MVL Fogões. Nosso técnico já está a caminho! 🔧🔥" },
  { id: "concluido", label: "Serviço Concluído", texto: "Olá {nome}! Seu serviço foi concluído com sucesso. Garantia de 30 dias em peças e serviços. Obrigado pela confiança! 🔥" },
  { id: "satisfacao", label: "Pesquisa de Satisfação", texto: "Olá {nome}! Como foi sua experiência com a MVL Fogões? Sua opinião é muito importante para nós! ⭐" },
  { id: "agenda", label: "Confirmar Visita", texto: "Olá {nome}! Confirmando sua visita técnica da MVL Fogões. Podemos manter o horário combinado?" },
];

export const preencher = (t, nome) => (t?.texto || "").replace(/\{nome\}/g, nome);

export function MensagensRapidas({ cfg, setCfg, tpls, tpl, setTpl }) {
  const [edit, setEdit] = useState(null);

  const salvar = async (lista) => {
    try {
      const r = await api.updateConfig({ templates: lista });
      setCfg(r);
      toast.success("Mensagens salvas");
    } catch { toast.error("Erro ao salvar"); }
  };
  const confirmar = async () => {
    if (!edit.label.trim() || !edit.texto.trim()) return toast.error("Preencha o nome e o texto");
    const existe = tpls.some((t) => t.id === edit.id);
    const lista = existe ? tpls.map((t) => (t.id === edit.id ? edit : t)) : [...tpls, edit];
    await salvar(lista);
    setTpl(edit); setEdit(null);
  };
  const excluir = async () => {
    if (!window.confirm("Excluir esta mensagem?")) return;
    const lista = tpls.filter((t) => t.id !== edit.id);
    await salvar(lista);
    setTpl(lista[0] || null); setEdit(null);
  };

  return (
    <div className="glass rounded-2xl p-5" data-testid="wa-mensagens">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-outfit font-bold flex items-center gap-2"><Sparkles size={18} className="text-sky-300" /> Mensagem Rápida</h3>
        <div className="flex gap-1">
          {tpl && <button onClick={() => setEdit({ ...tpl })} data-testid="wa-template-edit" className="p-2 rounded-lg text-sky-300 hover:bg-white/5"><Pencil size={16} /></button>}
          <button onClick={() => setEdit({ id: `t${Date.now()}`, label: "", texto: "Olá {nome}! " })} data-testid="wa-template-new" className="p-2 rounded-lg text-sky-300 hover:bg-white/5"><Plus size={16} /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {tpls.map((t) => (
          <button key={t.id} data-testid={`wa-template-${t.id}`} onClick={() => setTpl(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${tpl?.id === t.id ? "fire-btn text-white" : "bg-white/5 text-zinc-400"}`}>{t.label}</button>
        ))}
      </div>
      {edit ? (
        <div className="space-y-2" data-testid="wa-template-editor">
          <input data-testid="wa-template-label-input" value={edit.label} onChange={(e) => setEdit({ ...edit, label: e.target.value })} placeholder="Nome do botão" className={inputCls} />
          <textarea data-testid="wa-template-texto-input" value={edit.texto} onChange={(e) => setEdit({ ...edit, texto: e.target.value })} rows={3} className={inputCls} />
          <p className="text-[11px] text-zinc-500">Use {"{nome}"} onde deve entrar o nome do cliente.</p>
          <div className="flex gap-2">
            <Btn onClick={confirmar} className="flex-1" data-testid="wa-template-save"><Check size={16} /> Salvar</Btn>
            <Btn variant="outline" onClick={() => setEdit(null)} data-testid="wa-template-cancel">Cancelar</Btn>
            {tpls.some((t) => t.id === edit.id) && <Btn variant="danger" onClick={excluir} data-testid="wa-template-delete"><Trash2 size={16} /></Btn>}
          </div>
        </div>
      ) : tpl && <p className="text-sm text-zinc-400 bg-white/5 rounded-xl p-3 italic" data-testid="wa-template-preview">"{preencher(tpl, "[Cliente]")}"</p>}
    </div>
  );
}
