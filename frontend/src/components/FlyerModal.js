import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { X, Send, Download, Phone, Flame, Search, Wrench, ShieldCheck, Star, Handshake, Pencil, Check } from "lucide-react";
import { fmtBRL, fmtData, waLink, CIDADES } from "@/lib/api";
import { ConversaPanel } from "@/components/ConversaPanel";

const TIPOS = [
  { key: "fogao", label: "Fogão" },
  { key: "cooktop", label: "Cooktop" },
  { key: "forno", label: "Forno" },
  { key: "outro", label: "Outro" },
];

const W = 405;
const H = 720;
const OBS_PADRAO = "Em caso de necessidade de alteração, entre em contato com antecedência.";

const tipoDe = (ag) => ag.tipo || TIPOS.find((t) => (ag.servico || "").toLowerCase().includes(t.key))?.key || "fogao";

const initForm = (ag, cli, cfg) => ({
  nome: ag.nomeCli || "",
  tel: cli?.tel || "",
  end: cli?.end || "",
  cidade: (CIDADES.includes(cli?.etiqueta) ? `${cli.etiqueta} - MG` : cfg.cidade) || "",
  data: ag.data ? fmtData(ag.data) : "",
  hora: ag.hora || "",
  tipo: tipoDe(ag),
  servico: ag.servico || "",
  taxa: ag.valor ? fmtBRL(ag.valor) : "",
  obs: [OBS_PADRAO, ag.obs].filter(Boolean).join("\n"),
});

export function buildFlyerText(f, cfg) {
  const tipo = TIPOS.find((t) => t.key === f.tipo)?.label;
  const serv = [tipo, f.servico].filter(Boolean).join(" — ") || "—";
  return [
    "*MVL FOGÕES* 🔥",
    "*AGENDAMENTO DE VISITA*",
    `_${cfg.slogan || "A qualidade que dá confiança!"}_`,
    "",
    `👤 *Cliente:* ${f.nome || "—"}`,
    `📞 *Telefone:* ${f.tel || "—"}`,
    f.end ? `📍 *Endereço:* ${f.end}` : null,
    f.cidade ? `🏙️ *Cidade:* ${f.cidade}` : null,
    "",
    `📅 *Data da Visita:* ${f.data || "—"}`,
    `⏰ *Horário:* ${f.hora || "—"}`,
    `🔧 *Serviço:* ${serv}`,
    f.taxa ? `💰 *Taxa de Visita:* ${f.taxa}` : null,
    "",
    f.obs ? `📝 ${f.obs}` : null,
    "",
    `📱 *Fale conosco:* ${cfg.telefone || ""}`,
  ].filter((l) => l !== null).join("\n");
}

const lbl = { fontWeight: 800, fontSize: 11, color: "#FF6A00", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 };
const val = { width: "100%", border: "none", borderBottom: "1px dashed #c9c2b8", background: "transparent", fontSize: 14, fontWeight: 600, color: "#1a1a1a", padding: "2px 0 5px", outline: "none", fontFamily: "Inter, sans-serif", minHeight: 22, lineHeight: "18px" };

const Field = ({ label, k, f, set, cap, flex = 1, testid }) => (
  <div style={{ flex, minWidth: 0 }}>
    <div style={lbl}>{label}</div>
    {cap ? <div style={{ ...val, borderBottom: "1px solid #d6d0c7", whiteSpace: "nowrap", overflow: "hidden" }}>{f[k] || "\u00a0"}</div>
      : <input data-testid={testid} value={f[k]} onChange={(e) => set({ ...f, [k]: e.target.value })} placeholder="toque para preencher" style={val} />}
  </div>
);

