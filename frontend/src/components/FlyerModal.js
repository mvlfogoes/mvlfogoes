import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { X, Send, Download, Pencil, ClipboardPaste } from "lucide-react";
import { waLink } from "@/lib/api";
import { ConversaPanel } from "@/components/ConversaPanel";
import { W, H, Header, Solucoes, Footer } from "@/components/flyerParts";
import { MODELOS } from "@/components/flyerModelos";

const Flyer = ({ M, f, set, cfg, cap, innerRef }) => (
  <div ref={innerRef} data-testid="flyer-canvas" style={{ width: W, height: H, background: "#fff", fontFamily: "Inter, sans-serif", color: "#1a1a1a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <Header cfg={cfg} titulo={M.titulo} compacto={M.compacto} />
    <Solucoes cfg={cfg} />
    <div style={{ flex: 1, padding: M.compacto ? "10px 18px" : "14px 18px", display: "flex", flexDirection: "column", gap: M.compacto ? 6 : 8, minHeight: 0 }}>
      <M.Body f={f} set={set} cap={cap} cfg={cfg} />
    </div>
    <Footer cfg={cfg} />
  </div>
);

const useFitScale = () => {
  const [s, setS] = useState(1);
  useEffect(() => {
    const fit = () => setS(Math.min(1, (window.innerWidth - 24) / W));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return s;
};

export default function FlyerModal({ open, onClose, ag, cli, cfg, colar = false, modelo = "agenda" }) {
  const M = MODELOS[modelo];
  const conf = cfg || {};
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const [cap, setCap] = useState(false);
  const [painel, setPainel] = useState(colar);
  const [f, setF] = useState(() => M.init(ag || {}, cli, conf));
  const setForm = (n) => setF((old) => (M.fix ? M.fix(n, old) : n));
  const scale = useFitScale();

  if (!open) return null;

  const gerar = async () => {
    setCap(true);
    await new Promise((r) => setTimeout(r, 60));
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 3, backgroundColor: "#ffffff", useCORS: true, width: W, height: H,
        onclone: (doc) => {
          doc.querySelector('[data-testid="flyer-canvas"]').parentElement.style.transform = "none";
          const st = doc.createElement("style");
          st.textContent = "[data-ico]{position:relative;top:2px}[data-lbl]{position:relative;top:-1px}[data-testid=flyer-total] span{position:relative;top:-5px}[data-txt]{top:-4px}";
          doc.head.appendChild(st);
        },
      });
      return await new Promise((r) => canvas.toBlob(r, "image/png"));
    } finally {
      setCap(false);
    }
  };
  const nomeArq = `${M.arquivo}-${(f.nome || "cliente").replace(/\s+/g, "-")}.png`;

  const baixarBlob = (blob) => {
    const link = document.createElement("a");
    link.download = nomeArq;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  };

  const baixar = async () => {
    setBusy(true);
    try { baixarBlob(await gerar()); toast.success("Imagem salva na galeria!"); }
    catch { toast.error("Não foi possível gerar a imagem"); }
    setBusy(false);
  };

  const enviar = async () => {
    setBusy(true);
    const texto = M.texto(f, conf);
    try {
      const blob = await gerar();
      const file = new File([blob], nomeArq, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: texto });
      } else {
        baixarBlob(blob);
        toast.success("Imagem salva! Anexe-a na conversa do WhatsApp.");
        window.open(waLink(cli?.wa || cli?.tel || f.tel, texto), "_blank");
      }
    } catch (e) {
      if (e?.name !== "AbortError") toast.error("Não foi possível enviar");
    }
    setBusy(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-sm flex flex-col" data-testid="flyer-modal">
      <div className="glass border-b border-orange-500/20 px-4 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-outfit font-bold" data-testid="flyer-modal-title">{M.modal}</h3>
          <p className="text-xs text-zinc-400 flex items-center gap-1"><Pencil size={11} /> Toque nos campos para editar antes de enviar</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPainel(!painel)} data-testid="flyer-toggle-conversa" title="Dados da conversa" className={`p-2 rounded-xl ${painel ? "text-orange-400 bg-orange-500/10" : "text-zinc-400 hover:bg-white/5"}`}><ClipboardPaste size={19} /></button>
          <button onClick={onClose} data-testid="flyer-close-btn" className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={20} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 flex flex-col items-center gap-3">
        {painel && <ConversaPanel f={f} set={setForm} cli={cli} campos={M.campos} />}
        <div style={{ width: W * scale, height: H * scale, flexShrink: 0 }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: W, height: H }} className="rounded-xl overflow-hidden shadow-2xl">
            <Flyer M={M} f={f} set={setForm} cfg={conf} cap={cap} innerRef={ref} />
          </div>
        </div>
      </div>
      <div className="glass border-t border-orange-500/20 p-3 flex gap-2">
        <button onClick={enviar} disabled={busy} data-testid="flyer-send-btn" className="fire-btn text-white flex-1 rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"><Send size={17} /> {busy ? "Gerando..." : "Enviar no WhatsApp"}</button>
        <button onClick={baixar} disabled={busy} data-testid="flyer-download-btn" className="border border-orange-500/40 text-orange-400 rounded-xl px-4 py-3 font-semibold flex items-center gap-2 disabled:opacity-50"><Download size={17} /> Imagem</button>
      </div>
    </div>,
    document.body
  );
}
