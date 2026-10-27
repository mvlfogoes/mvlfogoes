import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { X, Send, Download, Phone, Flame, Search, Wrench, ShieldCheck, Star, Handshake } from "lucide-react";
import { fmtBRL, fmtData, waLink } from "@/lib/api";

const TIPOS = [
  { key: "fogao", label: "Fogão" },
  { key: "cooktop", label: "Cooktop" },
  { key: "forno", label: "Forno" },
  { key: "outro", label: "Outro" },
];

export function buildFlyerText(ag, cli, cfg) {
  const tipo = TIPOS.find((t) => t.key === ag.tipo)?.label || ag.servico || "—";
  const linhas = [
    "*MVL FOGÕES* 🔥",
    "*AGENDAMENTO DE VISITA*",
    "Assistência Técnica Especializada",
    `_${cfg.slogan || "A qualidade que dá confiança!"}_`,
    "",
    `👤 *Cliente:* ${ag.nomeCli || "—"}`,
    `📞 *Telefone:* ${cli?.tel || "—"}`,
    cli?.end ? `📍 *Endereço:* ${cli.end}` : null,
    `🏙️ *Cidade:* ${cfg.cidade || "—"}`,
    "",
    `📅 *Data da Visita:* ${fmtData(ag.data)}`,
    `⏰ *Horário:* ${ag.hora || "—"}`,
    `🔧 *Serviço:* ${tipo}${ag.servico && ag.tipo ? ` — ${ag.servico}` : ""}`,
    `💰 *Taxa de Visita:* ${fmtBRL(ag.valor)}`,
    "",
    "📝 *Observações:*",
    "🚨 Em caso de necessidade de alteração, entre em contato com antecedência.",
    ag.obs ? ag.obs : null,
    `*${cfg.telefone || ""} - ${cfg.cidade || ""}*`,
    "MVL Fogões - Qualidade que dá confiança!",
    "",
    `📱 *Fale conosco:* ${cfg.telefone || ""}`,
  ].filter((l) => l !== null);
  return linhas.join("\n");
}