const Header = ({ cfg }) => (
  <div style={{ background: "#1c1a18", color: "#fff", padding: "14px 16px 12px", textAlign: "center" }}>
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 36, lineHeight: 1 }}>
      MVL <span style={{ color: "#FF6A00" }}>FOGÕES</span>
    </div>
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 22, marginTop: 6 }}>AGENDAMENTO DE VISITA</div>
    <div style={{ fontSize: 9, letterSpacing: 2, color: "#cfcfcf", marginTop: 2 }}>ASSISTÊNCIA TÉCNICA ESPECIALIZADA</div>
    <div style={{ color: "#FF8A3C", fontWeight: 700, fontSize: 11, marginTop: 6 }}>{(cfg.slogan || "Qualidade que dá confiança!").toUpperCase()}</div>
    <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 8, fontSize: 10, fontWeight: 700 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ShieldCheck size={12} color="#FF8A3C" data-ico="1" style={{ display: "block", flexShrink: 0 }} /> SEGURANÇA</span>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={12} color="#FFCC00" data-ico="1" style={{ display: "block", flexShrink: 0 }} /> QUALIDADE</span>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Handshake size={12} color="#FF8A3C" data-ico="1" style={{ display: "block", flexShrink: 0 }} /> CONFIANÇA</span>
    </div>
  </div>
);

