import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, CalendarCheck, Calculator, Receipt, Send, Download, Trash2, Printer, Wrench } from "lucide-react";
import { api, docUrl } from "@/lib/api";
import { compartilhar, baixarBlob, imprimir } from "@/lib/media";
import { Empty, SectionTitle } from "@/lib/ui";
import { ZoomViewer } from "@/components/ZoomViewer";

const TIPOS = { agenda: ["Visita", CalendarCheck], servico: ["Serviço", Wrench], orcamento: ["Orçamento", Calculator], recibo: ["Recibo", Receipt] };
const FILTROS = [["", "Todos"], ["agenda", "Visitas"], ["servico", "Serviços"], ["orcamento", "Orçamentos"], ["recibo", "Recibos"]];
const quando = (ts) => new Date(ts).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function DocsCliente({ cli }) {
  const [docs, setDocs] = useState([]);
  const [tipo, setTipo] = useState("");
  const [ver, setVer] = useState(null);

  useEffect(() => { api.listDocs(cli.id).then(setDocs); }, [cli.id]);

  const blobDe = async (d) => (await fetch(docUrl(d.id))).blob();
  const nome = (d) => `${d.tipo}-${(d.nomeCli || "cliente").replace(/\s+/g, "-")}.png`;
  const enviar = async (d) => { try { await compartilhar(await blobDe(d), nome(d), cli.wa || cli.tel); } catch (e) { if (e?.name !== "AbortError") toast.error("Não foi possível enviar"); } };
  const baixar = async (d) => baixarBlob(await blobDe(d), nome(d));
  const excluir = async (d) => {
    if (!window.confirm("Excluir este documento do arquivo?")) return;
    await api.deleteDoc(d.id); setDocs((x) => x.filter((y) => y.id !== d.id)); setVer(null); toast.success("Documento excluído");
  };

  const list = docs.filter((d) => !tipo || d.tipo === tipo);

  return (
    <div data-testid="docs-cliente">
      <SectionTitle>Arquivo ({docs.length})</SectionTitle>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTROS.map(([k, l]) => (
          <button key={l} onClick={() => setTipo(k)} data-testid={`docs-filtro-${k || "todos"}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${tipo === k ? "fire-btn text-white" : "bg-white/5 text-zinc-400"}`}>{l}</button>
        ))}
      </div>
      {list.length === 0 ? <Empty icon={FileText} title="Nada guardado" sub="Use o botão Guardar no flyer para arquivar visitas, orçamentos e recibos." /> : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {list.map((d) => {
            const [label, Icon] = TIPOS[d.tipo] || ["Documento", FileText];
            return (
              <button key={d.id} onClick={() => setVer(d)} data-testid={`doc-${d.id}`} className="glass glass-hover rounded-xl overflow-hidden text-left">
                <div className="aspect-[9/16] bg-white"><img src={docUrl(d.id)} alt={label} loading="lazy" className="w-full h-full object-cover object-top" /></div>
                <div className="p-2">
                  <p className="text-[11px] font-semibold flex items-center gap-1 text-sky-300"><Icon size={11} /> {label}</p>
                  {d.resumo && <p className="text-[10px] text-zinc-500 truncate">{d.resumo}</p>}
                  <p className="text-[10px] text-zinc-600">{quando(d.ts)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {ver && (
        <ZoomViewer src={docUrl(ver.id)} onClose={() => setVer(null)} testid="doc-viewer">
          <button onClick={() => enviar(ver)} data-testid="doc-viewer-send" className="fire-btn text-white flex-1 rounded-xl py-3 font-semibold flex items-center justify-center gap-2"><Send size={17} /> Enviar</button>
          <button onClick={() => baixar(ver)} data-testid="doc-viewer-download" className="border border-sky-400/40 text-sky-300 rounded-xl px-4 py-3"><Download size={17} /></button>
          {<button onClick={async () => { try { await imprimir(await blobDe(ver)); } catch { toast.error("Não foi possível imprimir"); } }} data-testid="doc-viewer-print" aria-label="Imprimir" className="border border-sky-400/40 text-sky-300 rounded-xl px-4 py-3"><Printer size={17} /></button>}
          <button onClick={() => excluir(ver)} data-testid="doc-viewer-delete" className="border border-red-500/40 text-red-400 rounded-xl px-4 py-3"><Trash2 size={17} /></button>
        </ZoomViewer>
      )}
    </div>
  );
}
