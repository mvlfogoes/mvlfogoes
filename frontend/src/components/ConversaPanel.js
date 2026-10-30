import { useRef, useState } from "react";
import { toast } from "sonner";
import { ClipboardPaste, Wand2, MessageCircle } from "lucide-react";
import { waLink, CIDADES } from "@/lib/api";

const CAMPOS = [
  ["nome", "Cliente"], ["tel", "Telefone"], ["end", "Endereço"], ["cidade", "Cidade"],
  ["data", "Data"], ["hora", "Horário"], ["servico", "Serviço"], ["taxa", "Taxa"], ["obs", "Obs"],
];

const pad = (n) => String(n).padStart(2, "0");

export function extrair(txt) {
  const r = {};
  const d = txt.match(/\b(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?\b/);
  if (d) {
    const ano = d[3] ? (d[3].length === 2 ? `20${d[3]}` : d[3]) : new Date().getFullYear();
    r.data = `${pad(d[1])}/${pad(d[2])}/${ano}`;
  }
  const h = txt.match(/\b([01]?\d|2[0-3])\s?(?::|h)\s?([0-5]\d)?\b/i);
  if (h) r.hora = `${pad(h[1])}:${h[2] || "00"}`;
  const t = txt.match(/\(?\d{2}\)?\s?9?\s?\d{4}[-\s]?\d{4}/);
  if (t) r.tel = t[0].trim();
  const e = txt.match(/\b(rua|r\.|av\.?|avenida|travessa|tv\.|estrada|rodovia|praça|pça)\s[^\n]+/i);
  if (e) {
    let end = e[0].split(/\.\s|[!?;]/)[0];
    CIDADES.forEach((x) => { const i = end.toLowerCase().indexOf(x.toLowerCase()); if (i > 0) end = end.slice(0, i); });
    r.end = end.replace(/[\s,.-]+$/, "").trim();
  }
  const c = CIDADES.find((x) => txt.toLowerCase().includes(x.toLowerCase()));
  if (c) r.cidade = `${c} - MG`;
  const tipo = [["cooktop", "cooktop"], ["forno", "forno"], ["fogão", "fogao"], ["fogao", "fogao"]].find(([k]) => txt.toLowerCase().includes(k));
  if (tipo) r.tipo = tipo[1];
  const v = txt.match(/R\$\s?\d+(?:[.,]\d{2})?/i);
  if (v) r.taxa = v[0].replace(/\s/, " ");
  return r;
}

export function ConversaPanel({ f, set, cli, campos = CAMPOS }) {
  const ref = useRef();
  const [txt, setTxt] = useState("");

  const colar = async () => {
    try { setTxt(await navigator.clipboard.readText()); }
    catch { toast.info("Segure no campo e toque em Colar"); ref.current?.focus(); }
  };

  const auto = () => {
    const ex = extrair(txt);
    if ("valor" in f && ex.taxa) ex.valor = ex.taxa;
    const r = Object.fromEntries(Object.entries(ex).filter(([k]) => k in f));
    const n = Object.keys(r).length;
    if (!n) return toast.error("Não encontrei dados. Selecione o texto e toque no campo.");
    set({ ...f, ...r });
    toast.success(`${n} campo(s) preenchido(s)`);
  };

  const usarSelecao = (k) => {
    const el = ref.current;
    const sel = el ? txt.slice(el.selectionStart, el.selectionEnd).trim() : "";
    if (!sel) return toast.info("Primeiro selecione um trecho do texto");
    set({ ...f, [k]: k === "obs" || k === "outros" ? `${f[k]}\n${sel}`.trim() : sel });
    toast.success(`${campos.find((c) => c[0] === k)[1]} preenchido`);
  };

  return (
    <div className="glass rounded-2xl p-3 w-full max-w-[405px] space-y-2" data-testid="conversa-panel">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Dados da conversa</p>
        <a href={waLink(cli?.wa || cli?.tel, "")} target="_blank" rel="noreferrer" data-testid="conversa-open-wa" className="text-xs text-emerald-400 flex items-center gap-1"><MessageCircle size={13} /> Abrir conversa</a>
      </div>
      <p className="text-[11px] text-zinc-400">No WhatsApp, copie a mensagem do cliente e cole aqui. Depois selecione um trecho e toque no campo onde ele vai.</p>
      <textarea ref={ref} data-testid="conversa-text" value={txt} onChange={(e) => setTxt(e.target.value)} rows={4} placeholder="Cole aqui a conversa..." className="w-full rounded-xl bg-black/40 border border-white/10 p-2 text-sm text-zinc-100 outline-none focus:border-sky-400/60" />
      <div className="flex gap-2">
        <button onClick={colar} data-testid="conversa-paste-btn" className="flex-1 rounded-xl bg-white/5 py-2 text-xs font-semibold flex items-center justify-center gap-1"><ClipboardPaste size={14} /> Colar</button>
        <button onClick={auto} data-testid="conversa-auto-btn" className="flex-1 rounded-xl fire-btn text-white py-2 text-xs font-semibold flex items-center justify-center gap-1"><Wand2 size={14} /> Preencher automático</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {campos.map(([k, l]) => (
          <button key={k} onMouseDown={(e) => e.preventDefault()} onClick={() => usarSelecao(k)} data-testid={`conversa-campo-${k}`} className="px-2.5 py-1 rounded-full border border-sky-400/40 text-sky-300 text-[11px] font-semibold">→ {l}</button>
        ))}
      </div>
    </div>
  );
}
