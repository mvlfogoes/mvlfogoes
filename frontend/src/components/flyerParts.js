import { useLayoutEffect, useRef, useState } from "react";
import { Phone, Flame, Search, Wrench, ShieldCheck, Star, Handshake, Check } from "lucide-react";

export const W = 405;
export const H = 720;

export const TIPOS = [
  { key: "fogao", label: "Fogão" },
  { key: "cooktop", label: "Cooktop" },
  { key: "forno", label: "Forno" },
  { key: "outro", label: "Outro" },
];

export const lbl = { fontWeight: 800, fontSize: 11, color: "#FF6A00", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 };
export const val = { width: "100%", border: "none", borderBottom: "1px dashed #c9c2b8", background: "transparent", fontSize: 14, fontWeight: 600, color: "#1a1a1a", padding: "3px 0 5px", outline: "none", fontFamily: "Inter, sans-serif", minHeight: 22, lineHeight: "20px", boxSizing: "border-box" };

export const num = (s) => {
  if (typeof s === "number") return s;
  let t = String(s || "").replace(/[^\d,.-]/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  return parseFloat(t) || 0;
};

const U = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const D = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const C = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
const ate999 = (n) => {
  if (n === 100) return "cem";
  const c = Math.floor(n / 100), r = n % 100, p = [];
  if (c) p.push(C[c]);
  if (r) p.push(r < 20 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? ` e ${U[r % 10]}` : ""));
  return p.join(" e ");
};

export const extenso = (v) => {
  if (!v || v <= 0) return "";
  const reais = Math.floor(v), cent = Math.round((v - reais) * 100), parts = [];
  if (reais) {
    const mi = Math.floor(reais / 1e6), mil = Math.floor((reais % 1e6) / 1000), r = reais % 1000, g = [];
    if (mi) g.push(ate999(mi) + (mi > 1 ? " milhões" : " milhão"));
    if (mil) g.push(mil === 1 ? "mil" : `${ate999(mil)} mil`);
    if (r) g.push(ate999(r));
    const last = g.pop();
    const s = g.length ? `${g.join(" ")}${!r || r <= 100 || r % 100 === 0 ? " e " : " "}${last}` : last;
    parts.push(s + (mi && !mil && !r ? " de reais" : reais === 1 ? " real" : " reais"));
  }
  if (cent) parts.push(ate999(cent) + (cent === 1 ? " centavo" : " centavos"));
  return parts.join(" e ");
};

const medidor = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
const caber = (text, width, base, weight, wrap) => {
  if (!text || !width || !medidor) return { fontSize: base };
  medidor.font = `${weight} ${base}px Inter, sans-serif`;
  const w = medidor.measureText(String(text)).width;
  if (w <= width) return { fontSize: base };
  const uma = (base * width) / w;
  if (!wrap || uma >= 10.5) return { fontSize: Math.max(8, Math.floor(uma * 10) / 10) };
  const duas = Math.max(7.5, Math.min(9.5, Math.floor(((base * 2 * width) / w) * 0.95 * 10) / 10));
  return { fontSize: duas, wrap: true };
};

export const Cell = ({ value, onChange, cap, style = {}, testid, wrap = false, placeholder = "toque para preencher" }) => {
  const ref = useRef();
  const [w, setW] = useState(0);
  useLayoutEffect(() => { setW(ref.current?.clientWidth || 0); }, []);
  const fit = caber(value, w - 2, style.fontSize || 14, style.fontWeight || 600, wrap);
  const duas = fit.wrap && cap ? { whiteSpace: "normal", lineHeight: `${Math.ceil(fit.fontSize + 1.5)}px`, padding: "0 0 2px", height: 25, wordBreak: "break-word" } : {};
  return cap
    ? <div ref={ref} style={{ ...val, borderBottom: "1px solid #d6d0c7", whiteSpace: "nowrap", overflow: "hidden", ...style, fontSize: fit.fontSize, ...duas }}><span data-txt="1" style={{ position: "relative" }}>{value || "\u00a0"}</span></div>
    : <input ref={ref} data-testid={testid} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...val, ...style, fontSize: Math.max(fit.fontSize, fit.wrap ? 10 : 0) }} />;
};

export const Field = ({ label, k, f, set, cap, flex = 1, testid, style, placeholder, wrap }) => (
  <div style={{ flex, minWidth: 0 }}>
    <div style={lbl}>{label}</div>
    <Cell value={f[k]} onChange={(v) => set({ ...f, [k]: v })} cap={cap} testid={testid} style={style} placeholder={placeholder} wrap={wrap} />
  </div>
);

