import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Images, ChevronLeft, Upload, Trash2, X, Film } from "lucide-react";
import { api } from "@/lib/api";
import { Btn, Empty, SectionTitle, Badge } from "@/lib/ui";
import { useApp } from "@/App";

export default function Midias() {
  const { clientes } = useApp();
  const [midias, setMidias] = useState([]);
  const [sel, setSel] = useState(null);
  const [lb, setLb] = useState(null);
  const fileRef = useRef();

  const reload = () => api.listMidias().then(setMidias);
  useEffect(() => { reload(); }, []);

  const countOf = (cid) => midias.filter((m) => m.cliId === cid).length;
  const galeria = sel ? midias.filter((m) => m.cliId === sel.id) : [];

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (f.size > 3 * 1024 * 1024) { toast.error(`${f.name} muito grande (máx 3MB)`); continue; }
      const dataUrl = await toDataUrl(f);
      await api.createMidia({ cliId: sel.id, dataUrl, label: f.name, tipo: f.type.startsWith("video") ? "video" : "foto" });
    }
    toast.success("Mídia adicionada"); reload(); e.target.value = "";
  };

  const del = async (m) => { if (!window.confirm("Excluir mídia?")) return; await api.deleteMidia(m.id); setLb(null); reload(); };

  if (sel) {
    return (
      <div className="space-y-5">
        <button data-testid="back-midias-btn" onClick={() => setSel(null)} className="flex items-center gap-1 text-orange-400 text-sm font-semibold"><ChevronLeft size={18} /> Voltar</button>
        <SectionTitle right={<Btn onClick={() => fileRef.current.click()} data-testid="midia-upload-btn"><Upload size={16} /> Adicionar</Btn>}>{sel.nome}</SectionTitle>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={onFiles} data-testid="midia-file-input" />
        {galeria.length === 0 ? <Empty icon={Images} title="Sem mídias" sub="Adicione fotos ou vídeos deste cliente." /> : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {galeria.map((m) => (
              <button key={m.id} data-testid={`midia-item-${m.id}`} onClick={() => setLb(m)} className="relative aspect-square rounded-xl overflow-hidden glass glass-hover group">
                {m.tipo === "video" ? <video src={m.dataUrl} className="w-full h-full object-cover" /> : <img src={m.dataUrl} alt={m.label} className="w-full h-full object-cover" />}
                {m.tipo === "video" && <Film size={16} className="absolute top-1.5 right-1.5 text-white drop-shadow" />}
              </button>
            ))}
          </div>
        )}
        {lb && (
          <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4" onClick={() => setLb(null)} data-testid="lightbox">
            <button className="absolute top-4 right-4 text-white p-2" onClick={() => setLb(null)}><X size={26} /></button>
            {lb.tipo === "video" ? <video src={lb.dataUrl} controls className="max-h-[80vh] max-w-full rounded-xl" onClick={(e) => e.stopPropagation()} /> : <img src={lb.dataUrl} alt={lb.label} className="max-h-[80vh] max-w-full rounded-xl" onClick={(e) => e.stopPropagation()} />}
            <Btn variant="danger" className="absolute bottom-6" onClick={(e) => { e.stopPropagation(); del(lb); }} data-testid="lightbox-delete-btn"><Trash2 size={16} /> Excluir</Btn>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle>Mídias</SectionTitle>
      {clientes.length === 0 ? <Empty icon={Images} title="Sem clientes" sub="Cadastre clientes para adicionar mídias." /> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {clientes.map((c) => (
            <button key={c.id} data-testid={`midia-cli-${c.id}`} onClick={() => setSel(c)} className="glass glass-hover rounded-2xl p-4 flex items-center gap-3 text-left">
              <div className="flame-badge p-2.5 rounded-xl"><Images size={18} /></div>
              <div className="flex-1 min-w-0"><p className="font-semibold truncate">{c.nome}</p><p className="text-xs text-zinc-500">{countOf(c.id)} mídia(s)</p></div>
              {countOf(c.id) > 0 && <Badge tone="orange">{countOf(c.id)}</Badge>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const toDataUrl = (file) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