const Solucoes = ({ cfg }) => {
  const sol = [[Flame, "FOGÕES"], [Search, "COOKTOPS"], [Flame, "FORNOS"], [Wrench, "ACESSÓRIOS"]];
  return (
    <div style={{ background: "#faf6f0", padding: "8px 14px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        {sol.map(([I, t]) => <span key={t} style={{ display: "flex", alignItems: "center", gap: 3, fontWeight: 800, fontSize: 10 }}><I size={11} color="#FF6A00" data-ico="1" style={{ display: "block", flexShrink: 0 }} />{t}</span>)}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: "#FF6A00", fontWeight: 800, fontSize: 15, marginTop: 4 }}><Phone size={13} data-ico="1" style={{ display: "block", flexShrink: 0 }} /> FALE CONOSCO: {cfg.telefone || "(32) 98885-6030"}</div>
    </div>
  );
};

const Servicos = ({ f, set, cap }) => (
  <div>
    <div style={lbl}>Serviço</div>
    <div style={{ display: "flex", gap: 10, marginTop: 0 }}>
      {TIPOS.map((t) => {
        const on = f.tipo === t.key;
        return (
          <span key={t.key} role="button" data-testid={`flyer-tipo-${t.key}`} onClick={() => !cap && set({ ...f, tipo: t.key })} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, lineHeight: "17px", height: 17, padding: "4px 2px", cursor: "pointer", userSelect: "none", WebkitTapHighlightColor: "transparent", color: on ? "#FF6A00" : "#1a1a1a", fontWeight: on ? 800 : 400 }}>
            <span style={{ width: 17, height: 17, boxSizing: "border-box", borderRadius: 4, border: "2px solid #FF6A00", background: on ? "#FF6A00" : "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {on && <Check size={12} color="#fff" strokeWidth={4} style={{ display: "block" }} />}
            </span>
            <span data-lbl="1" style={{ display: "block", lineHeight: "17px" }}>{t.label}</span>
          </span>
        );
      })}
    </div>
  </div>
);

const Obs = ({ f, set, cap }) => {
  const box = { ...val, fontSize: 12, fontWeight: 500, color: "#333", lineHeight: "17px", border: "1px solid #e4ded5", borderRadius: 8, padding: 8, height: "100%", borderBottom: "1px solid #e4ded5", boxSizing: "border-box", resize: "none", whiteSpace: "pre-wrap", overflow: "hidden", display: "block" };
  return (
    <div style={{ flex: 1, minHeight: 60, display: "flex", flexDirection: "column" }}>
      <div style={{ ...lbl, marginBottom: 5 }}>Observações</div>
      {cap ? <div style={{ ...box, flex: 1 }}>{f.obs}</div>
        : <textarea data-testid="flyer-input-obs" maxLength={200} value={f.obs} onChange={(e) => set({ ...f, obs: e.target.value.split("\n").slice(0, 6).join("\n") })} style={{ ...box, flex: 1 }} />}
    </div>
  );
};

const Footer = ({ cfg }) => (
  <div style={{ background: "#1c1a18", color: "#fff", padding: "10px 14px", textAlign: "center" }}>
    <div style={{ display: "flex", justifyContent: "center", gap: 8, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span>SEGURANÇA EM 1º LUGAR</span><span style={{ color: "#FF8A3C" }}>•</span><span>PEÇAS CERTIFICADAS</span><span style={{ color: "#FF8A3C" }}>•</span><span>ASSISTÊNCIA TÉCNICA</span>
    </div>
    <div style={{ color: "#FF8A3C", fontWeight: 700, fontSize: 10, letterSpacing: 1.5, marginTop: 4 }}>MVL FOGÕES • {cfg.cidade || "A QUALIDADE QUE DÁ CONFIANÇA!"}</div>
  </div>
);

const Flyer = ({ f, set, cfg, cap, innerRef }) => {
  const p = { f, set, cap };
  return (
    <div ref={innerRef} data-testid="flyer-canvas" style={{ width: W, height: H, background: "#fff", fontFamily: "Inter, sans-serif", color: "#1a1a1a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header cfg={cfg} />
      <Solucoes cfg={cfg} />
      <div style={{ flex: 1, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
        <div style={{ display: "flex", gap: 14 }}><Field label="Cliente" k="nome" flex={1.4} testid="flyer-input-nome" {...p} /><Field label="Telefone" k="tel" testid="flyer-input-tel" {...p} /></div>
        <div style={{ display: "flex", gap: 14 }}><Field label="Endereço" k="end" flex={1.25} testid="flyer-input-end" {...p} /><Field label="Cidade" k="cidade" testid="flyer-input-cidade" {...p} /></div>
        <div style={{ display: "flex", gap: 14, background: "#fff4ea", borderRadius: 10, padding: "8px 10px" }}><Field label="Data da visita" k="data" testid="flyer-input-data" {...p} /><Field label="Horário" k="hora" testid="flyer-input-hora" {...p} /></div>
        <Servicos {...p} />
        <div style={{ display: "flex", gap: 14 }}><Field label="Detalhe do serviço" k="servico" flex={1.4} testid="flyer-input-servico" {...p} /><Field label="Taxa de visita" k="taxa" testid="flyer-input-taxa" {...p} /></div>
        <Obs {...p} />
      </div>
      <Footer cfg={cfg} />
    </div>
  );
};

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

export default function FlyerModal({ open, onClose, ag, cli, cfg, colar = false }) {
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const [cap, setCap] = useState(false);
  const [f, setF] = useState(() => initForm(ag || {}, cli, cfg || {}));
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
          st.textContent = "[data-ico]{position:relative;top:2px}[data-lbl]{position:relative;top:-1px}";
          doc.head.appendChild(st);
        },
      });
      return await new Promise((r) => canvas.toBlob(r, "image/png"));
    } finally {
      setCap(false);
    }
  };
  const nomeArq = `agendamento-${(f.nome || "visita").replace(/\s+/g, "-")}.png`;

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
    const texto = buildFlyerText(f, cfg);
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
      <div className="glass border-b border-orange-500/20 px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="font-outfit font-bold">Flyer de Agendamento</h3>
          <p className="text-xs text-zinc-400 flex items-center gap-1"><Pencil size={11} /> Toque nos campos para editar antes de enviar</p>
        </div>
        <button onClick={onClose} data-testid="flyer-close-btn" className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-auto p-3 flex flex-col items-center gap-3">
        {colar && <ConversaPanel f={f} set={setF} cli={cli} />}
        <div style={{ width: W * scale, height: H * scale, flexShrink: 0 }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: W, height: H }} className="rounded-xl overflow-hidden shadow-2xl">
            <Flyer f={f} set={setF} cfg={cfg || {}} cap={cap} innerRef={ref} />
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