export const Texto = ({ label, k, f, set, cap, testid, placeholder, maxLines = 6 }) => {
  const box = { ...val, fontSize: 12, fontWeight: 500, color: "#333", lineHeight: "17px", border: "1px solid #e4ded5", borderBottom: "1px solid #e4ded5", borderRadius: 8, padding: "7px 8px", height: maxLines * 17 + 16, minHeight: 0, resize: "none", whiteSpace: "pre-wrap", overflow: "hidden", display: "block" };
  return (
    <div>
      <div style={{ ...lbl, marginBottom: 5 }}>{label}</div>
      {cap ? <div style={box}><span data-txt="1" style={{ position: "relative", display: "block" }}>{f[k]}</span></div>
        : <textarea data-testid={testid} maxLength={240} value={f[k]} placeholder={placeholder} onChange={(e) => {
          const el = e.target;
          const v = el.value.split("\n").slice(0, maxLines).join("\n");
          if (v.length > (f[k] || "").length && el.scrollHeight > el.clientHeight + 1) return;
          set({ ...f, [k]: v });
        }} style={box} />}
    </div>
  );
};

const ico = { display: "block", flexShrink: 0 };

export const Header = ({ cfg, titulo, compacto }) => (
  <div style={{ background: "#1c1a18", color: "#fff", padding: compacto ? "10px 16px 9px" : "14px 16px 12px", textAlign: "center" }}>
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: compacto ? 30 : 36, lineHeight: 1 }}>
      MVL <span style={{ color: "#FF6A00" }}>FOGÕES</span>
    </div>
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 22, marginTop: compacto ? 3 : 6 }}>{titulo}</div>
    <div style={{ fontSize: 9, letterSpacing: 2, color: "#cfcfcf", marginTop: 2 }}>ASSISTÊNCIA TÉCNICA ESPECIALIZADA</div>
    {!compacto && <div style={{ color: "#FF8A3C", fontWeight: 700, fontSize: 11, marginTop: 6 }}>{(cfg.slogan || "Qualidade que dá confiança!").toUpperCase()}</div>}
    <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: compacto ? 6 : 8, fontSize: 10, fontWeight: 700 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ShieldCheck size={12} color="#FF8A3C" data-ico="1" style={ico} /> SEGURANÇA</span>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={12} color="#FFCC00" data-ico="1" style={ico} /> QUALIDADE</span>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Handshake size={12} color="#FF8A3C" data-ico="1" style={ico} /> CONFIANÇA</span>
    </div>
  </div>
);

export const Solucoes = ({ cfg }) => {
  const sol = [[Flame, "FOGÕES"], [Search, "COOKTOPS"], [Flame, "FORNOS"], [Wrench, "ACESSÓRIOS"]];
  return (
    <div style={{ background: "#faf6f0", padding: "8px 14px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        {sol.map(([I, t]) => <span key={t} style={{ display: "flex", alignItems: "center", gap: 3, fontWeight: 800, fontSize: 10 }}><I size={11} color="#FF6A00" data-ico="1" style={ico} />{t}</span>)}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: "#FF6A00", fontWeight: 800, fontSize: 15, marginTop: 4 }}><Phone size={13} data-ico="1" style={ico} /> FALE CONOSCO: {cfg.telefone || "(32) 98885-6030"}</div>
    </div>
  );
};

export const Servicos = ({ f, set, cap }) => (
  <div>
    <div style={lbl}>Serviço</div>
    <div style={{ display: "flex", gap: 10 }}>
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

export const Footer = ({ cfg }) => (
  <div style={{ background: "#1c1a18", color: "#fff", padding: "10px 14px", textAlign: "center" }}>
    <div style={{ display: "flex", justifyContent: "center", gap: 8, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span>SEGURANÇA EM 1º LUGAR</span><span style={{ color: "#FF8A3C" }}>•</span><span>PEÇAS CERTIFICADAS</span><span style={{ color: "#FF8A3C" }}>•</span><span>ASSISTÊNCIA TÉCNICA</span>
    </div>
    <div style={{ color: "#FF8A3C", fontWeight: 700, fontSize: 10, letterSpacing: 1.5, marginTop: 4 }}>MVL FOGÕES • {cfg.cidade || "A QUALIDADE QUE DÁ CONFIANÇA!"}</div>
  </div>
);