const Flyer = ({ ag, cli, cfg, innerRef }) => {
  const checked = (key) => ag.tipo === key;
  const sol = [
    { icon: Flame, t: "FOGÕES", s: "Alta performance e durabilidade" },
    { icon: Search, t: "COOKTOPS", s: "Design moderno e eficiência" },
    { icon: Flame, t: "FORNOS", s: "Tecnologia e segurança" },
    { icon: Wrench, t: "ACESSÓRIOS", s: "Conexões seguras e qualidade" },
  ];
  return (
    <div ref={innerRef} style={{ width: 640, background: "#fff", fontFamily: "Inter, sans-serif", color: "#1a1a1a" }}>
      {/* Header */}
      <div style={{ background: "#1c1a18", color: "#fff", padding: "34px 24px 26px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 46, letterSpacing: 1 }}>
          <span style={{ color: "#fff" }}>MVL </span><span style={{ color: "#FF6A00" }}>FOGÕES</span>
        </div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 30, marginTop: 10, letterSpacing: 1 }}>AGENDAMENTO DE VISITA</div>
        <div style={{ fontSize: 13, letterSpacing: 2, color: "#cfcfcf", marginTop: 4 }}>ASSISTÊNCIA TÉCNICA ESPECIALIZADA</div>
        <div style={{ color: "#FF8A3C", fontWeight: 700, fontSize: 15, marginTop: 14 }}>{(cfg.slogan || "QUALIDADE QUE DÁ CONFIANÇA!").toUpperCase()}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 16, fontSize: 13, fontWeight: 700 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={16} color="#FF8A3C" /> SEGURANÇA</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Star size={16} color="#FFCC00" /> QUALIDADE</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Handshake size={16} color="#FF8A3C" /> CONFIANÇA</span>
        </div>
      </div>

      {/* Soluções */}
      <div style={{ background: "#faf6f0", padding: "22px 24px" }}>
        <div style={{ textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 16 }}>SOLUÇÕES COMPLETAS PARA PRODUTOS A GÁS</div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          {sol.map((x, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontWeight: 800, fontSize: 14 }}><x.icon size={16} color="#FF6A00" /> {x.t}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{x.s}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", color: "#FF6A00", fontWeight: 800, fontSize: 14, padding: "14px 20px 4px" }}>PRODUTOS DE ALTA QUALIDADE PARA MAIS SEGURANÇA E ECONOMIA!</div>

      {/* Fale conosco */}
      <div style={{ margin: "14px 24px", background: "#fdeee0", borderRadius: 40, padding: "14px 20px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, fontSize: 14 }}><Phone size={15} color="#FF6A00" /> FALE CONOSCO</div>
        <div style={{ color: "#FF6A00", fontWeight: 800, fontSize: 26, marginTop: 2 }}>{cfg.telefone || "(32) 98885-6030"}</div>
      </div>

      {/* Dados */}
      <div style={{ padding: "6px 24px 18px" }}>
        <Pair label="Cliente:" value={ag.nomeCli} r={{ label: "Telefone:", value: cli?.tel }} />
        <Line label="Endereço:" value={cli?.end} />
        <Line label="Cidade:" value={cfg.cidade} />
        <Pair label="Data da Visita:" value={fmtData(ag.data)} r={{ label: "Horário:", value: ag.hora }} />
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Serviço:</div>
          <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
            {TIPOS.map((t) => (
              <span key={t.key} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14 }}>
                <span style={{ width: 20, height: 20, borderRadius: 5, border: "2px solid #FF6A00", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF6A00", fontWeight: 900, fontSize: 13, background: checked(t.key) ? "#fff2e6" : "#fff" }}>{checked(t.key) ? "✓" : ""}</span>
                {t.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 14, fontWeight: 800, fontSize: 14 }}>Taxa de Visita: <span style={{ fontWeight: 600 }}>{fmtBRL(ag.valor)}</span></div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Observações:</div>
          <div style={{ fontSize: 13, color: "#333", marginTop: 6, lineHeight: 1.6 }}>
            🚨 Em caso de necessidade de alteração, entre em contato com antecedência.<br />
            {ag.obs ? <>{ag.obs}<br /></> : null}
            *{cfg.telefone} - {cfg.cidade}*<br />
            MVL Fogões - Qualidade que dá confiança!
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#1c1a18", color: "#fff", padding: "16px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, fontSize: 11, fontWeight: 700, flexWrap: "wrap" }}>
          <span>🛡️ SEGURANÇA EM 1º LUGAR</span><span>✅ PRODUTOS CERTIFICADOS</span><span>🔧 ASSISTÊNCIA ESPECIALIZADA</span>
        </div>
        <div style={{ fontSize: 12, color: "#cfcfcf", marginTop: 8 }}>{cfg.cidade}</div>
        <div style={{ color: "#FF8A3C", fontWeight: 700, fontSize: 11, letterSpacing: 2, marginTop: 4 }}>M V L  F O G Õ E S • A QUALIDADE QUE DÁ CONFIANÇA!</div>
      </div>
    </div>
  );
};

const Pair = ({ label, value, r }) => (
  <div style={{ display: "flex", gap: 24, marginTop: 14 }}>
    <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 14 }}>{label}</div><div style={{ borderBottom: "1px solid #ccc", paddingBottom: 3, fontSize: 14 }}>{value || "—"}</div></div>
    <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 14 }}>{r.label}</div><div style={{ borderBottom: "1px solid #ccc", paddingBottom: 3, fontSize: 14 }}>{r.value || "—"}</div></div>
  </div>
);
const Line = ({ label, value }) => (
  <div style={{ marginTop: 14 }}><div style={{ fontWeight: 800, fontSize: 14 }}>{label}</div><div style={{ borderBottom: "1px solid #ccc", paddingBottom: 3, fontSize: 14 }}>{value || "—"}</div></div>
);

export default function FlyerModal({ open, onClose, ag, cli, cfg }) {
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const baixar = async () => {
    setBusy(true);
    try {
      const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const link = document.createElement("a");
      link.download = `agendamento-${(ag.nomeCli || "visita").replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Imagem salva! Anexe no WhatsApp.");
    } catch {
      toast.error("Não foi possível gerar a imagem");
    }
    setBusy(false);
  };

  const enviar = () => window.open(waLink(cli?.wa || cli?.tel, buildFlyerText(ag, cli, cfg)), "_blank");

  return createPortal(
    <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex flex-col" data-testid="flyer-modal">
      <div className="glass border-b border-orange-500/20 px-4 py-3 flex items-center justify-between">
        <h3 className="font-outfit font-bold">Flyer de Agendamento</h3>
        <button onClick={onClose} data-testid="flyer-close-btn" className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        <div style={{ transform: "scale(min(1, 100%))" }} className="origin-top">
          <div className="max-w-full overflow-x-auto rounded-xl shadow-2xl">
            <Flyer ag={ag} cli={cli} cfg={cfg} innerRef={ref} />
          </div>
        </div>
      </div>
      <div className="glass border-t border-orange-500/20 p-3 flex gap-2">
        <button onClick={enviar} data-testid="flyer-send-btn" className="fire-btn text-white flex-1 rounded-xl py-3 font-semibold flex items-center justify-center gap-2"><Send size={17} /> Enviar no WhatsApp</button>
        <button onClick={baixar} disabled={busy} data-testid="flyer-download-btn" className="border border-orange-500/40 text-orange-400 rounded-xl px-4 py-3 font-semibold flex items-center gap-2 disabled:opacity-50"><Download size={17} /> {busy ? "..." : "Imagem"}</button>
      </div>
    </div>,
    document.body
  );
}
